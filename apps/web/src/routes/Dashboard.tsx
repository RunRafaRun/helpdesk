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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard title="Tareas Abiertas" value={stats.totals.abiertas} icon="📋" color="#3B82F6" />
        <StatCard title="Sin Asignar" value={stats.totals.sinAsignar} icon="⚠️" color="#F59E0B" />
        <StatCard title="Cerradas (Total)" value={stats.totals.cerradas} icon="✅" color="#10B981" />
        {stats.latestRelease && (
          <StatCard
            title="Último Release"
            value={stats.latestRelease.codigo}
            subtitle={stats.latestRelease.hotfixes?.[0] ? `HF: ${stats.latestRelease.hotfixes[0].codigo}` : undefined}
            icon="🚀"
            color="#8B5CF6"
          />
        )}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 12 }}>
        {/* Left Column - Charts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* By Estado */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tareas por Estado</div>
            <MiniBarChart data={estadoData} colorMap={ESTADO_COLORS} />
          </div>

          {/* By Tipo */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tareas por Tipo</div>
            <MiniBarChart data={tipoData} />
          </div>
        </div>

        {/* Middle Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* By Prioridad */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Tareas por Prioridad</div>
            <MiniBarChart data={prioridadData} colorMap={dynamicPrioridadColors} />
          </div>

          {/* By Cliente (Top 10) */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Top 10 Clientes</div>
            <MiniBarChart data={clienteData} />
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Next Releases */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Próximos Releases</div>
            {stats.nextReleases.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: 12 }}>Sin releases planificados</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {stats.nextReleases.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: "6px 8px",
                      background: "#F9FAFB",
                      borderRadius: 5,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/clientes/${r.cliente.codigo}/ficha`)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: "#3B82F6" }}>{r.cliente.codigo}</span>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{formatDate(r.fechaPrevista)}</span>
                    </div>
                    <div style={{ marginTop: 1 }}>
                      <span style={{ fontWeight: 500 }}>{r.release.codigo}</span>
                      {r.hotfix && <span style={{ color: "var(--muted)" }}> / {r.hotfix.codigo}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
