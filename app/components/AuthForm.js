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
  );
}
