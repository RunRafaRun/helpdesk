import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TipTapEditor from "../components/TipTapEditor";
import TemplateSelector from "../components/TemplateSelector";
import { Icon } from "../components/Icon";
import { WildcardContext } from "../lib/wildcards";
import { useAuth } from "../lib/auth";
import {
  getTarea,
  getTareaTimeline,
  updateTarea,
  asignarTarea,
  cerrarTarea,
  addComentarioTarea,
  updateComentarioTarea,
  deleteComentarioTarea,
  listAgentes,
  listEstadosTarea,
  listEstadosPermitidos,
  listPrioridadesTarea,
  listTiposTarea,
  listModulosLookup,
  listReleasesLookup,
  listEstadosPeticionPermitidos,
  ModuloLookup,
  getCliente,
  listContactos,
  listClienteSoftware,
  listClienteConexiones,
  listUsuariosCliente,
  listUnidadesLookup,
  listClienteCentrosTrabajo,
  listClienteReleasesPlan,
  listClienteComentarios,
  Tarea,
  TareaEvento,
  Agente,
  EstadoTarea,
  PrioridadTarea,
  TipoTarea,
  Release,
  Cliente,
  EstadoPeticion,
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
  estado?: { codigo: string };
}) {
  const resolvedCodigo = codigo ?? estado?.codigo;
  // Use priority color if available, otherwise fall back to colorMap
  let colors;
  if (prioridad?.color) {
    colors = { bg: prioridad.color, text: "#FFFFFF" }; // White text on colored background
  } else if (colorMap) {
    colors = colorMap[resolvedCodigo ?? ""] ?? { bg: "#E5E7EB", text: "#4B5563" };
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
      {prioridad?.codigo ?? label ?? resolvedCodigo ?? "-"}
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
        unidades: { check: unidades, loader: () => listUnidadesLookup(clienteId), setter: setUnidades },
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

// Comment Editor Modal - Optimized for maximum writing space
function CommentEditorModal({
  initialContent,
  initialType,
  onSave,
  onClose,
  isEditing,
  tarea,
  agentes,
  timeline,
  currentAgente,
}: {
  initialContent: string;
  initialType: "RESPUESTA_AGENTE" | "NOTA_INTERNA";
   onSave: (content: string, type: "RESPUESTA_AGENTE" | "NOTA_INTERNA") => void;
  onClose: () => void;
  isEditing: boolean;
  tarea: Tarea | null;
  agentes: Agente[];
  timeline: TareaEvento[];
  currentAgente?: Agente | null;
}) {
  const [content, setContent] = React.useState(initialContent);
  const [commentType, setCommentType] = React.useState(initialType);
  const [selectedNotifyAgents, setSelectedNotifyAgents] = React.useState<string[]>([]);

  // Build wildcard context for template resolution
  const wildcardContext: WildcardContext = React.useMemo(() => ({
    cliente: tarea?.cliente ? {
      codigo: tarea.cliente.codigo,
      descripcion: tarea.cliente.descripcion,
      jefeProyecto1: tarea.cliente.jefeProyecto1,
      jefeProyecto2: tarea.cliente.jefeProyecto2,
    } : null,
    tarea: tarea ? {
      numero: tarea.numero,
      titulo: tarea.titulo,
      estado: tarea.estado,
      prioridad: tarea.prioridad,
      modulo: tarea.modulo,
    } : null,
    agente: currentAgente ? {
      nombre: currentAgente.nombre,
      email: currentAgente.email,
    } : null,
  }), [tarea, currentAgente]);

  // Handle template selection
  function handleTemplateSelect(resolvedHtml: string) {
    // If content is empty or just a paragraph, replace it
    if (!content || content === "<p></p>") {
      setContent(resolvedHtml);
    } else {
      // Append to existing content
      setContent(content + resolvedHtml);
    }
  }

  // Get involved agents (Jefe Proyecto 1, Jefe Proyecto 2, assigned, agents from previous comments)
  // Returns both the list and a Set of all IDs for efficient filtering
  const { involvedAgents, allInvolvedIds } = React.useMemo(() => {
    const involvedSet = new Set<string>();
    const involvedList: { id: string; nombre: string; usuario: string; reason: string }[] = [];

    // Find JP1 and JP2 agent objects by matching usuario field
    const jp1Usuario = tarea?.cliente?.jefeProyecto1?.toLowerCase();
    const jp2Usuario = tarea?.cliente?.jefeProyecto2?.toLowerCase();
    
    // Add JP1 agent if found
    if (jp1Usuario) {
      const jp1Agent = agentes.find((a) => a.usuario?.toLowerCase() === jp1Usuario);
      if (jp1Agent && !involvedSet.has(jp1Agent.id)) {
        involvedSet.add(jp1Agent.id);
        involvedList.push({ id: jp1Agent.id, nombre: jp1Agent.nombre, usuario: jp1Agent.usuario || '', reason: "JP1" });
      }
    }
    
    // Add JP2 agent if found
    if (jp2Usuario) {
      const jp2Agent = agentes.find((a) => a.usuario?.toLowerCase() === jp2Usuario);
      if (jp2Agent && !involvedSet.has(jp2Agent.id)) {
        involvedSet.add(jp2Agent.id);
        involvedList.push({ id: jp2Agent.id, nombre: jp2Agent.nombre, usuario: jp2Agent.usuario || '', reason: "JP2" });
      }
    }

    // Assigned agent
    if (tarea?.asignadoA) {
      if (!involvedSet.has(tarea.asignadoA.id)) {
        involvedSet.add(tarea.asignadoA.id);
        involvedList.push({ id: tarea.asignadoA.id, nombre: tarea.asignadoA.nombre, usuario: tarea.asignadoA.usuario || '', reason: "Asignado" });
      }
    }

    // Agents from previous comments/events
    if (timeline) {
      for (const event of timeline) {
        if (event.creadoPorAgenteId && !involvedSet.has(event.creadoPorAgenteId)) {
          const agente = agentes.find((a) => a.id === event.creadoPorAgenteId);
          if (agente) {
            involvedSet.add(agente.id);
            involvedList.push({ id: agente.id, nombre: agente.nombre, usuario: agente.usuario || '', reason: "Comentó anteriormente" });
          }
        }
      }
    }

    return { involvedAgents: involvedList, allInvolvedIds: involvedSet };
  }, [tarea, timeline, agentes]);

  // Available agents to add - only those NOT already involved
  const availableAgents = React.useMemo(() => {
    return agentes.filter((a) => !allInvolvedIds.has(a.id));
  }, [agentes, allInvolvedIds]);

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalCard"
        style={{ width: "95vw", maxWidth: "95vw", height: "95vh", maxHeight: "95vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact header - single line with all controls */}
        <div style={{ 
          padding: "4px 12px", 
          borderBottom: "1px solid var(--border)", 
          background: "var(--bg-secondary)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{isEditing ? "Editar" : "Nuevo"} · #{tarea?.numero} - {tarea?.cliente?.codigo}</span>
            <div style={{ display: "flex", gap: 12, borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11 }}>
                <input
                  type="radio"
                  name="commentType"
                  checked={commentType === "RESPUESTA_AGENTE"}
                  onChange={() => setCommentType("RESPUESTA_AGENTE")}
                  style={{ margin: 0, width: 12, height: 12 }}
                />
                <span>Respuesta al cliente</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11 }}>
                <input
                  type="radio"
                  name="commentType"
                  checked={commentType === "NOTA_INTERNA"}
                  onChange={() => setCommentType("NOTA_INTERNA")}
                  style={{ margin: 0, width: 12, height: 12 }}
                />
                <span>Nota interna</span>
              </label>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TemplateSelector
              context={wildcardContext}
              onSelect={handleTemplateSelect}
              buttonLabel="Plantilla"
              buttonStyle={{ padding: "3px 8px", fontSize: 10 }}
            />
            <button className="btn" style={{ padding: "3px 8px", fontSize: 10 }} onClick={onClose}>Cancelar</button>
            <button
              className="btn primary"
              style={{ padding: "3px 10px", fontSize: 10 }}
              onClick={() => onSave(content, commentType)}
              disabled={!content.trim() || content === "<p></p>"}
            >
              {isEditing ? "Guardar" : "Agregar"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Main content area - maximum space for editor */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <TipTapEditor content={content} onChange={setContent} />
            </div>
          </div>

          {/* Right sidebar - Agents - compact and scrollable */}
          <div style={{ width: 200, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "#FAFAFA", flexShrink: 0 }}>
            {/* Involved agents - compact list */}
            <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Involucrados</div>
              <div style={{ maxHeight: 100, overflow: "auto" }}>
                {involvedAgents.length > 0 ? (
                  involvedAgents.map((a) => (
                    <div key={a.id} style={{ fontSize: 10, padding: "2px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }} title={a.nombre}>{a.nombre}</span>
                      <span style={{ color: "var(--muted)", fontSize: 9, flexShrink: 0 }}>{a.reason}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>Sin agentes involucrados</div>
                )}
              </div>
            </div>

            {/* Add agents to notify - only show those not already involved */}
            <div style={{ flex: 1, padding: "6px 8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notificar también</div>
              {availableAgents.length > 0 ? (
                <select
                  multiple
                  className="input"
                  style={{
                    flex: 1,
                    width: "100%",
                    fontSize: "10px",
                    padding: "2px",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    background: "white",
                    minHeight: 60
                  }}
                  value={selectedNotifyAgents}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedNotifyAgents(selectedOptions);
                  }}
                >
                  {availableAgents.map((a) => (
                    <option key={a.id} value={a.id} style={{ padding: "1px 2px" }}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic" }}>Todos ya involucrados</div>
              )}
              {selectedNotifyAgents.length > 0 && (
                <div style={{ fontSize: 9, color: "#3B82F6", marginTop: 2, flexShrink: 0 }}>
                  +{selectedNotifyAgents.length} seleccionado{selectedNotifyAgents.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TareaFicha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { me } = useAuth();

  const [tarea, setTarea] = React.useState<Tarea | null>(null);
  const [timeline, setTimeline] = React.useState<TareaEvento[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Lookups
  const [agentes, setAgentes] = React.useState<Agente[]>([]);
  const [estados, setEstados] = React.useState<EstadoTarea[]>([]);
  const [estadosPermitidosList, setEstadosPermitidosList] = React.useState<EstadoTarea[]>([]);
  const [prioridades, setPrioridades] = React.useState<PrioridadTarea[]>([]);
  const [tipos, setTipos] = React.useState<TipoTarea[]>([]);
  const [modulos, setModulos] = React.useState<ModuloLookup[]>([]);
  const [releases, setReleases] = React.useState<Release[]>([]);
  const [estadosPeticion, setEstadosPeticion] = React.useState<EstadoPeticion[]>([]);

  // Edit mode
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState<any>({});
  const [saving, setSaving] = React.useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [selectedAgente, setSelectedAgente] = React.useState<string>("");

  // Cliente popup
  const [showClientePopup, setShowClientePopup] = React.useState(false);

  // Task info panel collapsed state (true = sidebar visible)
  const [infoExpanded, setInfoExpanded] = React.useState(true);

   // Comments
   const [selectedComment, setSelectedComment] = React.useState<TareaEvento | null>(null);
   const [showCommentEditor, setShowCommentEditor] = React.useState(false);
   const [submittingComment, setSubmittingComment] = React.useState(false);
  const [commentsOrderAsc, setCommentsOrderAsc] = React.useState(false); // false = newest first (DESC)
  const [replyToEventId, setReplyToEventId] = React.useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null); // ID of comment being edited

  async function loadLookups() {
    try {
      const [agentesData, estadosData, prioridadesData, tiposData, modulosData, releasesData] = await Promise.all([
        listAgentes(),
        listEstadosTarea(),
        listPrioridadesTarea(),
        listTiposTarea(),
        listModulosLookup(),
        listReleasesLookup(),
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

  // Load permitted Estados Petición based on tipo and current estado
  async function loadEstadosPeticionPermitidos(tipoTareaId: string, estadoPeticionId?: string) {
    try {
      const data = await listEstadosPeticionPermitidos({
        tipoTareaId,
        estadoActualId: estadoPeticionId,
        actorTipo: "AGENTE",
      });
      setEstadosPeticion(data);
    } catch (e) {
      console.error("Error loading estados petición permitidos:", e);
      setEstadosPeticion([]);
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
        estadoPeticionId: tareaData.estadoPeticionId || "",
      });
      // Auto-select first comment (oldest by date)
      const articleTypes = ["MENSAJE_CLIENTE", "RESPUESTA_AGENTE", "NOTA_INTERNA"];
      const articleComments = timelineData.filter((e: TareaEvento) => {
        const normalizedTipo = (e.tipo || "").trim().toUpperCase().replace(/\s+/g, "_");
        return articleTypes.includes(normalizedTipo) || articleTypes.includes(e.tipo || "");
      });
      if (articleComments.length > 0) {
        const sorted = [...articleComments].sort((a: TareaEvento, b: TareaEvento) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setSelectedComment(sorted[0]);
      }
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

  // Load allowed estados when task is loaded (for state machine)
  React.useEffect(() => {
    async function loadEstadosPermitidos() {
      if (!tarea?.tipoId) {
        // If no task, use all estados
        setEstadosPermitidosList(estados);
        return;
      }
      try {
        const permitidos = await listEstadosPermitidos(tarea.tipoId, tarea.estadoId, "AGENTE");
        setEstadosPermitidosList(permitidos);
      } catch (e) {
        // If error loading permitted states, fall back to all states
        console.error("Error loading estados permitidos:", e);
        setEstadosPermitidosList(estados);
      }
    }
    loadEstadosPermitidos();
  }, [tarea?.tipoId, tarea?.estadoId, estados]);

  // Load allowed Estados Petición when task is loaded or tipoId changes in edit mode
  React.useEffect(() => {
    const tipoId = editing ? editForm.tipoId : tarea?.tipoId;
    const estadoPeticionId = editing ? editForm.estadoPeticionId : tarea?.estadoPeticionId;
    
    if (!tipoId) {
      setEstadosPeticion([]);
      return;
    }
    
    // Check if this tipo uses Estado Petición
    const tipo = tipos.find(t => t.id === tipoId);
    if (tipo?.tablaRelacionada !== "EstadoPeticion") {
      setEstadosPeticion([]);
      return;
    }
    
    loadEstadosPeticionPermitidos(tipoId, estadoPeticionId || undefined);
  }, [tarea?.tipoId, tarea?.estadoPeticionId, editForm.tipoId, editForm.estadoPeticionId, editing, tipos]);

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
        estadoPeticionId: editForm.estadoPeticionId || undefined,
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
         relatedToId: replyToEventId || undefined,
       });
      setTimeline(updatedTimeline);
      setShowCommentEditor(false);
      setReplyToEventId(null);
    } catch (e: any) {
      alert(e?.message ?? "Error al agregar comentario");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleUpdateComment(content: string) {
    if (!id || !editingCommentId || !content.trim()) return;
    setSubmittingComment(true);
    try {
      const updatedTimeline = await updateComentarioTarea(id, editingCommentId, {
        cuerpo: content.trim(),
      });
      setTimeline(updatedTimeline);
      setShowCommentEditor(false);
      setEditingCommentId(null);
      // Update selectedComment with new content
      const updatedComment = updatedTimeline.find(e => e.id === editingCommentId);
      if (updatedComment) {
        setSelectedComment(updatedComment);
      }
    } catch (e: any) {
      alert(e?.message ?? "Error al actualizar comentario");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(comment: TareaEvento) {
    if (!id || !comment) return;
    
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer."
    );
    if (!confirmDelete) return;
    
    try {
      const updatedTimeline = await deleteComentarioTarea(id, comment.id);
      setTimeline(updatedTimeline);
      setSelectedComment(null);
    } catch (e: any) {
      alert(e?.message ?? "Error al eliminar comentario");
    }
  }

  // Check if a comment can be edited (no newer comments after it)
  function canEditComment(comment: TareaEvento): boolean {
    if (!comment) return false;
    // Only agent comments can be edited
    const editableTipos = ["RESPUESTA_AGENTE", "NOTA_INTERNA"];
    if (!editableTipos.includes(comment.tipo)) return false;
    
    // Get all article comments
    const articleTypes = ["MENSAJE_CLIENTE", "RESPUESTA_AGENTE", "NOTA_INTERNA"];
    const articleComments = timeline.filter(e => articleTypes.includes(e.tipo));
    
    // Check if there are any comments created after this one
    const commentDate = new Date(comment.createdAt).getTime();
    const hasNewerComments = articleComments.some(e => 
      e.id !== comment.id && new Date(e.createdAt).getTime() > commentDate
    );
    
    return !hasNewerComments;
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

  // Only show PRODUCCION releases and hotfixes
  const produccionReleases = releases.filter((r) => r.rama === "PRODUCCION");
  const selectedRelease = releases.find((r) => r.id === editForm.releaseId);
  const availableHotfixes = (selectedRelease?.hotfixes || []).filter((h) => h.rama === "PRODUCCION");
  const isClosed = !!tarea?.closedAt;

  // Find current agente from the logged-in user
  const currentAgente = React.useMemo(() => {
    if (!me) return null;
    return agentes.find(a => a.usuario === me.usuario) || null;
  }, [me, agentes]);

  function normalizeTipo(tipo?: string) {
    return (tipo || "").trim().toUpperCase().replace(/\s+/g, "_");
  }

  function isClientEvent(evento: TareaEvento) {
    return normalizeTipo(evento.tipo) == "MENSAJE_CLIENTE" || evento.actorTipo == "CLIENTE";
  }

  function isAgentEvent(evento: TareaEvento) {
    return normalizeTipo(evento.tipo) == "RESPUESTA_AGENTE" || evento.actorTipo == "AGENTE";
  }

  function resolveSenderName(evento: TareaEvento): string {
    if (isClientEvent(evento)) {
      const payloadName = evento.payload?.creadoPorCliente?.nombre || evento.payload?.creadoPorCliente?.usuario;
      return payloadName || tarea?.cliente?.codigo || "Cliente";
    }
    const payloadName = evento.payload?.creadoPorAgente?.nombre || evento.payload?.creadoPorAgente?.usuario;
    const agente = agentes.find(a => a.id === evento.creadoPorAgenteId);
    return payloadName || agente?.nombre || agente?.usuario || "Agente";
  }

  // Filter comments (MENSAJE_CLIENTE, RESPUESTA_AGENTE, NOTA_INTERNA)
  const comments = timeline.filter((e) =>
    ["MENSAJE_CLIENTE", "RESPUESTA_AGENTE", "NOTA_INTERNA"].includes(normalizeTipo(e.tipo))
  );

  const chronologicalOrder = [...comments].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
  const chronologicalNumbers = new Map<string, number>();
  chronologicalOrder.forEach((evento, index) => {
    chronologicalNumbers.set(evento.id, index + 1);
  });

  const chronologicalRelationships = new Map<string, string>();
  let lastClientIndex = -1;
  for (let i = 0; i < chronologicalOrder.length; i++) {
    const evento = chronologicalOrder[i];
    if (isClientEvent(evento)) {
      lastClientIndex = i;
      continue;
    }
    if (isAgentEvent(evento)) {
      if (lastClientIndex !== -1) {
        chronologicalRelationships.set(evento.id, `#${lastClientIndex + 1}`);
      }
    }
  }

  function resolveRelatedTo(evento: TareaEvento): string {
    const relatedTargetId = evento.payload?.relatedToId || evento.payload?.replyToId;
    if (relatedTargetId) {
      const number = chronologicalNumbers.get(relatedTargetId);
      if (number) return `#${number}`;
    }
    const direct = chronologicalRelationships.get(evento.id);
    if (direct) return direct;
    const idx = chronologicalOrder.findIndex((e) => e.id === evento.id);
    if (idx === -1) return "";
    for (let i = idx - 1; i >= 0; i--) {
      if (isClientEvent(chronologicalOrder[i])) return `#${i + 1}`;
    }
    for (let i = idx + 1; i < chronologicalOrder.length; i++) {
      if (isClientEvent(chronologicalOrder[i])) return `#${i + 1}`;
    }
    return "";
  }

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
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", gap: 0 }}>
      {/* Compact Header Bar */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "6px 12px",
        borderBottom: "1px solid var(--border)",
        background: "var(--card-bg)",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => navigate("/")}>
            ← Volver
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>
              #{tarea.numero}
            </span>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
            <span style={{ fontSize: 14, fontWeight: 500, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tarea.titulo}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <Badge estado={tarea.estado} />
            <Badge prioridad={tarea.prioridad} />
            {isClosed && (
              <span style={{ padding: "3px 8px", backgroundColor: "#374151", color: "#fff", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                CERRADA
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!isClosed && (
            <>
              <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setEditing(!editing)}>
                {editing ? "Cancelar" : "Editar"}
              </button>
              <button className="btn primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={handleClose}>
                Cerrar Tarea
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content: 3-column layout (left sidebar for future use, center for articles, right for task info) */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        
        {/* Center: Articles/Comments Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--border)" }}>
          
          {/* Article Overview - Compact list like OTRS */}
          <div style={{ 
            flexShrink: 0, 
            borderBottom: "1px solid var(--border)", 
            background: "var(--card-bg)",
            maxHeight: "35%",
            minHeight: 140,
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-secondary)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Artículos - {comments.length} Artículo(s)</span>
                <button
                  style={{ 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    padding: "2px 6px",
                    fontSize: 11,
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                  onClick={() => setCommentsOrderAsc(!commentsOrderAsc)}
                  title="Cambiar orden"
                >
                  {commentsOrderAsc ? "▲ Antiguos primero" : "▼ Recientes primero"}
                </button>
              </div>
              {!isClosed && (
                <button
                  className="btn primary"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  onClick={() => {
                    setReplyToEventId(null);
                    setShowCommentEditor(true);
                  }}
                >
                  + Nota
                </button>
              )}
            </div>
            
            {/* Compact article list */}
            <div style={{ flex: 1, overflow: "auto" }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted)", padding: 16, fontSize: 12 }}>
                  No hay artículos
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-secondary)" }}>
                      <th style={{ padding: "6px 8px", textAlign: "center", width: 35, fontWeight: 600, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>N°</th>
                      <th style={{ padding: "6px 8px", textAlign: "left", width: 110, fontWeight: 600, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>REMITENTE</th>
                      <th style={{ padding: "6px 8px", textAlign: "left", width: 65, fontWeight: 600, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>VIA</th>
                      <th style={{ padding: "6px 8px", textAlign: "left", width: 70, fontWeight: 600, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>REL.</th>
                      <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>ASUNTO</th>
                      <th style={{ padding: "6px 8px", textAlign: "left", width: 150, fontWeight: 600, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>CREADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const displayComments = commentsOrderAsc
                        ? [...chronologicalOrder]
                        : [...chronologicalOrder].reverse();

                      return displayComments.map((evento) => {
                        const isSelected = selectedComment?.id === evento.id;
                        const chronologicalNumber = chronologicalNumbers.get(evento.id) || 0;
                        const senderName = resolveSenderName(evento);
                        const viaLabel = isClientEvent(evento) 
                          ? "Cliente" 
                          : normalizeTipo(evento.tipo) === "NOTA_INTERNA" 
                            ? "Interno" 
                            : "Agente";
                        const isClientRow = isClientEvent(evento);
                        const isAgentRow = !isClientRow && viaLabel === "Agente";
                        const relatedTo = !isClientRow ? resolveRelatedTo(evento) : "";
                        const relDebug = relatedTo ? `Resp ${relatedTo}` : "-";
                        const subjectPreview = evento.cuerpo?.replace(/<[^>]*>/g, "").substring(0, 80) || "Sin contenido";

                        return (
                          <tr
                            key={evento.id}
                            onClick={() => setSelectedComment(evento)}
                            style={{
                              cursor: "pointer",
                              backgroundColor: isSelected ? "var(--accent)" : "transparent",
                              color: isSelected ? "#fff" : "var(--text)",
                              fontWeight: isSelected ? 600 : 400,
                            }}
                          >
                            <td style={{ padding: "5px 8px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                              {chronologicalNumber}
                            </td>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
                              {senderName}
                            </td>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)" }}>
                              <span style={{ 
                                fontSize: 10, 
                                fontWeight: 600,
                                color: isSelected ? "#fff" : (evento.tipo === "MENSAJE_CLIENTE" ? "#D97706" : evento.tipo === "NOTA_INTERNA" ? "#6B7280" : "#2563EB")
                              }}>
                                {viaLabel}
                              </span>
                            </td>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)" }}>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: isSelected ? "rgba(255,255,255,0.2)" : "var(--bg-secondary)",
                                color: isSelected ? "#fff" : isAgentRow ? "var(--accent)" : "var(--muted)",
                                whiteSpace: "nowrap",
                              }}>
                                {relDebug}
                              </span>
                            </td>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {subjectPreview}
                            </td>
                            <td style={{ padding: "5px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", fontSize: 10 }}>
                              {formatDate(evento.createdAt)}
                              {evento.updatedAt && (
                                <span style={{ 
                                  marginLeft: 4,
                                  fontSize: 8, 
                                  padding: "1px 3px", 
                                  backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : "#FEF3C7", 
                                  color: isSelected ? "#fff" : "#92400E", 
                                  borderRadius: 2 
                                }} title={`Editado: ${formatDate(evento.updatedAt)}`}>
                                  ed.
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Selected Article Detail - Takes maximum space */}
          <div style={{ 
            flex: 1, 
            overflow: "auto", 
            background: "#fff",
            display: "flex",
            flexDirection: "column"
          }}>
            {selectedComment ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Article header - compact info */}
                <div style={{
                  padding: "4px 10px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  flexShrink: 0
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span>#{(() => {
                          const idx = chronologicalOrder.findIndex(c => c.id === selectedComment.id);
                          return idx >= 0 ? idx + 1 : "?";
                        })()} — {selectedComment.tipo === "MENSAJE_CLIENTE" ? "Mensaje Cliente" : selectedComment.tipo === "NOTA_INTERNA" ? "Nota Interna" : "Respuesta Agente"}</span>
                        <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 10 }}>— {formatDate(selectedComment.createdAt)}</span>
                        {selectedComment.updatedAt && (
                          <span style={{ fontSize: 9, padding: "1px 4px", backgroundColor: "#FEF3C7", color: "#92400E", borderRadius: 3 }} title={`Editado: ${formatDate(selectedComment.updatedAt)}`}>
                            editado
                          </span>
                        )}
                        {selectedComment.tipo === "NOTA_INTERNA" && (
                          <span style={{ fontSize: 9, padding: "1px 4px", backgroundColor: "#374151", color: "#fff", borderRadius: 3 }}>
                            Interno
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted)", display: "flex", gap: 12, alignItems: "center" }}>
                        {resolveRelatedTo(selectedComment) && (
                          <span style={{
                            fontSize: 9,
                            padding: "1px 4px",
                            borderRadius: 3,
                            background: "var(--bg-secondary)",
                            color: "var(--accent)",
                          }}>
                            Resp. {resolveRelatedTo(selectedComment)}
                          </span>
                        )}
                        <span>
                          <strong>De:</strong> {resolveSenderName(selectedComment)}
                        </span>
                        {selectedComment.tipo !== "NOTA_INTERNA" && (
                          <span>
                            <strong>Para:</strong> {selectedComment.tipo === "MENSAJE_CLIENTE" ? "Soporte" : tarea.cliente?.codigo || "Cliente"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {!isClosed && selectedComment.tipo !== "MENSAJE_CLIENTE" && canEditComment(selectedComment) && (
                        <>
                          <button 
                            className="btn" 
                            style={{ padding: "4px 10px", fontSize: 11 }}
                            onClick={() => {
                              setEditingCommentId(selectedComment.id);
                              setShowCommentEditor(true);
                            }}
                          >
                            Editar
                          </button>
                          <button 
                            className="btn" 
                            style={{ padding: "4px 10px", fontSize: 11, color: "var(--danger)" }}
                            onClick={() => handleDeleteComment(selectedComment)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                      {!isClosed && (
                        <button
                          className="btn primary"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => {
                            setReplyToEventId(selectedComment?.id ?? null);
                            setShowCommentEditor(true);
                          }}
                        >
                          Responder
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Article body - maximum space for content, compact like OTRS */}
                <div style={{
                  flex: 1,
                  padding: "6px 10px",
                  overflow: "auto",
                  fontSize: 12,
                  lineHeight: 1.4
                }}>
                  {/* Author avatar/initials */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 3,
                      background: selectedComment.tipo === "MENSAJE_CLIENTE" ? "#FEF3C7" : "#DBEAFE",
                      color: selectedComment.tipo === "MENSAJE_CLIENTE" ? "#92400E" : "#1E40AF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      {(() => {
                        const name = selectedComment.tipo === "MENSAJE_CLIENTE"
                          ? (tarea.cliente?.codigo || "CL")
                          : (agentes.find(a => a.id === selectedComment.creadoPorAgenteId)?.nombre || "AG");
                        return name.substring(0, 2).toUpperCase();
                      })()}
                    </div>
                    <div style={{ flex: 1, borderLeft: "2px solid var(--border)", paddingLeft: 10 }}>
                      <div
                        className="comment-content"
                        style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
                        dangerouslySetInnerHTML={{ __html: selectedComment.cuerpo ?? "" }}
                      />
                    </div>
                  </div>
                  <style>{`
                    .comment-content {
                      font-size: 12px;
                      line-height: 1.4;
                    }
                    .comment-content p {
                      margin: 0 0 6px 0;
                    }
                    .comment-content img {
                      max-width: 100%;
                      height: auto;
                      display: block;
                      margin: 4px 0;
                      border: 1px solid var(--border);
                      border-radius: 3px;
                    }
                    .comment-content * {
                      max-width: 100%;
                    }
                    .comment-content table {
                      border-collapse: collapse;
                      margin: 4px 0;
                    }
                    .comment-content td, .comment-content th {
                      border: 1px solid var(--border);
                      padding: 2px 6px;
                      font-size: 11px;
                    }
                    .comment-content pre, .comment-content code {
                      background: var(--bg-secondary);
                      padding: 1px 4px;
                      border-radius: 3px;
                      font-size: 11px;
                    }
                    .comment-content pre {
                      padding: 6px 8px;
                      overflow-x: auto;
                      margin: 4px 0;
                    }
                    .comment-content ul, .comment-content ol {
                      margin: 4px 0;
                      padding-left: 20px;
                    }
                    .comment-content li {
                      margin: 2px 0;
                    }
                    .comment-content blockquote {
                      margin: 4px 0;
                      padding-left: 10px;
                      border-left: 2px solid var(--border);
                      color: var(--muted);
                    }
                  `}</style>
                </div>
              </div>
            ) : (
              <div style={{ 
                flex: 1, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "var(--muted)",
                fontSize: 13
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                  <div>Selecciona un artículo de la lista para ver su contenido</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Task Information (collapsible) */}
        <div style={{ 
          width: infoExpanded ? 280 : 0, 
          overflow: "hidden",
          transition: "width 0.2s ease",
          background: "var(--bg-secondary)",
          borderLeft: infoExpanded ? "1px solid var(--border)" : "none",
          display: "flex",
          flexDirection: "column"
        }}>
          {infoExpanded && (
            <div style={{ width: 280, height: "100%", overflow: "auto", fontSize: 12 }}>
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "6px 8px",
                background: "var(--card-bg)",
                borderBottom: "1px solid var(--border)"
              }}>
                <button
                  onClick={() => setInfoExpanded(false)}
                  title="Ocultar panel"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    padding: "2px 6px",
                    borderRadius: 6,
                    fontSize: 11,
                    color: "var(--muted)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  ◀
                </button>
              </div>
              {/* Ticket Info Section */}
              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <div 
                  style={{ 
                    padding: "10px 12px", 
                    background: "var(--card-bg)", 
                    fontWeight: 600, 
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer"
                  }}
                >
                  ▼ Información del ticket
                </div>
                <div style={{ padding: "8px 12px", background: "var(--card-bg)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "6px 8px" }}>
                    <span style={{ color: "var(--muted)" }}>Tipo:</span>
                    <span style={{ fontWeight: 500 }}>{tarea.tipo?.codigo ?? "-"}</span>
                    
                    <span style={{ color: "var(--muted)" }}>Creado:</span>
                    <span>{formatDate(tarea.createdAt)}</span>
                    
                    <span style={{ color: "var(--muted)" }}>Estado:</span>
                    <span><Badge estado={tarea.estado} /></span>
                    
                    {/* Estado Petición - only shown when TipoTarea has tablaRelacionada = "EstadoPeticion" */}
                    {tarea.tipo?.tablaRelacionada === "EstadoPeticion" && (
                      <>
                        <span style={{ color: "var(--muted)" }}>Est. Petición:</span>
                        <span style={{ fontWeight: 500, color: tarea.estadoPeticion ? "var(--accent)" : "var(--muted)" }}>
                          {tarea.estadoPeticion?.codigo ?? "-"}
                        </span>
                      </>
                    )}
                    
                    <span style={{ color: "var(--muted)" }}>Prioridad:</span>
                    <span><Badge prioridad={tarea.prioridad} /></span>
                    
                    <span style={{ color: "var(--muted)" }}>Propietario:</span>
                    <span style={{ fontWeight: 500, color: tarea.asignadoA ? "var(--text)" : "var(--muted)" }}>
                      {tarea.asignadoA?.nombre ?? "Sin asignar"}
                    </span>
                    
                    <span style={{ color: "var(--muted)" }}>Módulo:</span>
                    <span>{tarea.modulo?.codigo ?? "-"}</span>
                    
                    <span style={{ color: "var(--muted)" }}>Release:</span>
                    <span style={{ color: tarea.release ? "var(--accent)" : "var(--muted)" }}>
                      {tarea.release?.codigo ?? "N/A"}
                    </span>
                    
                    <span style={{ color: "var(--muted)" }}>HotFix:</span>
                    <span style={{ color: tarea.hotfix ? "var(--accent)" : "var(--muted)" }}>
                      {tarea.hotfix?.codigo ?? "N/A"}
                    </span>
                    
                    <span style={{ color: "var(--muted)" }}>Reproducido:</span>
                    <span>{tarea.reproducido ? "Sí" : "No"}</span>
                    
                    {tarea.closedAt && (
                      <>
                        <span style={{ color: "var(--muted)" }}>Cerrada:</span>
                        <span>{formatDate(tarea.closedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Info Section */}
              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <div 
                  style={{ 
                    padding: "10px 12px", 
                    background: "var(--card-bg)", 
                    fontWeight: 600, 
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer"
                  }}
                >
                  ▼ Información del cliente
                </div>
                <div style={{ padding: "8px 12px", background: "var(--card-bg)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "6px 8px" }}>
                    <span style={{ color: "var(--muted)" }}>Código:</span>
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                      {tarea.cliente?.codigo}
                      <button
                        className="btn"
                        style={{ padding: "1px 4px", fontSize: 9, marginLeft: 4 }}
                        onClick={() => setShowClientePopup(true)}
                        title="Ver ficha del cliente"
                      >
                        🔍
                      </button>
                    </span>
                    
                    <span style={{ color: "var(--muted)" }}>Descripción:</span>
                    <span style={{ wordBreak: "break-word" }}>{tarea.cliente?.descripcion || "-"}</span>
                    
                    <span style={{ color: "var(--muted)" }}>U.C.:</span>
                    <span>{tarea.unidadComercial?.codigo ?? "-"}</span>
                    
                    <span style={{ color: "var(--muted)" }}>JP 1:</span>
                    <span>{tarea.cliente?.jefeProyecto1 ?? "-"}</span>
                    
                    <span style={{ color: "var(--muted)" }}>JP 2:</span>
                    <span>{tarea.cliente?.jefeProyecto2 ?? "-"}</span>
                  </div>
                </div>
              </div>

              {/* Edit Mode (when editing) */}
              {editing && (
                <div style={{ borderBottom: "1px solid var(--border)" }}>
                  <div 
                    style={{ 
                      padding: "10px 12px", 
                      background: "#FEF3C7", 
                      fontWeight: 600, 
                      fontSize: 11,
                      color: "#92400E"
                    }}
                  >
                    ✏️ Modo edición
                  </div>
                  <div style={{ padding: "8px 12px", background: "var(--card-bg)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Título</div>
                        <input
                          className="input"
                          style={{ padding: "4px 6px", fontSize: 11 }}
                          value={editForm.titulo}
                          onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                        />
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Estado</div>
                        <select
                          className="input"
                          style={{ padding: "4px 6px", fontSize: 11 }}
                          value={editForm.estadoId || ""}
                          onChange={(e) => setEditForm({ ...editForm, estadoId: e.target.value })}
                        >
                          <option value="">Sin estado</option>
                          {(estadosPermitidosList.length > 0 ? estadosPermitidosList : estados).map((e) => (
                            <option key={e.id} value={e.id}>{e.codigo}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Prioridad</div>
                        <select
                          className="input"
                          style={{ padding: "4px 6px", fontSize: 11 }}
                          value={editForm.prioridadId || ""}
                          onChange={(e) => setEditForm({ ...editForm, prioridadId: e.target.value })}
                        >
                          {prioridades.map((p) => (
                            <option key={p.id} value={p.id}>{p.codigo}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Tipo</div>
                        <select
                          className="input"
                          style={{ padding: "4px 6px", fontSize: 11 }}
                          value={editForm.tipoId || ""}
                          onChange={(e) => setEditForm({ ...editForm, tipoId: e.target.value })}
                        >
                          {tipos.map((t) => (
                            <option key={t.id} value={t.id}>{t.codigo}</option>
                          ))}
                        </select>
                      </div>
                      {/* Estado Petición - only shown when TipoTarea has tablaRelacionada = "EstadoPeticion" */}
                      {tipos.find(t => t.id === editForm.tipoId)?.tablaRelacionada === "EstadoPeticion" && (
                        <div className="field" style={{ marginBottom: 0 }}>
                          <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Estado Petición</div>
                          <select
                            className="input"
                            style={{ padding: "4px 6px", fontSize: 11 }}
                            value={editForm.estadoPeticionId || ""}
                            onChange={(e) => setEditForm({ ...editForm, estadoPeticionId: e.target.value })}
                          >
                            <option value="">Sin estado petición</option>
                            {estadosPeticion.map((ep) => (
                              <option key={ep.id} value={ep.id}>{ep.codigo}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="field" style={{ marginBottom: 0 }}>
                        <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Módulo</div>
                        <select
                          className="input"
                          style={{ padding: "4px 6px", fontSize: 11 }}
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
                        <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Release</div>
                        <select
                          className="input"
                          style={{ padding: "4px 6px", fontSize: 11 }}
                          value={editForm.releaseId || ""}
                          onChange={(e) => setEditForm({ ...editForm, releaseId: e.target.value, hotfixId: "" })}
                        >
                          <option value="">Sin release</option>
                          {produccionReleases.map((r) => (
                            <option key={r.id} value={r.id}>{r.codigo}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Hotfix</div>
                        <select
                          className="input"
                          style={{ padding: "4px 6px", fontSize: 11 }}
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
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11 }}>
                        <input
                          type="checkbox"
                          checked={editForm.reproducido}
                          onChange={(e) => setEditForm({ ...editForm, reproducido: e.target.checked })}
                        />
                        <span>Reproducido</span>
                      </label>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <button className="btn primary" style={{ flex: 1, padding: "4px 8px", fontSize: 11 }} onClick={handleSave} disabled={saving}>
                          {saving ? "..." : "Guardar"}
                        </button>
                        <button className="btn" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => setEditing(false)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!infoExpanded && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
            }}
          >
            <button
              onClick={() => setInfoExpanded(true)}
              title="Mostrar panel"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRight: "none",
                padding: "6px 4px",
                fontSize: 11,
                borderRadius: "6px 0 0 6px",
                color: "var(--muted)",
              }}
            >
              ▶
            </button>
          </div>
        )}
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

      {showClientePopup && tarea.clienteId && (
        <ClientePopup clienteId={tarea.clienteId} onClose={() => setShowClientePopup(false)} />
      )}

      {showCommentEditor && (
        <CommentEditorModal
          initialContent={editingCommentId ? (timeline.find(e => e.id === editingCommentId)?.cuerpo || "") : ""}
          initialType={editingCommentId ? ((timeline.find(e => e.id === editingCommentId)?.tipo as "RESPUESTA_AGENTE" | "NOTA_INTERNA") || "RESPUESTA_AGENTE") : "RESPUESTA_AGENTE"}
          onSave={editingCommentId 
            ? (content) => handleUpdateComment(content) 
            : handleAddComment
          }
          onClose={() => {
            setShowCommentEditor(false);
            setEditingCommentId(null);
            setReplyToEventId(null);
          }}
          isEditing={!!editingCommentId}
          tarea={tarea}
          agentes={agentes}
          timeline={timeline}
          currentAgente={currentAgente}
        />
      )}
    </div>
  );
}

