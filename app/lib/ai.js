// Gemini 2.5 Flash via kie.ai — a standard OpenAI-compatible chat
// completions endpoint (not the async image/video task-queue pattern
// kie.ai uses elsewhere). One request, one response, no polling.
const KIE_ENDPOINT = "https://api.kie.ai/gemini-2.5-flash/v1/chat/completions";

async function callKie(messages) {
  const res = await fetch(KIE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KIE_AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, stream: false }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`kie.ai request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// Manual "one-click reply" — a real, contextual response to what the
// message actually says, not a generic template.
export async function generateManualReply({ fromAddress, subject, bodyText, displayName, signature }) {
  const system = `You write short, professional email replies on behalf of ${displayName || "the recipient"}. Match the tone of the original message. Be direct and helpful — no filler. Do not invent facts not present in the original email. End with the sender's name if a signature is provided, otherwise no sign-off needed.`;

  const user = `Original email:
From: ${fromAddress}
Subject: ${subject}

${bodyText || "(no body content)"}

---
Write a reply to this email.${signature ? ` Sign off with:\n${signature}` : ""}`;

  return callKie([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}

// Auto-reply (out-of-office style) — personalized using the account
// owner's own context instead of a generic "I am currently unavailable."
export async function generateAutoReply({ fromAddress, subject, bodyText, displayName, signature, autoReplyContext }) {
  const system = `You write brief, warm auto-reply / out-of-office emails on behalf of ${displayName || "the recipient"}. Use the context provided to explain their availability. Keep it under 80 words. Do not sound robotic or generic — reference the specific situation given in the context.`;

  const user = `Incoming email:
From: ${fromAddress}
Subject: ${subject}

${bodyText || "(no body content)"}

---
The recipient's auto-reply context: "${autoReplyContext}"

Write the auto-reply email now.${signature ? ` Sign off with:\n${signature}` : ""}`;

  return callKie([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}

// Classification fallback — only called when no rule matches. Keeps the
// output to exactly one word so it's safe to use directly as the
// classification value.
export async function classifyMessageWithAI({ fromAddress, subject, bodyText }) {
  const system = `You classify inbox emails into exactly one of three categories: "urgent", "routine", or "noise".
- urgent: needs a fast response — deadlines, direct requests, complaints, time-sensitive asks, anything from a real person expecting a reply soon.
- routine: normal correspondence that isn't time-critical — receipts, confirmations, non-urgent replies, ordinary business email.
- noise: newsletters, marketing, automated notifications, no-reply senders, anything nobody needs to act on.
Respond with ONLY the single word: urgent, routine, or noise. Nothing else.`;

  const user = `From: ${fromAddress}
Subject: ${subject}

${(bodyText || "").slice(0, 1500)}`;

  try {
    const result = await callKie([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    const cleaned = result.toLowerCase().trim();
    if (["urgent", "routine", "noise"].includes(cleaned)) return cleaned;
    return "routine"; // unexpected model output — fail safe, not silent
  } catch (err) {
    console.error("AI classification failed, defaulting to routine:", err.message);
    return "routine";
  }
}
