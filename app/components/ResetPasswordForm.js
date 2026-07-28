"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setToken(searchParams.get("token") || "");
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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
      <label className="text-xs text-inkDim block mb-1">New password</label>
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        className="w-full border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint mb-4"
      />
      <button
        type="submit"
        disabled={status === "loading" || !token}
        className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium bg-clay text-white px-5 py-3 rounded-lg hover:bg-clayDark transition-colors disabled:opacity-60"
      >
        {status === "loading" && <Loader2 size={15} className="animate-spin" />}
        {status === "loading" ? "Please wait…" : "Set new password"}
      </button>

      {!token && (
        <p className="text-xs text-clayDark mt-3">
          No reset token found in the URL — use the link from the forgot password page.
        </p>
      )}
      {status === "error" && (
        <div className="flex items-start gap-2 mt-3 text-sm text-clayDark">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {errorMsg}
        </div>
      )}
    </form>
  );
}
