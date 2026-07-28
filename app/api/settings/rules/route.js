import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function POST(request) {
  try {
    const { accountId, field, pattern } = await request.json();

    if (!accountId || !field || !pattern) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    await sql`
      INSERT INTO auto_reply_rules (account_id, field, pattern)
      VALUES (${accountId}, ${field}, ${pattern})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Add rule failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to add rule." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { ruleId } = await request.json();
    await sql`DELETE FROM auto_reply_rules WHERE id = ${ruleId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete rule failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete rule." }, { status: 500 });
  }
}
