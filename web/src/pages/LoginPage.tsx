import { useState } from "preact/hooks";
import { ApiError } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { navigate } from "../hooks/useRoute";

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login({ email, password });
      navigate("/app/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to sign in right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-hero">
        <p className="eyebrow">Focused delivery</p>
        <h1>Bring projects, people, and progress into one calm workspace.</h1>
        <p>
          Track every assignment, surface overdue work fast, and give admins the visibility they
          need without slowing members down.
        </p>
      </div>

      <form className="auth-card card" onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in</h2>
        </div>

        <label>
          Email
          <input value={email} onInput={(event) => setEmail(event.currentTarget.value)} type="email" required />
        </label>

        <label>
          Password
          <input
            value={password}
            onInput={(event) => setPassword(event.currentTarget.value)}
            type="password"
            minLength={8}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="helper-text">
          New here?{" "}
          <a
            href="/signup"
            onClick={(event) => {
              event.preventDefault();
              navigate("/signup");
            }}
          >
            Create an account
          </a>
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
