import { NextResponse } from "next/server";
import crypto from "crypto";
import { sql } from "../../../../lib/db";
import { hashPassword, createSession } from "../../../../lib/auth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=google_signin_failed", request.url));
  }

  const redirectUri = new URL("/api/auth/google-signin/callback", request.url).toString();

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
      }),
    });
    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Google sign-in token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/login?error=google_signin_failed", request.url));
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(new URL("/login?error=google_signin_failed", request.url));
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${profile.email}`;
    let userId;

    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      // New account, created via Google — no password was ever set, so
      // generate one they'll never need (they can always add a real
      // password later via the forgot-password flow if they want a
      // second way in).
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);
      const inserted = await sql`
        INSERT INTO users (email, password_hash)
        VALUES (${profile.email}, ${passwordHash})
        RETURNING id
      `;
      userId = inserted[0].id;
    }

    await createSession(userId);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Google sign-in error:", err);
    return NextResponse.redirect(new URL("/login?error=google_signin_failed", request.url));
  }
}
