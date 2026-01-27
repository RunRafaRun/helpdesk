import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  getDashboardStats,
  DashboardStats,
  listPrioridadesTarea,
  PrioridadTarea,
  getDashboardConfig,
  updateDashboardConfig,
  resetDashboardConfig,
  DashboardLayout,
  WidgetConfig,
  WidgetType,
} from "../lib/api";

// Default layout
const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: [
    { id: "releaseStatus", type: "releaseStatus", position: { x: 0, y: 0, w: 4, h: 2 }, visible: true },
    { id: "sinAsignar", type: "sinAsignar", position: { x: 4, y: 0, w: 2, h: 2 }, visible: true },
    { id: "prioridadPendientes", type: "prioridadPendientes", position: { x: 6, y: 0, w: 3, h: 2 }, visible: true },
    { id: "ticketsNuevosPendientes", type: "ticketsNuevosPendientes", position: { x: 0, y: 2, w: 9, h: 3 }, visible: true },
    { id: "resumenClienteEstado", type: "resumenClienteEstado", position: { x: 0, y: 5, w: 9, h: 5 }, visible: true },
    { id: "ultimosComentarios", type: "ultimosComentarios", position: { x: 9, y: 0, w: 3, h: 10 }, visible: true },
  ],
};

// Widget display names
const WIDGET_NAMES: Record<WidgetType, string> = {
  releaseStatus: "Estado de Releases",
  sinAsignar: "Sin Asignar",
  prioridadPendientes: "Tareas por Prioridad",
  ticketsNuevosPendientes: "Tickets Nuevos Pendientes",
  resumenClienteEstado: "Resumen Cliente/Estado",
  ultimosComentarios: "Últimos Comentarios",
};

// Estado colors for the pivot table
const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  PENDIENTE: { bg: "#FEF3C7", text: "#92400E" },
  ACEPTADA: { bg: "#DBEAFE", text: "#1D4ED8" },
  EN_PROGRESO: { bg: "#E0E7FF", text: "#4338CA" },
  CERRADA: { bg: "#D1FAE5", text: "#065F46" },
  RECHAZADA: { bg: "#FEE2E2", text: "#DC2626" },
  DUPLICADA: { bg: "#F3E8FF", text: "#7C3AED" },
  INTERNA: { bg: "#FED7AA", text: "#C2410C" },
  SOLUCIONADA: { bg: "#BBF7D0", text: "#166534" },
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function stripHtml(html: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Widget Wrapper with edit controls
function WidgetWrapper({
  widget,
  isEditMode,
  index,
  totalVisible,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  children,
}: {
  widget: WidgetConfig;
  isEditMode: boolean;
  index: number;
  totalVisible: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  children: React.ReactNode;
}) {
  if (!widget.visible && !isEditMode) return null;

  return (
    <div
      style={{
        position: "relative",
        opacity: widget.visible ? 1 : 0.5,
        border: isEditMode ? "2px dashed var(--accent)" : undefined,
        borderRadius: isEditMode ? 8 : undefined,
      }}
    >
      {isEditMode && (
        <div
          style={{
            position: "absolute",
            top: -10,
            right: 8,
            display: "flex",
            gap: 4,
            zIndex: 10,
            background: "#fff",
            padding: "2px 6px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", marginRight: 4 }}>
            {WIDGET_NAMES[widget.type]}
          </span>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            style={{
              background: "none",
              border: "none",
              cursor: index === 0 ? "not-allowed" : "pointer",
              opacity: index === 0 ? 0.3 : 1,
              padding: "2px 4px",
              fontSize: 12,
            }}
            title="Mover arriba"
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalVisible - 1}
            style={{
              background: "none",
              border: "none",
              cursor: index === totalVisible - 1 ? "not-allowed" : "pointer",
              opacity: index === totalVisible - 1 ? 0.3 : 1,
              padding: "2px 4px",
              fontSize: 12,
            }}
            title="Mover abajo"
          >
            ▼
          </button>
          <button
            onClick={onToggleVisibility}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              fontSize: 12,
            }}
            title={widget.visible ? "Ocultar" : "Mostrar"}
          >
            {widget.visible ? "👁" : "👁‍🗨"}
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

function ReleaseStatusPanel({ releaseStatus }: { releaseStatus: DashboardStats["releaseStatus"] }) {
  if (!releaseStatus) {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span>🚀</span> Estado de Releases
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 12 }}>
          Sin información de releases
        </div>
      </div>
    );
  }

  const { desarrolloRelease, produccionRelease } = releaseStatus;

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* Development Section */}
      <div>
        <div style={{
          fontSize: 9,
          fontWeight: 600,
          color: "#92400E",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 4
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }}></span>
          En Desarrollo
        </div>
        {desarrolloRelease ? (
          <div style={{
            background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
            borderRadius: 6,
            padding: "8px 12px",
            border: "1px solid #F59E0B30",
            minWidth: 120,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#92400E" }}>
                {desarrolloRelease.codigo}
              </div>
              <div style={{
                fontSize: 8,
                fontWeight: 600,
                color: "#92400E",
                background: "#FEF3C7",
                padding: "2px 6px",
                borderRadius: 3,
                border: "1px solid #F59E0B50",
              }}>
                DEV
              </div>
            </div>
            {desarrolloRelease.descripcion && (
              <div style={{ fontSize: 10, color: "#A16207", marginTop: 2 }}>
                {desarrolloRelease.descripcion}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic" }}>
            Sin release en desarrollo
          </div>
        )}
      </div>

      {/* Production Section */}
      <div>
        <div style={{
          fontSize: 9,
          fontWeight: 600,
          color: "#065F46",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 4
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }}></span>
          En Producción
        </div>
        {produccionRelease ? (
          <div style={{
            background: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
            borderRadius: 6,
            padding: "8px 12px",
            border: "1px solid #10B98130",
            minWidth: 140,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#065F46" }}>
                {produccionRelease.codigo}
              </div>
              <div style={{
                fontSize: 8,
                fontWeight: 600,
                color: "#065F46",
                background: "#D1FAE5",
                padding: "2px 6px",
                borderRadius: 3,
                border: "1px solid #10B98150",
              }}>
                PROD
              </div>
            </div>
            {/* Hotfixes */}
            {(produccionRelease.desarrolloHotfix || produccionRelease.produccionHotfix) && (
              <div style={{
                marginTop: 6,
                display: "flex",
                gap: 6,
              }}>
                {produccionRelease.produccionHotfix && (
                  <div style={{
                    background: "#ECFDF5",
                    borderRadius: 3,
                    padding: "2px 6px",
                    border: "1px solid #10B98130",
                    fontSize: 10,
                  }}>
                    <span style={{ color: "#065F46", fontWeight: 500 }}>HF Prod: </span>
                    <span style={{ fontWeight: 700, color: "#065F46" }}>{produccionRelease.produccionHotfix.codigo}</span>
                  </div>
                )}
                {produccionRelease.desarrolloHotfix && (
                  <div style={{
                    background: "#FFFBEB",
                    borderRadius: 3,
                    padding: "2px 6px",
                    border: "1px solid #F59E0B30",
                    fontSize: 10,
                  }}>
                    <span style={{ color: "#92400E", fontWeight: 500 }}>HF Dev: </span>
                    <span style={{ fontWeight: 700, color: "#92400E" }}>{produccionRelease.desarrolloHotfix.codigo}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic" }}>
            Sin release en producción
          </div>
        )}
      </div>
    </div>
  );
}

function PrioridadPendientesWidget({ 
  data, 
  prioridades 
}: { 
  data: DashboardStats["byPrioridadPendientes"];
  prioridades: PrioridadTarea[];
}) {
  // Create color map from prioridades
  const colorMap: Record<string, string> = {};
  prioridades.forEach(p => {
    if (p.color) colorMap[p.codigo] = p.color;
  });

  const maxValue = Math.max(...data.map(d => d.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {data.map((item) => (
        <div key={item.prioridad.codigo} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ 
            width: 55, 
            fontSize: 11, 
            color: "var(--text)", 
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {item.prioridad.codigo}
          </div>
          <div style={{ flex: 1, height: 18, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${(item.count / maxValue) * 100}%`,
                height: "100%",
                background: colorMap[item.prioridad.codigo] || "#3B82F6",
                borderRadius: 3,
                minWidth: item.count > 0 ? 4 : 0,
              }}
            />
          </div>
          <div style={{ width: 24, fontSize: 11, fontWeight: 600, textAlign: "right" }}>{item.count}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [prioridades, setPrioridades] = useState<PrioridadTarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout state
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [savedLayout, setSavedLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = me?.role === "ADMIN" || me?.roles?.includes("ADMIN");
  const hasChanges = JSON.stringify(layout) !== JSON.stringify(savedLayout);

  // Load dashboard config
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getDashboardConfig();
        if (config?.layout) {
          setLayout(config.layout);
          setSavedLayout(config.layout);
        }
      } catch (e) {
        // Fallback to default layout if config fails to load
        console.error("Failed to load dashboard config:", e);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const [statsData, prioridadesData] = await Promise.all([
        getDashboardStats(),
        listPrioridadesTarea()
      ]);
      setStats(statsData);
      setPrioridades(prioridadesData);
    } catch (e: any) {
      setError(e?.message || "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }

  // Widget manipulation handlers
  const getWidgetByType = useCallback((type: WidgetType) => {
    return layout.widgets.find(w => w.type === type);
  }, [layout]);

  const getVisibleWidgets = useCallback(() => {
    return layout.widgets.filter(w => w.visible);
  }, [layout]);

  const getHiddenWidgets = useCallback(() => {
    return layout.widgets.filter(w => !w.visible);
  }, [layout]);

  const moveWidget = useCallback((widgetId: string, direction: "up" | "down") => {
    setLayout(prev => {
      const widgets = [...prev.widgets];
      const visibleWidgets = widgets.filter(w => w.visible);
      const hiddenWidgets = widgets.filter(w => !w.visible);
      
      const currentIndex = visibleWidgets.findIndex(w => w.id === widgetId);
      if (currentIndex === -1) return prev;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= visibleWidgets.length) return prev;

      // Swap
      [visibleWidgets[currentIndex], visibleWidgets[newIndex]] = [visibleWidgets[newIndex], visibleWidgets[currentIndex]];
      
      return { widgets: [...visibleWidgets, ...hiddenWidgets] };
    });
  }, []);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setLayout(prev => ({
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
    }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const config = await updateDashboardConfig(layout);
      setSavedLayout(config.layout);
      setIsEditMode(false);
    } catch (e: any) {
      alert("Error al guardar: " + (e?.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLayout(savedLayout);
    setIsEditMode(false);
  };

  const handleReset = async () => {
    if (!confirm("¿Restablecer el layout por defecto? Se perderán los cambios guardados.")) return;
    setSaving(true);
    try {
      const config = await resetDashboardConfig();
      setLayout(config.layout);
      setSavedLayout(config.layout);
      setIsEditMode(false);
    } catch (e: any) {
      alert("Error al restablecer: " + (e?.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  // Render widget content by type
  const renderWidgetContent = (type: WidgetType) => {
    if (!stats) return null;

    switch (type) {
      case "releaseStatus":
        return (
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🚀</span> Estado de Releases
            </div>
            <ReleaseStatusPanel releaseStatus={stats.releaseStatus} />
          </div>
        );

      case "sinAsignar":
        return (
          <div style={{
            background: "#fff",
            borderRadius: 8,
            padding: 14,
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 120,
            height: "100%",
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: "#FEF3C715",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}>
              ⚠️
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Sin Asignar</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#F59E0B" }}>{stats.totals.sinAsignar}</div>
            </div>
          </div>
        );

      case "prioridadPendientes":
        return (
          <div style={{ 
            background: "#fff", 
            borderRadius: 8, 
            padding: 14, 
            border: "1px solid var(--border)",
            minWidth: 220,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tareas por Prioridad Pendientes</div>
            <PrioridadPendientesWidget data={stats.byPrioridadPendientes} prioridades={prioridades} />
          </div>
        );

      case "ticketsNuevosPendientes":
        return (
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Tickets Nuevos Pendientes</div>
              <button className="btn" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/tareas")}>Ver todo</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 90, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>TICKET#</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 100, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>ANTIG.</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>TITULO</th>
                  <th style={{ padding: "6px 8px", textAlign: "right", width: 80, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {stats.ticketsNuevosPendientes.slice(0, 5).map((t) => (
                  <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/tareas/${t.id}`)}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--accent)", fontWeight: 600 }}>#{t.numero}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{formatDateTime(t.createdAt)}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{t.titulo}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", textAlign: "right" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontSize: 10,
                        background: "#FEF3C7",
                        color: "#92400E",
                      }}>
                        Nuevo
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.ticketsNuevosPendientes.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "12px", textAlign: "center", color: "var(--muted)" }}>Sin tickets nuevos pendientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case "resumenClienteEstado":
        return (
          <div style={{ 
            background: "#fff", 
            borderRadius: 8, 
            padding: 14, 
            border: "1px solid var(--border)",
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, flexShrink: 0 }}>Resumen Tareas x Cliente / Estado</div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)", position: "sticky", top: 0 }}>
                    <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", borderBottom: "1px solid var(--border)", position: "sticky", left: 0, background: "var(--bg-secondary)", zIndex: 1 }}>Cliente</th>
                    {stats.estados.map((estado, idx) => (
                      <th 
                        key={estado.id} 
                        style={{ 
                          padding: "6px 8px", 
                          textAlign: "center", 
                          color: "var(--muted)", 
                          borderBottom: "1px solid var(--border)",
                          minWidth: 80,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {idx} - {estado.codigo}
                      </th>
                    ))}
                    <th style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)", borderBottom: "1px solid var(--border)", fontWeight: 700, minWidth: 60 }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.resumenClienteEstado.map((row) => (
                    <tr key={row.cliente.id}>
                      <td 
                        style={{ 
                          padding: "6px 8px", 
                          borderBottom: "1px solid var(--border)", 
                          color: "var(--accent)", 
                          fontWeight: 600,
                          cursor: "pointer",
                          position: "sticky",
                          left: 0,
                          background: "#fff",
                        }}
                        onClick={() => navigate(`/config/clientes/${row.cliente.id}`)}
                      >
                        {row.cliente.codigo}
                      </td>
                      {stats.estados.map((estado) => {
                        const count = row.byEstado[estado.codigo] || 0;
                        const colors = ESTADO_COLORS[estado.codigo] || { bg: "#f3f4f6", text: "#374151" };
                        return (
                          <td 
                            key={estado.id} 
                            style={{ 
                              padding: "4px 8px", 
                              borderBottom: "1px solid var(--border)", 
                              textAlign: "center",
                              background: count > 0 ? colors.bg : "transparent",
                              color: count > 0 ? colors.text : "var(--muted)",
                              fontWeight: count > 0 ? 600 : 400,
                            }}
                          >
                            {count}
                          </td>
                        );
                      })}
                      <td style={{ 
                        padding: "6px 8px", 
                        borderBottom: "1px solid var(--border)", 
                        textAlign: "center",
                        fontWeight: 700,
                        color: "var(--accent)",
                      }}>
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  {stats.resumenClienteEstado.length === 0 && (
                    <tr>
                      <td colSpan={stats.estados.length + 2} style={{ padding: "12px", textAlign: "center", color: "var(--muted)" }}>
                        Sin datos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "ultimosComentarios":
        return (
          <div style={{ 
            width: 280, 
            flexShrink: 0, 
            background: "#fff", 
            borderRadius: 8, 
            padding: 14, 
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100%",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, flexShrink: 0 }}>Últimos Comentarios</div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {stats.latestComments.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 12 }}>Sin comentarios recientes</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stats.latestComments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "8px 10px",
                        background: c.tipo === "NOTA_INTERNA" ? "#FEF3C7" : c.tipo === "MENSAJE_CLIENTE" ? "#DBEAFE" : "#F0FDF4",
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: "pointer",
                        borderLeft: `3px solid ${c.tipo === "NOTA_INTERNA" ? "#F59E0B" : c.tipo === "MENSAJE_CLIENTE" ? "#3B82F6" : "#10B981"}`,
                      }}
                      onClick={() => navigate(`/tareas/${c.tarea.id}`)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: "#3B82F6" }}>#{c.tarea.numero}</span>
                        <span style={{ fontSize: 9, color: "var(--muted)" }}>{formatDateTime(c.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3 }}>
                        {c.creadoPorAgente?.nombre || "Cliente"} • {c.tarea.cliente.codigo}
                      </div>
                      <div style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: 1.3,
                      }}>
                        {stripHtml(c.cuerpo).substring(0, 80)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ fontSize: 16, color: "var(--muted)" }}>Cargando dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: "#FEE2E2", color: "#DC2626", padding: 16, borderRadius: 8 }}>
          {error || "Error al cargar datos"}
        </div>
      </div>
    );
  }

  const visibleWidgets = getVisibleWidgets();
  const hiddenWidgets = getHiddenWidgets();

  // Group widgets by layout position for rendering
  const topRowWidgets = visibleWidgets.filter(w =>
    ["releaseStatus", "sinAsignar", "prioridadPendientes"].includes(w.type)
  );
  const sidebarWidget = visibleWidgets.find(w => w.type === "ultimosComentarios");
  const mainWidgets = visibleWidgets.filter(w =>
    ["ticketsNuevosPendientes", "resumenClienteEstado"].includes(w.type)
  );

  return (
    <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {isEditMode ? (
            <>
              <button 
                className="btn" 
                style={{ padding: "6px 12px", fontSize: 12 }} 
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                className="btn" 
                style={{ padding: "6px 12px", fontSize: 12, background: "#FEE2E2", color: "#DC2626" }} 
                onClick={handleReset}
                disabled={saving}
              >
                Restablecer
              </button>
              <button 
                className="btn primary" 
                style={{ padding: "6px 12px", fontSize: 12 }} 
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </>
          ) : (
            <>
              {isAdmin && (
                <button 
                  className="btn" 
                  style={{ padding: "6px 12px", fontSize: 12 }} 
                  onClick={() => setIsEditMode(true)}
                >
                  Editar Layout
                </button>
              )}
              <button className="btn primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => navigate("/tareas/nueva")}>
                + Nueva Tarea
              </button>
              <button className="btn" style={{ padding: "6px 10px", fontSize: 12 }} onClick={loadStats} title="Actualizar">
                🔄
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden widgets panel (edit mode only) */}
      {isEditMode && hiddenWidgets.length > 0 && (
        <div style={{
          background: "#f9fafb",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 12,
          border: "1px dashed var(--border)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Widgets ocultos:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {hiddenWidgets.map(w => (
              <button
                key={w.id}
                className="btn"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => toggleWidgetVisibility(w.id)}
              >
                + {WIDGET_NAMES[w.type]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout: Left content + Right sidebar */}
      <div style={{ display: "flex", gap: 12, flex: 1, overflow: "hidden" }}>
        {/* Left Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
          
          {/* Top Row: Release Status + Sin Asignar + Prioridad Pendientes */}
          {topRowWidgets.length > 0 && (
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              {topRowWidgets.map((widget, idx) => (
                <WidgetWrapper
                  key={widget.id}
                  widget={widget}
                  isEditMode={isEditMode}
                  index={visibleWidgets.findIndex(w => w.id === widget.id)}
                  totalVisible={visibleWidgets.length}
                  onMoveUp={() => moveWidget(widget.id, "up")}
                  onMoveDown={() => moveWidget(widget.id, "down")}
                  onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                >
                  {renderWidgetContent(widget.type)}
                </WidgetWrapper>
              ))}
            </div>
          )}

          {/* Main widgets (tickets + resumen) */}
          {mainWidgets.map((widget, idx) => (
            <WidgetWrapper
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
              index={visibleWidgets.findIndex(w => w.id === widget.id)}
              totalVisible={visibleWidgets.length}
              onMoveUp={() => moveWidget(widget.id, "up")}
              onMoveDown={() => moveWidget(widget.id, "down")}
              onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
            >
              {renderWidgetContent(widget.type)}
            </WidgetWrapper>
          ))}
        </div>

        {/* Right Sidebar: Últimos Comentarios */}
        {sidebarWidget && (
          <WidgetWrapper
            widget={sidebarWidget}
            isEditMode={isEditMode}
            index={visibleWidgets.findIndex(w => w.id === sidebarWidget.id)}
            totalVisible={visibleWidgets.length}
            onMoveUp={() => moveWidget(sidebarWidget.id, "up")}
            onMoveDown={() => moveWidget(sidebarWidget.id, "down")}
            onToggleVisibility={() => toggleWidgetVisibility(sidebarWidget.id)}
          >
            {renderWidgetContent(sidebarWidget.type)}
          </WidgetWrapper>
        )}
      </div>
    </div>
  );
}
