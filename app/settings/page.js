import AppShell from "../components/AppShell";
import AccountSettingsCard from "../components/AccountSettingsCard";
import { sql } from "../lib/db";
import { getSessionUserId } from "../lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getSettingsData(userId) {
  const accounts = await sql`
    SELECT id, provider, email, display_name, signature, auto_reply_context, auto_reply_enabled
    FROM accounts
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  const rulesByAccount = {};
  for (const account of accounts) {
    rulesByAccount[account.id] = await sql`
      SELECT id, field, pattern FROM auto_reply_rules WHERE account_id = ${account.id} ORDER BY created_at
    `;
  }

  return { accounts, rulesByAccount };
}

export default async function SettingsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { accounts, rulesByAccount } = await getSettingsData(userId);

  return (
    <AppShell>
      <main className="px-5 sm:px-8 py-8 max-w-2xl">
        <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-2">Settings</p>
        <h1 className="font-serif text-2xl sm:text-3xl mb-8">Reply profile & auto-reply rules.</h1>

        {accounts.length === 0 ? (
          <div className="border border-dashed border-black/15 rounded-lg px-4 py-10 text-center text-sm text-inkDim">
            Connect an inbox first from the{" "}
            <a href="/connect" className="text-clayDark underline">
              connect page
            </a>
            .
          </div>
        ) : (
          accounts.map((account) => (
            <AccountSettingsCard key={account.id} account={account} rules={rulesByAccount[account.id]} />
          ))
        )}
      </main>
    </AppShell>
  );
}
