import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TipTapEditor from "../components/TipTapEditor";
import { Icon } from "../components/Icon";
import {
  getTarea,
  getTareaTimeline,
  updateTarea,
  asignarTarea,
  cerrarTarea,
  addComentarioTarea,
  listAgentes,
  listEstadosTarea,
  listPrioridadesTarea,
  listTiposTarea,
  listModulos,
  listReleases,
  getCliente,
  listContactos,
  listClienteSoftware,
  listClienteConexiones,
  listUsuariosCliente,
  listUnidades,
  listClienteCentrosTrabajo,
  listClienteReleasesPlan,
  listClienteComentarios,
  Tarea,
  TareaEvento,
  Agente,
  EstadoTarea,
  PrioridadTarea,
  TipoTarea,
  Modulo,
  Release,
  Cliente,
} from "../lib/api";



const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  ACEPTADA: { bg: "#DBEAFE", text: "#1D4ED8" },
  RESUELTA: { bg: "#D1FAE5", text: "#059669" },
  PENDIENTE_VALIDACION: { bg: "#FEF3C7", text: "#D97706" },
  CERRADA: { bg: "#E5E7EB", text: "#4B5563" },
  PETICION: { bg: "#EDE9FE", text: "#7C3AED" },
};

const PRIORIDAD_COLORS: Record<string, { bg: string; text: string }> = {
  BAJA: { bg: "#E5E7EB", text: "#4B5563" },
  NORMAL: { bg: "#DBEAFE", text: "#1D4ED8" },
  ALTA: { bg: "#FEE2E2", text: "#DC2626" },
  CRITICA: { bg: "#DC2626", text: "#FFFFFF" },
};

const EVENTO_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  MENSAJE_CLIENTE: { bg: "#FEF3C7", border: "#FDE68A", icon: "💬" },
  RESPUESTA_AGENTE: { bg: "#DBEAFE", border: "#93C5FD", icon: "💬" },
  NOTA_INTERNA: { bg: "#F3F4F6", border: "#D1D5DB", icon: "📝" },
  CAMBIO_ESTADO: { bg: "#EDE9FE", border: "#C4B5FD", icon: "🔄" },
  ASIGNACION: { bg: "#D1FAE5", border: "#6EE7B7", icon: "👤" },
  CAMBIO_PRIORIDAD: { bg: "#FEE2E2", border: "#FECACA", icon: "⚡" },
  CAMBIO_TIPO: { bg: "#E0E7FF", border: "#A5B4FC", icon: "🏷️" },
  CAMBIO_MODULO: { bg: "#FCE7F3", border: "#F9A8D4", icon: "📦" },
  CAMBIO_RELEASE_HOTFIX: { bg: "#CCFBF1", border: "#5EEAD4", icon: "🚀" },
  SISTEMA: { bg: "#F3F4F6", border: "#D1D5DB", icon: "⚙️" },
};

function Badge({ codigo, label, colorMap, prioridad, estado }: {
  codigo?: string;
  label?: string;
  colorMap?: Record<string, { bg: string; text: string }>;
  prioridad?: { codigo: string; color?: string };
  estado?: { codigo: string }
}) {
  // Use priority color if available, otherwise fall back to colorMap
  let colors;
  if (prioridad?.color) {
    colors = { bg: prioridad.color, text: "#FFFFFF" }; // White text on colored background
  } else if (colorMap) {
    colors = colorMap[codigo ?? ""] ?? { bg: "#E5E7EB", text: "#4B5563" };
  } else {
    colors = { bg: "#E5E7EB", text: "#4B5563" };
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {prioridad?.codigo ?? estado?.codigo ?? label ?? codigo ?? "-"}
    </span>
  );
}

// Cliente Popup Component - Full read-only view of client data
function ClientePopup({ clienteId, onClose }: { clienteId: string; onClose: () => void }) {
  const [cliente, setCliente] = React.useState<any>(null);
  const [unidades, setUnidades] = React.useState<any[]>([]);
  const [usuarios, setUsuarios] = React.useState<any[]>([]);
  const [software, setSoftware] = React.useState<any[]>([]);
  const [contactos, setContactos] = React.useState<any[]>([]);
  const [conexiones, setConexiones] = React.useState<any[]>([]);
  const [centrosTrabajo, setCentrosTrabajo] = React.useState<any[]>([]);
  const [releasesPlan, setReleasesPlan] = React.useState<any[]>([]);
  const [comentarios, setComentarios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tabLoading, setTabLoading] = React.useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = React.useState("general");

  // Get highlighted comment
  const comentarioDestacado = comentarios.find((c) => c.destacado);

  // Get current release from releases plan
  const currentReleasePlan = releasesPlan.find((r) => r.estado === "INSTALADO");

  React.useEffect(() => {
    async function load() {
      try {
        // Load basic client data and comentarios at startup to show highlighted comment
        const [clienteData, comentariosData, releasesData] = await Promise.all([
          getCliente(clienteId),
          listClienteComentarios(clienteId),
          listClienteReleasesPlan(clienteId),
        ]);
        setCliente(clienteData);
        setComentarios(comentariosData);
        setReleasesPlan(releasesData);
      } catch (e) {
        console.error("Error loading cliente:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clienteId]);

  // Load tab data when switching tabs
  React.useEffect(() => {
    async function loadTabData() {
      if (activeTab === "general" || !clienteId) return;

      const dataLoaders: Record<string, { check: any[]; loader: () => Promise<any>; setter: (data: any) => void }> = {
        unidades: { check: unidades, loader: () => listUnidades(clienteId), setter: setUnidades },
        usuarios: { check: usuarios, loader: () => listUsuariosCliente(clienteId), setter: setUsuarios },
        software: { check: software, loader: () => listClienteSoftware(clienteId), setter: setSoftware },
        contactos: { check: contactos, loader: () => listContactos(clienteId), setter: setContactos },
        conexiones: { check: conexiones, loader: () => listClienteConexiones(clienteId), setter: setConexiones },
        centros: { check: centrosTrabajo, loader: () => listClienteCentrosTrabajo(clienteId), setter: setCentrosTrabajo },
        releases: { check: releasesPlan, loader: () => listClienteReleasesPlan(clienteId), setter: setReleasesPlan },
        comentarios: { check: comentarios, loader: () => listClienteComentarios(clienteId), setter: setComentarios },
      };

      const config = dataLoaders[activeTab];
      if (config && config.check.length === 0) {
        setTabLoading((prev) => ({ ...prev, [activeTab]: true }));
        try {
          const data = await config.loader();
          config.setter(data);
        } catch (e) {
          console.error(`Error loading ${activeTab}:`, e);
        } finally {
          setTabLoading((prev) => ({ ...prev, [activeTab]: false }));
        }
      }
    }
    loadTabData();
  }, [activeTab, clienteId]);

  if (loading) {
    return (
      <div className="modalOverlay" onClick={onClose}>
        <div className="modalCard" style={{ width: "95vw", maxWidth: 1200, maxHeight: "95vh" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: 24, textAlign: "center" }}>Cargando...</div>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="modalOverlay" onClick={onClose}>
        <div className="modalCard" style={{ width: "95vw", maxWidth: 1200 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: 24, textAlign: "center", color: "var(--danger)" }}>Error al cargar cliente</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General", icon: "📋" },
    { id: "unidades", label: "UCs", icon: "🏨" },
    { id: "usuarios", label: "Usuarios", icon: "👤" },
    { id: "software", label: "Software", icon: "💻" },
    { id: "contactos", label: "Contactos", icon: "👥" },
    { id: "conexiones", label: "Conexiones", icon: "🔌" },
    { id: "centros", label: "Centros Trabajo", icon: "🏢" },
    { id: "releases", label: "Releases", icon: "📦" },
    { id: "comentarios", label: "Comentarios", icon: "📝" },
  ];

  const currentReleaseLabel = currentReleasePlan
    ? `${currentReleasePlan.release?.codigo || ""}${currentReleasePlan.hotfix ? `-${currentReleasePlan.hotfix.codigo}` : ""}`
    : null;

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalCard"
        style={{ width: "95vw", maxWidth: 1200, height: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{cliente.descripcion || cliente.codigo}</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
                <span><strong>Código:</strong> {cliente.codigo}</span>
                <span><strong>Tipo Licencia:</strong> {cliente.licenciaTipo || "No definida"}</span>
                <span><strong>Jefe Proyecto 1:</strong> {cliente.jefeProyecto1 || "-"}</span>
                <span><strong>Jefe Proyecto 2:</strong> {cliente.jefeProyecto2 || "-"}</span>
                {currentReleaseLabel && (
                  <span style={{ padding: "2px 8px", background: "#4F46E5", color: "#fff", borderRadius: 4, fontSize: 12 }}>
                    {currentReleaseLabel}
                  </span>
                )}
              </div>
            </div>
            <button className="btn" onClick={onClose}>Cerrar</button>
          </div>

          {/* Highlighted Comment */}
          {comentarioDestacado && (
            <div style={{
              marginTop: 12,
              padding: "10px 16px",
              background: "#FEF3C7",
              borderLeft: "4px solid #F59E0B",
              borderRadius: 4,
              fontSize: 13,
            }}>
              <strong style={{ color: "#B45309" }}>Nota:</strong> {comentarioDestacado.texto}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", padding: "0 24px", overflowX: "auto", flexShrink: 0 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--accent)" : "var(--text)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: 13,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* General Tab */}
          {activeTab === "general" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
              <div className="card" style={{ padding: 16 }}>
                <div className="label" style={{ marginBottom: 8, fontWeight: 600, color: "var(--accent)" }}>Información General</div>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  <div><strong>Código:</strong> {cliente.codigo}</div>
                  <div><strong>Descripción:</strong> {cliente.descripcion || "-"}</div>
                  <div><strong>Tipo Licencia:</strong> {cliente.licenciaTipo || "No definida"}</div>
                </div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div className="label" style={{ marginBottom: 8, fontWeight: 600, color: "var(--accent)" }}>Jefes de Proyecto</div>
                <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                  <div><strong>Jefe Proyecto 1:</strong> {cliente.jefeProyecto1 || "-"}</div>
                  <div><strong>Jefe Proyecto 2:</strong> {cliente.jefeProyecto2 || "-"}</div>
                </div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div className="label" style={{ marginBottom: 8, fontWeight: 600, color: "var(--accent)" }}>Release Actual</div>
                <div style={{ fontSize: 13 }}>
                  {currentReleasePlan ? (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#4F46E5" }}>{currentReleaseLabel}</div>
                      <div className="small" style={{ marginTop: 4 }}>Instalado: {formatDate(currentReleasePlan.fechaInstalada)}</div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>Sin release instalado</span>
             )}
         </div>
            </div>
          )}

          {/* Unidades Tab */}
          {activeTab === "unidades" && (
            <div>
              {tabLoading.unidades && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
              {!tabLoading.unidades && unidades.length === 0 && <div className="small" style={{ color: "var(--muted)" }}>Sin unidades comerciales</div>}
              {unidades.length > 0 && (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Scope</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidades.map((u: any) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.codigo}</td>
                        <td>{u.descripcion || "-"}</td>
                        <td>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: u.scope === "CENTRAL" ? "#DBEAFE" : u.scope === "TODOS" ? "#D1FAE5" : "#FEF3C7",
                            color: u.scope === "CENTRAL" ? "#1D4ED8" : u.scope === "TODOS" ? "#059669" : "#D97706",
                          }}>
                            {u.scope}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            background: u.activo ? "#D1FAE5" : "#FEE2E2",
                            color: u.activo ? "#059669" : "#DC2626",
                          }}>
                            {u.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Usuarios Tab */}
          {activeTab === "usuarios" && (
            <div>
              {tabLoading.usuarios && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
              {!tabLoading.usuarios && usuarios.length === 0 && <div className="small" style={{ color: "var(--muted)" }}>Sin usuarios</div>}
              {usuarios.length > 0 && (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Tipo</th>
                      <th>Notificaciones</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u: any) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 500 }}>{u.nombre}</td>
                        <td><code style={{ fontSize: 11 }}>{u.usuario}</code></td>
                        <td>{u.email || "-"}</td>
                        <td>{u.telefono || "-"}</td>
                        <td>{u.tipo || "-"}</td>
                        <td>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            background: u.recibeNotificaciones ? "#D1FAE5" : "#E5E7EB",
                            color: u.recibeNotificaciones ? "#059669" : "#6B7280",
                          }}>
                            {u.recibeNotificaciones ? "Sí" : "No"}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            background: u.activo ? "#D1FAE5" : "#FEE2E2",
                            color: u.activo ? "#059669" : "#DC2626",
                          }}>
                            {u.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Software Tab */}
          {activeTab === "software" && (
            <div>
              {tabLoading.software && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
              {!tabLoading.software && software.length === 0 && <div className="small" style={{ color: "var(--muted)" }}>Sin software</div>}
              {software.length > 0 && (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Versión</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {software.map((s: any) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.nombre}</td>
                        <td>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: s.tipo === "PMS" ? "#DBEAFE" : s.tipo === "ERP" ? "#EDE9FE" : s.tipo === "PERIFERIA" ? "#FEF3C7" : "#E5E7EB",
                            color: s.tipo === "PMS" ? "#1D4ED8" : s.tipo === "ERP" ? "#7C3AED" : s.tipo === "PERIFERIA" ? "#D97706" : "#4B5563",
                          }}>
                            {s.tipo}
                          </span>
                        </td>
                        <td>{s.version || "-"}</td>
                        <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>{s.notas || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Contactos Tab */}
          {activeTab === "contactos" && (
            <div>
              {tabLoading.contactos && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
              {!tabLoading.contactos && contactos.length === 0 && <div className="small" style={{ color: "var(--muted)" }}>Sin contactos</div>}
              {contactos.length > 0 && (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Cargo</th>
                      <th>Email</th>
                      <th>Móvil</th>
                      <th>Principal</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactos.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                        <td>{c.cargo || "-"}</td>
                        <td>{c.email || "-"}</td>
                        <td>{c.movil || "-"}</td>
                        <td>
                          {c.principal && (
                            <span style={{ padding: "2px 6px", background: "var(--accent)", color: "#fff", borderRadius: 4, fontSize: 10 }}>
                              Principal
                            </span>
                          )}
                        </td>
                        <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{c.notas || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Conexiones Tab */}
          {activeTab === "conexiones" && (
            <div>
              {tabLoading.conexiones && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
              {!tabLoading.conexiones && conexiones.length === 0 && <div className="small" style={{ color: "var(--muted)" }}>Sin conexiones</div>}
              {conexiones.length > 0 && (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Endpoint</th>
                      <th>Usuario</th>
                      <th>Contraseña</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conexiones.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                        <td><code style={{ fontSize: 11 }}>{c.endpoint || "-"}</code></td>
                        <td>{c.usuario || "-"}</td>
                        <td>
                          {c.secretRef ? (
                            <code style={{ fontSize: 11, background: "#F3F4F6", padding: "2px 6px", borderRadius: 4 }}>{c.secretRef}</code>
                          ) : "-"}
                        </td>
                        <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{c.notas || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Centros Trabajo Tab */}
          {activeTab === "centros" && (
            <div>
              {tabLoading.centros && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
              {!tabLoading.centros && centrosTrabajo.length === 0 && <div className="small" style={{ color: "var(--muted)" }}>Sin centros de trabajo</div>}
              {centrosTrabajo.length > 0 && (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Base de Datos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centrosTrabajo.map((ct: any) => (
                      <tr key={ct.id}>
                        <td style={{ fontWeight: 500 }}>{ct.nombre}</td>
                        <td><code style={{ fontSize: 11 }}>{ct.baseDatos || "-"}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Releases Tab */}
          {activeTab === "releases" && (
            <div>
              {tabLoading.releases && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
              {!tabLoading.releases && releasesPlan.length === 0 && <div className="small" style={{ color: "var(--muted)" }}>Sin releases planificados</div>}
              {releasesPlan.length > 0 && (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Release</th>
                      <th>Hotfix</th>
                      <th>Estado</th>
                      <th>Fecha Prevista</th>
                      <th>Fecha Instalada</th>
                      <th>Agente</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releasesPlan.map((rp: any) => (
                      <tr key={rp.id}>
                        <td style={{ fontWeight: 600 }}>{rp.release?.codigo || "-"}</td>
                        <td>{rp.hotfix?.codigo || "-"}</td>
                        <td>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: rp.estado === "INSTALADO" ? "#D1FAE5" : rp.estado === "PLANIFICADO" ? "#DBEAFE" : rp.estado === "EN_CURSO" ? "#FEF3C7" : "#FEE2E2",
                            color: rp.estado === "INSTALADO" ? "#059669" : rp.estado === "PLANIFICADO" ? "#1D4ED8" : rp.estado === "EN_CURSO" ? "#D97706" : "#DC2626",
                          }}>
                            {rp.estado}
                          </span>
                        </td>
                        <td>{formatDate(rp.fechaPrevista)}</td>
                        <td>{formatDate(rp.fechaInstalada)}</td>
                        <td>{rp.agente?.nombre || "-"}</td>
                        <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{rp.detalle || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Comentarios Tab */}
          {activeTab === "comentarios" && (
            <div>
              {tabLoading.comentarios && <div style={{ textAlign: "center", padding: 16 }}>Cargando...</div>}
              {!tabLoading.comentarios && comentarios.length === 0 && <div className="small" style={{ color: "var(--muted)" }}>Sin comentarios</div>}
              {comentarios.map((c: any) => (
                <div
                  key={c.id}
                  style={{
                    padding: 16,
                    border: c.destacado ? "2px solid #F59E0B" : "1px solid var(--border)",
                    borderRadius: 8,
                    marginBottom: 12,
                    background: c.destacado ? "#FFFBEB" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      <strong>{c.agente?.nombre || "Agente"}</strong> · {new Date(c.createdAt).toLocaleString("es-ES")}
                    </div>
                    {c.destacado && (
                      <span style={{ padding: "2px 8px", background: "#F59E0B", color: "#fff", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        ⭐ Destacado
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14 }}>{c.texto}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Comment Editor Modal
function CommentEditorModal({
  initialContent,
  initialType,
  onSave,
  onClose,
  isEditing,
  tarea,
  agentes,
  timeline,
}: {
  initialContent: string;
  initialType: "RESPUESTA_AGENTE" | "NOTA_INTERNA";
   onSave: (content: string, type: "RESPUESTA_AGENTE" | "NOTA_INTERNA") => void;
  onClose: () => void;
  isEditing: boolean;
  tarea: Tarea | null;
  agentes: Agente[];
  timeline: TareaEvento[];
}) {
  const [content, setContent] = React.useState(initialContent);
  const [commentType, setCommentType] = React.useState(initialType);
  const [selectedNotifyAgents, setSelectedNotifyAgents] = React.useState<string[]>([]);

  // Get involved agents (Jefe Proyecto 1, Jefe Proyecto 2, assigned, agents from previous comments)
  const involvedAgents = React.useMemo(() => {
    const involvedSet = new Set<string>();
    const involvedList: { id: string; nombre: string; reason: string }[] = [];

    // Assigned agent
    if (tarea?.asignadoA) {
      if (!involvedSet.has(tarea.asignadoA.id)) {
        involvedSet.add(tarea.asignadoA.id);
        involvedList.push({ id: tarea.asignadoA.id, nombre: tarea.asignadoA.nombre, reason: "Asignado" });
      }
    }

    // Agents from previous comments/events
    if (timeline) {
      for (const event of timeline) {
        if (event.creadoPorAgenteId && !involvedSet.has(event.creadoPorAgenteId)) {
          const agente = agentes.find((a) => a.id === event.creadoPorAgenteId);
          if (agente) {
            involvedSet.add(agente.id);
            involvedList.push({ id: agente.id, nombre: agente.nombre, reason: "Comentó anteriormente" });
          }
        }
      }
    }

    return involvedList;
  }, [tarea, timeline, agentes]);

  // Available agents to add (exclude already involved)
  const availableAgents = React.useMemo(() => {
    const involvedIds = new Set(involvedAgents.map((a) => a.id));
    return agentes.filter((a) => !involvedIds.has(a.id));
  }, [agentes, involvedAgents]);

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalCard"
        style={{ width: "95vw", maxWidth: "95vw", height: "95vh", maxHeight: "95vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
          <div className="h1" style={{ fontSize: 18 }}>{isEditing ? "Editar Comentario" : "Nuevo Comentario"}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Tarea #{tarea?.numero} - {tarea?.cliente?.codigo}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Main content area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                  <input
                    type="radio"
                    name="commentType"
                    checked={commentType === "RESPUESTA_AGENTE"}
                    onChange={() => setCommentType("RESPUESTA_AGENTE")}
                  />
                  <span>Respuesta al cliente</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                  <input
                    type="radio"
                    name="commentType"
                    checked={commentType === "NOTA_INTERNA"}
                    onChange={() => setCommentType("NOTA_INTERNA")}
                  />
                  <span>Nota interna</span>
                </label>
              </div>
            </div>

            <div style={{ flex: 1, padding: 20, overflow: "auto", minHeight: "400px" }}>
              <TipTapEditor content={content} onChange={setContent} />
            </div>
          </div>

          {/* Right sidebar - Agents */}
          <div style={{ width: 240, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
            {/* Involved agents */}
            <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--muted)" }}>AGENTES INVOLUCRADOS</div>
              {tarea?.cliente?.jefeProyecto1 && (
                <div style={{ fontSize: 11, padding: "4px 0", display: "flex", justifyContent: "space-between" }}>
                  <span>{tarea.cliente.jefeProyecto1}</span>
                  <span style={{ color: "var(--muted)", fontSize: 10 }}>JP1</span>
                </div>
              )}
              {tarea?.cliente?.jefeProyecto2 && (
                <div style={{ fontSize: 11, padding: "4px 0", display: "flex", justifyContent: "space-between" }}>
                  <span>{tarea.cliente.jefeProyecto2}</span>
                  <span style={{ color: "var(--muted)", fontSize: 10 }}>JP2</span>
                </div>
              )}
              {involvedAgents.map((a) => (
                <div key={a.id} style={{ fontSize: 11, padding: "4px 0", display: "flex", justifyContent: "space-between" }}>
                  <span>{a.nombre}</span>
                  <span style={{ color: "var(--muted)", fontSize: 10 }}>{a.reason}</span>
                </div>
              ))}
              {!tarea?.cliente?.jefeProyecto1 && !tarea?.cliente?.jefeProyecto2 && involvedAgents.length === 0 && (
                <div style={{ fontSize: 11, color: "var(--muted)" }}>Sin agentes involucrados</div>
              )}
            </div>

            {/* Add agents to notify */}
            <div style={{ flex: 1, padding: 12, overflow: "auto" }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--muted)" }}>NOTIFICAR TAMBIÉN A</div>
              {availableAgents.length > 0 ? (
                <select
                  multiple
                  className="input"
                  style={{
                    width: "100%",
                    height: "120px",
                    fontSize: "11px",
                    padding: "4px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    background: "white"
                  }}
                  value={selectedNotifyAgents}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedNotifyAgents(selectedOptions);
                  }}
                >
                  {availableAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: 11, color: "var(--muted)" }}>Todos los agentes ya están involucrados</div>
              )}
              {selectedNotifyAgents.length > 0 && (
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                  {selectedNotifyAgents.length} agente{selectedNotifyAgents.length !== 1 ? 's' : ''} seleccionado{selectedNotifyAgents.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {selectedNotifyAgents.length > 0 && (
              <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", fontSize: 11, color: "#3B82F6" }}>
                {selectedNotifyAgents.length} agente(s) seleccionado(s)
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
             onClick={() => onSave(content, commentType)}
            disabled={!content.trim() || content === "<p></p>"}
          >
            {isEditing ? "Guardar" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TareaFicha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tarea, setTarea] = React.useState<Tarea | null>(null);
  const [timeline, setTimeline] = React.useState<TareaEvento[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Lookups
  const [agentes, setAgentes] = React.useState<Agente[]>([]);
  const [estados, setEstados] = React.useState<EstadoTarea[]>([]);
  const [prioridades, setPrioridades] = React.useState<PrioridadTarea[]>([]);
  const [tipos, setTipos] = React.useState<TipoTarea[]>([]);
  const [modulos, setModulos] = React.useState<Modulo[]>([]);
  const [releases, setReleases] = React.useState<Release[]>([]);

  // Edit mode
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState<any>({});
  const [saving, setSaving] = React.useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [selectedAgente, setSelectedAgente] = React.useState<string>("");

  // Cliente popup
  const [showClientePopup, setShowClientePopup] = React.useState(false);

  // Task info panel collapsed state
  const [infoExpanded, setInfoExpanded] = React.useState(false);

   // Comments
   const [selectedComment, setSelectedComment] = React.useState<TareaEvento | null>(null);
   const [showCommentEditor, setShowCommentEditor] = React.useState(false);
   const [submittingComment, setSubmittingComment] = React.useState(false);
   const [commentsOrderAsc, setCommentsOrderAsc] = React.useState(false); // false = newest first (DESC)

  async function loadLookups() {
    try {
      const [agentesData, estadosData, prioridadesData, tiposData, modulosData, releasesData] = await Promise.all([
        listAgentes(),
        listEstadosTarea(),
        listPrioridadesTarea(),
        listTiposTarea(),
        listModulos(),
        listReleases(),
      ]);
      setAgentes(agentesData);
      setEstados(estadosData);
      setPrioridades(prioridadesData);
      setTipos(tiposData);
      setModulos(modulosData);
      setReleases(releasesData);
    } catch (e) {
      console.error("Error loading lookups:", e);
    }
  }

  async function loadTarea() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [tareaData, timelineData] = await Promise.all([
        getTarea(id),
        getTareaTimeline(id, true),
      ]);
      setTarea(tareaData);
      setTimeline(timelineData);
      setEditForm({
        titulo: tareaData.titulo,
        estadoId: tareaData.estadoId,
        prioridadId: tareaData.prioridadId,
        tipoId: tareaData.tipoId,
        moduloId: tareaData.moduloId || "",
        releaseId: tareaData.releaseId || "",
        hotfixId: tareaData.hotfixId || "",
        reproducido: tareaData.reproducido,
      });
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar la tarea");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadLookups();
    loadTarea();
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateTarea(id, {
        titulo: editForm.titulo,
        estadoId: editForm.estadoId || undefined,
        prioridadId: editForm.prioridadId || undefined,
        tipoId: editForm.tipoId || undefined,
        moduloId: editForm.moduloId || undefined,
        releaseId: editForm.releaseId || undefined,
        hotfixId: editForm.hotfixId || undefined,
        reproducido: editForm.reproducido,
      });
      setTarea(updated);
      setEditing(false);
      const timelineData = await getTareaTimeline(id, true);
      setTimeline(timelineData);
    } catch (e: any) {
      alert(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign() {
    if (!id || !selectedAgente) return;
    setSaving(true);
    try {
      const updated = await asignarTarea(id, selectedAgente);
      setTarea(updated);
      setShowAssignModal(false);
      setSelectedAgente("");
      const timelineData = await getTareaTimeline(id, true);
      setTimeline(timelineData);
    } catch (e: any) {
      alert(e?.message ?? "Error al asignar");
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    if (!id) return;
    if (!confirm("¿Está seguro de cerrar esta tarea?")) return;
    setSaving(true);
    try {
      const updated = await cerrarTarea(id);
      setTarea(updated);
      const timelineData = await getTareaTimeline(id, true);
      setTimeline(timelineData);
    } catch (e: any) {
      alert(e?.message ?? "Error al cerrar");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(content: string, tipo: "RESPUESTA_AGENTE" | "NOTA_INTERNA") {
    if (!id || !content.trim()) return;
    setSubmittingComment(true);
    try {
       const updatedTimeline = await addComentarioTarea(id, {
         tipo,
         cuerpo: content.trim(),
       });
      setTimeline(updatedTimeline);
      setShowCommentEditor(false);
    } catch (e: any) {
      alert(e?.message ?? "Error al agregar comentario");
    } finally {
      setSubmittingComment(false);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const selectedRelease = releases.find((r) => r.id === editForm.releaseId);
  const availableHotfixes = selectedRelease?.hotfixes || [];
  const isClosed = !!tarea?.closedAt;

  // Filter comments (MENSAJE_CLIENTE, RESPUESTA_AGENTE, NOTA_INTERNA)
  const comments = timeline.filter((e) =>
    ["MENSAJE_CLIENTE", "RESPUESTA_AGENTE", "NOTA_INTERNA"].includes(e.tipo)
  );

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <div style={{ fontSize: "16px", color: "#6B7280" }}>Cargando...</div>
      </div>
    );
  }

  if (error || !tarea) {
    return (
      <div className="grid">
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error ?? "Tarea no encontrada"}</div>
          <button className="btn" onClick={() => navigate("/")}>Volver a tareas</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      overflow: "hidden"
    }}>
      {/* Compact Header - Single row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn" onClick={() => navigate("/")} style={{ padding: "4px 8px" }}>
            ← Volver
          </button>
          <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>
            #{tarea.numero}
          </span>
          <Badge estado={tarea.estado} />
          <Badge prioridad={tarea.prioridad} />
          {isClosed && (
            <span style={{
              padding: "2px 6px",
              backgroundColor: "#374151",
              color: "#fff",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600
            }}>
              CERRADA
            </span>
          )}
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text)",
            maxWidth: 300,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {tarea.titulo}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!isClosed && (
            <>
               <button className="btn" onClick={() => setEditing(!editing)} style={{ padding: "4px 8px", fontSize: 12 }}>
                 {editing ? "Cancelar" : "Editar"}
               </button>
               <button className="btn primary" onClick={handleClose} style={{ padding: "4px 8px", fontSize: 12 }}>
                 Cerrar Tarea
               </button>
            </>
          )}
        </div>
      </div>

      {/* Compact Task Info Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 16px",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        fontSize: 12
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div>
            <span className="label" style={{ marginRight: 4 }}>Cliente:</span>
            <strong>{tarea.cliente?.codigo}</strong>
            <button
              className="btn"
              style={{ padding: "1px 4px", fontSize: 9, marginLeft: 4, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => setShowClientePopup(true)}
              title="Ver ficha del cliente"
            >
              👁
            </button>
          </div>
          <div><span className="label">U.C.:</span> {tarea.unidadComercial?.codigo ?? "-"}</div>
          <div><span className="label">Módulo:</span> {tarea.modulo?.codigo ?? "-"}</div>
          <div>
            <span className="label">Asignado:</span>
            <span style={{ fontWeight: tarea.asignadoA ? 500 : 400, color: tarea.asignadoA ? "var(--text)" : "var(--muted)" }}>
              {tarea.asignadoA?.nombre ?? "Sin asignar"}
            </span>
          </div>
          <div><span className="label">Release:</span> {tarea.release?.codigo ?? "-"}{tarea.hotfix ? `/${tarea.hotfix.codigo}` : ""}</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>
          Creada: {new Date(tarea.createdAt).toLocaleDateString("es-ES")}
        </div>
      </div>

        {/* Inline Edit Form (when editing) */}
        {editing && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label" style={{ marginBottom: 2, fontSize: 11 }}>Título</div>
                  <input
                    className="input"
                    style={{ padding: "4px 8px", fontSize: 13 }}
                    value={editForm.titulo}
                    onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label" style={{ marginBottom: 2, fontSize: 11 }}>Estado</div>
                  <select
                    className="input"
                    style={{ padding: "4px 8px", fontSize: 13 }}
                    value={editForm.estadoId || ""}
                    onChange={(e) => setEditForm({ ...editForm, estadoId: e.target.value })}
                  >
                    <option value="">Sin estado</option>
                    {estados.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.codigo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label" style={{ marginBottom: 2, fontSize: 11 }}>Prioridad</div>
                  <select
                    className="input"
                    style={{ padding: "4px 8px", fontSize: 13 }}
                    value={editForm.prioridadId || ""}
                    onChange={(e) => setEditForm({ ...editForm, prioridadId: e.target.value })}
                  >
                    {prioridades.map((p) => (
                      <option key={p.id} value={p.id}>{p.codigo}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label" style={{ marginBottom: 2, fontSize: 11 }}>Tipo</div>
                  <select
                    className="input"
                    style={{ padding: "4px 8px", fontSize: 13 }}
                    value={editForm.tipoId || ""}
                    onChange={(e) => setEditForm({ ...editForm, tipoId: e.target.value })}
                  >
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.codigo}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label" style={{ marginBottom: 2, fontSize: 11 }}>Módulo</div>
                  <select
                    className="input"
                    style={{ padding: "4px 8px", fontSize: 13 }}
                    value={editForm.moduloId || ""}
                    onChange={(e) => setEditForm({ ...editForm, moduloId: e.target.value })}
                  >
                    <option value="">Sin módulo</option>
                    {modulos.map((m) => (
                      <option key={m.id} value={m.id}>{m.codigo}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label" style={{ marginBottom: 2, fontSize: 11 }}>Release</div>
                  <select
                    className="input"
                    style={{ padding: "4px 8px", fontSize: 13 }}
                    value={editForm.releaseId || ""}
                    onChange={(e) => setEditForm({ ...editForm, releaseId: e.target.value, hotfixId: "" })}
                  >
                    <option value="">Sin release</option>
                    {releases.map((r) => (
                      <option key={r.id} value={r.id}>{r.codigo}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label" style={{ marginBottom: 2, fontSize: 11 }}>Hotfix</div>
                  <select
                    className="input"
                    style={{ padding: "4px 8px", fontSize: 13 }}
                    value={editForm.hotfixId || ""}
                    onChange={(e) => setEditForm({ ...editForm, hotfixId: e.target.value })}
                    disabled={!editForm.releaseId}
                  >
                    <option value="">Sin hotfix</option>
                    {availableHotfixes.map((h) => (
                      <option key={h.id} value={h.id}>{h.codigo}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0, display: "flex", alignItems: "flex-end" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={editForm.reproducido}
                      onChange={(e) => setEditForm({ ...editForm, reproducido: e.target.checked })}
                    />
                    <span>Reproducido</span>
                  </label>
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 6 }}>
                  <button className="btn primary" style={{ padding: "4px 12px", fontSize: 12 }} onClick={handleSave} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button className="btn" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => setEditing(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>


        )}

      {/* Comments section - Takes all remaining space */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg)"
      }}>
        {/* Comments Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          flexShrink: 0
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
            Comentarios ({comments.length})
          </div>
          {!isClosed && (
            <button className="btn primary" onClick={() => setShowCommentEditor(true)} style={{ padding: "6px 12px" }}>
              + Nuevo
            </button>
          )}
        </div>

        {/* Comments List - Takes available space, split with detail */}
        <div style={{
          flex: selectedComment ? 0.4 : 1,
          minHeight: 200,
          overflow: "auto",
          borderBottom: selectedComment ? "1px solid var(--border)" : "none",
          background: "var(--bg)"
        }}>
          {comments.length === 0 ? (
            <div style={{
              textAlign: "center",
              color: "var(--muted)",
              padding: 48,
              fontSize: 16
            }}>
              No hay comentarios en esta tarea
            </div>
          ) : (
            <div>
              {/* Debug info - compact */}
              <div style={{
                padding: "6px 16px",
                background: "#f8f9fa",
                fontSize: 11,
                borderBottom: "1px solid var(--border)"
              }}>
                <strong>Debug:</strong> {comments.length} comentarios |
                Tipos: {comments.map(c => c.tipo).join(', ')} |
                Orden: {commentsOrderAsc ? 'Antiguos primero' : 'Recientes primero'}
              </div>

              {/* Compact table */}
              <table className="table" style={{ fontSize: 13, margin: 0 }}>
                 <thead>
                    <tr>
                      <th
                        style={{
                          width: 40,
                          cursor: "pointer",
                          userSelect: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4
                        }}
                        onClick={() => setCommentsOrderAsc(!commentsOrderAsc)}
                        title="Cambiar orden"
                      >
                        #
                        <span style={{
                          fontSize: 10,
                          transform: commentsOrderAsc ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s"
                        }}>
                          ▲
                        </span>
                      </th>
                      <th style={{ width: 140 }}>Fecha/Hora</th>
                      <th style={{ width: 100 }}>Tipo</th>
                      <th>Relacionado</th>
                      <th>Descripción</th>
                    </tr>
                 </thead>
                   <tbody>
                     {(() => {
                       // Debug: Log comment types and order
                       console.log("Comments timeline:", comments.map(c => ({ tipo: c.tipo, createdAt: c.createdAt })));

                       // Always number chronologically (oldest = #1)
                       const chronologicalOrder = [...comments].reverse(); // API gives newest first, so reverse for chronological
                       console.log("Chronological order:", chronologicalOrder.map(c => c.tipo));

                       // Build relationship mapping: RESPUESTA_AGENTE relates to most recent MENSAJE_CLIENTE before it
                       const chronologicalRelationships = new Map<string, string>();
                       let lastClientMessageIndex = -1;

                       for (let i = 0; i < chronologicalOrder.length; i++) {
                         const evento = chronologicalOrder[i];
                         console.log(`Event ${i + 1}: ${evento.tipo}`);

                         if (evento.tipo === "MENSAJE_CLIENTE") {
                           lastClientMessageIndex = i;
                           console.log(`  Updated last client message index to ${i + 1}`);
                         } else if (evento.tipo === "RESPUESTA_AGENTE" && lastClientMessageIndex >= 0) {
                           chronologicalRelationships.set(evento.id, `#${lastClientMessageIndex + 1}`);
                           console.log(`  Set relationship: RESPUESTA_AGENTE -> MENSAJE_CLIENTE #${lastClientMessageIndex + 1}`);
                         }
                       }

                       console.log("Relationships found:", Array.from(chronologicalRelationships.entries()));

                       // Debug: Show relationships in UI
                       if (chronologicalRelationships.size > 0) {
                         console.log("Found relationships:", chronologicalRelationships.size);
                       } else {
                         console.log("No relationships found - check if there are RESPUESTA_AGENTE and MENSAJE_CLIENTE pairs");
                       }

                       // Create chronological number mapping for each event
                       const chronologicalNumbers = new Map<string, number>();
                       chronologicalOrder.forEach((evento, index) => {
                         chronologicalNumbers.set(evento.id, index + 1);
                       });

                       // Sort comments for display based on user preference
                       const displayComments = commentsOrderAsc
                         ? [...comments].reverse() // ASC: oldest first
                         : [...comments]; // DESC: newest first (default)

                       return displayComments.map((evento) => {
                         const colors = EVENTO_COLORS[evento.tipo] ?? EVENTO_COLORS.SISTEMA;
                         const isSelected = selectedComment?.id === evento.id;

                         // Always show chronological number (#1 = oldest)
                         const chronologicalNumber = chronologicalNumbers.get(evento.id) || 0;

                         // Get chronological relationship
                         const relatedTo = chronologicalRelationships.get(evento.id) || "";

                         return (
                           <tr
                             key={evento.id}
                             onClick={() => setSelectedComment(evento)}
                             style={{
                               cursor: "pointer",
                               backgroundColor: isSelected ? "var(--accent)" : "transparent",
                               color: isSelected ? "#fff" : "var(--text)",
                             }}
                           >
                             <td style={{ textAlign: "center", fontWeight: 600, color: "var(--muted)" }}>
                               {chronologicalNumber}
                             </td>
                             <td>
                               {formatDate(evento.createdAt)}
                             </td>
                             <td>
                               <span style={{
                                 display: "inline-flex",
                                 alignItems: "center",
                                 gap: 4,
                                 padding: "2px 6px",
                                 borderRadius: 4,
                                 background: isSelected ? "rgba(255,255,255,0.2)" : colors.bg,
                                 fontSize: 11,
                               }}>
                                 {colors.icon} {evento.tipo === "MENSAJE_CLIENTE" ? "Cliente" : evento.tipo === "RESPUESTA_AGENTE" ? "Agente" : "Interno"}
                               </span>
                             </td>
                             <td style={{ textAlign: "center", fontWeight: 600, color: relatedTo ? "var(--accent)" : "var(--muted)" }}>
                               {relatedTo || "-"}
                             </td>
                             <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                               {evento.cuerpo?.replace(/<[^>]*>/g, "").substring(0, 60)}...
                             </td>
                           </tr>
                         );
                        });
                     })()}
                   </tbody>
                 </table>
               </div>
             )}
           </div>

        {/* Selected Comment Detail - Large reading area */}
        {selectedComment ? (
          <div style={{
            flex: 0.6,
            minHeight: 300,
            overflow: "auto",
            background: "var(--bg)",
            padding: "20px"
          }}>
            {/* Comment Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "1px solid var(--border)"
            }}>
              <div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  {EVENTO_COLORS[selectedComment.tipo]?.icon}
                  {selectedComment.tipo.replace(/_/g, " ")}
                  {!selectedComment.visibleParaCliente && (
                    <span style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      backgroundColor: "#374151",
                      color: "#fff",
                      borderRadius: 4
                    }}>
                      Interno
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}>
                  <span>{formatDate(selectedComment.createdAt)}</span>
                  <span>#{chronologicalNumbers.get(selectedComment.id)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                {!isClosed && selectedComment.tipo !== "MENSAJE_CLIENTE" && (
                  <>
                    <button className="btn" style={{ padding: "6px 12px", fontSize: 12 }}>Editar</button>
                    <button className="btn" style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      backgroundColor: "var(--danger)",
                      color: "white",
                      border: "none"
                    }}>Eliminar</button>
                  </>
                )}
                {!isClosed && (
                  <button className="btn primary" style={{
                    padding: "6px 12px",
                    fontSize: 12
                  }} onClick={() => setShowCommentEditor(true)}>
                    Responder
                  </button>
                )}
              </div>
            </div>

            {/* Comment Content - Large, readable area */}
            <div
              className="comment-content"
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "var(--text)",
                overflowWrap: "break-word",
                wordWrap: "break-word",
                padding: "16px",
                backgroundColor: EVENTO_COLORS[selectedComment.tipo]?.bg ?? "#F8F9FA",
                border: `1px solid ${EVENTO_COLORS[selectedComment.tipo]?.border ?? "#E5E7EB"}`,
                borderRadius: 8,
                minHeight: 200
              }}
              dangerouslySetInnerHTML={{ __html: selectedComment.cuerpo ?? "" }}
            />

            <style>{`
              .comment-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .comment-content img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 12px 0;
                border-radius: 4px;
              }
              .comment-content p {
                margin: 8px 0;
              }
              .comment-content blockquote {
                border-left: 3px solid var(--accent);
                padding-left: 12px;
                margin: 12px 0;
                color: var(--muted);
                font-style: italic;
              }
            `}</style>

            {/* Notifications section */}
            <div style={{ marginTop: 16, padding: "12px", backgroundColor: "var(--bg-secondary)", borderRadius: 6, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
                NOTIFICACIONES ENVIADAS
              </div>
              <div style={{ fontSize: 12, color: "var(--text)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ color: "var(--muted)" }}>👥</span>
                  <span>Agentes: Ninguno</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--muted)" }}>👤</span>
                  <span>Usuarios del cliente: Ninguno</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, fontStyle: "italic" }}>
                  Sistema de notificaciones próximamente disponible
                </div>
              </div>
            </div>
          </div>
            ) : (
              <div style={{ padding: 16, textAlign: "center", color: "var(--muted)", border: "1px dashed var(--border)", borderRadius: 8 }}>
                Selecciona un comentario de la lista para ver el detalle
              </div>
            )}
          </div>
        </div>

      {/* Modals */}
      {showAssignModal && (
        <div className="modalOverlay" onClick={() => setShowAssignModal(false)}>
          <div className="modalCard" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="h1" style={{ marginBottom: 16 }}>Asignar Tarea</div>
            <div className="field">
              <div className="label">Seleccionar agente</div>
              <select
                className="input"
                value={selectedAgente}
                onChange={(e) => setSelectedAgente(e.target.value)}
              >
                <option value="">-- Seleccionar --</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => setShowAssignModal(false)}>
                Cancelar
              </button>
              <button className="btn primary" onClick={handleAssign} disabled={!selectedAgente || saving}>
                {saving ? "Asignando..." : "Asignar"}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Modals */}
        {showClientePopup && tarea.clienteId && (
          <ClientePopup clienteId={tarea.clienteId} onClose={() => setShowClientePopup(false)} />
        )}

        {showCommentEditor && (
          <CommentEditorModal
            initialContent=""
            initialType="RESPUESTA_AGENTE"
            onSave={handleAddComment}
            onClose={() => setShowCommentEditor(false)}
            isEditing={false}
            tarea={tarea}
            agentes={agentes}
            timeline={timeline}
          />
        )}
      </div>
  );
}
