import { NextResponse } from "next/server";
import { google } from "googleapis";
import { sql } from "../../../lib/db";
import { decryptToken } from "../../../lib/crypto";
import { classifyMessage } from "../../../lib/classify";
import { extractGmailBody } from "../../../lib/gmail-body";
import { getSessionUserId } from "../../../lib/auth";

// Real-time push (gmail.users.watch) isn't wired up yet — see README.
// Until it is, this is how Gmail messages actually get pulled in: a
// manual "Sync now" button, same idea as the IMAP one.
export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });
    }

    const { accountId } = await request.json();

    const rows = await sql`
      SELECT id, email, secret_encrypted FROM accounts
      WHERE id = ${accountId} AND provider = 'google' AND user_id = ${userId}
    `;
    const account = rows[0];
    if (!account) {
      return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: decryptToken(account.secret_encrypted) });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 15,
      labelIds: ["INBOX"],
    });

    let stored = 0;
    for (const item of list.data.messages || []) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: item.id,
        format: "full",
      });

      const headers = msg.data.payload?.headers || [];
      const fromAddress = headers.find((h) => h.name === "From")?.value || "";
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const messageIdHeader = headers.find((h) => h.name === "Message-ID")?.value || null;
      const bodyText = extractGmailBody(msg.data.payload).slice(0, 5000);

      const { classification, classifiedBy } = await classifyMessage(account.id, { fromAddress, subject });
      const initialStatus = classification === "noise" ? "done" : "needs_reply";

      try {
        await sql`
          INSERT INTO messages (account_id, provider_message_id, message_id_header, from_address, subject, body_text, classification, classified_by, status)
          VALUES (${account.id}, ${item.id}, ${messageIdHeader}, ${fromAddress}, ${subject}, ${bodyText}, ${classification}, ${classifiedBy}, ${initialStatus})
          ON CONFLICT (account_id, provider_message_id)
          DO UPDATE SET classification = EXCLUDED.classification, classified_by = EXCLUDED.classified_by
        `;
        stored++;
      } catch (err) {
        console.error("Gmail message upsert failed:", err.message);
      }
    }

    return NextResponse.json({ ok: true, synced: stored });
  } catch (err) {
    console.error("Gmail manual sync error:", err);
    return NextResponse.json({ ok: false, error: "Sync failed — see server logs." }, { status: 500 });
  }
}
