import React from "react";
import {
  Plantilla,
  listPlantillas,
  createPlantilla,
  updatePlantilla,
  deletePlantilla,
} from "../../lib/api";
import TipTapEditor, { TipTapEditorRef } from "../../components/TipTapEditor";
import WildcardPicker from "../../components/WildcardPicker";
import { resolveWildcards, getSampleContext } from "../../lib/wildcards";

export default function Plantillas() {
  const [items, setItems] = React.useState<Plantilla[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [codigo, setCodigo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [texto, setTexto] = React.useState("<p></p>");
  const [categoria, setCategoria] = React.useState("");
  const [orden, setOrden] = React.useState(0);
  const [activo, setActivo] = React.useState(true);
  const [showInactive, setShowInactive] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Preview modal
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewHtml, setPreviewHtml] = React.useState("");

  // Wildcard picker
  const [showWildcardPicker, setShowWildcardPicker] = React.useState(false);

  // TipTap editor ref for inserting wildcards at cursor
  const editorRef = React.useRef<TipTapEditorRef>(null);

  // Available categories from existing templates
  const existingCategories = React.useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.categoria) cats.add(item.categoria);
    });
    return Array.from(cats).sort();
  }, [items]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listPlantillas({ includeInactive: showInactive });
      setItems(data);
    } catch (e: any) {
      console.error("Error loading plantillas:", e);
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
    setTexto("<p></p>");
    setCategoria("");
    setOrden(0);
    setActivo(true);
    setEditingId(null);
    setShowForm(keepOpen);
    setError(null);
  }

  function startEdit(item: Plantilla) {
    setEditingId(item.id);
    setCodigo(item.codigo);
    setDescripcion(item.descripcion || "");
    setTexto(item.texto);
    setCategoria(item.categoria || "");
    setOrden(item.orden);
    setActivo(item.activo);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) {
      setError("El codigo es obligatorio");
      return;
    }
    if (!texto.trim() || texto === "<p></p>") {
      setError("El texto es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updatePlantilla(editingId, {
          codigo: codigo.trim(),
          descripcion: descripcion.trim() || undefined,
          texto,
          categoria: categoria.trim() || undefined,
          orden,
          activo,
        });
      } else {
        await createPlantilla({
          codigo: codigo.trim(),
          descripcion: descripcion.trim() || undefined,
          texto,
          categoria: categoria.trim() || undefined,
          orden,
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

  async function handleDelete(item: Plantilla) {
    if (!confirm("¿Esta seguro de eliminar esta plantilla?")) return;
    try {
      await deletePlantilla(item.id);
      await loadData();
    } catch (err: any) {
      alert(err?.message ?? "Error al eliminar");
    }
  }

  function insertWildcard(token: string) {
    // Insert wildcard at cursor position using TipTap editor
    if (editorRef.current) {
      editorRef.current.insertText(token);
    }
    setShowWildcardPicker(false);
  }

  function handlePreview() {
    const resolved = resolveWildcards(texto, getSampleContext());
    setPreviewHtml(resolved);
    setShowPreview(true);
  }

  // Group items by category for display
  const groupedItems = React.useMemo(() => {
    const grouped: Record<string, Plantilla[]> = {};
    items.forEach((item) => {
      const cat = item.categoria || "Sin categoria";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [items]);

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Plantillas</div>
        <button className="btn icon" onClick={loadData} disabled={loading} title="Refrescar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Plantillas de Texto</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Mostrar desactivadas
            </label>
            {!showForm && (
              <button className="btn primary" onClick={() => setShowForm(true)}>
                + Nueva Plantilla
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
              <div className="field">
                <div className="label">Codigo *</div>
                <input
                  className="input"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej: SALUDO_CLIENTE"
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 12, marginBottom: 12 }}>
              <div className="field">
                <div className="label">Categoria</div>
                <input
                  className="input"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej: Respuestas, Saludos..."
                  list="categorias"
                />
                <datalist id="categorias">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <div className="label">Estado</div>
                <select className="input" value={activo ? "ACTIVO" : "DESACTIVADO"} onChange={(e) => setActivo(e.target.value === "ACTIVO")}>
                  <option value="ACTIVO">Activo</option>
                  <option value="DESACTIVADO">Desactivado</option>
                </select>
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

            <div className="field" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div className="label">Texto *</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() => setShowWildcardPicker(!showWildcardPicker)}
                    >
                      + Variable
                    </button>
                    {showWildcardPicker && (
                      <WildcardPicker
                        onSelect={insertWildcard}
                        onClose={() => setShowWildcardPicker(false)}
                        position="right"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={handlePreview}
                  >
                    Vista Previa
                  </button>
                </div>
              </div>
              <TipTapEditor ref={editorRef} content={texto} onChange={setTexto} />
              <div className="small" style={{ marginTop: 6, color: "var(--muted)" }}>
                Use variables como {"{{cliente.codigo}}"} para insertar datos dinamicos
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
              </button>
              <button type="button" className="btn" onClick={() => resetForm()} disabled={saving}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="small">Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            No hay plantillas
          </div>
        ) : (
          <div>
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
                  {category}
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Orden</th>
                      <th style={{ width: 150 }}>Codigo</th>
                      <th>Descripcion</th>
                      <th style={{ width: 300 }}>Vista Previa</th>
                      <th style={{ width: 80 }}>Estado</th>
                      <th style={{ width: 120 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.map((item) => (
                      <tr key={item.id} style={{ opacity: item.activo ? 1 : 0.5 }}>
                        <td>{item.orden}</td>
                        <td style={{ fontWeight: 500 }}>{item.codigo}</td>
                        <td>{item.descripcion || "-"}</td>
                        <td>
                          <div
                            style={{
                              maxHeight: 60,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: 12,
                              color: "var(--muted)",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: item.texto.replace(/<[^>]*>/g, " ").substring(0, 100) + "...",
                            }}
                          />
                        </td>
                        <td>{item.activo ? "Activo" : "Desactivado"}</td>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modalOverlay" onClick={() => setShowPreview(false)}>
          <div className="modalCard" style={{ maxWidth: 700, maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="h1" style={{ fontSize: 18 }}>Vista Previa</div>
              <button className="btn" onClick={() => setShowPreview(false)}>Cerrar</button>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
              Vista previa con datos de ejemplo
            </div>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 16,
                background: "#fff",
                maxHeight: 400,
                overflow: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
