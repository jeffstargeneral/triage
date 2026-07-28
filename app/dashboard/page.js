import Nav from "../components/Nav";
import SyncButton from "../components/SyncButton";
import StatusControl from "../components/StatusControl";
import { sql } from "../lib/db";
import { getSessionUserId } from "../lib/auth";
import { redirect } from "next/navigation";
import { CheckCircle2, AlertTriangle, Circle, Settings, ChevronRight, Search, ChevronLeft, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

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

async function getDashboardData(userId, { q, page, classification, status }) {
  const accounts = await sql`
    SELECT id, provider, email FROM accounts WHERE user_id = ${userId} ORDER BY created_at DESC
  `;

  if (accounts.length === 0) {
    return { accounts: [], statusStats: { needs_reply: 0, follow_up: 0, done: 0 }, messages: [], totalPages: 0 };
  }

  const accountIds = accounts.map((a) => a.id);
  const searchPattern = q ? `%${q}%` : null;
  const offset = (page - 1) * PAGE_SIZE;
  const whereClassification = classification || null;
  const whereStatus = status || null;

  const messages = await sql`
    SELECT id, from_address, subject, body_text, classification, status, replied_at, created_at
    FROM messages
    WHERE account_id = ANY(${accountIds})
      AND (${searchPattern}::text IS NULL OR subject ILIKE ${searchPattern} OR from_address ILIKE ${searchPattern} OR body_text ILIKE ${searchPattern})
      AND (${whereClassification}::text IS NULL OR classification = ${whereClassification})
      AND (${whereStatus}::text IS NULL OR status = ${whereStatus})
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const countRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM messages
    WHERE account_id = ANY(${accountIds})
      AND (${searchPattern}::text IS NULL OR subject ILIKE ${searchPattern} OR from_address ILIKE ${searchPattern} OR body_text ILIKE ${searchPattern})
      AND (${whereClassification}::text IS NULL OR classification = ${whereClassification})
      AND (${whereStatus}::text IS NULL OR status = ${whereStatus})
  `;
  const totalPages = Math.max(1, Math.ceil(countRows[0].count / PAGE_SIZE));

  const allStatuses = await sql`
    SELECT status FROM messages WHERE account_id = ANY(${accountIds})
  `;
  const statusStats = { needs_reply: 0, follow_up: 0, done: 0 };
  for (const m of allStatuses) {
    if (statusStats[m.status] !== undefined) statusStats[m.status]++;
  }

  return { accounts, statusStats, messages, totalPages };
}

function buildQueryString(params) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.classification) usp.set("classification", params.classification);
  if (params.status) usp.set("status", params.status);
  if (params.page && params.page !== 1) usp.set("page", String(params.page));
  const str = usp.toString();
  return str ? `?${str}` : "";
}

export default async function DashboardPage({ searchParams }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const q = searchParams?.q || "";
  const classification = searchParams?.classification || "";
  const status = searchParams?.status || "";
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);

  const { accounts, statusStats, messages, totalPages } = await getDashboardData(userId, {
    q,
    page,
    classification,
    status,
  });
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/contacts"
              className="inline-flex items-center gap-1.5 text-xs font-medium border border-black/15 rounded-full px-3 py-1.5 hover:border-clay transition-colors"
            >
              <Users size={13} /> Contacts
            </a>
            <a
              href="/settings"
              className="inline-flex items-center gap-1.5 text-xs font-medium border border-black/15 rounded-full px-3 py-1.5 hover:border-clay transition-colors"
            >
              <Settings size={13} /> Settings
            </a>
          </div>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl mt-4 mb-6">Your inbox, today.</h1>

        {/* Status stats — the CRM-style "pipeline" view */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <a
            href={buildQueryString({ status: status === "needs_reply" ? "" : "needs_reply" })}
            className={`border rounded-xl p-4 sm:p-5 transition-colors ${
              status === "needs_reply" ? "border-clay bg-clayTint" : "border-black/10 bg-surface hover:border-clay/40"
            }`}
          >
            <div className="text-xl sm:text-2xl font-serif text-clayDark">{statusStats.needs_reply}</div>
            <div className="text-[11px] sm:text-xs text-inkDim mt-1 uppercase tracking-wide">Needs reply</div>
          </a>
          <a
            href={buildQueryString({ status: status === "follow_up" ? "" : "follow_up" })}
            className={`border rounded-xl p-4 sm:p-5 transition-colors ${
              status === "follow_up" ? "border-waiting bg-waitingTint" : "border-black/10 bg-surface hover:border-waiting/40"
            }`}
          >
            <div className="text-xl sm:text-2xl font-serif text-waiting">{statusStats.follow_up}</div>
            <div className="text-[11px] sm:text-xs text-inkDim mt-1 uppercase tracking-wide">Follow-up</div>
          </a>
          <a
            href={buildQueryString({ status: status === "done" ? "" : "done" })}
            className={`border rounded-xl p-4 sm:p-5 transition-colors ${
              status === "done" ? "border-routine bg-[#EAEFE6]" : "border-black/10 bg-surface hover:border-routine/40"
            }`}
          >
            <div className="text-xl sm:text-2xl font-serif text-routine">{statusStats.done}</div>
            <div className="text-[11px] sm:text-xs text-inkDim mt-1 uppercase tracking-wide">Done</div>
          </a>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="font-medium text-base sm:text-lg">Messages</h2>
        </div>

        <form method="GET" className="flex gap-2 mb-4 flex-wrap">
          <input type="hidden" name="status" value={status} />
          <div className="relative flex-1 min-w-[160px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkFaint" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search subject, sender, or body…"
              className="w-full border border-black/15 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-surface"
            />
          </div>
          <select
            name="classification"
            defaultValue={classification}
            className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surface"
          >
            <option value="">All priority</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
            <option value="noise">Noise</option>
          </select>
          <button
            type="submit"
            className="text-sm font-medium bg-ink text-bg px-4 py-2.5 rounded-lg flex-shrink-0"
          >
            Search
          </button>
        </form>

        {messages.length === 0 ? (
          <div className="border border-dashed border-black/15 rounded-lg px-4 py-10 text-center text-sm text-inkDim">
            {!hasAccount
              ? "Connect an inbox to start seeing classified messages here."
              : q || classification || status
              ? "No messages match your filters."
              : "No messages classified yet — new mail will show up here as it arrives."}
          </div>
        ) : (
          <>
            <div className="border border-black/10 rounded-xl overflow-hidden bg-surface divide-y divide-black/[0.06]">
              {messages.map((email) => (
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
                    </div>
                    <p className="text-xs text-inkFaint truncate mt-0.5">
                      {email.from_address} — {(email.body_text || "").replace(/\s+/g, " ").slice(0, 60) || "No preview available"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusControl messageId={email.id} status={email.status} compact />
                    <span className="text-[11px] text-inkFaint">{relativeTime(email.created_at)}</span>
                  </div>
                  <ChevronRight size={16} className="text-inkFaint flex-shrink-0 hidden sm:block" />
                </a>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <a
                  href={buildQueryString({ q, classification, status, page: Math.max(1, page - 1) }) || "?"}
                  aria-disabled={page <= 1}
                  className={`inline-flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-black/15 ${
                    page <= 1 ? "opacity-40 pointer-events-none" : "hover:border-clay"
                  }`}
                >
                  <ChevronLeft size={15} /> Previous
                </a>
                <span className="text-xs text-inkFaint">
                  Page {page} of {totalPages}
                </span>
                <a
                  href={buildQueryString({ q, classification, status, page: Math.min(totalPages, page + 1) })}
                  aria-disabled={page >= totalPages}
                  className={`inline-flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-black/15 ${
                    page >= totalPages ? "opacity-40 pointer-events-none" : "hover:border-clay"
                  }`}
                >
                  Next <ChevronRight size={15} />
                </a>
              </div>
            )}
          </>
        )}

        <div className="flex items-start gap-2 mt-8 text-xs text-inkFaint border-t border-black/10 pt-6">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <p>
            Status updates automatically — new mail starts as "Needs reply"
            (or "Done" if classified as noise), and flips to "Follow-up"
            once you send a reply. Click the status badge to change it manually.
          </p>
        </div>
      </main>
    </>
  );
}
