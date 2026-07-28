import Nav from "../components/Nav";
import SyncButton from "../components/SyncButton";
import { sql } from "../lib/db";
import { CheckCircle2, AlertTriangle, Circle, Settings, ChevronRight } from "lucide-react";

// This page reads live data every time — never prerender it statically
// at build time (which would mean querying the database during the
// build itself, before env vars or network access can be relied on).
export const dynamic = "force-dynamic";

const tagStyles = {
  urgent: "bg-clayTint text-clayDark",
  routine: "bg-[#EAEFE6] text-routine",
  noise: "bg-bgAlt text-inkDim",
};

const borderStyles = {
  urgent: "border-l-clay",
  routine: "border-l-routine",
  noise: "border-l-black/10",
};

function initials(fromAddress) {
  const name = (fromAddress || "?").split("@")[0];
  return name.slice(0, 2).toUpperCase();
}

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

async function getDashboardData() {
  const accounts = await sql`
    SELECT id, provider, email FROM accounts ORDER BY created_at DESC
  `;

  if (accounts.length === 0) {
    return { accounts: [], stats: { urgent: 0, routine: 0, noise: 0 }, recent: [] };
  }

  const accountIds = accounts.map((a) => a.id);

  const recent = await sql`
    SELECT id, from_address, subject, body_text, classification, replied_at, created_at
    FROM messages
    WHERE account_id = ANY(${accountIds})
    ORDER BY created_at DESC
    LIMIT 20
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
      <main className="pt-24 pb-24 max-w-3xl mx-auto px-5 sm:px-6">
        <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
          {hasAccount ? (
            <div className="flex flex-col gap-1.5">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm text-routine flex-wrap">
                  <CheckCircle2 size={15} className="flex-shrink-0" />
                  <span className="truncate">{a.email}</span>
                  <span className="text-inkFaint text-xs flex-shrink-0">({a.provider})</span>
                  {a.provider === "imap" && <SyncButton accountId={a.id} />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-inkFaint">
              <Circle size={15} />
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

        <h1 className="font-serif text-2xl sm:text-3xl mt-4 mb-6">Your inbox, today.</h1>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div className="border border-black/10 bg-surface rounded-xl p-4 sm:p-5">
            <div className="text-xl sm:text-2xl font-serif text-clayDark">{stats.urgent}</div>
            <div className="text-[11px] sm:text-xs text-inkDim mt-1 uppercase tracking-wide">Urgent</div>
          </div>
          <div className="border border-black/10 bg-surface rounded-xl p-4 sm:p-5">
            <div className="text-xl sm:text-2xl font-serif text-routine">{stats.routine}</div>
            <div className="text-[11px] sm:text-xs text-inkDim mt-1 uppercase tracking-wide">Routine</div>
          </div>
          <div className="border border-black/10 bg-surface rounded-xl p-4 sm:p-5">
            <div className="text-xl sm:text-2xl font-serif text-inkDim">{stats.noise}</div>
            <div className="text-[11px] sm:text-xs text-inkDim mt-1 uppercase tracking-wide">Noise</div>
          </div>
        </div>

        <h2 className="font-medium text-base sm:text-lg mb-3">Recently classified</h2>

        {recent.length === 0 ? (
          <div className="border border-dashed border-black/15 rounded-lg px-4 py-10 text-center text-sm text-inkDim">
            {hasAccount
              ? "No messages classified yet — new mail will show up here as it arrives."
              : "Connect an inbox to start seeing classified messages here."}
          </div>
        ) : (
          <div className="border border-black/10 rounded-xl overflow-hidden bg-surface divide-y divide-black/[0.06]">
            {recent.map((email) => (
              <a
                key={email.id}
                href={`/messages/${email.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 border-l-[3px] hover:bg-surfaceTint transition-colors ${borderStyles[email.classification]}`}
              >
                <div className="w-9 h-9 rounded-full bg-bgAlt flex items-center justify-center text-xs font-medium text-inkDim flex-shrink-0">
                  {initials(email.from_address)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{email.subject || "(no subject)"}</span>
                    {email.replied_at && (
                      <CheckCircle2 size={12} className="text-routine flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-inkFaint truncate mt-0.5">
                    {email.from_address} — {(email.body_text || "").replace(/\s+/g, " ").slice(0, 70) || "No preview available"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tagStyles[email.classification]}`}>
                    {email.classification}
                  </span>
                  <span className="text-[11px] text-inkFaint">{relativeTime(email.created_at)}</span>
                </div>
                <ChevronRight size={16} className="text-inkFaint flex-shrink-0 hidden sm:block" />
              </a>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 mt-8 text-xs text-inkFaint border-t border-black/10 pt-6">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <p>
            Classification is rule-based only for now — messages with no
            matching rule default to "routine". Click any message to read
            it in full and generate an AI reply.
          </p>
        </div>
      </main>
    </>
  );
}
