import Nav from "../components/Nav";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="pt-32 pb-24 max-w-sm mx-auto px-6">
        <p className="text-sm font-medium text-clayDark uppercase tracking-wide mb-3 text-center">
          Welcome back
        </p>
        <h1 className="font-serif text-3xl mb-8 text-center">Log in</h1>
        <AuthForm mode="login" />
        <p className="text-center text-sm mt-4">
          <a href="/forgot-password" className="text-clayDark underline">
            Forgot password?
          </a>
        </p>
        <p className="text-center text-sm text-inkDim mt-3">
          Don't have an account?{" "}
          <a href="/signup" className="text-clayDark underline">
            Sign up
          </a>
        </p>
      </main>
    </>
  );
}
