import { NextResponse } from "next/server";

// This is for logging into the Triage app itself via Google — separate
// from /api/auth/google, which connects a Gmail inbox as a data source
// and requires you to already be logged in. This one only asks for
// identity (email), never Gmail access, and works for brand-new users.
//
// Uses the same Google OAuth client as the Gmail-connect flow, just a
// different registered redirect URI — add this one in Google Cloud
// Console too: {your domain}/api/auth/google-signin/callback
export async function GET(request) {
  const redirectUri = new URL("/api/auth/google-signin/callback", request.url).toString();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: ["openid", "https://www.googleapis.com/auth/userinfo.email"].join(" "),
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
