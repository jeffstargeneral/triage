import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { decryptToken } from "../../../lib/crypto";
import { classifyMessage } from "../../../lib/classify";

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

async function getAccessToken(refreshToken) {
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: "Mail.Read Mail.ReadWrite offline_access",
    }),
  });
  const data = await res.json();
  return data.access_token;
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

      const accessToken = await getAccessToken(decryptToken(account.secret_encrypted));

      // note.resource looks like "Users/{id}/Messages/{id}"
      const msgRes = await fetch(`https://graph.microsoft.com/v1.0/${note.resource}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const msg = await msgRes.json();

      const fromAddress = msg.from?.emailAddress?.address || "";
      const subject = msg.subject || "";

      const { classification, classifiedBy } = await classifyMessage(account.id, {
        fromAddress,
        subject,
      });

      await sql`
        INSERT INTO messages (account_id, provider_message_id, from_address, subject, classification, classified_by)
        VALUES (${account.id}, ${msg.id}, ${fromAddress}, ${subject}, ${classification}, ${classifiedBy})
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
