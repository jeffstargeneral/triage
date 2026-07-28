import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import { encryptToken } from "../../../../lib/crypto";
import { getSessionUserId } from "../../../../lib/auth";

// Microsoft redirects here after the user approves access.
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

  const sessionUserId = await getSessionUserId();
  if (!sessionUserId || sessionUserId !== stateUserId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const tenant = process.env.MICROSOFT_TENANT_ID || "common";

  try {
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
          grant_type: "authorization_code",
          code,
        }),
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Microsoft token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/connect?error=token_exchange_failed", request.url));
    }

    const profileResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    const email = profile.mail || profile.userPrincipalName;

    try {
      await sql`
        INSERT INTO accounts (user_id, provider, email, secret_encrypted)
        VALUES (${sessionUserId}, 'microsoft', ${email}, ${encryptToken(tokens.refresh_token)})
        ON CONFLICT (provider, email)
        DO UPDATE SET secret_encrypted = EXCLUDED.secret_encrypted, user_id = EXCLUDED.user_id
      `;
    } catch (dbError) {
      console.error("Postgres upsert failed:", dbError);
      return NextResponse.redirect(new URL("/connect?error=storage_failed", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard?connected=outlook", request.url));
  } catch (err) {
    console.error("Microsoft token exchange error:", err);
    return NextResponse.redirect(new URL("/connect?error=token_exchange_failed", request.url));
  }
}
