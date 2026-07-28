import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { getSessionUserId } from "../../../lib/auth";

export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });
    }

    const { accountId, displayName, signature, autoReplyContext, autoReplyEnabled } = await request.json();

    // WHERE clause includes user_id so someone can't update another
    // user's account by guessing an accountId.
    await sql`
      UPDATE accounts
      SET display_name = ${displayName},
          signature = ${signature},
          auto_reply_context = ${autoReplyContext},
          auto_reply_enabled = ${Boolean(autoReplyEnabled)}
      WHERE id = ${accountId} AND user_id = ${userId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Settings update failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to save settings." }, { status: 500 });
  }
}
