import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { sql } from "../../../lib/db";
import { decryptToken } from "../../../lib/crypto";
import { classifyMessage } from "../../../lib/classify";
import { findMatchingRule } from "../../../lib/rules";
import { generateAutoReply } from "../../../lib/ai";
import { sendReply } from "../../../lib/smtp";
import { getSessionUserId } from "../../../lib/auth";

// Plain IMAP has no equivalent to Gmail push or Graph subscriptions —
// there's no webhook to receive. IMAP's IDLE command gives near-real-time
// updates, but it needs a long-lived connection, which doesn't fit a
// serverless function. So this route is pull-based: it's called either
// by the "Sync now" button (one account, no secret needed — the user is
// already signed in to that action) or by an external scheduler hitting
// it on a timer for every connected IMAP account (secret required, since
// this path has no user session behind it).

async function maybeAutoReply(account, message) {
  if (!account.auto_reply_enabled || message.replied_at) return;

  const rules = await sql`
    SELECT field, pattern FROM auto_reply_rules WHERE account_id = ${account.id}
  `;
  const matched = findMatchingRule(rules, {
    fromAddress: message.from_address,
    subject: message.subject,
  });
  if (!matched) return;

  try {
    const replyText = await generateAutoReply({
      fromAddress: message.from_address,
      subject: message.subject,
      bodyText: message.body_text,
      displayName: account.display_name,
      signature: account.signature,
      autoReplyContext: account.auto_reply_context,
    });

    await sendReply({
      smtpHost: account.smtp_host,
      smtpPort: account.smtp_port,
      email: account.email,
      password: decryptToken(account.secret_encrypted),
      to: message.from_address,
      subject: message.subject,
      text: replyText,
      inReplyTo: message.message_id_header,
    });

    await sql`UPDATE messages SET replied_at = now(), status = 'follow_up' WHERE id = ${message.id}`;
  } catch (err) {
    // Auto-reply failing should never break the sync itself — log and
    // move on, the message is still classified and stored either way.
    console.error(`Auto-reply failed for message ${message.id}:`, err.message);
  }
}

async function syncAccount(account) {
  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: true,
    auth: { user: account.email, pass: decryptToken(account.secret_encrypted) },
    logger: false,
  });

  await client.connect();
  const mailbox = await client.mailboxOpen("INBOX");

  const total = mailbox.exists;
  const fetchCount = Math.min(total, 15);
  let stored = 0;

  if (fetchCount > 0) {
    const range = `${total - fetchCount + 1}:${total}`;

    for await (const msg of client.fetch(range, { envelope: true, uid: true, source: true })) {
      const fromAddress = msg.envelope?.from?.[0]?.address || "";
      const subject = msg.envelope?.subject || "";
      const providerMessageId = String(msg.uid);

      let bodyText = "";
      let messageIdHeader = null;
      try {
        const parsed = await simpleParser(msg.source);
        bodyText = (parsed.text || "").slice(0, 5000); // cap length for AI context + storage
        messageIdHeader = parsed.messageId || null;
      } catch (parseErr) {
        console.error("Failed to parse message body:", parseErr.message);
      }

      const { classification, classifiedBy } = await classifyMessage(account.id, {
        fromAddress,
        subject,
      });
      const initialStatus = classification === "noise" ? "done" : "needs_reply";

      try {
        const rows = await sql`
          INSERT INTO messages (account_id, provider_message_id, message_id_header, from_address, subject, body_text, classification, classified_by, status)
          VALUES (${account.id}, ${providerMessageId}, ${messageIdHeader}, ${fromAddress}, ${subject}, ${bodyText}, ${classification}, ${classifiedBy}, ${initialStatus})
          ON CONFLICT (account_id, provider_message_id)
          DO UPDATE SET classification = EXCLUDED.classification, classified_by = EXCLUDED.classified_by
          RETURNING id, from_address, subject, body_text, message_id_header, replied_at
        `;
        stored++;
        await maybeAutoReply(account, rows[0]);
      } catch (upsertError) {
        console.error("Message upsert failed:", upsertError.message);
      }
    }
  }

  await client.logout();
  return stored;
}

export async function POST(request) {
  try {
    const { accountId } = await request.json().catch(() => ({}));

    if (accountId) {
      // Single-account manual sync, triggered by the "Sync now" button —
      // requires a valid session, and only for an account that user owns.
      const userId = await getSessionUserId();
      if (!userId) {
        return NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });
      }

      const rows = await sql`
        SELECT * FROM accounts WHERE id = ${accountId} AND provider = 'imap' AND user_id = ${userId}
      `;
      const account = rows[0];

      if (!account) {
        return NextResponse.json({ ok: false, error: "IMAP account not found" }, { status: 404 });
      }

      const stored = await syncAccount(account);
      return NextResponse.json({ ok: true, synced: stored });
    }

    // Bulk sync for an external scheduler — every IMAP account, one call.
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await sql`SELECT * FROM accounts WHERE provider = 'imap'`;

    const results = [];
    for (const account of accounts) {
      try {
        const stored = await syncAccount(account);
        results.push({ email: account.email, synced: stored });
      } catch (err) {
        console.error(`Sync failed for ${account.email}:`, err.message);
        results.push({ email: account.email, error: err.message });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("IMAP sync error:", err);
    return NextResponse.json({ ok: false, error: "Sync failed — see server logs." }, { status: 500 });
  }
}
