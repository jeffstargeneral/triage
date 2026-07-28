import { NextResponse } from "next/server";
import { google } from "googleapis";
import { sql } from "../../../lib/db";
import { decryptToken } from "../../../lib/crypto";
import { classifyMessage } from "../../../lib/classify";
import { extractGmailBody } from "../../../lib/gmail-body";

// Google delivers Gmail push notifications through a Pub/Sub subscription
// that POSTs here. The body contains a base64-encoded JSON payload with
// the user's email address and a historyId — not the message itself.
// We use that historyId to fetch exactly what changed since last time.
export async function POST(request) {
  try {
    const body = await request.json();
    const messageData = body?.message?.data;

    if (!messageData) {
      return NextResponse.json({ ok: true }); // nothing to do
    }

    const decoded = JSON.parse(
      Buffer.from(messageData, "base64").toString("utf-8")
    );
    const { emailAddress, historyId } = decoded;

    const rows = await sql`
      SELECT id, secret_encrypted, history_id
      FROM accounts
      WHERE provider = 'google' AND email = ${emailAddress}
    `;
    const account = rows[0];

    if (!account) {
      console.warn("No stored account for", emailAddress);
      return NextResponse.json({ ok: true });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      refresh_token: decryptToken(account.secret_encrypted),
    });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // First notification ever for this account — nothing to diff against
    // yet, just record the starting point and wait for the next one.
    if (!account.history_id) {
      await sql`UPDATE accounts SET history_id = ${historyId} WHERE id = ${account.id}`;
      return NextResponse.json({ ok: true });
    }

    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId: account.history_id,
      historyTypes: ["messageAdded"],
    });

    const added = history.data.history?.flatMap((h) => h.messagesAdded || []) || [];

    for (const item of added) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: item.message.id,
        format: "full",
      });

      const headers = msg.data.payload?.headers || [];
      const fromAddress = headers.find((h) => h.name === "From")?.value || "";
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const messageIdHeader = headers.find((h) => h.name === "Message-ID")?.value || null;
      const bodyText = extractGmailBody(msg.data.payload).slice(0, 5000);

      const { classification, classifiedBy } = await classifyMessage(account.id, {
        fromAddress,
        subject,
        bodyText,
      });
      const initialStatus = classification === "noise" ? "done" : "needs_reply";

      await sql`
        INSERT INTO messages (account_id, provider_message_id, message_id_header, from_address, subject, body_text, classification, classified_by, status)
        VALUES (${account.id}, ${item.message.id}, ${messageIdHeader}, ${fromAddress}, ${subject}, ${bodyText}, ${classification}, ${classifiedBy}, ${initialStatus})
        ON CONFLICT (account_id, provider_message_id)
        DO UPDATE SET classification = EXCLUDED.classification, classified_by = EXCLUDED.classified_by
      `;
    }

    await sql`UPDATE accounts SET history_id = ${historyId} WHERE id = ${account.id}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Gmail webhook error:", err);
    // Still return 200 — Pub/Sub retries aggressively on non-2xx responses.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
