import { sql } from "./db";
import { findMatchingRule } from "./rules";

// Rule-based classification. Checked first because it's free and instant.
// An LLM fallback for ambiguous cases can be added here later — this
// function is the one place that decision would plug in.
export async function classifyMessage(accountId, { fromAddress, subject }) {
  const rules = await sql`
    SELECT field, pattern, classification
    FROM rules
    WHERE account_id = ${accountId}
  `;

  const match = findMatchingRule(rules, { fromAddress, subject });
  if (match) {
    return { classification: match.classification, classifiedBy: "rule" };
  }

  // No rule matched — default bucket until an LLM fallback is added.
  return { classification: "routine", classifiedBy: "rule" };
}
