import { Suspense } from "react";
import Nav from "../components/Nav";
import ResetPasswordForm from "../components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <>
      <Nav />
      <main className="pt-32 pb-24 max-w-sm mx-auto px-6">
        <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-3 text-center">
          Almost done
        </p>
        <h1 className="font-serif text-3xl mb-8 text-center">Set a new password</h1>

        <Suspense fallback={<div className="text-sm text-inkDim text-center">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </>
  );
}
