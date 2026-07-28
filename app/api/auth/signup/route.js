import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { hashPassword, createSession } from "../../../lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Email and a password (8+ characters) are required." },
        { status: 400 }
      );
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id
    `;

    await createSession(rows[0].id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
