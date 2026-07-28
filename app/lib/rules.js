// Shared by classify.js (rules → urgent/routine/noise) and the
// auto-reply trigger (auto_reply_rules → send or don't). Same shape,
// same matching logic, different table.
export function findMatchingRule(rules, { fromAddress, subject }) {
  const from = (fromAddress || "").toLowerCase();
  const subj = (subject || "").toLowerCase();
  const domain = from.split("@")[1] || "";

  for (const rule of rules) {
    const pattern = rule.pattern.toLowerCase();
    if (rule.field === "sender_domain" && domain.includes(pattern)) return rule;
    if (rule.field === "sender_address" && from.includes(pattern)) return rule;
    if (rule.field === "subject_keyword" && subj.includes(pattern)) return rule;
  }
  return null;
}
