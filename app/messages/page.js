import AppShell from "../components/AppShell";
import StatusControl from "../components/StatusControl";
import { sql } from "../lib/db";
import { getSessionUserId } from "../lib/auth";
import { redirect } from "next/navigation";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

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

async function getMessages(userId, { q, page, classification, status }) {
  const accounts = await sql`SELECT id FROM accounts WHERE user_id = ${userId}`;
  if (accounts.length === 0) return { messages: [], totalPages: 0, hasAccount: false };

  const accountIds = accounts.map((a) => a.id);
  const searchPattern = q ? `%${q}%` : null;
  const offset = (page - 1) * PAGE_SIZE;
  const whereClassification = classification || null;
  const whereStatus = status || null;

  const messages = await sql`
    SELECT id, from_address, subject, body_text, classification, status, created_at
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

  return { messages, totalPages, hasAccount: true };
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

export default async function MessagesPage({ searchParams }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const q = searchParams?.q || "";
  const classification = searchParams?.classification || "";
  const status = searchParams?.status || "";
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10) || 1);

  const { messages, totalPages, hasAccount } = await getMessages(userId, { q, page, classification, status });

  return (
    <AppShell>
      <main className="px-5 sm:px-8 py-8 max-w-5xl">
        <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-1">Messages</p>
        <h1 className="font-serif text-2xl sm:text-3xl mb-6">Every message, searchable.</h1>

        <form method="GET" className="flex gap-2 mb-4 flex-wrap">
          <input type="hidden" name="status" value={status} />
          <div className="relative flex-1 min-w-[200px]">
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
          <button type="submit" className="text-sm font-medium bg-ink text-bg px-4 py-2.5 rounded-lg flex-shrink-0">
            Search
          </button>
        </form>

        {status && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-inkDim">Filtered by status:</span>
            <a
              href={buildQueryString({ q, classification })}
              className="text-xs font-medium bg-clayTint text-clayDark px-2.5 py-1 rounded-full"
            >
              {status.replace("_", " ")} ✕
            </a>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="border border-dashed border-black/15 rounded-lg px-4 py-10 text-center text-sm text-inkDim">
            {!hasAccount
              ? "Connect an inbox to start seeing classified messages here."
              : "No messages match your filters."}
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
                    <span className="text-sm font-medium truncate block">{email.subject || "(no subject)"}</span>
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
                  className={`inline-flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-black/15 ${
                    page <= 1 ? "opacity-40 pointer-events-none" : "hover:border-clay"
                  }`}
                >
                  <ChevronLeft size={15} /> Previous
                </a>
                <span className="text-xs text-inkFaint">Page {page} of {totalPages}</span>
                <a
                  href={buildQueryString({ q, classification, status, page: Math.min(totalPages, page + 1) })}
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
      </main>
    </AppShell>
  );
}
