import { NextResponse } from "next/server";
import { google } from "googleapis";
import { sql } from "../../../../lib/db";
import { encryptToken } from "../../../../lib/crypto";

// Google redirects here after the user approves access.
// We exchange the one-time code for an access token + refresh token.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    // tokens = { access_token, refresh_token, expiry_date, ... }

    if (!tokens.refresh_token) {
      // Google only returns a refresh_token on the *first* consent.
      // If the user already connected before and revoked nothing,
      // it can come back empty — prompt=consent in the initiation
      // route is what forces Google to reissue one every time.
      console.warn("No refresh_token returned — check prompt=consent is set.");
    }

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: profile } = await oauth2.userinfo.get();

    try {
      await sql`
        INSERT INTO accounts (provider, email, secret_encrypted)
        VALUES ('google', ${profile.email}, ${encryptToken(tokens.refresh_token)})
        ON CONFLICT (provider, email)
        DO UPDATE SET secret_encrypted = EXCLUDED.secret_encrypted
      `;
    } catch (dbError) {
      console.error("Postgres upsert failed:", dbError);
      return NextResponse.redirect(new URL("/connect?error=storage_failed", request.url));
    }

    // TODO(gmail-watch): call gmail.users.watch({ userId: 'me', requestBody:
    // { topicName } }) here to start receiving real-time push notifications,
    // and store the returned historyId on the account row.

    return NextResponse.redirect(new URL("/dashboard?connected=gmail", request.url));
  } catch (err) {
    console.error("Google token exchange failed:", err);
    return NextResponse.redirect(new URL("/connect?error=token_exchange_failed", request.url));
  }
}
