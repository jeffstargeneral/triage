import nodemailer from "nodemailer";

// Sends mail using the same email/password already stored for IMAP —
// most webmail providers (Hostinger, Zoho, cPanel hosts) issue one
// login that works for both. Only used for provider = 'imap' accounts;
// Gmail/Outlook sending would go through their own APIs instead (not
// built yet — see README).
export async function sendReply({ smtpHost, smtpPort, email, password, to, subject, text, inReplyTo }) {
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user: email, pass: password },
  });

  const headers = {};
  if (inReplyTo) {
    headers["In-Reply-To"] = inReplyTo;
    headers["References"] = inReplyTo;
  }

  await transporter.sendMail({
    from: email,
    to,
    subject: subject?.startsWith("Re:") ? subject : `Re: ${subject || ""}`,
    text,
    headers,
  });
}

// Best-effort guess at the SMTP host from an IMAP host, since most
// providers follow "imap.x" / "smtp.x" — used to prefill the connect
// form; always editable, since cPanel hosts often use one hostname
// for everything instead.
export function guessSmtpHost(imapHost) {
  if (imapHost.startsWith("imap.")) {
    return imapHost.replace("imap.", "smtp.");
  }
  return imapHost;
}
