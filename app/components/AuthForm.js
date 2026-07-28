"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

export default function AuthForm({ mode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.ok) {
        window.location.href = "/dashboard";
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong.");
    }
  }

  return (
    <div>
      <a
        href="/api/auth/google-signin"
        className="w-full flex items-center justify-center gap-2 border border-black/15 bg-surface rounded-xl px-5 py-3 text-sm font-medium hover:border-black/30 transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.5-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 6.1 29.5 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
          <path fill="#4CAF50" d="M24 45c5.4 0 10.3-1.8 14-5.1l-6.5-5.5C29.4 36 26.9 37 24 37c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 40.6 16.3 45 24 45z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.5C41.4 35.5 45 30.2 45 24c0-1.2-.1-2.5-.4-3.5z"/>
        </svg>
        Continue with Google
      </a>

      <div className="flex items-center gap-3 mb-4">
        <div className="h-px bg-black/10 flex-1" />
        <span className="text-xs text-inkFaint uppercase tracking-wide">or</span>
        <div className="h-px bg-black/10 flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="border border-black/15 bg-surface rounded-xl p-6">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-inkDim block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint"
            />
          </div>
          <div>
            <label className="text-xs text-inkDim block mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full mt-5 inline-flex items-center justify-center gap-2 text-sm font-medium bg-clay text-white px-5 py-3 rounded-lg hover:bg-clayDark transition-colors disabled:opacity-60"
        >
          {status === "loading" && <Loader2 size={15} className="animate-spin" />}
          {status === "loading" ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>

        {status === "error" && (
          <div className="flex items-start gap-2 mt-3 text-sm text-clayDark">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {errorMsg}
          </div>
        )}
      </form>
    </div>
  );
}
