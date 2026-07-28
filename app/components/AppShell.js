"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Hexagon,
  LayoutGrid,
  Mail,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [auth, setAuth] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const SidebarContent = (
    <>
      <a href="/dashboard" className="flex items-center gap-2 font-serif text-lg font-medium px-1 mb-8">
        <Hexagon size={20} className="text-clay" strokeWidth={1.8} />
        Triage
      </a>

      <a
        href="/connect"
        className="flex items-center justify-center gap-2 text-sm font-medium bg-clay text-white px-4 py-2.5 rounded-lg hover:bg-clayDark transition-colors mb-6"
      >
        <Plus size={15} /> Connect inbox
      </a>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? "bg-clayTint text-clayDark font-medium" : "text-inkDim hover:bg-surfaceTint hover:text-ink"
              }`}
            >
              <Icon size={17} />
              {label}
            </a>
          );
        })}
      </nav>

      <div className="border-t border-black/10 pt-4 mt-4">
        {auth?.loggedIn && (
          <div className="text-xs text-inkFaint truncate mb-3 px-1">{auth.email}</div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-inkDim hover:bg-surfaceTint hover:text-ink transition-colors w-full"
        >
          <LogOut size={17} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 flex-shrink-0 border-r border-black/10 bg-surfaceTint px-4 py-6 fixed top-0 left-0 bottom-0">
        {SidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-bg/90 backdrop-blur-md border-b border-black/10 flex items-center justify-between px-4 py-3">
        <a href="/dashboard" className="flex items-center gap-2 font-serif text-base font-medium">
          <Hexagon size={18} className="text-clay" strokeWidth={1.8} />
          Triage
        </a>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-lg border border-black/15 flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu size={17} />
        </button>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-bg flex flex-col px-5 py-6">
          <div className="flex items-center justify-between mb-8">
            <a href="/dashboard" className="flex items-center gap-2 font-serif text-lg font-medium">
              <Hexagon size={20} className="text-clay" strokeWidth={1.8} />
              Triage
            </a>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-9 h-9 rounded-lg border border-black/15 flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 flex flex-col" onClick={() => setMobileOpen(false)}>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-60 pt-14 md:pt-0">{children}</div>
    </div>
  );
}
