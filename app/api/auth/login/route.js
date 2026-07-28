import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { verifyPassword, createSession } from "../../../lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const rows = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
    const user = rows[0];

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ ok: false, error: "Incorrect email or password." }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
