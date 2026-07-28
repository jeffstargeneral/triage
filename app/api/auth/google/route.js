import { NextResponse } from "next/server";

// Redirects the user to Google's consent screen.
// Scopes are read + label only — never full mailbox delete or send access.
export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    access_type: "offline", // needed to receive a refresh_token
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.labels",
    ].join(" "),
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
