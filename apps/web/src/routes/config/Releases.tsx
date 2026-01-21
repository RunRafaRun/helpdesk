import React from "react";
import "../../styles/collapsible.css";
import {
  createRelease,
  deleteRelease,
  listReleases,
  createHotfix,
  deleteHotfix,
  Release,
} from "../../lib/api";

export default function Releases() {
  const [items, setItems] = React.useState<Release[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [releaseForm, setReleaseForm] = React.useState({ codigo: "", descripcion: "" });
  const [savingRelease, setSavingRelease] = React.useState(false);

  const [expandedReleaseId, setExpandedReleaseId] = React.useState<string | null>(null);
  const [hotfixForm, setHotfixForm] = React.useState({ codigo: "", descripcion: "" });
  const [savingHotfix, setSavingHotfix] = React.useState(false);

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

  React.useEffect(() => { load(); }, []);

  async function onCreateRelease(e: React.FormEvent) {
    e.preventDefault();
    setSavingRelease(true);
    setError(null);
    try {
      await createRelease({ codigo: releaseForm.codigo, descripcion: releaseForm.descripcion || undefined });
      setReleaseForm({ codigo: "", descripcion: "" });
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

  async function onCreateHotfix(e: React.FormEvent, releaseId: string) {
    e.preventDefault();
    setSavingHotfix(true);
    setError(null);
    try {
      await createHotfix(releaseId, { codigo: hotfixForm.codigo, descripcion: hotfixForm.descripcion || undefined });
      setHotfixForm({ codigo: "", descripcion: "" });
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
    setHotfixForm({ codigo: "", descripcion: "" });
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Releases</div>
        <button className="btn icon" onClick={load} disabled={loading} title="Refrescar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      <details className="card cardDetails collapsible">
        <summary className="cardSummary">
          <div className="h1">Crear release</div>
        </summary>
        <div className="cardContent">
          <form className="form" onSubmit={onCreateRelease}>
            <div className="field">
              <div className="label">Código</div>
              <input className="input" placeholder="Ej: R35" value={releaseForm.codigo} onChange={(e) => setReleaseForm({ ...releaseForm, codigo: e.target.value })} />
            </div>
            <div className="field">
              <div className="label">Descripción</div>
              <input className="input" value={releaseForm.descripcion} onChange={(e) => setReleaseForm({ ...releaseForm, descripcion: e.target.value })} />
            </div>
            <div className="field full">
              <button className="btn primary" disabled={savingRelease}>Crear release</button>
            </div>
          </form>
        </div>
      </details>

      <details className="card cardDetails collapsible" open>
        <summary className="cardSummary">
          <div>
            <div className="h1">Lista de releases</div>
            <div className="small" style={{ marginTop: 6 }}>{loading ? "Cargando..." : `${items.length} release(s)`}</div>
          </div>
        </summary>
        <div className="cardContent">
          {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Hotfixes</th>
                <th style={{ width: 100 }}></th>
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
                          style={{ transform: expandedReleaseId === r.id ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </td>
                    <td><strong>{r.codigo}</strong></td>
                    <td>{r.descripcion ?? "-"}</td>
                    <td>{r.hotfixes.length}</td>
                    <td>
                      <button className="btn" onClick={() => onDeleteRelease(r.id)}>Eliminar</button>
                    </td>
                  </tr>
                  {expandedReleaseId === r.id && (
                    <tr>
                      <td colSpan={5} style={{ background: "rgba(0,0,0,0.02)", padding: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                          <div className="h2" style={{ marginBottom: 10 }}>Hotfixes de {r.codigo}</div>
                          {r.hotfixes.length === 0 ? (
                            <div className="small">No hay hotfixes</div>
                          ) : (
                            <table className="table" style={{ marginBottom: 16 }}>
                              <thead>
                                <tr>
                                  <th>Código</th>
                                  <th>Descripción</th>
                                  <th style={{ width: 100 }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.hotfixes.map((hf) => (
                                  <tr key={hf.id}>
                                    <td>{hf.codigo}</td>
                                    <td>{hf.descripcion ?? "-"}</td>
                                    <td>
                                      <button className="btn" onClick={() => onDeleteHotfix(r.id, hf.id)}>Eliminar</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                          <div className="h2" style={{ marginBottom: 10 }}>Agregar hotfix</div>
                          <form className="form" onSubmit={(e) => onCreateHotfix(e, r.id)} style={{ maxWidth: 500 }}>
                            <div className="field">
                              <div className="label">Código</div>
                              <input className="input" placeholder="Ej: HF01" value={hotfixForm.codigo} onChange={(e) => setHotfixForm({ ...hotfixForm, codigo: e.target.value })} />
                            </div>
                            <div className="field">
                              <div className="label">Descripción</div>
                              <input className="input" value={hotfixForm.descripcion} onChange={(e) => setHotfixForm({ ...hotfixForm, descripcion: e.target.value })} />
                            </div>
                            <div className="field full">
                              <button className="btn primary" disabled={savingHotfix}>Agregar hotfix</button>
                            </div>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#6B7280", padding: 24 }}>
                    No hay releases registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
