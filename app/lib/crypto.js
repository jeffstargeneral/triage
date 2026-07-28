import crypto from "crypto";

// Encrypts refresh tokens before they go into Postgres, so a database
// leak alone doesn't hand over live inbox access. TOKEN_ENCRYPTION_KEY
// must be a 32-byte key, base64-encoded — generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

function getKey() {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY is not set — see .env.example");
  }
  return Buffer.from(key, "base64");
}

export function encryptToken(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv + authTag + ciphertext together, base64-encoded, so one
  // column holds everything needed to decrypt later.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(stored) {
  const raw = Buffer.from(stored, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
