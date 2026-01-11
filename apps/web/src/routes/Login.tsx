import React from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [usuario, setUsuario] = React.useState("admin");
  const [password, setPassword] = React.useState("admin123!");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(usuario, password);
      await refresh();
      nav("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ marginBottom: 10 }}>
          <div className="h1">Helpdesk</div>
          <div className="small">Acceso de administración</div>
        </div>

        <form onSubmit={onSubmit} className="grid">
          <div className="field">
            <div className="label">Usuario</div>
            <input className="input" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <div className="small" style={{ color: "var(--danger)" }}>{error}</div>}

          <button className="btn primary" disabled={busy}>
            {busy ? "Entrando..." : "Entrar"}
          </button>

          <div className="small">
            En dev se crea un admin por seed (admin / admin123!).
          </div>
        </form>
      </div>
    </div>
  );
}
