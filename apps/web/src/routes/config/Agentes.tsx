import React from "react";
import "../../styles/collapsible.css";
import { createAgente, listAgentes } from "../../lib/api";

export default function Agentes() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({ nombre: "", usuario: "", password: "", role: "AGENTE", email: "" });
  const [saving, setSaving] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listAgentes());
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAgente({
        nombre: form.nombre,
        usuario: form.usuario,
        password: form.password,
        role: form.role as any,
        email: form.email || undefined,
      });
      setForm({ nombre: "", usuario: "", password: "", role: "AGENTE", email: "" });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  
return (
  <div className="grid">
    <div className="topbar">
      <div>
        <div className="h1">Agentes</div>
        <div className="h2">Gestión de agentes</div>
      </div>
      <button className="btn" onClick={load} disabled={loading}>Refrescar</button>
    </div>

    <details className="card cardDetails collapsible">
      <summary className="cardSummary">
        <div className="h1">Crear agente</div></summary>
      <div className="cardContent">
        <form className="form" onSubmit={onCreate}>
          <div className="field">
            <div className="label">Nombre</div>
            <input className="input" value={form.nombre} onChange={(e)=>setForm({...form,nombre:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Usuario</div>
            <input className="input" value={form.usuario} onChange={(e)=>setForm({...form,usuario:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Password</div>
            <input className="input" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Email</div>
            <input className="input" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Rol</div>
            <select className="input" value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}>
              <option value="AGENTE">AGENTE</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="field full">
            <button className="btn primary" disabled={saving}>Crear agente</button>
          </div>
        </form>
      </div>
    </details>

<details className="card cardDetails collapsible" open>
      <summary className="cardSummary">
        <div>
          <div className="h1">Lista</div>
          <div className="small" style={{ marginTop: 6 }}>{loading ? "Cargando..." : `${items.length} agente(s)`}</div>
        </div></summary>
      <div className="cardContent">
        {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.usuario}</td>
                <td>{a.nombre}</td>
                <td>{a.email ?? "-"}</td>
                <td>{a.role}</td>
                <td style={{ width: 140 }}>
                  <button className="btn" onClick={() => onDelete(a.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  </div>
);
}
