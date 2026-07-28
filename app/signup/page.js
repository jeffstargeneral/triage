import Nav from "../components/Nav";
import AuthForm from "../components/AuthForm";

export default function SignupPage() {
  return (
    <>
      <Nav />
      <main className="pt-32 pb-24 max-w-sm mx-auto px-6">
        <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-3 text-center">
          Get started
        </p>
        <h1 className="font-serif text-3xl mb-8 text-center">Create your account</h1>
        <AuthForm mode="signup" />
        <p className="text-center text-sm text-inkDim mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-clayDark underline">
            Log in
          </a>
        </p>
      </main>
    </>
  );
}
