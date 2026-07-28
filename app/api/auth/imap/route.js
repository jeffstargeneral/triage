import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import { sql } from "../../../lib/db";
import { encryptToken } from "../../../lib/crypto";
import { getSessionUserId } from "../../../lib/auth";

// Generic IMAP connect for webmail providers that don't offer OAuth —
// Hostinger, cPanel-based hosting, Zoho, and similar.
export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Please log in first." }, { status: 401 });
    }

    const { email, password, host, port, useSSL, smtpHost, smtpPort } = await request.json();

    if (!email || !password || !host || !port) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const client = new ImapFlow({
      host,
      port: Number(port),
      secure: Boolean(useSSL),
      auth: { user: email, pass: password },
      logger: false,
    });

    try {
      await client.connect();
      await client.mailboxOpen("INBOX");
      await client.logout();
    } catch (connErr) {
      console.error("IMAP test connection failed:", connErr.message);
      return NextResponse.json(
        { ok: false, error: "Could not connect — check the host, port, and password." },
        { status: 400 }
      );
    }

    try {
      await sql`
        INSERT INTO accounts (user_id, provider, email, secret_encrypted, imap_host, imap_port, smtp_host, smtp_port)
        VALUES (${userId}, 'imap', ${email}, ${encryptToken(password)}, ${host}, ${Number(port)}, ${smtpHost}, ${Number(smtpPort)})
        ON CONFLICT (provider, email)
        DO UPDATE SET
          secret_encrypted = EXCLUDED.secret_encrypted,
          imap_host = EXCLUDED.imap_host,
          imap_port = EXCLUDED.imap_port,
          smtp_host = EXCLUDED.smtp_host,
          smtp_port = EXCLUDED.smtp_port,
          user_id = EXCLUDED.user_id
      `;
    } catch (dbError) {
      console.error("Postgres upsert failed:", dbError);
      return NextResponse.json({ ok: false, error: "Saved connection failed to store." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("IMAP connect error:", err);
    return NextResponse.json({ ok: false, error: "Unexpected error." }, { status: 500 });
  }
}
