import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";

export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });
    }

    const { accountId, field, pattern } = await request.json();

    if (!accountId || !field || !pattern) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    // Confirm the account actually belongs to this user before adding
    // a rule to it.
    const owned = await sql`SELECT id FROM accounts WHERE id = ${accountId} AND user_id = ${userId}`;
    if (owned.length === 0) {
      return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
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
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });
    }

    const { ruleId } = await request.json();

    // Only deletes if the rule's account actually belongs to this user.
    await sql`
      DELETE FROM auto_reply_rules
      WHERE id = ${ruleId}
        AND account_id IN (SELECT id FROM accounts WHERE user_id = ${userId})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete rule failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete rule." }, { status: 500 });
  }
}
