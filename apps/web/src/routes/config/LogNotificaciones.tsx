import React from "react";
import { Link } from "react-router-dom";
import {
  listNotificacionLogs,
  getNotificacionLog,
  getNotificacionLogStats,
  retryNotificacion,
  cancelNotificacion,
  processNotificacionQueue,
  NotificacionLog,
  NotificacionLogStats,
  EstadoNotificacion,
  ListNotificacionLogParams,
} from "../../lib/api";

const ESTADO_COLORS: Record<EstadoNotificacion, { bg: string; text: string }> = {
  PENDIENTE: { bg: "#FEF3C7", text: "#92400E" },
  PROCESANDO: { bg: "#DBEAFE", text: "#1E40AF" },
  ENVIADO: { bg: "#D1FAE5", text: "#065F46" },
  ERROR: { bg: "#FEE2E2", text: "#DC2626" },
  CANCELADO: { bg: "#E5E7EB", text: "#374151" },
};

const EVENTO_TIPO_LABELS: Record<string, string> = {
  MENSAJE_CLIENTE: "Mensaje Cliente",
  RESPUESTA_AGENTE: "Respuesta Agente",
  NOTA_INTERNA: "Nota Interna",
  CAMBIO_ESTADO: "Cambio Estado",
  ASIGNACION: "Asignacion",
  CAMBIO_PRIORIDAD: "Cambio Prioridad",
  CAMBIO_TIPO: "Cambio Tipo",
  CAMBIO_MODULO: "Cambio Modulo",
  CAMBIO_RELEASE_HOTFIX: "Cambio Release",
  SISTEMA: "Sistema",
};

export default function LogNotificaciones() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Stats
  const [stats, setStats] = React.useState<NotificacionLogStats | null>(null);

  // List data
  const [items, setItems] = React.useState<NotificacionLog[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Filters
  const [estadoFilter, setEstadoFilter] = React.useState<EstadoNotificacion | "">("");
  const [eventoTipoFilter, setEventoTipoFilter] = React.useState("");
  const [searchFilter, setSearchFilter] = React.useState("");
  const [fechaDesde, setFechaDesde] = React.useState("");
  const [fechaHasta, setFechaHasta] = React.useState("");

  // Detail modal
  const [selectedLog, setSelectedLog] = React.useState<NotificacionLog | null>(null);
  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // Processing
  const [processing, setProcessing] = React.useState(false);

  async function loadStats() {
    try {
      const data = await getNotificacionLogStats();
      setStats(data);
    } catch (e: any) {
      console.error("Error loading stats:", e);
    }
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const params: ListNotificacionLogParams = {
        page,
        limit: 50,
      };
      if (estadoFilter) params.estado = estadoFilter;
      if (eventoTipoFilter) params.eventoTipo = eventoTipoFilter;
      if (searchFilter) params.search = searchFilter;
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;

      const result = await listNotificacionLogs(params);
      setItems(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadStats();
    loadData();
  }, [page, estadoFilter, eventoTipoFilter, fechaDesde, fechaHasta]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadData();
  }

  async function handleViewDetail(id: string) {
    setLoadingDetail(true);
    setShowDetailModal(true);
    try {
      const data = await getNotificacionLog(id);
      setSelectedLog(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar detalle");
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRetry(id: string) {
    try {
      await retryNotificacion(id);
      setSuccess("Notificacion marcada para reintento");
      loadData();
      loadStats();
    } catch (e: any) {
      setError(e?.message ?? "Error al reintentar");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("¿Cancelar esta notificacion?")) return;
    try {
      await cancelNotificacion(id);
      setSuccess("Notificacion cancelada");
      loadData();
      loadStats();
    } catch (e: any) {
      setError(e?.message ?? "Error al cancelar");
    }
  }

  async function handleProcessQueue() {
    setProcessing(true);
    try {
      const result = await processNotificacionQueue();
      setSuccess(`Cola procesada: ${result.processed} procesadas, ${result.successCount} exitosas, ${result.failed} fallidas`);
      loadData();
      loadStats();
    } catch (e: any) {
      setError(e?.message ?? "Error al procesar cola");
    } finally {
      setProcessing(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Log Notificaciones</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn"
            onClick={handleProcessQueue}
            disabled={processing}
          >
            {processing ? "Procesando..." : "Procesar Cola"}
          </button>
          <button
            className="btn icon"
            onClick={() => { loadData(); loadStats(); }}
            disabled={loading}
            title="Refrescar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "12px", cursor: "pointer" }}>×</button>
        </div>
      )}
      {success && (
        <div style={{ padding: "12px", background: "#D1FAE5", color: "#059669", borderRadius: "8px", marginBottom: "16px" }}>
          {success}
          <button onClick={() => setSuccess(null)} style={{ marginLeft: "12px", cursor: "pointer" }}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "20px" }}>
          <div className="card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#92400E" }}>{stats.pendiente}</div>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>Pendientes</div>
          </div>
          <div className="card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#1E40AF" }}>{stats.procesando}</div>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>Procesando</div>
          </div>
          <div className="card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#065F46" }}>{stats.enviadoHoy}</div>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>Enviados Hoy</div>
          </div>
          <div className="card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#DC2626" }}>{stats.errorHoy}</div>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>Errores Hoy</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Estado</label>
            <select
              className="input"
              value={estadoFilter}
              onChange={(e) => { setEstadoFilter(e.target.value as EstadoNotificacion | ""); setPage(1); }}
              style={{ minWidth: "120px" }}
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PROCESANDO">Procesando</option>
              <option value="ENVIADO">Enviado</option>
              <option value="ERROR">Error</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Tipo Evento</label>
            <select
              className="input"
              value={eventoTipoFilter}
              onChange={(e) => { setEventoTipoFilter(e.target.value); setPage(1); }}
              style={{ minWidth: "150px" }}
            >
              <option value="">Todos</option>
              {Object.entries(EVENTO_TIPO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Desde</label>
            <input
              type="date"
              className="input"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Hasta</label>
            <input
              type="date"
              className="input"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Buscar</label>
            <input
              type="text"
              className="input"
              placeholder="Numero tarea, titulo, asunto..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <button type="submit" className="btn primary">Buscar</button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setEstadoFilter("");
              setEventoTipoFilter("");
              setFechaDesde("");
              setFechaHasta("");
              setSearchFilter("");
              setPage(1);
            }}
          >
            Limpiar
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>No hay notificaciones</div>
        ) : (
          <>
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tarea</th>
                  <th>Tipo</th>
                  <th>Destinatarios</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ cursor: "pointer" }} onClick={() => handleViewDetail(item.id)}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(item.createdAt)}</td>
                    <td>
                      <Link
                        to={`/tareas/${item.tareaId}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "var(--primary)", textDecoration: "none" }}
                      >
                        #{item.tarea?.numero}
                      </Link>
                      {item.tarea?.cliente && (
                        <span style={{ marginLeft: "6px", color: "var(--muted)", fontSize: "12px" }}>
                          ({item.tarea.cliente.codigo})
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "12px" }}>
                        {EVENTO_TIPO_LABELS[item.eventoTipo] || item.eventoTipo}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px" }}>
                        {item.emailsTo.length} destinatario(s)
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          background: ESTADO_COLORS[item.estado]?.bg || "#E5E7EB",
                          color: ESTADO_COLORS[item.estado]?.text || "#374151",
                        }}
                      >
                        {item.estado}
                      </span>
                      {item.retryCount > 0 && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", color: "var(--muted)" }}>
                          ({item.retryCount}/{item.maxRetries})
                        </span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn small"
                          onClick={() => handleViewDetail(item.id)}
                          title="Ver detalle"
                        >
                          Ver
                        </button>
                        {(item.estado === "ERROR" || item.estado === "CANCELADO") && (
                          <button
                            className="btn small"
                            onClick={() => handleRetry(item.id)}
                            title="Reintentar"
                          >
                            Reintentar
                          </button>
                        )}
                        {item.estado === "PENDIENTE" && (
                          <button
                            className="btn small"
                            onClick={() => handleCancel(item.id)}
                            title="Cancelar"
                            style={{ color: "#DC2626" }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                  Mostrando {items.length} de {total}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn small"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </button>
                  <span style={{ padding: "6px 12px", fontSize: "14px" }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    className="btn small"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="card"
            style={{
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              padding: "24px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>Cargando...</div>
            ) : selectedLog ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "18px" }}>Detalle de Notificacion</h2>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "8px",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontWeight: 500,
                        background: ESTADO_COLORS[selectedLog.estado]?.bg || "#E5E7EB",
                        color: ESTADO_COLORS[selectedLog.estado]?.text || "#374151",
                      }}
                    >
                      {selectedLog.estado}
                    </span>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} style={{ fontSize: "24px", cursor: "pointer", background: "none", border: "none", color: "var(--muted)" }}>
                    ×
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Tarea</div>
                    <div>
                      <Link to={`/tareas/${selectedLog.tareaId}`} style={{ color: "var(--primary)" }}>
                        #{selectedLog.tarea?.numero}
                      </Link>
                      {" - "}{selectedLog.tarea?.titulo}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Tipo Evento</div>
                    <div>{EVENTO_TIPO_LABELS[selectedLog.eventoTipo] || selectedLog.eventoTipo}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Creado</div>
                    <div>{formatDate(selectedLog.createdAt)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Enviado</div>
                    <div>{selectedLog.enviadoAt ? formatDate(selectedLog.enviadoAt) : "-"}</div>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Destinatarios (To)</div>
                  <div style={{ fontSize: "14px" }}>{selectedLog.emailsTo.join(", ") || "-"}</div>
                </div>

                {selectedLog.emailsCc.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>CC</div>
                    <div style={{ fontSize: "14px" }}>{selectedLog.emailsCc.join(", ")}</div>
                  </div>
                )}

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Asunto</div>
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>{selectedLog.asunto}</div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Contenido</div>
                  <div
                    style={{
                      padding: "16px",
                      background: "var(--bg-secondary)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      maxHeight: "300px",
                      overflow: "auto",
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedLog.cuerpoHtml }}
                  />
                </div>

                {selectedLog.errorMessage && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#DC2626", marginBottom: "4px" }}>Error</div>
                    <div style={{ padding: "12px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", fontSize: "14px" }}>
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                )}

                {selectedLog.logEnvio && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Log de Envio</div>
                    <pre style={{
                      padding: "12px",
                      background: "var(--bg-secondary)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      overflow: "auto",
                      maxHeight: "200px",
                    }}>
                      {JSON.stringify(JSON.parse(selectedLog.logEnvio), null, 2)}
                    </pre>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  {(selectedLog.estado === "ERROR" || selectedLog.estado === "CANCELADO") && (
                    <button
                      className="btn primary"
                      onClick={() => {
                        handleRetry(selectedLog.id);
                        setShowDetailModal(false);
                      }}
                    >
                      Reintentar
                    </button>
                  )}
                  {selectedLog.estado === "PENDIENTE" && (
                    <button
                      className="btn"
                      onClick={() => {
                        handleCancel(selectedLog.id);
                        setShowDetailModal(false);
                      }}
                      style={{ color: "#DC2626" }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button className="btn" onClick={() => setShowDetailModal(false)}>
                    Cerrar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
