"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Hexagon, LogOut } from "lucide-react";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [auth, setAuth] = useState(null); // null = loading, then { loggedIn, email }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setAuth)
      .catch(() => setAuth({ loggedIn: false }));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

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
          <a href="/#roadmap" className="hover:text-ink transition-colors">
            Roadmap
          </a>
          {auth?.loggedIn && (
            <>
              <a href="/dashboard" className="hover:text-ink transition-colors">
                Dashboard
              </a>
              <a href="/contacts" className="hover:text-ink transition-colors">
                Contacts
              </a>
              <a href="/settings" className="hover:text-ink transition-colors">
                Settings
              </a>
            </>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {auth?.loggedIn ? (
            <>
              <span className="text-xs text-inkFaint truncate max-w-[140px]">{auth.email}</span>
              <a
                href="/connect"
                className="inline-flex items-center gap-2 text-sm font-medium bg-clay text-white px-5 py-2.5 rounded-lg hover:bg-clayDark transition-colors"
              >
                Connect inbox <ArrowRight size={15} />
              </a>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm text-inkDim hover:text-ink transition-colors"
              >
                <LogOut size={14} /> Log out
              </button>
            </>
          ) : auth?.loggedIn === false ? (
            <>
              <a href="/login" className="text-sm text-inkDim hover:text-ink transition-colors">
                Log in
              </a>
              <a
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-medium bg-clay text-white px-5 py-2.5 rounded-lg hover:bg-clayDark transition-colors"
              >
                Sign up <ArrowRight size={15} />
              </a>
            </>
          ) : null}
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
            href="/#roadmap"
            className="py-3 border-b border-black/10 font-serif text-lg"
            onClick={() => setOpen(false)}
          >
            Roadmap
          </a>
          {auth?.loggedIn && (
            <>
              <a
                href="/dashboard"
                className="py-3 border-b border-black/10 font-serif text-lg"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </a>
              <a
                href="/contacts"
                className="py-3 border-b border-black/10 font-serif text-lg"
                onClick={() => setOpen(false)}
              >
                Contacts
              </a>
              <a
                href="/settings"
                className="py-3 border-b border-black/10 font-serif text-lg"
                onClick={() => setOpen(false)}
              >
                Settings
              </a>
            </>
          )}
          {auth?.loggedIn ? (
            <>
              <a
                href="/connect"
                className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium bg-clay text-white px-5 py-3 rounded-lg"
                onClick={() => setOpen(false)}
              >
                Connect inbox <ArrowRight size={15} />
              </a>
              <button
                onClick={handleLogout}
                className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium border border-black/15 px-5 py-3 rounded-lg"
              >
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium border border-black/15 px-5 py-3 rounded-lg"
                onClick={() => setOpen(false)}
              >
                Log in
              </a>
              <a
                href="/signup"
                className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium bg-clay text-white px-5 py-3 rounded-lg"
                onClick={() => setOpen(false)}
              >
                Sign up <ArrowRight size={15} />
              </a>
            </>
          )}
        </div>
      )}
    </header>
  );
}
