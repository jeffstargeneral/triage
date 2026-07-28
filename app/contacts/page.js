import AppShell from "../components/AppShell";
import { sql } from "../lib/db";
import { getSessionUserId } from "../lib/auth";
import { redirect } from "next/navigation";
import { Search, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

const statusDot = {
  needs_reply: "bg-clay",
  follow_up: "bg-waiting",
  done: "bg-routine",
};

function initials(fromAddress) {
  const name = (fromAddress || "?").split("@")[0];
  return name.slice(0, 2).toUpperCase();
}

function relativeTime(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

async function getContacts(userId, q) {
  const accounts = await sql`SELECT id FROM accounts WHERE user_id = ${userId}`;
  if (accounts.length === 0) return [];

  const accountIds = accounts.map((a) => a.id);
  const searchPattern = q ? `%${q}%` : null;

  const contacts = await sql`
    SELECT * FROM (
      SELECT DISTINCT ON (from_address)
        from_address,
        subject AS last_subject,
        status AS latest_status,
        created_at AS last_contact,
        COUNT(*) OVER (PARTITION BY from_address) AS message_count
      FROM messages
      WHERE account_id = ANY(${accountIds})
        AND (${searchPattern}::text IS NULL OR from_address ILIKE ${searchPattern})
      ORDER BY from_address, created_at DESC
    ) contacts
    ORDER BY last_contact DESC
    LIMIT 50
  `;

  return contacts;
}

export default async function ContactsPage({ searchParams }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const q = searchParams?.q || "";
  const contacts = await getContacts(userId, q);

  return (
    <AppShell>
      <main className="px-5 sm:px-8 py-8 max-w-5xl">
        <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-2">Contacts</p>
        <h1 className="font-serif text-2xl sm:text-3xl mb-2">Everyone who's emailed you.</h1>
        <p className="text-sm text-inkDim mb-6">
          Built from your inbox automatically — no manual data entry. Each
          contact shows their most recent message and status.
        </p>

        <form method="GET" className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkFaint" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search contacts by email…"
            className="w-full border border-black/15 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-surface"
          />
        </form>

        {contacts.length === 0 ? (
          <div className="border border-dashed border-black/15 rounded-lg px-4 py-10 text-center text-sm text-inkDim">
            {q ? "No contacts match that search." : "Contacts appear here automatically as mail comes in."}
          </div>
        ) : (
          <div className="border border-black/10 rounded-xl overflow-hidden bg-surface divide-y divide-black/[0.06]">
            {contacts.map((c) => (
              <a
                key={c.from_address}
                href={`/messages?q=${encodeURIComponent(c.from_address)}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-surfaceTint transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-bgAlt flex items-center justify-center text-xs font-medium text-inkDim flex-shrink-0">
                  {initials(c.from_address)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.from_address}</div>
                  <p className="text-xs text-inkFaint truncate mt-0.5">{c.last_subject || "(no subject)"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                  <div className="flex items-center gap-1.5 text-xs text-inkDim">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[c.latest_status]}`} />
                    {c.message_count} {c.message_count === 1 ? "message" : "messages"}
                  </div>
                  <span className="text-[11px] text-inkFaint">{relativeTime(c.last_contact)}</span>
                </div>
                <ArrowUpRight size={15} className="text-inkFaint flex-shrink-0 hidden sm:block" />
              </a>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
