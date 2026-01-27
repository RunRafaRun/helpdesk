import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/collapsible.css";
import { createCliente, listClientes, listAgentes, Agente, updateCliente } from "../../lib/api";
import { useAuth } from "../../lib/auth";

type Cliente = {
  id: string;
  codigo: string;
  descripcion?: string | null;
  jefeProyecto1?: string | null;
  jefeProyecto2?: string | null;
  licenciaTipo?: "AAM" | "PPU" | null;
  currentRelease?: string | null;
  comentarioDestacado?: string | null;
};

export default function Clientes() {
  const navigate = useNavigate();
  const { me } = useAuth();

  // Check if user has full edit permission (CONFIG_CLIENTES) or just read-only (CONFIG_CLIENTES_READ)
  const canEdit = me?.permisos?.includes('CONFIG_CLIENTES') ?? false;
  const [items, setItems] = React.useState<Cliente[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [showInactive, setShowInactive] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [replacementId, setReplacementId] = React.useState("");
  const [status, setStatus] = React.useState<"ACTIVO" | "DESACTIVADO">("ACTIVO");

  const [clienteForm, setClienteForm] = React.useState({
    codigo: "",
    descripcion: "",
    jefeProyecto1: "" as string,
    jefeProyecto2: "" as string,
    licenciaTipo: "" as "" | "AAM" | "PPU"
  });
  const [savingCliente, setSavingCliente] = React.useState(false);
  const [agentes, setAgentes] = React.useState<Agente[]>([]);

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter(c =>
      c.codigo.toLowerCase().includes(term) ||
      (c.descripcion?.toLowerCase().includes(term) ?? false)
    );
  }, [items, search]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listClientes({ includeInactive: showInactive });
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentes() {
    try {
      const data = await listAgentes();
      setAgentes(data);
    } catch (e) {
      console.error("Error loading agentes:", e);
    }
  }

  React.useEffect(() => {
    load();
    loadAgentes();
  }, [showInactive]);

  async function onCreateCliente(e: React.FormEvent) {
    e.preventDefault();
    setSavingCliente(true);
    setError(null);
    try {
      const created = await createCliente({
        codigo: clienteForm.codigo,
        descripcion: clienteForm.descripcion || undefined,
        jefeProyecto1: clienteForm.jefeProyecto1 || null,
        jefeProyecto2: clienteForm.jefeProyecto2 || null,
        licenciaTipo: clienteForm.licenciaTipo || null,
        activo: status === "ACTIVO",
      });
      setClienteForm({ codigo: "", descripcion: "", jefeProyecto1: "", jefeProyecto2: "", licenciaTipo: "" });
      setStatus("ACTIVO");
      navigate(`/clientes/${created.codigo}/ficha`);
    } catch (e: any) {
      setError(e?.message ?? "Error");
      setSavingCliente(false);
    }
  }

  async function onChangeStatus(cliente: Cliente, nextStatus: "ACTIVO" | "DESACTIVADO") {
    if (nextStatus === "DESACTIVADO") {
      if (!replacementId || !editingId || editingId !== cliente.id) {
        setError("Debe seleccionar un reemplazo para desactivar.");
        return;
      }
    }
    try {
      await updateCliente(cliente.id, { activo: nextStatus === "ACTIVO" }, replacementId || undefined);
      setEditingId(null);
      setReplacementId("");
      setError(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Error al actualizar");
    }
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Clientes</div>
        <button className="btn icon" onClick={load} disabled={loading} title="Refrescar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      {/* Crear arriba (colapsado al entrar) - only shown if user has edit permission */}
        {canEdit && (
          <details className="card cardDetails collapsible">
            <summary className="cardSummary">
              <div className="h1">Crear cliente</div>
            </summary>
            <div className="cardContent">
              {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}
              <form className="form" onSubmit={onCreateCliente}>
              <div className="field">
                <div className="label">Código *</div>
                <input className="input" value={clienteForm.codigo} onChange={(e)=>setClienteForm({ ...clienteForm, codigo: e.target.value })} required />
              </div>
              <div className="field">
                <div className="label">Descripción</div>
                <input className="input" value={clienteForm.descripcion} onChange={(e)=>setClienteForm({ ...clienteForm, descripcion: e.target.value })} />
              </div>
              <div className="field">
                <div className="label">Jefe Proyecto 1</div>
                <select className="input" value={clienteForm.jefeProyecto1} onChange={(e)=>setClienteForm({ ...clienteForm, jefeProyecto1: e.target.value })}>
                  <option value="">-- Seleccionar --</option>
                  {agentes.map(a => (
                    <option key={a.id} value={a.usuario}>{a.nombre} ({a.usuario})</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <div className="label">Jefe Proyecto 2</div>
                <select className="input" value={clienteForm.jefeProyecto2} onChange={(e)=>setClienteForm({ ...clienteForm, jefeProyecto2: e.target.value })}>
                  <option value="">-- Seleccionar --</option>
                  {agentes.map(a => (
                    <option key={a.id} value={a.usuario}>{a.nombre} ({a.usuario})</option>
                  ))}
                </select>
              </div>
                <div className="field">
                  <div className="label">Tipo Licencia</div>
                  <select className="input" value={clienteForm.licenciaTipo} onChange={(e)=>setClienteForm({ ...clienteForm, licenciaTipo: e.target.value as "" | "AAM" | "PPU" })}>
                    <option value="">-- Seleccionar --</option>
                    <option value="AAM">AAM</option>
                    <option value="PPU">PPU</option>
                  </select>
                </div>
                <div className="field">
                  <div className="label">Estado</div>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value as "ACTIVO" | "DESACTIVADO")}> 
                    <option value="ACTIVO">Activo</option>
                    <option value="DESACTIVADO">Desactivado</option>
                  </select>
                </div>
                <div className="field full">
                  <button className="btn primary" disabled={savingCliente}>Crear cliente</button>
                </div>
              </form>
            </div>
          </details>
        )}

      {/* Lista debajo (abierta al entrar) */}
      <details className="card cardDetails collapsible" open>
        <summary className="cardSummary">
          <div>
            <div className="h1">Lista de clientes</div>
            <div className="small" style={{ marginTop: 6 }}>{loading ? "Cargando..." : `${filteredItems.length} de ${items.length} cliente(s)`}</div>
          </div>
        </summary>
        <div className="cardContent">
          {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}

          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <input
              className="input"
              type="text"
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', maxWidth: 500 }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Mostrar desactivados
            </label>
            {search && (
              <button
                className="btn"
                style={{ marginLeft: 8 }}
                onClick={() => setSearch("")}
              >
                Limpiar
              </button>
            )}
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Release</th>
                <th>Estado</th>
                <th style={{ width: '40px' }}></th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((c) => (
                <tr key={c.id}>
                  <td>{c.codigo}</td>
                  <td>{c.descripcion ?? "-"}</td>
                  <td>
                    {c.currentRelease ? (
                      <span style={{ padding: '2px 8px', backgroundColor: '#D1FAE5', color: '#059669', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                        {c.currentRelease}
                      </span>
                    ) : (
                      <span style={{ color: '#9CA3AF' }}>-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select
                        className="input"
                        style={{ minWidth: 140 }}
                        value={c.activo !== false ? "ACTIVO" : "DESACTIVADO"}
                        onChange={(e) => {
                          const nextStatus = e.target.value as "ACTIVO" | "DESACTIVADO";
                          if (nextStatus === "DESACTIVADO") {
                            setEditingId(c.id);
                            if (!replacementId) {
                              setError("Seleccione un reemplazo antes de desactivar.");
                              return;
                            }
                          }
                          onChangeStatus(c, nextStatus);
                        }}
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="DESACTIVADO">Desactivado</option>
                      </select>
                      {editingId === c.id && (
                        <select
                          className="input"
                          style={{ minWidth: 160 }}
                          value={editingId === c.id ? replacementId : ""}
                          onChange={(e) => {
                            setEditingId(c.id);
                            setReplacementId(e.target.value);
                            if (e.target.value) {
                              setError(null);
                            }
                          }}
                        >
                          <option value="">Reasignar a...</option>
                          {items.filter((i) => i.id !== c.id && i.activo !== false).map((i) => (
                            <option key={i.id} value={i.id}>{i.codigo}</option>
                          ))}
                        </select>
                      )}
                      {editingId === c.id && (
                        <span className="small" style={{ color: "var(--muted)" }}>
                          Requerido para desactivar.
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {c.comentarioDestacado && (
                      <button
                        className="btn"
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#FEF3C7',
                          border: '1px solid #FDE68A',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                        title={c.comentarioDestacado}
                        onClick={() => navigate(`/clientes/${c.codigo}/ficha`)}
                      >
                        ⚠
                      </button>
                    )}
                  </td>
                  <td>
                    <button className="btn" onClick={() => navigate(`/clientes/${c.codigo}/ficha`)}>Ficha</button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#6B7280', padding: 24 }}>
                    {search ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados'}
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
