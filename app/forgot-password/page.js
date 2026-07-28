"use client";

import { useState } from "react";
import Nav from "../components/Nav";
import { Loader2, Copy, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [resetLink, setResetLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResetLink(data.resetLink || "");
      setStatus("done");
    } catch {
      setStatus("done");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Nav />
      <main className="pt-32 pb-24 max-w-sm mx-auto px-6">
        <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-3 text-center">
          Reset your password
        </p>
        <h1 className="font-serif text-3xl mb-8 text-center">Forgot password</h1>

        {status !== "done" ? (
          <form onSubmit={handleSubmit} className="border border-black/15 bg-surface rounded-xl p-6">
            <label className="text-xs text-inkDim block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint mb-4"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium bg-clay text-white px-5 py-3 rounded-lg hover:bg-clayDark transition-colors disabled:opacity-60"
            >
              {status === "loading" && <Loader2 size={15} className="animate-spin" />}
              {status === "loading" ? "Please wait…" : "Send reset link"}
            </button>
          </form>
        ) : resetLink ? (
          <div className="border border-black/15 bg-surface rounded-xl p-6">
            <p className="text-sm text-inkDim mb-3">
              This project doesn't have email sending set up yet, so here's
              your reset link directly (in production, this would be
              emailed instead):
            </p>
            <div className="flex items-center gap-2 bg-surfaceTint border border-black/15 rounded-lg px-3 py-2.5">
              <code className="text-xs text-ink truncate flex-1">{resetLink}</code>
              <button onClick={handleCopy} className="flex-shrink-0 text-inkDim hover:text-clayDark">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <a
              href={resetLink}
              className="block text-center mt-4 text-sm font-medium bg-clay text-white px-5 py-3 rounded-lg hover:bg-clayDark transition-colors"
            >
              Continue to reset password
            </a>
          </div>
        ) : (
          <div className="border border-black/15 bg-surface rounded-xl p-6 text-sm text-inkDim text-center">
            If an account exists with that email, a reset link has been generated.
          </div>
        )}

        <p className="text-center text-sm text-inkDim mt-6">
          <a href="/login" className="text-clayDark underline">
            Back to login
          </a>
        </p>
      </main>
    </>
  );
}
