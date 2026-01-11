import React from "react";
import "../../styles/collapsible.css";
import { createModulo, deleteModulo, listModulos } from "../../lib/api";

export default function Modulos() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({ codigo: "", descripcion: "" });
  const [saving, setSaving] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listModulos());
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
      await createModulo({ codigo: form.codigo, descripcion: form.descripcion || undefined });
      setForm({ codigo: "", descripcion: "" });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar módulo?")) return;
    try {
      await deleteModulo(id);
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Error");
    }
  }

  
return (
  <div className="grid">
    <div className="topbar">
      <div>
        <div className="h1">Módulos</div>
        <div className="h2">Catálogo de módulos (AVA/AVC)</div>
      </div>
      <button className="btn" onClick={load} disabled={loading}>Refrescar</button>
    </div>

    <details className="card cardDetails collapsible">
      <summary className="cardSummary">
        <div className="h1">Añadir módulo</div></summary>
      <div className="cardContent">
        <form className="form" onSubmit={onCreate}>
          <div className="field">
            <div className="label">Código</div>
            <input className="input" value={form.codigo} onChange={(e)=>setForm({...form,codigo:e.target.value})}/>
          </div>
          <div className="field">
            <div className="label">Descripción</div>
            <input className="input" value={form.descripcion} onChange={(e)=>setForm({...form,descripcion:e.target.value})}/>
          </div>
          <div className="field full">
            <button className="btn primary" disabled={saving}>Crear módulo</button>
          </div>
        </form>
      </div>
    </details>

<details className="card cardDetails collapsible" open>
      <summary className="cardSummary">
        <div>
          <div className="h1">Lista</div>
          <div className="small" style={{ marginTop: 6 }}>{loading ? "Cargando..." : `${items.length} módulo(s)`}</div>
        </div></summary>
      <div className="cardContent">
        {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.codigo}</td>
                <td>{m.descripcion ?? "-"}</td>
                <td style={{ width: 120 }}>
                  <button className="btn" onClick={() => onDelete(m.id)}>Eliminar</button>
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
