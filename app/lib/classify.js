import { sql } from "./db";
import { findMatchingRule } from "./rules";
import { classifyMessageWithAI } from "./ai";

// Rule-based classification runs first — it's free and instant. Only
// when nothing matches does this fall back to an AI classification call,
// which is what actually distinguishes urgent/noise instead of every
// unmatched message defaulting to "routine" (the old behavior, which is
// why classification felt like it wasn't doing much).
export async function classifyMessage(accountId, { fromAddress, subject, bodyText }) {
  const rules = await sql`
    SELECT field, pattern, classification
    FROM rules
    WHERE account_id = ${accountId}
  `;

  const match = findMatchingRule(rules, { fromAddress, subject });
  if (match) {
    return { classification: match.classification, classifiedBy: "rule" };
  }

  const classification = await classifyMessageWithAI({ fromAddress, subject, bodyText });
  return { classification, classifiedBy: "llm" };
}
