// Gmail's message payload can be a single part or a tree of MIME parts.
// This walks it looking for the plain-text version and decodes it from
// base64url. Falls back to an empty string if nothing usable is found.
export function extractGmailBody(payload) {
  if (!payload) return "";

  function decode(data) {
    if (!data) return "";
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf-8");
  }

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decode(payload.body.data);
  }

  if (payload.parts) {
    // Prefer text/plain; fall back to the first part with any body data.
    const plain = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decode(plain.body.data);

    for (const part of payload.parts) {
      const nested = extractGmailBody(part);
      if (nested) return nested;
    }
  }

  if (payload.body?.data) return decode(payload.body.data);

  return "";
}
