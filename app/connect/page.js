import Nav from "../components/Nav";
import ImapConnectForm from "../components/ImapConnectForm";
import { Lock, Mail } from "lucide-react";

export default function ConnectPage() {
  return (
    <>
      <Nav />
      <main className="pt-32 pb-24 max-w-md mx-auto px-6">
        <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-4 text-center">
          Connect your inbox
        </p>
        <h1 className="font-serif text-3xl mb-4 text-center">
          Choose your provider.
        </h1>
        <p className="text-inkDim text-center mb-10">
          You'll approve access on Google or Microsoft's own sign-in page.
          We never see or store your password.
        </p>

        <div className="flex flex-col gap-3 mb-8">
          <a
            href="/api/auth/google"
            className="flex items-center gap-3 border border-black/15 bg-surface rounded-xl px-5 py-4 hover:border-clay transition-colors"
          >
            <Mail size={20} className="text-clay" />
            <div className="text-left">
              <div className="font-medium">Connect Gmail</div>
              <div className="text-xs text-inkDim">Google Workspace or personal Gmail</div>
            </div>
          </a>

          <a
            href="/api/auth/microsoft"
            className="flex items-center gap-3 border border-black/15 bg-surface rounded-xl px-5 py-4 hover:border-clay transition-colors"
          >
            <Mail size={20} className="text-clay" />
            <div className="text-left">
              <div className="font-medium">Connect Outlook</div>
              <div className="text-xs text-inkDim">Microsoft 365 or Outlook.com</div>
            </div>
          </a>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="h-px bg-black/10 flex-1" />
          <span className="text-xs text-inkFaint uppercase tracking-wide">or</span>
          <div className="h-px bg-black/10 flex-1" />
        </div>

        <ImapConnectForm />

        <div className="flex items-start gap-2 mt-10 text-xs text-inkFaint">
          <Lock size={14} className="mt-0.5 flex-shrink-0" />
          <p>
            Read and label access only. You can revoke access at any time
            from your Google or Microsoft account settings — for IMAP
            connections, change your password to revoke access.
          </p>
        </div>
      </main>
    </>
  );
}
