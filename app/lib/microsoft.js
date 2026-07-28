export async function getMicrosoftAccessToken(refreshToken) {
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: "Mail.Read Mail.ReadWrite offline_access",
    }),
  });
  const data = await res.json();
  return data.access_token;
}
