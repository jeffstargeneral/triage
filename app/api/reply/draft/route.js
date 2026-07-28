import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { generateManualReply } from "../../../lib/ai";

export async function POST(request) {
  try {
    const { messageId } = await request.json();

    const rows = await sql`
      SELECT m.id, m.from_address, m.subject, m.body_text, a.display_name, a.signature
      FROM messages m
      JOIN accounts a ON a.id = m.account_id
      WHERE m.id = ${messageId}
    `;
    const message = rows[0];

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message not found" }, { status: 404 });
    }

    const draft = await generateManualReply({
      fromAddress: message.from_address,
      subject: message.subject,
      bodyText: message.body_text,
      displayName: message.display_name,
      signature: message.signature,
    });

    return NextResponse.json({ ok: true, draft });
  } catch (err) {
    console.error("Reply draft error:", err);
    return NextResponse.json({ ok: false, error: "Could not generate a draft." }, { status: 500 });
  }
}
