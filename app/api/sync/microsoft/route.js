import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { decryptToken } from "../../../lib/crypto";
import { classifyMessage } from "../../../lib/classify";
import { getMicrosoftAccessToken } from "../../../lib/microsoft";
import { getSessionUserId } from "../../../lib/auth";

// Graph subscriptions (real-time push) aren't wired up yet — see README.
// Until they are, this is how Outlook messages actually get pulled in: a
// manual "Sync now" button, same idea as the IMAP one.
export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });
    }

    const { accountId } = await request.json();

    const rows = await sql`
      SELECT id, email, secret_encrypted, sync_limit FROM accounts
      WHERE id = ${accountId} AND provider = 'microsoft' AND user_id = ${userId}
    `;
    const account = rows[0];
    if (!account) {
      return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
    }

    const accessToken = await getMicrosoftAccessToken(decryptToken(account.secret_encrypted));

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${account.sync_limit || 15}&$orderby=receivedDateTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // Ask Graph for plain text instead of HTML, so we don't need
          // an HTML stripper for the AI context / preview snippets.
          Prefer: 'outlook.body-content-type="text"',
        },
      }
    );
    const data = await res.json();

    let stored = 0;
    for (const msg of data.value || []) {
      const fromAddress = msg.from?.emailAddress?.address || "";
      const subject = msg.subject || "";
      const bodyText = (msg.body?.content || "").slice(0, 5000);
      const messageIdHeader = msg.internetMessageId || null;

      const { classification, classifiedBy } = await classifyMessage(account.id, { fromAddress, subject, bodyText });
      const initialStatus = classification === "noise" ? "done" : "needs_reply";

      try {
        await sql`
          INSERT INTO messages (account_id, provider_message_id, message_id_header, from_address, subject, body_text, classification, classified_by, status)
          VALUES (${account.id}, ${msg.id}, ${messageIdHeader}, ${fromAddress}, ${subject}, ${bodyText}, ${classification}, ${classifiedBy}, ${initialStatus})
          ON CONFLICT (account_id, provider_message_id)
          DO UPDATE SET classification = EXCLUDED.classification, classified_by = EXCLUDED.classified_by
        `;
        stored++;
      } catch (err) {
        console.error("Outlook message upsert failed:", err.message);
      }
    }

    return NextResponse.json({ ok: true, synced: stored });
  } catch (err) {
    console.error("Outlook manual sync error:", err);
    return NextResponse.json({ ok: false, error: "Sync failed — see server logs." }, { status: 500 });
  }
}
