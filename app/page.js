import Nav from "./components/Nav";
import TriageFlow from "./components/TriageFlow";
import { Lock, Zap, Route as RouteIcon, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="pt-28">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-5">
              Inbox triage, automatically
            </p>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-6">
              Your inbox, sorted <em className="italic text-clay">before you open it</em>.
            </h1>
            <p className="text-lg text-inkDim mb-8 max-w-md">
              Connect Gmail or Outlook and every new email gets classified the
              moment it arrives — urgent, routine, or noise — and routed
              where it needs to go.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/connect"
                className="inline-flex items-center gap-2 text-sm font-medium bg-clay text-white px-6 py-3.5 rounded-lg hover:bg-clayDark transition-colors"
              >
                Connect your inbox <ArrowRight size={16} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 text-sm font-medium border border-black/15 px-6 py-3.5 rounded-lg hover:bg-surfaceTint transition-colors"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="bg-surface border border-black/10 rounded-2xl p-8">
            <TriageFlow />
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-black/10">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-wrap gap-8 items-center justify-center text-sm text-inkDim">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-clay" />
              OAuth only — we never see your password
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-clay" />
              Real-time, not polling
            </div>
            <div className="flex items-center gap-2">
              <RouteIcon size={16} className="text-clay" />
              Works with Gmail and Outlook 365
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-4">
            How it works
          </p>
          <h2 className="font-serif text-3xl mb-12 max-w-xl">
            Three steps, no inbox babysitting after that.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-surface border border-black/10 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-clayTint flex items-center justify-center mb-5 text-clayDark font-serif">
                1
              </div>
              <h3 className="font-medium text-lg mb-2">Connect</h3>
              <p className="text-sm text-inkDim">
                Sign in with Google or Microsoft. We ask for read and label
                permissions only — never your password.
              </p>
            </div>
            <div className="bg-surface border border-black/10 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-clayTint flex items-center justify-center mb-5 text-clayDark font-serif">
                2
              </div>
              <h3 className="font-medium text-lg mb-2">Classify</h3>
              <p className="text-sm text-inkDim">
                Every new email is checked against your rules first, then an
                AI model handles anything ambiguous.
              </p>
            </div>
            <div className="bg-surface border border-black/10 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-clayTint flex items-center justify-center mb-5 text-clayDark font-serif">
                3
              </div>
              <h3 className="font-medium text-lg mb-2">Act</h3>
              <p className="text-sm text-inkDim">
                Urgent messages get flagged instantly, routine ones get
                filed, noise gets out of your way.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Stop opening every email to find out what it is.
          </h2>
          <p className="text-inkDim mb-8 max-w-md mx-auto">
            Free while in beta. Connect your inbox in under a minute.
          </p>
          <a
            href="/connect"
            className="inline-flex items-center gap-2 text-sm font-medium bg-clay text-white px-7 py-3.5 rounded-lg hover:bg-clayDark transition-colors"
          >
            Connect your inbox <ArrowRight size={16} />
          </a>
        </section>

        <footer className="border-t border-black/10 py-8">
          <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-between items-center gap-4 text-sm text-inkFaint">
            <span>© 2026 Node Wealth</span>
            <a href="https://node-wealth.com" className="hover:text-clayDark">
              node-wealth.com
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
