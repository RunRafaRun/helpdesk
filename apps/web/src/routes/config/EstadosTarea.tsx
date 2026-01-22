import React from "react";
import {
  EstadoTarea,
  listEstadosTarea,
  createEstadoTarea,
  updateEstadoTarea,
  deleteEstadoTarea,
} from "../../lib/api";
import { Icon } from "../../components/Icon";



export default function EstadosTarea() {
  const [items, setItems] = React.useState<EstadoTarea[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [codigo, setCodigo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [orden, setOrden] = React.useState(0);
  const [porDefecto, setPorDefecto] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listEstadosTarea();
      setItems(data);
    } catch (e: any) {
      console.error("Error loading estados tarea:", e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setCodigo("");
    setDescripcion("");
    setOrden(0);
    setPorDefecto(false);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  }

  function startEdit(item: EstadoTarea) {
    setEditingId(item.id);
    setCodigo(item.codigo);
    setDescripcion(item.descripcion || "");
    setOrden(item.orden);
    setPorDefecto(item.porDefecto);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) {
      setError("El codigo es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateEstadoTarea(editingId, {
          codigo: codigo.trim(),
          descripcion: descripcion.trim() || undefined,
          orden,
          porDefecto,
        });
      } else {
        await createEstadoTarea({
          codigo: codigo.trim(),
          descripcion: descripcion.trim() || undefined,
          orden,
          porDefecto,
        });
      }
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Esta seguro de eliminar este registro?")) return;
    try {
      await deleteEstadoTarea(id);
      await loadData();
    } catch (err: any) {
      alert(err?.message ?? "Error al eliminar");
    }
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Estados de Tarea</div>
        <button className="btn icon" onClick={loadData} disabled={loading} title="Refrescar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Listado</h2>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px", gap: 12, marginBottom: 12 }}>
              <div className="field">
                <div className="label">Codigo *</div>
                <input
                  className="input"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej: PENDIENTE"
                />
              </div>
              <div className="field">
                <div className="label">Descripcion</div>
                <input
                  className="input"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripcion opcional"
                />
              </div>
              <div className="field">
                <div className="label">Orden</div>
                <input
                  className="input"
                  type="number"
                  value={orden}
                  onChange={(e) => setOrden(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={porDefecto}
                  onChange={(e) => setPorDefecto(e.target.checked)}
                />
                <span>Por Defecto (se usara en nuevas tareas)</span>
              </label>
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

        {loading ? (
          <div className="small">Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            No hay registros
          </div>
        ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Orden</th>
                  <th style={{ width: 150 }}>Codigo</th>
                  <th>Descripcion</th>
                  <th style={{ width: 100 }}>Por Defecto</th>
                  <th style={{ width: 120 }}>Acciones</th>
                </tr>
              </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.orden}</td>
                  <td style={{ fontWeight: 500 }}>{item.codigo}</td>
                  <td>{item.descripcion || "-"}</td>
                  <td>
                    {item.porDefecto && (
                      <span style={{ color: "#059669", fontWeight: 500 }}>Si</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => startEdit(item)}>
                        Editar
                      </button>
                      <button
                        className="btn"
                        style={{ padding: "4px 8px", fontSize: 12, color: "var(--danger)" }}
                        onClick={() => handleDelete(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
