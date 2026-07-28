"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const PRESETS = {
  hostinger: { label: "Hostinger", host: "imap.hostinger.com", port: 993, smtpHost: "smtp.hostinger.com", smtpPort: 465 },
  cpanel: { label: "cPanel hosting", host: "mail.yourdomain.com", port: 993, smtpHost: "mail.yourdomain.com", smtpPort: 465 },
  zoho: { label: "Zoho Mail", host: "imap.zoho.com", port: 993, smtpHost: "smtp.zoho.com", smtpPort: 465 },
  custom: { label: "Custom / other", host: "", port: 993, smtpHost: "", smtpPort: 465 },
};

export default function ImapConnectForm() {
  const [preset, setPreset] = useState("hostinger");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [host, setHost] = useState(PRESETS.hostinger.host);
  const [port, setPort] = useState(PRESETS.hostinger.port);
  const [smtpHost, setSmtpHost] = useState(PRESETS.hostinger.smtpHost);
  const [smtpPort, setSmtpPort] = useState(PRESETS.hostinger.smtpPort);
  const [showSmtp, setShowSmtp] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  function handlePreset(key) {
    setPreset(key);
    setHost(PRESETS[key].host);
    setPort(PRESETS[key].port);
    setSmtpHost(PRESETS[key].smtpHost);
    setSmtpPort(PRESETS[key].smtpPort);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/imap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, host, port, useSSL: true, smtpHost, smtpPort }),
      });
      const data = await res.json();

      if (data.ok) {
        setStatus("success");
        window.location.href = "/dashboard?connected=imap";
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Connection failed.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Something went wrong. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-black/15 bg-surface rounded-xl p-5">
      <div className="text-sm font-medium mb-1">Other webmail (IMAP)</div>
      <p className="text-xs text-inkDim mb-4">
        For Hostinger, cPanel-based hosting, Zoho, and similar providers
        without OAuth. Use an app-specific password if your provider
        supports one.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            type="button"
            key={key}
            onClick={() => handlePreset(key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              preset === key
                ? "bg-clay text-white border-clay"
                : "border-black/15 text-inkDim hover:border-clay"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="you@yourdomain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint"
        />
        <input
          type="password"
          required
          placeholder="Password or app password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint"
        />
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="IMAP host"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="col-span-2 border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint"
          />
          <input
            type="number"
            required
            placeholder="Port"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowSmtp(!showSmtp)}
          className="flex items-center gap-1.5 text-xs text-inkDim self-start"
        >
          {showSmtp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          SMTP settings (needed to send replies)
        </button>

        {showSmtp && (
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="SMTP host"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="col-span-2 border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint"
            />
            <input
              type="number"
              placeholder="Port"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="border border-black/15 rounded-lg px-3 py-2.5 text-sm bg-surfaceTint"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium bg-ink text-bg px-5 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {status === "loading" && <Loader2 size={15} className="animate-spin" />}
        {status === "loading" ? "Testing connection…" : "Test & connect"}
      </button>

      {status === "success" && (
        <div className="flex items-center gap-2 mt-3 text-sm text-routine">
          <CheckCircle2 size={15} /> Connected — redirecting…
        </div>
      )}
      {status === "error" && (
        <div className="flex items-start gap-2 mt-3 text-sm text-clayDark">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {errorMsg}
        </div>
      )}
    </form>
  );
}
