"use client";

import { useState } from "react";
import { RefreshCw, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

const ENDPOINTS = {
  imap: "/api/sync/imap",
  google: "/api/sync/google",
  microsoft: "/api/sync/microsoft",
};

export default function SyncButton({ accountId, provider }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const router = useRouter();

  async function handleSync() {
    setStatus("loading");
    try {
      const res = await fetch(ENDPOINTS[provider] || ENDPOINTS.imap, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      await res.json();
      setStatus("done");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={status === "loading"}
      className="inline-flex items-center gap-1.5 text-xs font-medium border border-black/15 rounded-full px-3 py-1.5 hover:border-clay transition-colors disabled:opacity-60"
    >
      {status === "loading" && <Loader2 size={13} className="animate-spin" />}
      {status === "done" && <Check size={13} />}
      {status === "idle" && <RefreshCw size={13} />}
      {status === "loading" ? "Syncing…" : status === "done" ? "Synced" : "Sync now"}
    </button>
  );
}
