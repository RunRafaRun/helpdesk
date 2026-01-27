import React from "react";
import { useNavigate } from "react-router-dom";
import {
  createTarea,
  listUnidades,
  listTiposTarea,
  listPrioridadesTarea,
  listEstadosTarea,
  getClienteLatestReleasePlan,
  listClientesLookup,
  listModulosLookup,
  listReleasesLookup,
  ClienteLookup,
  ModuloLookup,
  TipoTarea,
  PrioridadTarea,
  EstadoTarea,
  Release,
  Hotfix,
} from "../lib/api";
import TipTapEditor from "../components/TipTapEditor";
import { useAuth } from "../lib/auth";



type UnidadComercial = {
  id: string;
  codigo: string;
  descripcion?: string;
  scope: string;
};

export default function NuevaTarea() {
  const navigate = useNavigate();
  const { me } = useAuth();

  const [clientes, setClientes] = React.useState<ClienteLookup[]>([]);
  const [unidades, setUnidades] = React.useState<UnidadComercial[]>([]);
  const [modulos, setModulos] = React.useState<ModuloLookup[]>([]);
  const [tipos, setTipos] = React.useState<TipoTarea[]>([]);
  const [prioridades, setPrioridades] = React.useState<PrioridadTarea[]>([]);
  const [estados, setEstados] = React.useState<EstadoTarea[]>([]);
  const [releases, setReleases] = React.useState<Release[]>([]);
  const [hotfixes, setHotfixes] = React.useState<Hotfix[]>([]);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [form, setForm] = React.useState({
    titulo: "",
    clienteCodigo: "",
    unidadComercialCodigo: "",
    moduloCodigo: "",
    tipoCodigo: "",
    prioridadCodigo: "",
    estadoCodigo: "",
    releaseId: "",
    hotfixId: "",
    mensajeInicial: "",
  });

  const [loadingUnidades, setLoadingUnidades] = React.useState(false);
  const [loadingReleasePlan, setLoadingReleasePlan] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Group clients: "Mis clientes" (where current agent is JP1 or JP2) first, then "Resto Clientes"
  const { misClientes, restoClientes } = React.useMemo(() => {
    if (!me?.usuario) {
      return { misClientes: [], restoClientes: clientes };
    }
    const currentUsuario = me.usuario.toLowerCase();
    const mis: ClienteLookup[] = [];
    const resto: ClienteLookup[] = [];
    
    for (const c of clientes) {
      const jp1 = c.jefeProyecto1?.toLowerCase();
      const jp2 = c.jefeProyecto2?.toLowerCase();
      if (jp1 === currentUsuario || jp2 === currentUsuario) {
        mis.push(c);
      } else {
        resto.push(c);
      }
    }
    return { misClientes: mis, restoClientes: resto };
  }, [clientes, me]);

  async function loadLookups() {
    try {
      const [clientesData, modulosData, tiposData, prioridadesData, estadosData, releasesData] = await Promise.all([
        listClientesLookup(),
        listModulosLookup(),
        listTiposTarea(),
        listPrioridadesTarea(),
        listEstadosTarea(),
        listReleasesLookup(),
      ]);
      setClientes(clientesData);
      setModulos(modulosData);
      setTipos(tiposData);
      setPrioridades(prioridadesData);
      setEstados(estadosData);
      setReleases(releasesData.filter((r) => r.rama === "PRODUCCION"));

      // Set default values from lookups (porDefecto = true)
      const defaultTipo = tiposData.find((t) => t.porDefecto);
      const defaultPrioridad = prioridadesData.find((p) => p.porDefecto);
      const defaultEstado = estadosData.find((e) => e.porDefecto);
      setForm((prev) => ({
        ...prev,
        tipoCodigo: defaultTipo?.codigo || (tiposData[0]?.codigo ?? ""),
        prioridadCodigo: defaultPrioridad?.codigo || (prioridadesData[0]?.codigo ?? ""),
        estadoCodigo: defaultEstado?.codigo || (estadosData[0]?.codigo ?? ""),
      }));
    } catch (e) {
      console.error("Error loading lookups:", e);
    }
  }

  async function loadUnidades(clienteCodigo: string) {
    if (!clienteCodigo) {
      setUnidades([]);
      return;
    }
    const cliente = clientes.find((c) => c.codigo === clienteCodigo);
    if (!cliente) return;

    setLoadingUnidades(true);
    try {
      const data = await listUnidades(cliente.id);
      setUnidades(data);
      // Auto-select if only one
      if (data.length === 1) {
        setForm((prev) => ({ ...prev, unidadComercialCodigo: data[0].codigo }));
      }
    } catch (e) {
      console.error("Error loading unidades:", e);
      setUnidades([]);
    } finally {
      setLoadingUnidades(false);
    }
  }

  async function loadLatestReleasePlan(clienteCodigo: string) {
    if (!clienteCodigo) {
      setForm((prev) => ({ ...prev, releaseId: "", hotfixId: "" }));
      setHotfixes([]);
      return;
    }
    const cliente = clientes.find((c) => c.codigo === clienteCodigo);
    if (!cliente) return;

    setLoadingReleasePlan(true);
    try {
      const latestPlan = await getClienteLatestReleasePlan(cliente.id);
      if (latestPlan) {
        // Auto-populate with latest release/hotfix
        setForm((prev) => ({
          ...prev,
          releaseId: latestPlan.releaseId,
          hotfixId: latestPlan.hotfixId || "",
        }));
        // Load hotfixes for this release (only PRODUCCION)
        const release = releases.find((r) => r.id === latestPlan.releaseId);
        if (release?.hotfixes) {
          setHotfixes(release.hotfixes.filter((h) => h.rama === "PRODUCCION"));
        }
      } else {
        setForm((prev) => ({ ...prev, releaseId: "", hotfixId: "" }));
        setHotfixes([]);
      }
    } catch (e) {
      console.error("Error loading latest release plan:", e);
    } finally {
      setLoadingReleasePlan(false);
    }
  }

  React.useEffect(() => {
    loadLookups();
  }, []);

  React.useEffect(() => {
    loadUnidades(form.clienteCodigo);
    loadLatestReleasePlan(form.clienteCodigo);
  }, [form.clienteCodigo, clientes]);

  // Update hotfixes when release changes (only PRODUCCION)
  React.useEffect(() => {
    if (form.releaseId) {
      const release = releases.find((r) => r.id === form.releaseId);
      if (release?.hotfixes) {
        setHotfixes(release.hotfixes.filter((h) => h.rama === "PRODUCCION"));
      } else {
        setHotfixes([]);
      }
    } else {
      setHotfixes([]);
    }
  }, [form.releaseId, releases]);

  async function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();
    setError(null);

    if (!form.titulo.trim()) {
      setError("El título es obligatorio");
      return;
    }
    if (!form.clienteCodigo) {
      setError("Debe seleccionar un cliente");
      return;
    }
    if (!form.unidadComercialCodigo) {
      setError("Debe seleccionar una unidad comercial");
      return;
    }
    // Strip HTML tags to check if there's actual content
    const mensajeText = form.mensajeInicial.replace(/<[^>]*>/g, "").trim();
    if (!mensajeText) {
      setError("El mensaje inicial es obligatorio");
      return;
    }

    setSubmitting(true);
    try {
      const tarea = await createTarea({
        titulo: form.titulo.trim(),
        clienteCodigo: form.clienteCodigo,
        unidadComercialCodigo: form.unidadComercialCodigo,
        mensajeInicial: form.mensajeInicial,
        moduloCodigo: form.moduloCodigo || undefined,
        tipoCodigo: form.tipoCodigo || undefined,
        prioridadCodigo: form.prioridadCodigo || undefined,
        estadoCodigo: form.estadoCodigo || undefined,
        releaseId: form.releaseId || undefined,
        hotfixId: form.hotfixId || undefined,
      });
      navigate(`/tareas/${tarea.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Error al crear la tarea");
      setSubmitting(false);
    }
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...files]);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Nueva Tarea</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => navigate("/")} disabled={submitting}>
            Cancelar
          </button>
          <button className="btn primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creando..." : "Crear Tarea"}
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: 12, backgroundColor: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, marginBottom: 16, color: "#DC2626" }}>
              {error}
            </div>
          )}

          {/* Title input - large, minimal styling */}
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Título de la tarea..."
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              style={{
                width: "100%",
                fontSize: 24,
                fontWeight: 600,
                padding: "12px 0",
                border: "none",
                borderBottom: "2px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                outline: "none",
              }}
            />
          </div>

          {/* Form grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div className="field">
              <div className="label">Cliente *</div>
              <select
                className="input"
                value={form.clienteCodigo}
                onChange={(e) => setForm({ ...form, clienteCodigo: e.target.value, unidadComercialCodigo: "" })}
              >
                <option value="">-- Seleccionar cliente --</option>
                {misClientes.length > 0 && (
                  <optgroup label="Mis clientes">
                    {misClientes.map((c) => (
                      <option key={c.id} value={c.codigo}>
                        {c.codigo} {c.descripcion ? `- ${c.descripcion}` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                {restoClientes.length > 0 && (
                  <optgroup label={misClientes.length > 0 ? "Resto clientes" : "Clientes"}>
                    {restoClientes.map((c) => (
                      <option key={c.id} value={c.codigo}>
                        {c.codigo} {c.descripcion ? `- ${c.descripcion}` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="field">
              <div className="label">Unidad Comercial *</div>
              <select
                className="input"
                value={form.unidadComercialCodigo}
                onChange={(e) => setForm({ ...form, unidadComercialCodigo: e.target.value })}
                disabled={!form.clienteCodigo || loadingUnidades}
              >
                <option value="">
                  {loadingUnidades ? "Cargando..." : !form.clienteCodigo ? "Seleccione cliente primero" : "-- Seleccionar U.C. --"}
                </option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.codigo}>
                    {u.codigo} {u.descripcion ? `- ${u.descripcion}` : ""} ({u.scope})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">Módulo</div>
              <select
                className="input"
                value={form.moduloCodigo}
                onChange={(e) => setForm({ ...form, moduloCodigo: e.target.value })}
              >
                <option value="">-- Sin módulo --</option>
                {modulos.map((m) => (
                  <option key={m.id} value={m.codigo}>
                    {m.codigo} {m.descripcion ? `- ${m.descripcion}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">Tipo</div>
              <select
                className="input"
                value={form.tipoCodigo}
                onChange={(e) => setForm({ ...form, tipoCodigo: e.target.value })}
              >
                {tipos.map((t) => (
                  <option key={t.id} value={t.codigo}>
                    {t.codigo}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">Prioridad</div>
              <select
                className="input"
                value={form.prioridadCodigo}
                onChange={(e) => setForm({ ...form, prioridadCodigo: e.target.value })}
              >
                {prioridades.map((p) => (
                  <option key={p.id} value={p.codigo}>
                    {p.codigo}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">Estado</div>
              <select
                className="input"
                value={form.estadoCodigo}
                onChange={(e) => setForm({ ...form, estadoCodigo: e.target.value })}
              >
                {estados.map((e) => (
                  <option key={e.id} value={e.codigo}>
                    {e.codigo}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">
                Release {loadingReleasePlan && <span style={{ color: "var(--muted)", fontSize: 12 }}>(cargando...)</span>}
              </div>
              <select
                className="input"
                value={form.releaseId}
                onChange={(e) => setForm({ ...form, releaseId: e.target.value, hotfixId: "" })}
              >
                <option value="">-- Sin release --</option>
                {releases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.codigo} {r.descripcion ? `- ${r.descripcion}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="label">Hotfix</div>
              <select
                className="input"
                value={form.hotfixId}
                onChange={(e) => setForm({ ...form, hotfixId: e.target.value })}
                disabled={!form.releaseId || hotfixes.length === 0}
              >
                <option value="">-- Sin hotfix --</option>
                {hotfixes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.codigo} {h.descripcion ? `- ${h.descripcion}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message editor */}
          <div className="field" style={{ marginBottom: 24 }}>
            <div className="label">Mensaje Inicial *</div>
            <TipTapEditor
              content={form.mensajeInicial}
              onChange={(html) => setForm({ ...form, mensajeInicial: html })}
              placeholder="Describe el problema o solicitud..."
            />
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>Adjuntos</div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              style={{ display: "none" }}
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: 24,
                border: "2px dashed var(--border)",
                borderRadius: 8,
                textAlign: "center",
                color: "var(--muted)",
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "var(--bg-secondary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Arrastra archivos aquí o haz clic para seleccionar</div>
              <div className="small" style={{ marginTop: 4 }}>Soporta múltiples archivos</div>
            </div>

            {attachments.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--bg-secondary)",
                      borderRadius: 6,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span style={{ fontSize: 13 }}>{file.name}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeAttachment(index); }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger)",
                        cursor: "pointer",
                        padding: 4,
                      }}
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
