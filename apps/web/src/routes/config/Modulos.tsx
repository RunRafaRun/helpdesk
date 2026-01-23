import React from "react";
import "../../styles/collapsible.css";
import { createModulo, updateModulo, deleteModulo, listModulos } from "../../lib/api";

export default function Modulos() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({ codigo: "", descripcion: "" });
  const [saving, setSaving] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

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

  function resetForm() {
    setForm({ codigo: "", descripcion: "" });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setForm({ codigo: item.codigo, descripcion: item.descripcion || "" });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.codigo.trim()) {
      setError("El código es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateModulo(editingId, {
          codigo: form.codigo.trim(),
          descripcion: form.descripcion.trim() || undefined,
        });
      } else {
        await createModulo({
          codigo: form.codigo.trim(),
          descripcion: form.descripcion.trim() || undefined,
        });
      }
      resetForm();
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
      <div className="h1">Módulos</div>
      <button className="btn icon" onClick={load} disabled={loading} title="Refrescar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
    </div>

    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Gestión de Módulos</h2>
        {!showForm && (
          <button className="btn primary" onClick={() => setShowForm(true)}>
            + Nuevo
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ padding: 16, background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 16 }}>
          {error && (
            <div style={{ padding: 8, background: "#FEE2E2", color: "#DC2626", borderRadius: 4, marginBottom: 12, fontSize: 13 }}>
              {error}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
            <div className="field">
              <div className="label">Código *</div>
              <input
                className="input"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ej: RESERVAS"
              />
            </div>
            <div className="field">
              <div className="label">Descripción</div>
              <input
                className="input"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
            </button>
            <button type="button" className="btn" onClick={resetForm} disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>

    <details className="card cardDetails collapsible" open>
      <summary className="cardSummary">
        <div>
          <div className="h1">Lista de módulos</div>
          <div className="small" style={{ marginTop: 6 }}>{loading ? "Cargando..." : `${items.length} módulo(s)`}</div>
        </div>
      </summary>
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
                <td style={{ width: 180 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => startEdit(m)}>
                      Editar
                    </button>
                    <button
                      className="btn"
                      style={{ padding: "4px 8px", fontSize: 12, color: "var(--danger)" }}
                      onClick={() => onDelete(m.id)}
                    >
                      Eliminar
                    </button>
                  </div>
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
