import AppShell from "../components/AppShell";
import SyncButton from "../components/SyncButton";
import StatusControl from "../components/StatusControl";
import VolumeChart from "../components/charts/VolumeChart";
import ClassificationDonut from "../components/charts/ClassificationDonut";
import { sql } from "../lib/db";
import { getSessionUserId } from "../lib/auth";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, RotateCw, Inbox, ArrowRight, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

const providerLabel = { google: "Gmail", microsoft: "Outlook", imap: "IMAP" };

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

async function getOverviewData(userId) {
  const accounts = await sql`
    SELECT id, provider, email FROM accounts WHERE user_id = ${userId} ORDER BY created_at DESC
  `;

  if (accounts.length === 0) {
    return {
      accounts: [],
      stats: { needs_reply: 0, follow_up: 0, done: 0, total: 0 },
      recent: [],
      volumeData: [],
      classificationData: { urgent: 0, routine: 0, noise: 0 },
    };
  }

  const accountIds = accounts.map((a) => a.id);

  const recent = await sql`
    SELECT id, from_address, subject, body_text, classification, status, created_at
    FROM messages
    WHERE account_id = ANY(${accountIds})
    ORDER BY created_at DESC
    LIMIT 8
  `;

  const allStatuses = await sql`SELECT status FROM messages WHERE account_id = ANY(${accountIds})`;
  const stats = { needs_reply: 0, follow_up: 0, done: 0, total: allStatuses.length };
  for (const m of allStatuses) {
    if (stats[m.status] !== undefined) stats[m.status]++;
  }

  // Analytics are always computed from the FULL message history for
  // these accounts — never limited by the per-account "messages to pull
  // per sync" setting, so changing that setting in Settings never
  // affects these numbers retroactively.
  const volumeRows = await sql`
    SELECT d::date AS day, COUNT(m.id)::int AS count
    FROM generate_series((current_date - interval '13 days')::date, current_date, interval '1 day') d
    LEFT JOIN messages m
      ON date_trunc('day', m.created_at) = d
      AND m.account_id = ANY(${accountIds})
    GROUP BY d
    ORDER BY d
  `;
  const volumeData = volumeRows.map((r) => ({
    label: new Date(r.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: r.count,
  }));

  const classificationRows = await sql`
    SELECT classification, COUNT(*)::int AS count
    FROM messages
    WHERE account_id = ANY(${accountIds})
    GROUP BY classification
  `;
  const classificationData = { urgent: 0, routine: 0, noise: 0 };
  for (const r of classificationRows) {
    classificationData[r.classification] = r.count;
  }

  return { accounts, stats, recent, volumeData, classificationData };
}

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { accounts, stats, recent, volumeData, classificationData } = await getOverviewData(userId);
  const hasAccount = accounts.length > 0;

  return (
    <AppShell>
      <main className="px-5 sm:px-8 py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-1">Overview</p>
            <h1 className="font-serif text-2xl sm:text-3xl">Your inbox, at a glance.</h1>
          </div>
        </div>

        {!hasAccount ? (
          <div className="border border-dashed border-black/15 rounded-2xl px-6 py-16 text-center">
            <Inbox size={28} className="mx-auto text-inkFaint mb-4" />
            <h2 className="font-serif text-xl mb-2">No inbox connected yet</h2>
            <p className="text-sm text-inkDim mb-6 max-w-sm mx-auto">
              Connect Gmail, Outlook, or another webmail provider to start
              seeing classified messages and contacts here.
            </p>
            <a
              href="/connect"
              className="inline-flex items-center gap-2 text-sm font-medium bg-clay text-white px-5 py-3 rounded-lg hover:bg-clayDark transition-colors"
            >
              Connect an inbox <ArrowRight size={15} />
            </a>
          </div>
        ) : (
          <>
            {/* Connected accounts */}
            <div className="flex flex-col gap-2 mb-8">
              {accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 border border-black/10 bg-surface rounded-xl px-4 py-3 flex-wrap"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={16} className="text-routine flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{a.email}</span>
                    <span className="text-xs text-inkFaint border border-black/10 rounded-full px-2 py-0.5 flex-shrink-0">
                      {providerLabel[a.provider]}
                    </span>
                  </div>
                  <SyncButton accountId={a.id} provider={a.provider} />
                </div>
              ))}
            </div>

            {/* Stat cards — the pipeline view */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
              <a
                href="/messages?status=needs_reply"
                className="border border-black/10 bg-surface rounded-xl p-5 hover:border-clay/40 transition-colors"
              >
                <Clock size={16} className="text-clayDark mb-3" />
                <div className="text-2xl font-serif text-clayDark">{stats.needs_reply}</div>
                <div className="text-xs text-inkDim mt-1">Needs reply</div>
              </a>
              <a
                href="/messages?status=follow_up"
                className="border border-black/10 bg-surface rounded-xl p-5 hover:border-waiting/40 transition-colors"
              >
                <RotateCw size={16} className="text-waiting mb-3" />
                <div className="text-2xl font-serif text-waiting">{stats.follow_up}</div>
                <div className="text-xs text-inkDim mt-1">Follow-up</div>
              </a>
              <a
                href="/messages?status=done"
                className="border border-black/10 bg-surface rounded-xl p-5 hover:border-routine/40 transition-colors"
              >
                <CheckCircle2 size={16} className="text-routine mb-3" />
                <div className="text-2xl font-serif text-routine">{stats.done}</div>
                <div className="text-xs text-inkDim mt-1">Done</div>
              </a>
              <a
                href="/messages"
                className="border border-black/10 bg-surface rounded-xl p-5 hover:border-black/25 transition-colors"
              >
                <Mail size={16} className="text-inkDim mb-3" />
                <div className="text-2xl font-serif text-ink">{stats.total}</div>
                <div className="text-xs text-inkDim mt-1">Total messages</div>
              </a>
            </div>

            {/* Analytics */}
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              <div className="md:col-span-2 border border-black/10 bg-surface rounded-xl p-5">
                <h3 className="text-sm font-medium mb-1">Message volume</h3>
                <p className="text-xs text-inkFaint mb-3">Last 14 days, across all connected inboxes</p>
                <VolumeChart data={volumeData} />
              </div>
              <div className="border border-black/10 bg-surface rounded-xl p-5">
                <h3 className="text-sm font-medium mb-1">Priority breakdown</h3>
                <p className="text-xs text-inkFaint mb-3">All-time, all inboxes</p>
                <ClassificationDonut data={classificationData} />
                <div className="flex items-center justify-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-inkDim">
                    <span className="w-2 h-2 rounded-full bg-clay" /> Urgent
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-inkDim">
                    <span className="w-2 h-2 rounded-full bg-routine" /> Routine
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-inkDim">
                    <span className="w-2 h-2 rounded-full bg-noise" /> Noise
                  </span>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-base">Recent activity</h2>
              <a href="/messages" className="text-xs text-clayDark font-medium inline-flex items-center gap-1">
                View all <ArrowRight size={13} />
              </a>
            </div>

            {recent.length === 0 ? (
              <div className="border border-dashed border-black/15 rounded-xl px-4 py-10 text-center text-sm text-inkDim">
                No messages yet — click "Sync now" above to pull in recent mail.
              </div>
            ) : (
              <div className="border border-black/10 rounded-xl overflow-hidden bg-surface divide-y divide-black/[0.06]">
                {recent.map((email) => (
                  <a
                    key={email.id}
                    href={`/messages/${email.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-surfaceTint transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-bgAlt flex items-center justify-center text-xs font-medium text-inkDim flex-shrink-0">
                      {initials(email.from_address)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{email.subject || "(no subject)"}</div>
                      <p className="text-xs text-inkFaint truncate mt-0.5">
                        {email.from_address} — {(email.body_text || "").replace(/\s+/g, " ").slice(0, 60) || "No preview available"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusControl messageId={email.id} status={email.status} compact />
                      <span className="text-[11px] text-inkFaint">{relativeTime(email.created_at)}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
