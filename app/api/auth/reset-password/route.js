import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { hashResetToken, hashPassword, createSession } from "../../../lib/auth";

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password || password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "A valid token and a password (8+ characters) are required." },
        { status: 400 }
      );
    }

    const tokenHash = hashResetToken(token);

    const rows = await sql`
      SELECT id FROM users
      WHERE reset_token_hash = ${tokenHash} AND reset_token_expires > now()
    `;
    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, reset_token_hash = NULL, reset_token_expires = NULL
      WHERE id = ${user.id}
    `;

    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
