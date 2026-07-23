import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../context/useAuth";
import { getApiError } from "../services/api";

const demoAccounts = [
  "admin@minierp.test",
  "sales@minierp.test",
  "warehouse@minierp.test",
  "accounts@minierp.test",
];

function Login() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("admin@minierp.test");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <div className="brand login-brand">
            <div className="brand-mark">ME</div>
            <div>
              <strong>Mini ERP</strong>
              <span>Operations CRM</span>
            </div>
          </div>
          <h1>Run customers, stock, and sales challans from one workspace.</h1>
          <p>
            A focused internal portal for sales, warehouse, and accounts teams.
          </p>
          <div className="login-metrics">
            <span>JWT auth</span>
            <span>Role access</span>
            <span>Stock ledger</span>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Secure sign in</p>
            <h2>Welcome back</h2>
          </div>

          {error ? <StatusMessage type="error" message={error} /> : null}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button className="btn btn-primary full-width" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="demo-box">
            <strong>Demo credentials</strong>
            <span>Password: Password@123</span>
            <div>
              {demoAccounts.map((account) => (
                <button
                  key={account}
                  type="button"
                  className="link-button"
                  onClick={() => setEmail(account)}
                >
                  {account}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Login;
