import React from "react";
import "../../styles/collapsible.css";
import {
  createRelease,
  updateRelease,
  deleteRelease,
  listReleases,
  createHotfix,
  updateHotfix,
  deleteHotfix,
  Release,
  Hotfix,
  RamaTipo,
  isReleaseConfirmationResponse,
} from "../../lib/api";

export default function Releases() {
  const [items, setItems] = React.useState<Release[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [releaseForm, setReleaseForm] = React.useState<{ codigo: string; descripcion: string; rama: RamaTipo }>({
    codigo: "",
    descripcion: "",
    rama: "DESARROLLO",
  });
  const [savingRelease, setSavingRelease] = React.useState(false);
  const [showReleaseForm, setShowReleaseForm] = React.useState(false);
  const [editingReleaseId, setEditingReleaseId] = React.useState<string | null>(null);

  const [expandedReleaseId, setExpandedReleaseId] = React.useState<string | null>(null);
  const [hotfixForm, setHotfixForm] = React.useState<{ codigo: string; descripcion: string; rama: RamaTipo }>({
    codigo: "",
    descripcion: "",
    rama: "DESARROLLO",
  });
  const [savingHotfix, setSavingHotfix] = React.useState(false);
  const [editingHotfixId, setEditingHotfixId] = React.useState<string | null>(null);
  const [editingHotfixReleaseId, setEditingHotfixReleaseId] = React.useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = React.useState<{
    show: boolean;
    message: string;
    onConfirm: () => void;
    existingCode?: string;
  }>({ show: false, message: "", onConfirm: () => {} });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listReleases());
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  function resetReleaseForm() {
    setReleaseForm({ codigo: "", descripcion: "", rama: "DESARROLLO" });
    setEditingReleaseId(null);
    setShowReleaseForm(false);
    setError(null);
  }

  function startEditRelease(item: Release) {
    setEditingReleaseId(item.id);
    setReleaseForm({
      codigo: item.codigo,
      descripcion: item.descripcion || "",
      rama: item.rama || "DESARROLLO",
    });
    setShowReleaseForm(true);
    setError(null);
  }

  function startEditHotfix(releaseId: string, hotfix: Hotfix) {
    setEditingHotfixId(hotfix.id);
    setEditingHotfixReleaseId(releaseId);
    setHotfixForm({
      codigo: hotfix.codigo,
      descripcion: hotfix.descripcion || "",
      rama: hotfix.rama || "DESARROLLO",
    });
    setError(null);
  }

  function cancelEditHotfix() {
    setEditingHotfixId(null);
    setEditingHotfixReleaseId(null);
    setHotfixForm({ codigo: "", descripcion: "", rama: "DESARROLLO" });
  }

  async function handleReleaseSubmit(e: React.FormEvent, confirmMoveToProduccion = false) {
    e.preventDefault();
    setSavingRelease(true);
    setError(null);
    try {
      const input = {
        codigo: releaseForm.codigo.trim(),
        descripcion: releaseForm.descripcion.trim() || undefined,
        rama: releaseForm.rama,
        confirmMoveToProduccion,
      };

      let result;
      if (editingReleaseId) {
        result = await updateRelease(editingReleaseId, input);
      } else {
        result = await createRelease(input);
      }

      // Check if API requires confirmation
      if (isReleaseConfirmationResponse(result)) {
        setConfirmModal({
          show: true,
          message: result.message,
          existingCode: result.existingDesarrolloRelease?.codigo,
          onConfirm: () => {
            setConfirmModal({ show: false, message: "", onConfirm: () => {} });
            handleReleaseSubmit(e, true);
          },
        });
        setSavingRelease(false);
        return;
      }

      resetReleaseForm();
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSavingRelease(false);
    }
  }

  async function onDeleteRelease(id: string) {
    if (!confirm("¿Eliminar release y todos sus hotfixes?")) return;
    try {
      await deleteRelease(id);
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Error");
    }
  }

  async function onCreateHotfix(e: React.FormEvent, releaseId: string, confirmMoveToProduccion = false) {
    e.preventDefault();
    setSavingHotfix(true);
    setError(null);
    try {
      const input = {
        codigo: hotfixForm.codigo,
        descripcion: hotfixForm.descripcion || undefined,
        rama: hotfixForm.rama,
        confirmMoveToProduccion,
      };

      const result = await createHotfix(releaseId, input);

      // Check if API requires confirmation
      if (isReleaseConfirmationResponse(result)) {
        setConfirmModal({
          show: true,
          message: result.message,
          existingCode: result.existingDesarrolloHotfix?.codigo,
          onConfirm: () => {
            setConfirmModal({ show: false, message: "", onConfirm: () => {} });
            onCreateHotfix(e, releaseId, true);
          },
        });
        setSavingHotfix(false);
        return;
      }

      setHotfixForm({ codigo: "", descripcion: "", rama: "DESARROLLO" });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSavingHotfix(false);
    }
  }

  async function onUpdateHotfix(e: React.FormEvent, releaseId: string, hotfixId: string, confirmMoveToProduccion = false) {
    e.preventDefault();
    setSavingHotfix(true);
    setError(null);
    try {
      const input = {
        codigo: hotfixForm.codigo.trim(),
        descripcion: hotfixForm.descripcion.trim() || undefined,
        rama: hotfixForm.rama,
        confirmMoveToProduccion,
      };

      const result = await updateHotfix(releaseId, hotfixId, input);

      // Check if API requires confirmation
      if (isReleaseConfirmationResponse(result)) {
        setConfirmModal({
          show: true,
          message: result.message,
          existingCode: result.existingDesarrolloHotfix?.codigo,
          onConfirm: () => {
            setConfirmModal({ show: false, message: "", onConfirm: () => {} });
            onUpdateHotfix(e, releaseId, hotfixId, true);
          },
        });
        setSavingHotfix(false);
        return;
      }

      cancelEditHotfix();
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setSavingHotfix(false);
    }
  }

  async function onDeleteHotfix(releaseId: string, hotfixId: string) {
    if (!confirm("¿Eliminar hotfix?")) return;
    try {
      await deleteHotfix(releaseId, hotfixId);
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Error");
    }
  }

  function toggleExpand(releaseId: string) {
    setExpandedReleaseId((prev) => (prev === releaseId ? null : releaseId));
    setHotfixForm({ codigo: "", descripcion: "", rama: "DESARROLLO" });
  }

  // Helper to render rama badge
  function RamaBadge({ rama }: { rama: RamaTipo }) {
    const isDesarrollo = rama === "DESARROLLO";
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 500,
          backgroundColor: isDesarrollo ? "#FEF3C7" : "#D1FAE5",
          color: isDesarrollo ? "#92400E" : "#065F46",
        }}
      >
        {isDesarrollo ? "Desarrollo" : "Producción"}
      </span>
    );
  }

  return (
    <div className="grid">
      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              maxWidth: 500,
              width: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Confirmar cambio de rama</h3>
            <p style={{ marginBottom: 20, color: "#4B5563", lineHeight: 1.5 }}>{confirmModal.message}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={() => setConfirmModal({ show: false, message: "", onConfirm: () => {} })}
              >
                Cancelar
              </button>
              <button className="btn primary" onClick={confirmModal.onConfirm}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="topbar">
        <div className="h1">Releases</div>
        <button className="btn icon" onClick={load} disabled={loading} title="Refrescar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Gestión de Releases</h2>
          {!showReleaseForm && (
            <button className="btn primary" onClick={() => setShowReleaseForm(true)}>
              + Nuevo Release
            </button>
          )}
        </div>

        {showReleaseForm && (
          <form
            onSubmit={(e) => handleReleaseSubmit(e)}
            style={{ padding: 16, background: "var(--bg-secondary)", borderRadius: 8, marginBottom: 16 }}
          >
            {error && (
              <div
                style={{
                  padding: 8,
                  background: "#FEE2E2",
                  color: "#DC2626",
                  borderRadius: 4,
                  marginBottom: 12,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12, marginBottom: 12 }}>
              <div className="field">
                <div className="label">Código *</div>
                <input
                  className="input"
                  value={releaseForm.codigo}
                  onChange={(e) => setReleaseForm({ ...releaseForm, codigo: e.target.value })}
                  placeholder="Ej: R35"
                />
              </div>
              <div className="field">
                <div className="label">Descripción</div>
                <input
                  className="input"
                  value={releaseForm.descripcion}
                  onChange={(e) => setReleaseForm({ ...releaseForm, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="field">
                <div className="label">Rama</div>
                <select
                  className="input"
                  value={releaseForm.rama}
                  onChange={(e) => setReleaseForm({ ...releaseForm, rama: e.target.value as RamaTipo })}
                >
                  <option value="DESARROLLO">Desarrollo</option>
                  <option value="PRODUCCION">Producción</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn primary" disabled={savingRelease}>
                {savingRelease ? "Guardando..." : editingReleaseId ? "Guardar" : "Crear"}
              </button>
              <button type="button" className="btn" onClick={resetReleaseForm} disabled={savingRelease}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Lista de Releases</h2>
          <div className="small" style={{ marginTop: 6, color: "var(--muted)" }}>
            {loading ? "Cargando..." : `${items.length} release(s)`}
          </div>
        </div>
        {error && (
          <div
            style={{
              padding: 8,
              background: "#FEE2E2",
              color: "#DC2626",
              borderRadius: 4,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>Cargando releases...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Rama</th>
                <th>Hotfixes</th>
                <th style={{ width: 180 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <React.Fragment key={r.id}>
                  <tr>
                    <td>
                      <button
                        className="btn icon"
                        onClick={() => toggleExpand(r.id)}
                        title={expandedReleaseId === r.id ? "Contraer" : "Expandir"}
                        style={{ padding: 4, minWidth: 28, height: 28 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: expandedReleaseId === r.id ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </td>
                    <td>
                      <strong>{r.codigo}</strong>
                    </td>
                    <td>{r.descripcion ?? "-"}</td>
                    <td>
                      <RamaBadge rama={r.rama} />
                    </td>
                    <td>{r.hotfixes.length}</td>
                    <td style={{ width: 180 }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn"
                          style={{ padding: "4px 8px", fontSize: 12 }}
                          onClick={() => startEditRelease(r)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn"
                          style={{ padding: "4px 8px", fontSize: 12, color: "var(--danger)" }}
                          onClick={() => onDeleteRelease(r.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedReleaseId === r.id && (
                    <tr>
                      <td colSpan={6} style={{ background: "rgba(0,0,0,0.02)", padding: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                          <div className="h2" style={{ marginBottom: 10 }}>
                            Hotfixes de {r.codigo}
                          </div>
                          {r.hotfixes.length === 0 ? (
                            <div className="small">No hay hotfixes</div>
                          ) : (
                            <table className="table" style={{ marginBottom: 16 }}>
                              <thead>
                                <tr>
                                  <th>Código</th>
                                  <th>Descripción</th>
                                  <th>Rama</th>
                                  <th style={{ width: 120 }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.hotfixes.map((hf) => (
                                  <React.Fragment key={hf.id}>
                                    {editingHotfixId === hf.id && editingHotfixReleaseId === r.id ? (
                                      <tr style={{ background: "#F3F4F6" }}>
                                        <td colSpan={4} style={{ padding: 12 }}>
                                          <form
                                            onSubmit={(e) => onUpdateHotfix(e, r.id, hf.id)}
                                            style={{ display: "flex", gap: 12, alignItems: "end" }}
                                          >
                                            <div className="field" style={{ flex: 1 }}>
                                              <div className="label">Código *</div>
                                              <input
                                                className="input"
                                                value={hotfixForm.codigo}
                                                onChange={(e) =>
                                                  setHotfixForm({ ...hotfixForm, codigo: e.target.value })
                                                }
                                                style={{ fontSize: "12px" }}
                                              />
                                            </div>
                                            <div className="field" style={{ flex: 2 }}>
                                              <div className="label">Descripción</div>
                                              <input
                                                className="input"
                                                value={hotfixForm.descripcion}
                                                onChange={(e) =>
                                                  setHotfixForm({ ...hotfixForm, descripcion: e.target.value })
                                                }
                                                style={{ fontSize: "12px" }}
                                              />
                                            </div>
                                            <div className="field" style={{ flex: 1 }}>
                                              <div className="label">Rama</div>
                                              <select
                                                className="input"
                                                value={hotfixForm.rama}
                                                onChange={(e) =>
                                                  setHotfixForm({ ...hotfixForm, rama: e.target.value as RamaTipo })
                                                }
                                                style={{ fontSize: "12px" }}
                                              >
                                                <option value="DESARROLLO">Desarrollo</option>
                                                <option value="PRODUCCION">Producción</option>
                                              </select>
                                            </div>
                                            <div style={{ display: "flex", gap: 6 }}>
                                              <button
                                                type="submit"
                                                className="btn primary"
                                                disabled={savingHotfix}
                                                style={{ padding: "6px 12px", fontSize: 11 }}
                                              >
                                                {savingHotfix ? "Guardando..." : "Guardar"}
                                              </button>
                                              <button
                                                type="button"
                                                className="btn"
                                                onClick={cancelEditHotfix}
                                                disabled={savingHotfix}
                                                style={{ padding: "6px 12px", fontSize: 11 }}
                                              >
                                                Cancelar
                                              </button>
                                            </div>
                                          </form>
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr>
                                        <td>{hf.codigo}</td>
                                        <td>{hf.descripcion ?? "-"}</td>
                                        <td>
                                          <RamaBadge rama={hf.rama} />
                                        </td>
                                        <td>
                                          <div style={{ display: "flex", gap: 6 }}>
                                            <button
                                              className="btn"
                                              style={{ padding: "4px 8px", fontSize: 11 }}
                                              onClick={() => startEditHotfix(r.id, hf)}
                                            >
                                              Editar
                                            </button>
                                            <button
                                              className="btn"
                                              style={{ padding: "4px 8px", fontSize: 11, color: "var(--danger)" }}
                                              onClick={() => onDeleteHotfix(r.id, hf.id)}
                                            >
                                              Eliminar
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                        {/* Show hotfix form only if release is in PRODUCCION */}
                        {r.rama === "PRODUCCION" ? (
                          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                            <div className="h2" style={{ marginBottom: 10 }}>
                              Agregar hotfix
                            </div>
                            <form
                              className="form"
                              onSubmit={(e) => onCreateHotfix(e, r.id)}
                              style={{ maxWidth: 600 }}
                            >
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12 }}>
                                <div className="field">
                                  <div className="label">Código</div>
                                  <input
                                    className="input"
                                    placeholder="Ej: HF01"
                                    value={hotfixForm.codigo}
                                    onChange={(e) => setHotfixForm({ ...hotfixForm, codigo: e.target.value })}
                                  />
                                </div>
                                <div className="field">
                                  <div className="label">Descripción</div>
                                  <input
                                    className="input"
                                    value={hotfixForm.descripcion}
                                    onChange={(e) => setHotfixForm({ ...hotfixForm, descripcion: e.target.value })}
                                  />
                                </div>
                                <div className="field">
                                  <div className="label">Rama</div>
                                  <select
                                    className="input"
                                    value={hotfixForm.rama}
                                    onChange={(e) =>
                                      setHotfixForm({ ...hotfixForm, rama: e.target.value as RamaTipo })
                                    }
                                  >
                                    <option value="DESARROLLO">Desarrollo</option>
                                    <option value="PRODUCCION">Producción</option>
                                  </select>
                                </div>
                              </div>
                              <div className="field full" style={{ marginTop: 12 }}>
                                <button className="btn primary" disabled={savingHotfix}>
                                  Agregar hotfix
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div
                            style={{
                              borderTop: "1px solid var(--border)",
                              paddingTop: 12,
                              color: "#6B7280",
                              fontSize: 13,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "12px 16px",
                                background: "#FEF3C7",
                                borderRadius: 6,
                                color: "#92400E",
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              <span>
                                No se pueden agregar hotfixes a un release en <strong>Desarrollo</strong>. El release
                                debe estar en <strong>Producción</strong> para poder agregar hotfixes.
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#6B7280", padding: 24 }}>
                    No hay releases registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
