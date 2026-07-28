import { NextResponse } from "next/server";
import { google } from "googleapis";
import { sql } from "../../../../lib/db";
import { encryptToken } from "../../../../lib/crypto";
import { getSessionUserId } from "../../../../lib/auth";

// Google redirects here after the user approves access.
// We exchange the one-time code for an access token + refresh token.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateUserId = searchParams.get("state");

  if (error) {
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // The user must still be logged in, and it must be the same person
  // who started this connection — state is set to their user id when
  // the flow began, in the initiation route.
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId || sessionUserId !== stateUserId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.warn("No refresh_token returned — check prompt=consent is set.");
    }

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: profile } = await oauth2.userinfo.get();

    try {
      await sql`
        INSERT INTO accounts (user_id, provider, email, secret_encrypted)
        VALUES (${sessionUserId}, 'google', ${profile.email}, ${encryptToken(tokens.refresh_token)})
        ON CONFLICT (provider, email)
        DO UPDATE SET secret_encrypted = EXCLUDED.secret_encrypted, user_id = EXCLUDED.user_id
      `;
    } catch (dbError) {
      console.error("Postgres upsert failed:", dbError);
      return NextResponse.redirect(new URL("/connect?error=storage_failed", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard?connected=gmail", request.url));
  } catch (err) {
    console.error("Google token exchange failed:", err);
    return NextResponse.redirect(new URL("/connect?error=token_exchange_failed", request.url));
  }
}
