import React from "react";
import {
  TipoTarea,
  EstadoPeticion,
  EstadoPeticionFlowListItem,
  EstadoPeticionFlowDetail,
  listTiposTarea,
  listEstadosPeticion,
  listEstadoPeticionFlows,
  getEstadoPeticionFlowByTipoTarea,
  createEstadoPeticionFlow,
  updateEstadoPeticionFlow,
  deleteEstadoPeticionFlow,
  toggleEstadoPeticionFlow,
  EstadoPermitido,
  Transicion,
} from "../../lib/api";

type TransicionUI = Transicion & {
  key: string;
};

export default function EstadoPeticionFlows() {
  const [tipos, setTipos] = React.useState<TipoTarea[]>([]);
  const [estados, setEstados] = React.useState<EstadoPeticion[]>([]);
  const [flows, setFlows] = React.useState<EstadoPeticionFlowListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Edit modal state
  const [showModal, setShowModal] = React.useState(false);
  const [editingTipoId, setEditingTipoId] = React.useState<string | null>(null);
  const [editingFlow, setEditingFlow] = React.useState<EstadoPeticionFlowDetail | null>(null);

  // Form state
  const [estadoInicialId, setEstadoInicialId] = React.useState<string>("");
  const [estadosPermitidos, setEstadosPermitidos] = React.useState<EstadoPermitido[]>([]);
  const [transiciones, setTransiciones] = React.useState<TransicionUI[]>([]);
  const [activo, setActivo] = React.useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [tiposData, estadosData, flowsData] = await Promise.all([
        listTiposTarea({ includeInactive: false }),
        listEstadosPeticion({ includeInactive: false }),
        listEstadoPeticionFlows(),
      ]);
      // Filter to only show tipos that have tablaRelacionada = "EstadoPeticion"
      const filteredTipos = tiposData.filter((t) => t.tablaRelacionada === "EstadoPeticion");
      setTipos(filteredTipos);
      setEstados(estadosData);
      setFlows(flowsData);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, []);

  function getTipoLabel(tipoId: string) {
    const tipo = tipos.find((t) => t.id === tipoId);
    return tipo?.codigo ?? tipoId;
  }

  function getEstadoLabel(estadoId: string) {
    const estado = estados.find((e) => e.id === estadoId);
    return estado?.codigo ?? estadoId;
  }

  async function openEditor(tipoId: string) {
    setEditingTipoId(tipoId);
    setError(null);
    setSuccess(null);

    try {
      const flow = await getEstadoPeticionFlowByTipoTarea(tipoId);
      if (flow) {
        setEditingFlow(flow);
        setEstadoInicialId(flow.estadoInicialId ?? "");
        setEstadosPermitidos(
          flow.estadosPermitidos.map((ep) => ({
            estadoId: ep.estadoId,
            orden: ep.orden,
            visibleCliente: ep.visibleCliente,
          }))
        );
        setTransiciones(
          flow.transiciones.map((t, i) => ({
            key: `t-${i}`,
            estadoOrigenId: t.estadoOrigenId,
            estadoDestinoId: t.estadoDestinoId,
            permiteAgente: t.permiteAgente,
            permiteCliente: t.permiteCliente,
            notificar: t.notificar,
            orden: t.orden,
          }))
        );
        setActivo(flow.activo);
      } else {
        setEditingFlow(null);
        setEstadoInicialId("");
        // Initialize with all estados as permitidos
        setEstadosPermitidos(
          estados.map((e, i) => ({
            estadoId: e.id,
            orden: i,
            visibleCliente: true,
          }))
        );
        setTransiciones([]);
        setActivo(true);
      }
      setShowModal(true);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar flujo");
    }
  }

  function closeModal() {
    setShowModal(false);
    setEditingTipoId(null);
    setEditingFlow(null);
  }

  function toggleEstadoPermitido(estadoId: string) {
    const existing = estadosPermitidos.find((ep) => ep.estadoId === estadoId);
    if (existing) {
      // Remove it
      setEstadosPermitidos(estadosPermitidos.filter((ep) => ep.estadoId !== estadoId));
      // Also remove related transitions
      setTransiciones(
        transiciones.filter((t) => t.estadoOrigenId !== estadoId && t.estadoDestinoId !== estadoId)
      );
    } else {
      // Add it
      setEstadosPermitidos([
        ...estadosPermitidos,
        { estadoId, orden: estadosPermitidos.length, visibleCliente: true },
      ]);
    }
  }

  function updateEstadoPermitidoVisibility(estadoId: string, visible: boolean) {
    setEstadosPermitidos(
      estadosPermitidos.map((ep) =>
        ep.estadoId === estadoId ? { ...ep, visibleCliente: visible } : ep
      )
    );
  }

  function addTransicion() {
    const allowedEstadoIds = estadosPermitidos.map((ep) => ep.estadoId);
    if (allowedEstadoIds.length < 2) return;
    setTransiciones([
      ...transiciones,
      {
        key: `t-new-${Date.now()}`,
        estadoOrigenId: allowedEstadoIds[0],
        estadoDestinoId: allowedEstadoIds[1],
        permiteAgente: true,
        permiteCliente: false,
        notificar: false,
        orden: transiciones.length,
      },
    ]);
  }

  function updateTransicion(key: string, field: keyof TransicionUI, value: any) {
    setTransiciones(
      transiciones.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    );
  }

  function removeTransicion(key: string) {
    setTransiciones(transiciones.filter((t) => t.key !== key));
  }

  async function handleSave() {
    if (!editingTipoId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = {
        tipoTareaId: editingTipoId,
        estadoInicialId: estadoInicialId || undefined,
        estadosPermitidos: estadosPermitidos.map((ep) => ({
          estadoId: ep.estadoId,
          orden: ep.orden ?? 0,
          visibleCliente: ep.visibleCliente ?? true,
        })),
        transiciones: transiciones.map((t) => ({
          estadoOrigenId: t.estadoOrigenId,
          estadoDestinoId: t.estadoDestinoId,
          permiteAgente: t.permiteAgente ?? true,
          permiteCliente: t.permiteCliente ?? false,
          notificar: t.notificar ?? false,
          orden: t.orden ?? 0,
        })),
        activo,
      };

      if (editingFlow) {
        await updateEstadoPeticionFlow(editingFlow.id, data);
      } else {
        await createEstadoPeticionFlow(data);
      }

      setSuccess("Flujo guardado correctamente");
      await loadData();
      closeModal();
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar flujo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tipoTareaId: string) {
    if (!confirm("¿Esta seguro de eliminar el flujo de estados de petición para este tipo de tarea?")) return;

    try {
      await deleteEstadoPeticionFlow(tipoTareaId);
      setSuccess("Flujo eliminado correctamente");
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Error al eliminar flujo");
    }
  }

  async function handleToggle(flowId: string) {
    try {
      await toggleEstadoPeticionFlow(flowId);
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Error al cambiar estado del flujo");
    }
  }

  const allowedEstadoIds = new Set(estadosPermitidos.map((ep) => ep.estadoId));

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Flujos de Estado Petición</div>
        <button className="btn icon" onClick={loadData} disabled={loading} title="Refrescar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEE2E2", color: "#DC2626", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 12, background: "#D1FAE5", color: "#059669", borderRadius: 8, marginBottom: 16 }}>
          {success}
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Configure las transiciones de estado de petición permitidas para cada tipo de tarea
            que tenga configurada la tabla relacionada "Estado Petición".
            Solo se muestran los tipos de tarea con esta configuración.
          </p>
        </div>

        {loading ? (
          <div className="small">Cargando...</div>
        ) : tipos.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            No hay tipos de tarea con "Estado Petición" como tabla relacionada.
            <br />
            <span style={{ fontSize: 12 }}>
              Configure un tipo de tarea con "Tabla Relacionada = Estado Petición" en la sección Tipos de Tarea.
            </span>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tipo de Tarea</th>
                <th style={{ width: 150 }}>Estado Inicial</th>
                <th style={{ width: 100 }}>Estados</th>
                <th style={{ width: 120 }}>Transiciones</th>
                <th style={{ width: 100 }}>Activo</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => {
                const flow = flows.find((f) => f.tipoTareaId === tipo.id);
                return (
                  <tr key={tipo.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{tipo.codigo}</div>
                      {tipo.descripcion && (
                        <div className="small" style={{ color: "var(--muted)" }}>{tipo.descripcion}</div>
                      )}
                    </td>
                    <td>
                      {flow?.estadoInicial?.codigo ?? (
                        <span style={{ color: "var(--muted)" }}>Por defecto</span>
                      )}
                    </td>
                    <td>{flow?.estadosCount ?? "-"}</td>
                    <td>{flow?.transicionesCount ?? "-"}</td>
                    <td>
                      {flow ? (
                        <button
                          className="btn"
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            background: flow.activo ? "#D1FAE5" : "#FEE2E2",
                            color: flow.activo ? "#059669" : "#DC2626",
                            border: "none",
                          }}
                          onClick={() => handleToggle(flow.id)}
                        >
                          {flow.activo ? "Activo" : "Inactivo"}
                        </button>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>Sin flujo</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn primary"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                          onClick={() => openEditor(tipo.id)}
                        >
                          {flow ? "Editar" : "Configurar"}
                        </button>
                        {flow && (
                          <button
                            className="btn"
                            style={{ padding: "4px 10px", fontSize: 12, color: "var(--danger)" }}
                            onClick={() => handleDelete(tipo.id)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && editingTipoId && (
        <div className="modalOverlay" onClick={closeModal}>
          <div
            className="modalCard"
            style={{ width: "95vw", maxWidth: 900, maxHeight: "95vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>
                Flujo de Estado Petición: {getTipoLabel(editingTipoId)}
              </h2>
              <button className="btn" onClick={closeModal}>Cerrar</button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
              {/* Estado Inicial */}
              <div className="field" style={{ marginBottom: 20 }}>
                <div className="label">Estado Petición Inicial</div>
                <select
                  className="input"
                  value={estadoInicialId}
                  onChange={(e) => setEstadoInicialId(e.target.value)}
                  style={{ maxWidth: 300 }}
                >
                  <option value="">-- Por defecto del sistema --</option>
                  {estados.map((e) => (
                    <option key={e.id} value={e.id}>{e.codigo}</option>
                  ))}
                </select>
                <div className="small" style={{ marginTop: 4, color: "var(--muted)" }}>
                  Estado de petición inicial para nuevas tareas de este tipo
                </div>
              </div>

              {/* Estados Permitidos */}
              <div style={{ marginBottom: 24 }}>
                <div className="label" style={{ marginBottom: 8 }}>Estados de Petición Permitidos</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 8 }}>
                  {estados.map((estado) => {
                    const isAllowed = allowedEstadoIds.has(estado.id);
                    const ep = estadosPermitidos.find((ep) => ep.estadoId === estado.id);
                    return (
                      <div
                        key={estado.id}
                        style={{
                          padding: 10,
                          border: `1px solid ${isAllowed ? "var(--accent)" : "var(--border)"}`,
                          borderRadius: 6,
                          background: isAllowed ? "rgba(79, 70, 229, 0.05)" : "transparent",
                        }}
                      >
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => toggleEstadoPermitido(estado.id)}
                          />
                          <span style={{ fontWeight: 500 }}>{estado.codigo}</span>
                        </label>
                        {isAllowed && (
                          <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, marginLeft: 24, fontSize: 12 }}>
                            <input
                              type="checkbox"
                              checked={ep?.visibleCliente ?? true}
                              onChange={(e) => updateEstadoPermitidoVisibility(estado.id, e.target.checked)}
                            />
                            <span>Visible para cliente</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transiciones */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div className="label">Transiciones Permitidas</div>
                  <button
                    className="btn"
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={addTransicion}
                    disabled={allowedEstadoIds.size < 2}
                  >
                    + Agregar Transición
                  </button>
                </div>

                {transiciones.length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center", color: "var(--muted)", background: "var(--bg-secondary)", borderRadius: 6 }}>
                    Sin transiciones definidas. Se permiten todas las transiciones entre estados permitidos.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {transiciones.map((t) => (
                      <div
                        key={t.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto 1fr auto auto auto auto",
                          gap: 8,
                          alignItems: "center",
                          padding: 10,
                          background: "var(--bg-secondary)",
                          borderRadius: 6,
                        }}
                      >
                        <select
                          className="input"
                          value={t.estadoOrigenId}
                          onChange={(e) => updateTransicion(t.key, "estadoOrigenId", e.target.value)}
                          style={{ fontSize: 13 }}
                        >
                          {estados.filter((e) => allowedEstadoIds.has(e.id)).map((e) => (
                            <option key={e.id} value={e.id}>{e.codigo}</option>
                          ))}
                        </select>

                        <span style={{ color: "var(--muted)" }}>&rarr;</span>

                        <select
                          className="input"
                          value={t.estadoDestinoId}
                          onChange={(e) => updateTransicion(t.key, "estadoDestinoId", e.target.value)}
                          style={{ fontSize: 13 }}
                        >
                          {estados.filter((e) => allowedEstadoIds.has(e.id)).map((e) => (
                            <option key={e.id} value={e.id}>{e.codigo}</option>
                          ))}
                        </select>

                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap" }}>
                          <input
                            type="checkbox"
                            checked={t.permiteAgente ?? true}
                            onChange={(e) => updateTransicion(t.key, "permiteAgente", e.target.checked)}
                          />
                          Agente
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap" }}>
                          <input
                            type="checkbox"
                            checked={t.permiteCliente ?? false}
                            onChange={(e) => updateTransicion(t.key, "permiteCliente", e.target.checked)}
                          />
                          Cliente
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap" }}>
                          <input
                            type="checkbox"
                            checked={t.notificar ?? false}
                            onChange={(e) => updateTransicion(t.key, "notificar", e.target.checked)}
                          />
                          Notificar
                        </label>

                        <button
                          className="btn"
                          style={{ padding: "4px 8px", fontSize: 12, color: "var(--danger)" }}
                          onClick={() => removeTransicion(t.key)}
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="small" style={{ marginTop: 8, color: "var(--muted)" }}>
                  Define qué transiciones están permitidas y quién puede realizarlas.
                </div>
              </div>

              {/* Activo */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                  />
                  <span style={{ fontWeight: 500 }}>Flujo activo</span>
                </label>
                <div className="small" style={{ marginTop: 4, color: "var(--muted)", marginLeft: 24 }}>
                  Si el flujo está inactivo, se permiten todas las transiciones.
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button className="btn primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
