import { useState } from "preact/hooks";
import { ApiError } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { navigate } from "../hooks/useRoute";

const SignupPage = () => {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signup(form);
      navigate("/app/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to create your account right now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-hero">
        <p className="eyebrow">Quick onboarding</p>
        <h1>The first account becomes the admin so setup stays simple.</h1>
        <p>
          After that, every new signup joins as a member and can be added to projects by an admin
          in seconds.
        </p>
      </div>

      <form className="auth-card card" onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <p className="eyebrow">Create account</p>
          <h2>Start your workspace</h2>
        </div>

        <label>
          Full name
          <input
            value={form.name}
            onInput={(event) => setForm((current) => ({ ...current, name: event.currentTarget.value }))}
            type="text"
            minLength={2}
            required
          />
        </label>

        <label>
          Email
          <input
            value={form.email}
            onInput={(event) => setForm((current) => ({ ...current, email: event.currentTarget.value }))}
            type="email"
            required
          />
        </label>

        <label>
          Password
          <input
            value={form.password}
            onInput={(event) =>
              setForm((current) => ({ ...current, password: event.currentTarget.value }))
            }
            type="password"
            minLength={8}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <p className="helper-text">
          Already have access?{" "}
          <a
            href="/login"
            onClick={(event) => {
              event.preventDefault();
              navigate("/login");
            }}
          >
            Sign in
          </a>
        </p>
      </form>
    </section>
  );
};

export default SignupPage;
