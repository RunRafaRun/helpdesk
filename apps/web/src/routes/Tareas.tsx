import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import {
  listTareas,
  listClientesLookup,
  ClienteLookup,
  listAgentes,
  listEstadosTarea,
  listPrioridadesTarea,
  Tarea,
  Agente,
  EstadoTarea,
  PrioridadTarea,
  ListarTareasParams,
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
      {estado ? (
        // For estado: show code only
        <>
          {estado.codigo ?? "-"}
        </>
      ) : (
        // For prioridad or other: show text only (no icons for prioridad)
        <>
          {prioridad?.codigo ?? label ?? codigo ?? "-"}
        </>
      )}
    </span>
  );
}

export default function Tareas() {
  const navigate = useNavigate();

  const [tareas, setTareas] = React.useState<Tarea[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [clientes, setClientes] = React.useState<ClienteLookup[]>([]);
  const [agentes, setAgentes] = React.useState<Agente[]>([]);
  const [estados, setEstados] = React.useState<EstadoTarea[]>([]);
  const [prioridades, setPrioridades] = React.useState<PrioridadTarea[]>([]);

  const [filters, setFilters] = React.useState<ListarTareasParams>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = React.useState("");

  async function loadLookups() {
    try {
      const [clientesData, agentesData, estadosData, prioridadesData] = await Promise.all([
        listClientesLookup(),
        listAgentes(),
        listEstadosTarea(),
        listPrioridadesTarea(),
      ]);
      setClientes(clientesData);
      setAgentes(agentesData);
      setEstados(estadosData);
      setPrioridades(prioridadesData);
    } catch (e) {
      console.error("Error loading lookups:", e);
    }
  }

  async function loadTareas() {
    setLoading(true);
    setError(null);
    try {
      const params: ListarTareasParams = {
        ...filters,
        page,
        search: search.trim() || undefined,
      };
      const result = await listTareas(params);
      setTareas(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadLookups();
  }, []);

  React.useEffect(() => {
    loadTareas();
  }, [filters, page, search]);

  function handleFilterChange(key: keyof ListarTareasParams, value: string) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }

  function handleSearchChange(value: string) {
    setPage(1);
    setSearch(value);
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setFilters({ page: 1, limit: 20 });
  }

  const hasFilters = filters.clienteId || filters.estadoId || filters.prioridadId || filters.asignadoAId || search;

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Tareas</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn icon" onClick={loadTareas} disabled={loading} title="Refrescar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
          <button className="btn primary" onClick={() => navigate("/tareas/nueva")}>
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 180 }}>
            <div className="label">Buscar</div>
            <input
              className="input"
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="field" style={{ minWidth: 160 }}>
            <div className="label">Cliente</div>
            <select
              className="input"
              value={filters.clienteId ?? ""}
              onChange={(e) => handleFilterChange("clienteId", e.target.value)}
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ minWidth: 140 }}>
            <div className="label">Estado</div>
            <select
              className="input"
              value={filters.estadoId ?? ""}
              onChange={(e) => handleFilterChange("estadoId", e.target.value)}
            >
              <option value="">Todos</option>
              {estados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ minWidth: 120 }}>
            <div className="label">Prioridad</div>
            <select
              className="input"
              value={filters.prioridadId ?? ""}
              onChange={(e) => handleFilterChange("prioridadId", e.target.value)}
            >
              <option value="">Todas</option>
              {prioridades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ minWidth: 160 }}>
            <div className="label">Asignado a</div>
            <select
              className="input"
              value={filters.asignadoAId ?? ""}
              onChange={(e) => handleFilterChange("asignadoAId", e.target.value)}
            >
              <option value="">Todos</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button className="btn" onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="card">
        {error && <div className="small" style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="small">
            {loading ? "Cargando..." : `${total} tarea(s) encontrada(s)`}
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Número</th>
              <th>Título</th>
              <th style={{ width: 100 }}>Cliente</th>
              <th style={{ width: 100 }}>Estado</th>
              <th style={{ width: 80 }}>Prioridad</th>
              <th style={{ width: 120 }}>Asignado</th>
              <th style={{ width: 90 }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {tareas.map((t) => (
              <tr
                key={t.id}
                onClick={() => navigate(`/tareas/${t.id}`)}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <td style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 500, color: "var(--accent)" }}>
                  #{t.numero}
                </td>
                <td style={{ fontWeight: 500 }}>{t.titulo}</td>
                <td>{t.cliente?.codigo ?? "-"}</td>
                <td>
                  <Badge estado={t.estado} />
                </td>
                <td>
                  <Badge prioridad={t.prioridad} />
                </td>
                <td style={{ color: t.asignadoA ? "var(--text)" : "var(--muted)" }}>
                  {t.asignadoA?.nombre ?? "Sin asignar"}
                </td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>
                  {formatDate(t.createdAt)}
                </td>
              </tr>
            ))}
            {tareas.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#6B7280", padding: 24 }}>
                  No se encontraron tareas
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button
              className="iconBtn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              &lt;
            </button>
            <span className="small">
              Página {page} de {totalPages}
            </span>
            <button
              className="iconBtn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
