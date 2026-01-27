import React from "react";
import {
  TipoTarea,
  listTiposTarea,
  createTipoTarea,
  updateTipoTarea,
  deleteTipoTarea,
} from "../../lib/api";

export default function TiposTarea() {
  const [items, setItems] = React.useState<TipoTarea[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [codigo, setCodigo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [orden, setOrden] = React.useState(0);
  const [porDefecto, setPorDefecto] = React.useState(false);
  const [activo, setActivo] = React.useState(true);
  const [replacementId, setReplacementId] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listTiposTarea({ includeInactive: showInactive });
      setItems(data);
    } catch (e: any) {
      console.error("Error loading tipos tarea:", e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, [showInactive]);

  function resetForm(options?: { keepOpen?: boolean }) {
    const keepOpen = options?.keepOpen ?? false;
    setCodigo("");
    setDescripcion("");
    setOrden(0);
    setPorDefecto(false);
    setActivo(true);
    setReplacementId("");
    setEditingId(null);
    setShowForm(keepOpen);
    setError(null);
  }

  function startEdit(item: TipoTarea) {
    setEditingId(item.id);
    setCodigo(item.codigo);
    setDescripcion(item.descripcion || "");
    setOrden(item.orden);
    setPorDefecto(item.porDefecto);
    setActivo(item.activo !== false);
    setReplacementId("");
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
        if (!activo && !replacementId) {
          setError("Debe seleccionar un reemplazo para desactivar.");
          return;
        }
        await updateTipoTarea(editingId, {
          codigo: codigo.trim(),
          descripcion: descripcion.trim() || undefined,
          orden,
          porDefecto,
          activo,
        }, replacementId || undefined);
      } else {
        await createTipoTarea({
          codigo: codigo.trim(),
          descripcion: descripcion.trim() || undefined,
          orden,
          porDefecto,
          activo,
        });
      }
      resetForm(editingId ? undefined : { keepOpen: true });
      await loadData();
    } catch (err: any) {
      setError(err?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: TipoTarea) {
    if (!confirm("¿Esta seguro de eliminar este registro?")) return;
    try {
      await deleteTipoTarea(item.id, replacementId || undefined);
      await loadData();
      setReplacementId("");
      setEditingId(null);
    } catch (err: any) {
      const message = err?.message ?? "Error al eliminar";
      if (message.includes("tareas asociadas") || message.includes("reemplazo")) {
        startEdit(item);
        setError("Seleccione un reemplazo y vuelva a intentar.");
        return;
      }
      alert(message);
    }
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Tipos de Tarea</div>
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Mostrar desactivados
            </label>
            {!showForm && (
              <button className="btn primary" onClick={() => setShowForm(true)}>
                + Nuevo
              </button>
            )}
          </div>
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
                  placeholder="Ej: INCIDENCIA"
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
              <div className="field">
                <div className="label">Estado</div>
                <select className="input" value={activo ? "ACTIVO" : "DESACTIVADO"} onChange={(e) => setActivo(e.target.value === "ACTIVO")}> 
                  <option value="ACTIVO">Activo</option>
                  <option value="DESACTIVADO">Desactivado</option>
                </select>
              </div>
              {editingId && (
                <div className="field">
                  <div className="label">Reasignar tareas a</div>
                  <select className="input" value={replacementId} onChange={(e) => setReplacementId(e.target.value)}>
                    <option value="">-- Seleccionar --</option>
                    {items.filter((i) => i.id !== editingId && i.activo !== false).map((i) => (
                      <option key={i.id} value={i.id}>{i.codigo}</option>
                    ))}
                  </select>
                  <div className="small" style={{ marginTop: 6, color: "var(--muted)" }}>
                    Requerido si hay tareas asociadas.
                  </div>
                </div>
              )}
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
                <th style={{ width: 120 }}>Estado</th>
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
                <td>{item.activo !== false ? "Activo" : "Desactivado"}</td>
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
                        onClick={() => handleDelete(item)}
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
