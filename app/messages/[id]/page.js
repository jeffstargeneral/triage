import Nav from "../../components/Nav";
import ReplyPanel from "../../components/ReplyPanel";
import StatusControl from "../../components/StatusControl";
import { sql } from "../../lib/db";
import { getSessionUserId } from "../../lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const tagStyles = {
  urgent: "bg-clayTint text-clayDark",
  routine: "bg-[#EAEFE6] text-routine",
  noise: "bg-bgAlt text-inkDim",
};

function initials(fromAddress) {
  const name = (fromAddress || "?").split("@")[0];
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getMessage(id, userId) {
  const rows = await sql`
    SELECT m.id, m.from_address, m.subject, m.body_text, m.classification, m.status, m.replied_at, m.created_at
    FROM messages m
    JOIN accounts a ON a.id = m.account_id
    WHERE m.id = ${id} AND a.user_id = ${userId}
  `;
  return rows[0];
}

export default async function MessageDetailPage({ params }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const message = await getMessage(params.id, userId);
  if (!message) notFound();

  return (
    <>
      <Nav />
      <main className="pt-24 pb-24 max-w-2xl mx-auto px-5 sm:px-6">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-inkDim hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to inbox
        </a>

        <div className="border border-black/10 bg-surface rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-8 border-b border-black/10">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${tagStyles[message.classification]}`}>
                {message.classification}
              </span>
              <StatusControl messageId={message.id} status={message.status} />
            </div>

            <h1 className="font-serif text-2xl sm:text-[28px] leading-snug mb-5 break-words">
              {message.subject || "(no subject)"}
            </h1>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-bgAlt flex items-center justify-center text-sm font-medium text-inkDim flex-shrink-0">
                {initials(message.from_address)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{message.from_address}</div>
                <div className="text-xs text-inkFaint">{formatDate(message.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-8">
            {message.body_text ? (
              <div className="text-[15px] leading-relaxed text-ink whitespace-pre-wrap break-words">
                {message.body_text}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-inkFaint py-6">
                <Mail size={16} />
                No message body was captured for this email.
              </div>
            )}
          </div>
        </div>

        {/* Reply */}
        <div className="mt-6">
          <h2 className="font-medium text-sm text-inkDim mb-3 uppercase tracking-wide">Reply</h2>
          <ReplyPanel messageId={message.id} alreadyReplied={Boolean(message.replied_at)} />
        </div>
      </main>
    </>
  );
}
