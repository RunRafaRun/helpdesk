import React from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [usuario, setUsuario] = React.useState("");
  const [password, setPassword] = React.useState("");
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

  const inputStyle: React.CSSProperties = {
    marginTop: '4px',
    display: 'block',
    width: '100%',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    padding: '10px 12px',
    boxSizing: 'border-box',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>MACS</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>My Avalon Communication Service</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Acceso Agentes</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Usuario</label>
            <input
              style={inputStyle}
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingrese su usuario"
            />
          </div>

          <div>
            <label style={labelStyle}>Contraseña</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: '6px',
              color: '#DC2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#2563EB',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '6px',
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
              marginTop: '8px'
            }}
          >
            {busy ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
