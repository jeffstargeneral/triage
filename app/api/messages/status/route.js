import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";

const VALID_STATUSES = ["needs_reply", "follow_up", "done"];

export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });
    }

    const { messageId, status } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
    }

    // Ownership check baked into the WHERE clause — this only touches
    // a row if it actually belongs to the requesting user's account.
    await sql`
      UPDATE messages
      SET status = ${status}
      WHERE id = ${messageId}
        AND account_id IN (SELECT id FROM accounts WHERE user_id = ${userId})
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update status." }, { status: 500 });
  }
}
