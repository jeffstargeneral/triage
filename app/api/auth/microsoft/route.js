import { NextResponse } from "next/server";
import { getSessionUserId } from "../../../lib/auth";

// Redirects the user to Microsoft's consent screen.
// Uses the v2.0 endpoint so it works for both personal Outlook and
// Microsoft 365 work/school accounts.
export async function GET(request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const tenant = process.env.MICROSOFT_TENANT_ID || "common";

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    response_type: "code",
    response_mode: "query",
    state: userId,
    scope: [
      "offline_access",
      "Mail.Read",
      "Mail.ReadWrite",
    ].join(" "),
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`
  );
}
