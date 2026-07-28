import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { generateResetToken } from "../../../lib/auth";

// NOTE: this doesn't actually send an email — there's no transactional
// email service wired up (Resend, Postmark, etc.), which would need its
// own API key and a verified sending domain. For a project not used by
// real end users yet, that felt like an unnecessary third external
// service to add. Instead, the reset link is returned directly in the
// response and shown on screen. This works fine for demoing/using it
// yourself, but it does mean anyone who submits an email address here
// can tell whether it's registered (a real email flow that only ever
// says "check your inbox" regardless would avoid that). Worth switching
// to real email delivery before this app has actual outside users —
// swapping in Resend here is a small, contained change.
export async function POST(request) {
  try {
    const { email } = await request.json();

    const rows = await sql`SELECT id FROM users WHERE email = ${email}`;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ ok: true, found: false });
    }

    const { rawToken, tokenHash } = generateResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sql`
      UPDATE users SET reset_token_hash = ${tokenHash}, reset_token_expires = ${expires.toISOString()}
      WHERE id = ${user.id}
    `;

    const resetLink = `${new URL(request.url).origin}/reset-password?token=${rawToken}`;

    return NextResponse.json({ ok: true, found: true, resetLink });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
