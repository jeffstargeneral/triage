import Nav from "../components/Nav";
import SyncButton from "../components/SyncButton";
import ReplyPanel from "../components/ReplyPanel";
import { sql } from "../lib/db";
import { CheckCircle2, AlertTriangle, Circle, Settings } from "lucide-react";

// This page reads live data every time — never prerender it statically
// at build time (which would mean querying the database during the
// build itself, before env vars or network access can be relied on).
export const dynamic = "force-dynamic";

const tagStyles = {
  urgent: "bg-clayTint text-clayDark border-clay/30",
  routine: "bg-[#EAEFE6] text-routine border-routine/30",
  noise: "bg-bgAlt text-inkDim border-black/10",
};

async function getDashboardData() {
  const accounts = await sql`
    SELECT id, provider, email FROM accounts ORDER BY created_at DESC
  `;

  if (accounts.length === 0) {
    return { accounts: [], stats: { urgent: 0, routine: 0, noise: 0 }, recent: [] };
  }

  const accountIds = accounts.map((a) => a.id);

  const recent = await sql`
    SELECT id, from_address, subject, classification, replied_at, created_at
    FROM messages
    WHERE account_id = ANY(${accountIds})
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const allMessages = await sql`
    SELECT classification FROM messages WHERE account_id = ANY(${accountIds})
  `;

  const stats = { urgent: 0, routine: 0, noise: 0 };
  for (const m of allMessages) {
    if (stats[m.classification] !== undefined) stats[m.classification]++;
  }

  return { accounts, stats, recent };
}

export default async function DashboardPage() {
  const { accounts, stats, recent } = await getDashboardData();
  const hasAccount = accounts.length > 0;

  return (
    <>
      <Nav />
      <main className="pt-28 pb-24 max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-2">
          {hasAccount ? (
            <div className="flex flex-col gap-2">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm text-routine">
                  <CheckCircle2 size={16} />
                  {a.email}
                  <span className="text-inkFaint text-xs">({a.provider})</span>
                  {a.provider === "imap" && <SyncButton accountId={a.id} />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-inkFaint">
              <Circle size={16} />
              No inbox connected yet
            </div>
          )}
          <a
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-medium border border-black/15 rounded-full px-3 py-1.5 hover:border-clay transition-colors flex-shrink-0"
          >
            <Settings size={13} /> Settings
          </a>
        </div>
        <h1 className="font-serif text-3xl mb-8">Your inbox, today.</h1>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border border-black/10 bg-surface rounded-xl p-5">
            <div className="text-2xl font-serif text-clayDark">{stats.urgent}</div>
            <div className="text-xs text-inkDim mt-1 uppercase tracking-wide">Urgent</div>
          </div>
          <div className="border border-black/10 bg-surface rounded-xl p-5">
            <div className="text-2xl font-serif text-routine">{stats.routine}</div>
            <div className="text-xs text-inkDim mt-1 uppercase tracking-wide">Routine</div>
          </div>
          <div className="border border-black/10 bg-surface rounded-xl p-5">
            <div className="text-2xl font-serif text-inkDim">{stats.noise}</div>
            <div className="text-xs text-inkDim mt-1 uppercase tracking-wide">Noise</div>
          </div>
        </div>

        <h2 className="font-medium text-lg mb-4">Recently classified</h2>

        {recent.length === 0 ? (
          <div className="border border-dashed border-black/15 rounded-lg px-4 py-10 text-center text-sm text-inkDim">
            {hasAccount
              ? "No messages classified yet — new mail will show up here as it arrives."
              : "Connect an inbox to start seeing classified messages here."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((email) => (
              <div
                key={email.id}
                className="border border-black/10 bg-surface rounded-lg px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{email.subject || "(no subject)"}</div>
                    <div className="text-xs text-inkFaint truncate">{email.from_address}</div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${tagStyles[email.classification]}`}
                  >
                    {email.classification}
                  </span>
                </div>
                <ReplyPanel messageId={email.id} alreadyReplied={Boolean(email.replied_at)} />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 mt-10 text-xs text-inkFaint border-t border-black/10 pt-6">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <p>
            Classification is rule-based only for now — messages with no
            matching rule default to "routine". AI reply generation is
            available per message above, and for IMAP accounts only —
            Gmail/Outlook sending isn't wired up yet.
          </p>
        </div>
      </main>
    </>
  );
}
