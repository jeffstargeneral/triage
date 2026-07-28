import { NextResponse } from "next/server";

// Redirects the user to Microsoft's consent screen.
// Uses the v2.0 endpoint so it works for both personal Outlook and
// Microsoft 365 work/school accounts.
export async function GET() {
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    response_type: "code",
    response_mode: "query",
    scope: [
      "offline_access", // needed to receive a refresh token
      "Mail.Read",
      "Mail.ReadWrite", // required to move/label messages
    ].join(" "),
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`
  );
}
