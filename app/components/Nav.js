"use client";

import { useState } from "react";
import { Menu, X, ArrowRight, Hexagon } from "lucide-react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-md border-b border-black/10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-serif text-lg font-medium">
          <Hexagon size={20} className="text-clay" strokeWidth={1.8} />
          Triage
          <span className="hidden sm:inline text-inkFaint text-sm font-sans font-normal">
            by Node Wealth
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm text-inkDim">
          <a href="/#how-it-works" className="hover:text-ink transition-colors">
            How it works
          </a>
          <a href="/dashboard" className="hover:text-ink transition-colors">
            Dashboard
          </a>
          <a href="/settings" className="hover:text-ink transition-colors">
            Settings
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/connect"
            className="inline-flex items-center gap-2 text-sm font-medium bg-clay text-white px-5 py-2.5 rounded-lg hover:bg-clayDark transition-colors"
          >
            Connect your inbox <ArrowRight size={15} />
          </a>
        </div>

        <button
          className="md:hidden w-9 h-9 rounded-lg border border-black/15 flex items-center justify-center"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden px-6 pb-6 pt-2 flex flex-col gap-1 bg-bg border-t border-black/10">
          <a
            href="/#how-it-works"
            className="py-3 border-b border-black/10 font-serif text-lg"
            onClick={() => setOpen(false)}
          >
            How it works
          </a>
          <a
            href="/dashboard"
            className="py-3 border-b border-black/10 font-serif text-lg"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </a>
          <a
            href="/settings"
            className="py-3 border-b border-black/10 font-serif text-lg"
            onClick={() => setOpen(false)}
          >
            Settings
          </a>
          <a
            href="/connect"
            className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium bg-clay text-white px-5 py-3 rounded-lg"
            onClick={() => setOpen(false)}
          >
            Connect your inbox <ArrowRight size={15} />
          </a>
        </div>
      )}
    </header>
  );
}
