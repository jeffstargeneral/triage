"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Send, X, CheckCircle2 } from "lucide-react";

export default function ReplyPanel({ messageId, alreadyReplied }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("idle"); // idle | drafting | ready | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleGenerate() {
    setOpen(true);
    setStatus("drafting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/reply/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      const data = await res.json();
      if (data.ok) {
        setDraft(data.draft);
        setStatus("ready");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Could not generate a draft.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong.");
    }
  }

  async function handleSend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/reply/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, text: draft }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("sent");
        router.refresh();
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to send.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong.");
    }
  }

  if (alreadyReplied && !open) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-routine">
        <CheckCircle2 size={13} /> Replied
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={handleGenerate}
        className="inline-flex items-center gap-1.5 text-xs font-medium border border-black/15 rounded-full px-3 py-1.5 hover:border-clay transition-colors"
      >
        <Sparkles size={13} /> AI reply
      </button>
    );
  }

  return (
    <div className="mt-2 border border-black/10 rounded-lg p-3 bg-surfaceTint">
      {status === "drafting" && (
        <div className="flex items-center gap-2 text-xs text-inkDim py-2">
          <Loader2 size={13} className="animate-spin" /> Drafting a reply…
        </div>
      )}

      {(status === "ready" || status === "sending" || status === "error") && (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full text-sm border border-black/15 rounded-md p-2 bg-surface"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSend}
              disabled={status === "sending"}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-clay text-white px-3 py-1.5 rounded-full hover:bg-clayDark transition-colors disabled:opacity-60"
            >
              {status === "sending" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {status === "sending" ? "Sending…" : "Send reply"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs text-inkDim px-2"
            >
              <X size={13} /> Cancel
            </button>
          </div>
          {status === "error" && <p className="text-xs text-clayDark mt-2">{errorMsg}</p>}
        </>
      )}

      {status === "sent" && (
        <div className="flex items-center gap-2 text-xs text-routine py-1">
          <CheckCircle2 size={13} /> Reply sent.
        </div>
      )}
    </div>
  );
}
