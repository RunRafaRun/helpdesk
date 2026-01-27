import React, { useState, useCallback } from "react";
import {
  listClientesLookup,
  listRoles,
  sendNotificacion,
  listNotificaciones,
  getNotificacion,
  NotificacionMasiva,
  Adjunto,
} from "../lib/api";
import TipTapEditor from "../components/TipTapEditor";
import TemplateSelector from "../components/TemplateSelector";
import { WildcardContext } from "../lib/wildcards";
import { useAuth } from "../lib/auth";

// Convert UTC date to local datetime-local input format (YYYY-MM-DDTHH:mm)
function toLocalDatetimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// Get minimum datetime for scheduling (current time in local format)
function getMinDateTime(): string {
  return toLocalDatetimeString(new Date());
}

interface NotificationDetailModalProps {
  notification: NotificacionMasiva | null;
  onClose: () => void;
  onReschedule?: (id: string, programadoAt: string) => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({ notification, onClose, onReschedule }) => {
  if (!notification) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--panel)",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
          width: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Detalles de Notificación</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <strong>Asunto:</strong> {notification.asunto}
          </div>
          
          <div>
            <strong>Estado:</strong>{" "}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                background:
                  notification.estado === "ENVIADO"
                    ? "#D1FAE5"
                    : notification.estado === "ERROR"
                    ? "#FEE2E2"
                    : notification.estado === "PROGRAMADO"
                    ? "#DBEAFE"
                    : notification.estado === "PENDIENTE"
                    ? "#FEF3C7"
                    : notification.estado === "ENVIANDO"
                    ? "#E0F2FE"
                    : "#FEF3C7",
                color:
                  notification.estado === "ENVIADO"
                    ? "#059669"
                    : notification.estado === "ERROR"
                    ? "#DC2626"
                    : notification.estado === "PROGRAMADO"
                    ? "#1E40AF"
                    : notification.estado === "PENDIENTE"
                    ? "#92400E"
                    : notification.estado === "ENVIANDO"
                    ? "#0369A1"
                    : "#B45309",
              }}
            >
              {notification.estado}
            </span>
          </div>

          <div>
            <strong>Enviado por:</strong> {notification.agente.nombre} ({notification.agente.usuario})
          </div>

          <div>
            <strong>Fecha creación:</strong> {new Date(notification.createdAt).toLocaleString()}
          </div>

          {notification.enviadoAt && (
            <div>
              <strong>Fecha envío:</strong> {new Date(notification.enviadoAt).toLocaleString()}
            </div>
          )}

          {notification.programadoAt && (
            <div>
              <strong>Programado para:</strong> {new Date(notification.programadoAt).toLocaleString()}
            </div>
          )}

          <div>
            <strong>Destinatarios (TO):</strong>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              {notification.emailsTo.map((email, index) => (
                <li key={index} style={{ fontSize: "14px" }}>{email}</li>
              ))}
            </ul>
          </div>

          {notification.emailsCc && notification.emailsCc.length > 0 && (
            <div>
              <strong>Destinatarios (CC):</strong>
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                {notification.emailsCc.map((email, index) => (
                  <li key={index} style={{ fontSize: "14px" }}>{email}</li>
                ))}
              </ul>
            </div>
          )}

          {notification.adjuntos && notification.adjuntos.length > 0 && (
            <div>
              <strong>Adjuntos:</strong>
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                {notification.adjuntos.map((adjunto, index) => (
                  <li key={index} style={{ fontSize: "14px" }}>
                    {adjunto.nombre} ({adjunto.tipo})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <strong>Estadísticas:</strong> Enviados: {notification.enviados} | Errores: {notification.errores}
          </div>

          {notification.estado === "PROGRAMADO" && onReschedule && (
            <div style={{ marginTop: "16px", padding: "16px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>Reprogramar envío</h4>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="datetime-local"
                  className="input"
                  id={`reschedule-${notification.id}`}
                  min={getMinDateTime()}
                  defaultValue={notification.programadoAt ? toLocalDatetimeString(new Date(notification.programadoAt)) : ""}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn"
                  onClick={() => {
                    const input = document.getElementById(`reschedule-${notification.id}`) as HTMLInputElement;
                    if (input && input.value) {
                      onReschedule(notification.id, input.value);
                      onClose();
                    }
                  }}
                >
                  Reprogramar
                </button>
              </div>
            </div>
          )}

          <div>
            <strong>Mensaje:</strong>
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "12px",
                marginTop: "8px",
                background: "var(--bg)",
                maxHeight: "200px",
                overflow: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: notification.cuerpoHtml }}
            />
          </div>

          {notification.logEnvio && (
            <div>
              <strong>Log de envío:</strong>
              <pre
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "12px",
                  marginTop: "8px",
                  background: "var(--bg)",
                  fontSize: "12px",
                  maxHeight: "150px",
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {notification.logEnvio}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NotificacionesMasivas() {
  const { me } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [historial, setHistorial] = useState<NotificacionMasiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificacionMasiva | null>(null);

  // Context for template wildcards (limited context for notifications)
  const wildcardContext: WildcardContext = React.useMemo(() => ({
    agente: me ? {
      nombre: me.usuario,
      email: null,
    } : null,
    cliente: null,
    tarea: null,
  }), [me]);

  // Handle template selection
  function handleTemplateSelect(resolvedHtml: string) {
    if (!cuerpoHtml || cuerpoHtml === "<p></p>") {
      setCuerpoHtml(resolvedHtml);
    } else {
      setCuerpoHtml(cuerpoHtml + resolvedHtml);
    }
  }

  // Form state
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [selectAllClientes, setSelectAllClientes] = useState(false);
  const [emailManual, setEmailManual] = useState("");
  const [emailsManuales, setEmailsManuales] = useState<string[]>([]);
  const [roleCcId, setRoleCcId] = useState("");
  const [asunto, setAsunto] = useState("");
  const [cuerpoHtml, setCuerpoHtml] = useState("<p></p>");
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [programadoAt, setProgramadoAt] = useState("");

  // Search filter for clientes
  const [searchCliente, setSearchCliente] = useState("");

  const handleReschedule = async (id: string, programadoAt: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/admin/notificaciones/${id}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ programadoAt }),
      });

      if (response.ok) {
        // Refresh the notifications list
        await load();
        alert("Notificación reprogramada exitosamente");
      } else {
        alert("Error al reprogramar la notificación");
      }
    } catch (error) {
      console.error("Error rescheduling notification:", error);
      alert("Error al reprogramar la notificación");
    }
  };

  async function load() {
    setLoading(true);
    try {
      const [clientesData, rolesData, historialData] = await Promise.all([
        listClientesLookup(),
        listRoles(),
        listNotificaciones(),
      ]);
      setClientes(clientesData);
      setRoles(rolesData);
      setHistorial(historialData);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const handleSelectAllClientes = useCallback(() => {
    if (selectAllClientes) {
      setSelectedClientes([]);
    } else {
      setSelectedClientes(clientes.map(c => c.id));
    }
    setSelectAllClientes(!selectAllClientes);
  }, [selectAllClientes, clientes]);

  function toggleCliente(clienteId: string) {
    setSelectedClientes((prev) =>
      prev.includes(clienteId)
        ? prev.filter((id) => id !== clienteId)
        : [...prev, clienteId]
    );
  }

  function addManualEmail() {
    const email = emailManual.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido");
      return;
    }
    if (!emailsManuales.includes(email)) {
      setEmailsManuales([...emailsManuales, email]);
    }
    setEmailManual("");
  }

  function removeManualEmail(email: string) {
    setEmailsManuales(emailsManuales.filter((e) => e !== email));
  }

  const handleFileAttach = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix to get pure base64
        const pureBase64 = base64.split(',')[1];
        
        const adjunto: Adjunto = {
          nombre: file.name,
          tipo: file.type,
          datos: pureBase64,
        };
        
        setAdjuntos(prev => [...prev, adjunto]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  }, []);

  function removeAdjunto(index: number) {
    setAdjuntos(adjuntos.filter((_, i) => i !== index));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (selectedClientes.length === 0 && emailsManuales.length === 0) {
      setError("Debe seleccionar al menos un destinatario");
      return;
    }
    if (!asunto.trim()) {
      setError("El asunto es obligatorio");
      return;
    }
    if (!cuerpoHtml || cuerpoHtml === "<p></p>") {
      setError("El cuerpo del mensaje es obligatorio");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendNotificacion({
        clienteIds: selectedClientes.length > 0 ? selectedClientes : undefined,
        emailsManuales: emailsManuales.length > 0 ? emailsManuales : undefined,
        roleCcId: roleCcId || undefined,
        asunto,
        cuerpoHtml,
        adjuntos: adjuntos.length > 0 ? adjuntos : undefined,
        programadoAt: programadoAt || undefined,
      });

      if (result.success) {
        const message = result.scheduled
          ? `Notificación programada para ${programadoAt ? new Date(programadoAt).toLocaleString() : 'envío futuro'}`
          : `Notificación en cola para envío inmediato a ${result.destinatarios} destinatario(s)${
              result.cc ? ` y ${result.cc} en CC` : ""
            }`;
        
        setSuccess(message);
        // Reset form
        setSelectedClientes([]);
        setSelectAllClientes(false);
        setEmailsManuales([]);
        setRoleCcId("");
        setAsunto("");
        setCuerpoHtml("<p></p>");
        setAdjuntos([]);
        setProgramadoAt("");
        // Reload history
        const historialData = await listNotificaciones();
        setHistorial(historialData);
      } else {
        setError(result.error || "Error al enviar notificación");
      }
    } catch (e: any) {
      setError(e?.message ?? "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  const filteredClientes = clientes.filter(
    (c) =>
      c.codigo.toLowerCase().includes(searchCliente.toLowerCase()) ||
      (c.descripcion || "").toLowerCase().includes(searchCliente.toLowerCase())
  );

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Notificaciones Masivas</div>
        <button className="btn icon" onClick={load} disabled={loading} title="Refrescar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "12px", background: "#D1FAE5", color: "#059669", borderRadius: "8px", marginBottom: "16px" }}>
          {success}
        </div>
      )}

       <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "24px" }}>
        {/* Form Column */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>
            Crear Notificación
          </h2>

          <form onSubmit={handleSend}>
            {/* Para: Seleccionar Clientes */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                Para (Clientes)
              </label>
              
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  className="input"
                  placeholder="Buscar cliente..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={handleSelectAllClientes}
                  style={{ 
                    background: selectAllClientes ? "var(--accent)" : "var(--panel)",
                    color: selectAllClientes ? "white" : "var(--text)"
                  }}
                >
                  {selectAllClientes ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
              </div>

              <div
                style={{
                  maxHeight: "150px",
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "8px",
                }}
              >
                {loading ? (
                  <div className="small">Cargando...</div>
                ) : filteredClientes.length === 0 ? (
                  <div className="small" style={{ color: "var(--muted)" }}>No hay clientes</div>
                ) : (
                  filteredClientes.map((c) => (
                    <label
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        background: selectedClientes.includes(c.id) ? "var(--accent)" : "transparent",
                        color: selectedClientes.includes(c.id) ? "white" : "var(--text)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClientes.includes(c.id)}
                        onChange={() => toggleCliente(c.id)}
                      />
                      <span style={{ fontWeight: 500 }}>{c.codigo}</span>
                      {c.descripcion && (
                        <span style={{ fontSize: "12px", opacity: 0.8 }}>
                          - {c.descripcion}
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
              {selectedClientes.length > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)" }}>
                  {selectedClientes.length} cliente(s) seleccionado(s)
                </div>
              )}
            </div>

            {/* Emails Manuales */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                Emails adicionales
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  className="input"
                  placeholder="email@ejemplo.com"
                  value={emailManual}
                  onChange={(e) => setEmailManual(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addManualEmail();
                    }
                  }}
                />
                <button type="button" className="btn" onClick={addManualEmail}>
                  Agregar
                </button>
              </div>
              {emailsManuales.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                  {emailsManuales.map((email) => (
                    <span
                      key={email}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        background: "var(--bg)",
                        borderRadius: "16px",
                        fontSize: "13px",
                      }}
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeManualEmail(email)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: "16px",
                          lineHeight: 1,
                          color: "var(--danger)",
                        }}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CC: Rol */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                CC (Rol)
              </label>
              <select
                className="input"
                value={roleCcId}
                onChange={(e) => setRoleCcId(e.target.value)}
              >
                <option value="">Sin CC</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.codigo} - {r.nombre}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                Todos los agentes con este rol recibirán copia
              </div>
            </div>

            {/* Asunto */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                Asunto
              </label>
              <input
                className="input"
                placeholder="Asunto del correo"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
              />
            </div>

            {/* Cuerpo (WYSIWYG) */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: 500 }}>
                  Cuerpo del mensaje
                </label>
                <TemplateSelector
                  context={wildcardContext}
                  onSelect={handleTemplateSelect}
                  buttonLabel="Usar Plantilla"
                  buttonStyle={{ padding: "6px 12px", fontSize: 12 }}
                />
              </div>
              <TipTapEditor content={cuerpoHtml} onChange={setCuerpoHtml} />
            </div>

            {/* Adjuntos */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                Adjuntos
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileAttach}
                style={{ marginBottom: "8px" }}
              />
              {adjuntos.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {adjuntos.map((adjunto, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px",
                        background: "var(--bg)",
                        borderRadius: "4px",
                        fontSize: "13px",
                      }}
                    >
                      <span>{adjunto.nombre} ({Math.round(adjunto.datos.length * 0.75 / 1024)}KB)</span>
                      <button
                        type="button"
                        onClick={() => removeAdjunto(index)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--danger)",
                          fontSize: "16px",
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Programar envío */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                Programar envío (opcional)
              </label>
              <input
                type="datetime-local"
                className="input"
                value={programadoAt}
                onChange={(e) => setProgramadoAt(e.target.value)}
                min={getMinDateTime()}
              />
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                Deje vacío para enviar inmediatamente
              </div>
            </div>

            <button className="btn primary" type="submit" disabled={sending} style={{ width: "100%" }}>
              {sending ? "Enviando..." : (programadoAt ? "Programar Notificación" : "Enviar Notificación")}
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>
            Historial de Envíos
          </h2>

          {loading ? (
            <div className="small">Cargando...</div>
          ) : historial.length === 0 ? (
            <div className="small" style={{ color: "var(--muted)" }}>No hay notificaciones enviadas</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {historial.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onClick={() => setSelectedNotification(n)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 500 }}>{n.asunto}</span>
                    <span
                      style={{
                        fontSize: "12px",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background:
                          n.estado === "ENVIADO"
                            ? "#D1FAE5"
                            : n.estado === "ERROR"
                            ? "#FEE2E2"
                            : n.estado === "PROGRAMADO"
                            ? "#DBEAFE"
                            : n.estado === "PENDIENTE"
                            ? "#FEF3C7"
                            : n.estado === "ENVIANDO"
                            ? "#E0F2FE"
                            : "#FEF3C7",
                        color:
                          n.estado === "ENVIADO"
                            ? "#059669"
                            : n.estado === "ERROR"
                            ? "#DC2626"
                            : n.estado === "PROGRAMADO"
                            ? "#1E40AF"
                            : n.estado === "PENDIENTE"
                            ? "#92400E"
                            : n.estado === "ENVIANDO"
                            ? "#0369A1"
                            : "#B45309",
                      }}
                    >
                      {n.estado}
                    </span>
                  </div>
                   <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                     <div>Por: {n.agente.nombre}</div>
                     <div>Fecha creación: {new Date(n.createdAt).toLocaleString()}</div>
                     {n.programadoAt && <div>Programado para: {new Date(n.programadoAt).toLocaleString()}</div>}
                     <div>
                       Enviados: {n.enviados} | Errores: {n.errores}
                     </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onReschedule={handleReschedule}
      />
    </div>
  );
}