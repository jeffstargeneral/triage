"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, RotateCw, CheckCircle2, ChevronDown } from "lucide-react";

const STATUS_META = {
  needs_reply: { label: "Needs reply", icon: Clock, className: "bg-clayTint text-clayDark" },
  follow_up: { label: "Follow-up", icon: RotateCw, className: "bg-waitingTint text-waiting" },
  done: { label: "Done", icon: CheckCircle2, className: "bg-[#EAEFE6] text-routine" },
};

export default function StatusControl({ messageId, status, compact }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleChange(newStatus) {
    setOpen(false);
    if (newStatus === current) return;
    setSaving(true);
    setCurrent(newStatus);
    await fetch("/api/messages/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, status: newStatus }),
    });
    setSaving(false);
    router.refresh();
  }

  const meta = STATUS_META[current] || STATUS_META.needs_reply;
  const Icon = meta.icon;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${meta.className} ${compact ? "" : "px-3 py-1.5"}`}
      >
        <Icon size={compact ? 11 : 13} />
        {meta.label}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute z-10 top-full mt-1 right-0 bg-surface border border-black/10 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
          {Object.entries(STATUS_META).map(([key, m]) => {
            const OptIcon = m.icon;
            return (
              <button
                key={key}
                onClick={() => handleChange(key)}
                className="flex items-center gap-2 w-full text-left text-xs px-3 py-2 hover:bg-surfaceTint transition-colors"
              >
                <OptIcon size={12} />
                {m.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
