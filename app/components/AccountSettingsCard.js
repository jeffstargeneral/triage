"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Trash2, Plus } from "lucide-react";

const FIELD_LABELS = {
  sender_domain: "Sender domain contains",
  sender_address: "Sender address contains",
  subject_keyword: "Subject contains",
};

export default function AccountSettingsCard({ account, rules }) {
  const [displayName, setDisplayName] = useState(account.display_name || "");
  const [signature, setSignature] = useState(account.signature || "");
  const [autoReplyContext, setAutoReplyContext] = useState(account.auto_reply_context || "");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(account.auto_reply_enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newField, setNewField] = useState("sender_domain");
  const [newPattern, setNewPattern] = useState("");
  const [addingRule, setAddingRule] = useState(false);

  const router = useRouter();

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: account.id,
        displayName,
        signature,
        autoReplyContext,
        autoReplyEnabled,
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function handleAddRule(e) {
    e.preventDefault();
    if (!newPattern.trim()) return;
    setAddingRule(true);
    await fetch("/api/settings/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: account.id, field: newField, pattern: newPattern.trim() }),
    });
    setNewPattern("");
    setAddingRule(false);
    router.refresh();
  }

  async function handleDeleteRule(ruleId) {
    await fetch("/api/settings/rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId }),
    });
    router.refresh();
  }

  return (
    <div className="border border-black/10 bg-surface rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="font-medium">{account.email}</span>
        <span className="text-xs text-inkFaint">({account.provider})</span>
      </div>

      <form onSubmit={handleSaveProfile} className="flex flex-col gap-3 mb-6">
        <div>
          <label className="text-xs text-inkDim block mb-1">Your name (used in AI replies)</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jeff Stargeneral"
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-surfaceTint"
          />
        </div>
        <div>
          <label className="text-xs text-inkDim block mb-1">Signature</label>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={2}
            placeholder="Jeff&#10;Node Wealth"
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-surfaceTint"
          />
        </div>
        <div>
          <label className="text-xs text-inkDim block mb-1">Auto-reply context (out-of-office, etc.)</label>
          <textarea
            value={autoReplyContext}
            onChange={(e) => setAutoReplyContext(e.target.value)}
            rows={2}
            placeholder="On vacation until Aug 5. For urgent matters, contact james@company.com."
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm bg-surfaceTint"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoReplyEnabled}
            onChange={(e) => setAutoReplyEnabled(e.target.checked)}
          />
          Auto-reply enabled for this account
        </label>

        <button
          type="submit"
          disabled={saving}
          className="self-start inline-flex items-center gap-1.5 text-xs font-medium bg-ink text-bg px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "Saving…" : saved ? "Saved" : "Save settings"}
        </button>
      </form>

      <div className="border-t border-black/10 pt-4">
        <div className="text-xs font-medium text-inkDim uppercase tracking-wide mb-3">
          Auto-reply triggers
        </div>

        {rules.length === 0 && (
          <p className="text-xs text-inkFaint mb-3">
            No triggers yet — auto-reply won't send until at least one rule matches.
          </p>
        )}

        <div className="flex flex-col gap-2 mb-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between gap-2 text-sm bg-surfaceTint rounded-md px-3 py-2">
              <span>
                <span className="text-inkDim">{FIELD_LABELS[rule.field]}:</span> {rule.pattern}
              </span>
              <button onClick={() => handleDeleteRule(rule.id)} className="text-inkFaint hover:text-clayDark">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddRule} className="flex gap-2">
          <select
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            className="border border-black/15 rounded-lg px-2 py-2 text-xs bg-surfaceTint"
          >
            <option value="sender_domain">Sender domain</option>
            <option value="sender_address">Sender address</option>
            <option value="subject_keyword">Subject keyword</option>
          </select>
          <input
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="e.g. client.com or invoice"
            className="flex-1 border border-black/15 rounded-lg px-3 py-2 text-xs bg-surfaceTint"
          />
          <button
            type="submit"
            disabled={addingRule}
            className="inline-flex items-center gap-1 text-xs font-medium border border-black/15 rounded-lg px-3 py-2 hover:border-clay transition-colors disabled:opacity-60"
          >
            <Plus size={13} /> Add
          </button>
        </form>
      </div>
    </div>
  );
}
