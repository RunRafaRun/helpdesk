import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, DashboardStats, listPrioridadesTarea, PrioridadTarea } from "../lib/api";

// Colors for charts
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];
const ESTADO_COLORS: Record<string, string> = {
  Pendiente: "#F59E0B",
  "En Proceso": "#3B82F6",
  Resuelto: "#10B981",
  Cerrada: "#6B7280",
};
const PRIORIDAD_COLORS: Record<string, string> = {
  Urgente: "#EF4444",
  Alta: "#F97316",
  Normal: "#3B82F6",
  Baja: "#10B981",
};

function StatCard({ title, value, subtitle, color = "var(--accent)", icon }: { title: string; value: number | string; subtitle?: string; color?: string; icon?: string }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      padding: "14px 16px",
      border: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      {icon && (
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
        {subtitle && <div style={{ fontSize: 11, color: "var(--muted)" }}>{subtitle}</div>}
      </div>
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
    <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span>🚀</span> Estado de Releases
      </div>

      {/* Development Section */}
      <div style={{ marginBottom: 12 }}>
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
            padding: "8px 10px",
            border: "1px solid #F59E0B30",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#92400E" }}>
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
            padding: "8px 10px",
            border: "1px solid #10B98130",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#065F46" }}>
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

            {/* Hotfixes for production release */}
            {(produccionRelease.desarrolloHotfix || produccionRelease.produccionHotfix) && (
              <div style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: "1px dashed #10B98140",
                display: "flex",
                gap: 8,
              }}>
                {produccionRelease.produccionHotfix && (
                  <div style={{
                    flex: 1,
                    background: "#ECFDF5",
                    borderRadius: 4,
                    padding: "4px 6px",
                    border: "1px solid #10B98130",
                  }}>
                    <div style={{ fontSize: 8, color: "#065F46", fontWeight: 500 }}>HF Prod</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#065F46" }}>
                      {produccionRelease.produccionHotfix.codigo}
                    </div>
                  </div>
                )}
                {produccionRelease.desarrolloHotfix && (
                  <div style={{
                    flex: 1,
                    background: "#FFFBEB",
                    borderRadius: 4,
                    padding: "4px 6px",
                    border: "1px solid #F59E0B30",
                  }}>
                    <div style={{ fontSize: 8, color: "#92400E", fontWeight: 500 }}>HF Dev</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>
                      {produccionRelease.desarrolloHotfix.codigo}
                    </div>
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

function MiniBarChart({ data, colorMap }: { data: Array<{ label: string; value: number }>; colorMap?: Record<string, string> }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {data.map((item, i) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 70, fontSize: 11, color: "var(--text)", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.label}>
            {item.label}
          </div>
          <div style={{ flex: 1, height: 16, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                height: "100%",
                background: colorMap?.[item.label] || COLORS[i % COLORS.length],
                borderRadius: 3,
                minWidth: item.value > 0 ? 4 : 0,
              }}
            />
          </div>
          <div style={{ width: 28, fontSize: 11, fontWeight: 600, textAlign: "right" }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function stripHtml(html: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function formatPercent(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [prioridades, setPrioridades] = useState<PrioridadTarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const estadoData = stats.byEstado.map((e) => ({ label: e.estado.codigo, value: e.count }));
  const tipoData = stats.byTipo.map((t) => ({ label: t.tipo.codigo, value: t.count }));
  const clienteData = stats.byCliente.map((c) => ({ label: c.cliente.codigo, value: c.count }));
  const prioridadData = stats.byPrioridad.map((p) => ({ label: p.prioridad.codigo, value: p.count }));

  // Create dynamic color map from prioridades
  const dynamicPrioridadColors: Record<string, string> = {};
  prioridades.forEach(p => {
    if (p.color) {
      dynamicPrioridadColors[p.codigo] = p.color;
    }
  });

  const totalByEstado = stats.byEstado.reduce((sum, e) => sum + e.count, 0);
  const oldestComments = [...stats.latestComments]
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 6);

  return (
    <div style={{ padding: "12px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>Resumen de tareas y actividad</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => navigate("/tareas/nueva")}>
            + Nueva Tarea
          </button>
          <button className="btn" style={{ padding: "6px 10px", fontSize: 12 }} onClick={loadStats} title="Actualizar">
            🔄
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard title="Tareas Abiertas" value={stats.totals.abiertas} icon="📋" color="#3B82F6" />
        <StatCard title="Sin Asignar" value={stats.totals.sinAsignar} icon="⚠️" color="#F59E0B" />
        <StatCard title="Cerradas (Total)" value={stats.totals.cerradas} icon="✅" color="#10B981" />
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12 }}>
        {/* Left Column - Tables */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Tickets Nuevos */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Tickets Nuevos</div>
              <button className="btn" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/tareas")}>Ver todo</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 90, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>TICKET#</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 90, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>ANTIG.</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>TITULO</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 100, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {stats.latestComments.slice(0, 5).map((c) => (
                  <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/tareas/${c.tarea.id}`)}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--accent)", fontWeight: 600 }}>#{c.tarea.numero}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{formatDateTime(c.createdAt)}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.tarea.titulo}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>Nuevo</td>
                  </tr>
                ))}
                {stats.latestComments.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "12px", textAlign: "center", color: "var(--muted)" }}>Sin tickets nuevos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen por Estado */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Resumen de Tareas por Estado</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>ESTADO</th>
                  <th style={{ padding: "6px 8px", textAlign: "right", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>TOTAL</th>
                  <th style={{ padding: "6px 8px", textAlign: "right", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>%</th>
                </tr>
              </thead>
              <tbody>
                {stats.byEstado.map((e) => (
                  <tr key={e.estado.codigo}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>{e.estado.codigo}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 600 }}>{e.count}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", textAlign: "right", color: "var(--muted)" }}>{formatPercent(e.count, totalByEstado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Backlog más antiguo */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Backlog más antiguo</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 90, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>TICKET#</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 120, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>ULT. MOV.</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>TITULO</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", width: 90, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>CLIENTE</th>
                </tr>
              </thead>
              <tbody>
                {oldestComments.map((c) => (
                  <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/tareas/${c.tarea.id}`)}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--accent)", fontWeight: 600 }}>#{c.tarea.numero}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>{formatDateTime(c.createdAt)}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.tarea.titulo}</td>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>{c.tarea.cliente.codigo}</td>
                  </tr>
                ))}
                {oldestComments.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "12px", textAlign: "center", color: "var(--muted)" }}>Sin backlog antiguo</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Summary / Panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Estado por Estado (compact) */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tareas por Estado</div>
            <MiniBarChart data={estadoData} colorMap={ESTADO_COLORS} />
          </div>

          {/* Prioridad */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tareas por Prioridad</div>
            <MiniBarChart data={prioridadData} colorMap={dynamicPrioridadColors} />
          </div>

          {/* Latest Comments */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)", flex: 1, minHeight: 180, maxHeight: 300, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Últimos Comentarios</div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {stats.latestComments.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 12 }}>Sin comentarios recientes</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {stats.latestComments.slice(0, 6).map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "6px 8px",
                        background: c.tipo === "NOTA_INTERNA" ? "#FEF3C7" : c.tipo === "MENSAJE_CLIENTE" ? "#DBEAFE" : "#F0FDF4",
                        borderRadius: 5,
                        fontSize: 11,
                        cursor: "pointer",
                        borderLeft: `3px solid ${c.tipo === "NOTA_INTERNA" ? "#F59E0B" : c.tipo === "MENSAJE_CLIENTE" ? "#3B82F6" : "#10B981"}`,
                      }}
                      onClick={() => navigate(`/tareas/${c.tarea.id}`)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, color: "#3B82F6" }}>#{c.tarea.numero}</span>
                        <span style={{ fontSize: 9, color: "var(--muted)" }}>{formatDateTime(c.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>
                        {c.creadoPorAgente?.nombre || "Cliente"} • {c.tarea.cliente.codigo}
                      </div>
                      <div style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                      }}>
                        {stripHtml(c.cuerpo).substring(0, 60)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Release Status Panel */}
          <ReleaseStatusPanel releaseStatus={stats.releaseStatus} />
        </div>
      </div>

      {/* Quick Link to Tasks */}
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <button
          className="btn"
          style={{ fontSize: 12 }}
          onClick={() => navigate("/tareas")}
        >
          Ver Todas las Tareas →
        </button>
      </div>
    </div>
  );
}
