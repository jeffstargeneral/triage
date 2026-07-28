import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function POST(request) {
  try {
    const { accountId, displayName, signature, autoReplyContext, autoReplyEnabled } = await request.json();

    await sql`
      UPDATE accounts
      SET display_name = ${displayName},
          signature = ${signature},
          auto_reply_context = ${autoReplyContext},
          auto_reply_enabled = ${Boolean(autoReplyEnabled)}
      WHERE id = ${accountId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Settings update failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to save settings." }, { status: 500 });
  }
}
