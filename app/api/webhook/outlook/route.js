import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { decryptToken } from "../../../lib/crypto";
import { classifyMessage } from "../../../lib/classify";
import { getMicrosoftAccessToken } from "../../../lib/microsoft";

// When you create a Microsoft Graph subscription, Graph immediately sends
// a validation request with a `validationToken` query param — you must
// echo it back as plain text within 10 seconds or the subscription fails.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const validationToken = searchParams.get("validationToken");

  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ ok: true });
}

// Real notifications arrive here as POST requests once the subscription
// is active. clientState (set when creating the subscription) should be
// used to look up which account this notification belongs to.
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const validationToken = searchParams.get("validationToken");
    if (validationToken) {
      return new NextResponse(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const body = await request.json();
    const notifications = body?.value || [];

    for (const note of notifications) {
      // clientState should be set to the account's id when the
      // subscription is created, so we can look it up directly here.
      const accountId = note.clientState;
      const rows = await sql`
        SELECT id, secret_encrypted FROM accounts WHERE id = ${accountId}
      `;
      const account = rows[0];
      if (!account) continue;

      const accessToken = await getMicrosoftAccessToken(decryptToken(account.secret_encrypted));

      // note.resource looks like "Users/{id}/Messages/{id}"
      const msgRes = await fetch(`https://graph.microsoft.com/v1.0/${note.resource}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'outlook.body-content-type="text"',
        },
      });
      const msg = await msgRes.json();

      const fromAddress = msg.from?.emailAddress?.address || "";
      const subject = msg.subject || "";
      const bodyText = (msg.body?.content || "").slice(0, 5000);
      const messageIdHeader = msg.internetMessageId || null;

      const { classification, classifiedBy } = await classifyMessage(account.id, {
        fromAddress,
        subject,
      });
      const initialStatus = classification === "noise" ? "done" : "needs_reply";

      await sql`
        INSERT INTO messages (account_id, provider_message_id, message_id_header, from_address, subject, body_text, classification, classified_by, status)
        VALUES (${account.id}, ${msg.id}, ${messageIdHeader}, ${fromAddress}, ${subject}, ${bodyText}, ${classification}, ${classifiedBy}, ${initialStatus})
        ON CONFLICT (account_id, provider_message_id)
        DO UPDATE SET classification = EXCLUDED.classification, classified_by = EXCLUDED.classified_by
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Outlook webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
