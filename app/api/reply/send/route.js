import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { decryptToken } from "../../../lib/crypto";
import { sendReply } from "../../../lib/smtp";

export async function POST(request) {
  try {
    const { messageId, text } = await request.json();

    const rows = await sql`
      SELECT m.id, m.from_address, m.subject, m.message_id_header,
             a.email, a.secret_encrypted, a.smtp_host, a.smtp_port, a.provider
      FROM messages m
      JOIN accounts a ON a.id = m.account_id
      WHERE m.id = ${messageId}
    `;
    const message = rows[0];

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message not found" }, { status: 404 });
    }

    if (message.provider !== "imap") {
      // Gmail/Outlook sending would use their own send APIs — not
      // built yet. Being explicit here rather than silently failing.
      return NextResponse.json(
        { ok: false, error: "Sending isn't set up yet for Gmail/Outlook accounts — only IMAP." },
        { status: 400 }
      );
    }

    await sendReply({
      smtpHost: message.smtp_host,
      smtpPort: message.smtp_port,
      email: message.email,
      password: decryptToken(message.secret_encrypted),
      to: message.from_address,
      subject: message.subject,
      text,
      inReplyTo: message.message_id_header,
    });

    await sql`UPDATE messages SET replied_at = now() WHERE id = ${messageId}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reply send error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send — see server logs." }, { status: 500 });
  }
}
