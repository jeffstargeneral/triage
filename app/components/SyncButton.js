"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SyncButton({ accountId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    try {
      await fetch("/api/sync/imap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium border border-black/15 rounded-full px-3 py-1.5 hover:border-clay transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
      {loading ? "Syncing…" : "Sync now"}
    </button>
  );
}
