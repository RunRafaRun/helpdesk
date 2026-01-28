import React from "react";
import {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  duplicateWorkflow,
  listPlantillas,
  listAgentes,
  listClientes,
  listEstadosTarea,
  listTiposTarea,
  listPrioridadesTarea,
  listModulos,
  listReleases,
  listRoles,
  WorkflowListItem,
  WorkflowDetail,
  WorkflowCondition,
  WorkflowRecipient,
  WorkflowAction,
  WorkflowTrigger,
  WorkflowConditionField,
  WorkflowConditionOperator,
  WorkflowRecipientType,
  WorkflowActionType,
  WORKFLOW_TRIGGER_LABELS,
  CONDITION_FIELD_LABELS,
  CONDITION_OPERATOR_LABELS,
  RECIPIENT_TYPE_LABELS,
  ACTION_TYPE_LABELS,
  Plantilla,
  Agente,
  Cliente,
} from "../../lib/api";
import WildcardPicker from "../../components/WildcardPicker";

// Types for lookups
type LookupItem = { id: string; codigo?: string; nombre?: string; descripcion?: string | null };
type RoleItem = { id: string; nombre: string };

// Fields that require ID lookups
const ID_FIELDS: WorkflowConditionField[] = [
  "CLIENTE_ID",
  "ESTADO_ID",
  "TIPO_ID",
  "PRIORIDAD_ID",
  "MODULO_ID",
  "RELEASE_ID",
  "HOTFIX_ID",
  "ASIGNADO_A_ID",
  "CREADO_POR_AGENTE_ID",
  "UNIDAD_COMERCIAL_ID",
  "ESTADO_ANTERIOR_ID",
  "ESTADO_NUEVO_ID",
  "PRIORIDAD_ANTERIOR_ID",
  "PRIORIDAD_NUEVA_ID",
  "TIPO_ANTERIOR_ID",
  "TIPO_NUEVO_ID",
  "MODULO_ANTERIOR_ID",
  "MODULO_NUEVO_ID",
  "RELEASE_ANTERIOR_ID",
  "RELEASE_NUEVO_ID",
];

// Operators that don't require a value
const NO_VALUE_OPERATORS: WorkflowConditionOperator[] = ["IS_NULL", "IS_NOT_NULL"];

export default function Workflows() {
  const [items, setItems] = React.useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Filters
  const [triggerFilter, setTriggerFilter] = React.useState<WorkflowTrigger | "">("");
  const [searchFilter, setSearchFilter] = React.useState("");

  // Modal state
  const [showModal, setShowModal] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [nombre, setNombre] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [trigger, setTrigger] = React.useState<WorkflowTrigger>("TAREA_CREADA");
  const [activo, setActivo] = React.useState(true);
  const [orden, setOrden] = React.useState(0);
  const [stopOnMatch, setStopOnMatch] = React.useState(false);
  const [plantillaId, setPlantillaId] = React.useState("");
  const [asuntoCustom, setAsuntoCustom] = React.useState("");
  const [ccJefeProyecto1, setCcJefeProyecto1] = React.useState(false);
  const [ccJefeProyecto2, setCcJefeProyecto2] = React.useState(false);
  const [conditions, setConditions] = React.useState<WorkflowCondition[]>([]);
  const [recipients, setRecipients] = React.useState<WorkflowRecipient[]>([]);
  const [actions, setActions] = React.useState<WorkflowAction[]>([]);

  // Wildcard picker for asunto
  const [showAsuntoWildcardPicker, setShowAsuntoWildcardPicker] = React.useState(false);
  const asuntoInputRef = React.useRef<HTMLInputElement>(null);

  // Lookups
  const [plantillas, setPlantillas] = React.useState<Plantilla[]>([]);
  const [agentes, setAgentes] = React.useState<Agente[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [estados, setEstados] = React.useState<LookupItem[]>([]);
  const [tipos, setTipos] = React.useState<LookupItem[]>([]);
  const [prioridades, setPrioridades] = React.useState<LookupItem[]>([]);
  const [modulos, setModulos] = React.useState<LookupItem[]>([]);
  const [releases, setReleases] = React.useState<LookupItem[]>([]);
  const [roles, setRoles] = React.useState<RoleItem[]>([]);

  async function loadLookups() {
    try {
      const [pl, ag, cl, es, ti, pr, mo, re, ro] = await Promise.all([
        listPlantillas({ includeInactive: false }),
        listAgentes({ includeInactive: false }),
        listClientes({ includeInactive: false }),
        listEstadosTarea({ includeInactive: false }),
        listTiposTarea({ includeInactive: false }),
        listPrioridadesTarea({ includeInactive: false }),
        listModulos({ includeInactive: false }),
        listReleases(),
        listRoles(),
      ]);
      setPlantillas(pl);
      setAgentes(ag);
      setClientes(cl);
      setEstados(es as LookupItem[]);
      setTipos(ti as LookupItem[]);
      setPrioridades(pr as LookupItem[]);
      setModulos(mo as LookupItem[]);
      setReleases(re as LookupItem[]);
      setRoles(ro);
    } catch (e: any) {
      console.error("Error loading lookups:", e);
    }
  }

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const params: { trigger?: WorkflowTrigger; search?: string } = {};
      if (triggerFilter) params.trigger = triggerFilter;
      if (searchFilter) params.search = searchFilter;
      const data = await listWorkflows(params);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadLookups();
    loadData();
  }, [triggerFilter]);

  function resetForm() {
    setNombre("");
    setDescripcion("");
    setTrigger("TAREA_CREADA");
    setActivo(true);
    setOrden(0);
    setStopOnMatch(false);
    setPlantillaId("");
    setAsuntoCustom("");
    setCcJefeProyecto1(false);
    setCcJefeProyecto2(false);
    setConditions([]);
    setRecipients([]);
    setActions([]);
    setEditingId(null);
    setError(null);
    setShowAsuntoWildcardPicker(false);
  }

  async function handleEdit(id: string) {
    try {
      const detail = await getWorkflow(id);
      setEditingId(id);
      setNombre(detail.nombre);
      setDescripcion(detail.descripcion || "");
      setTrigger(detail.trigger);
      setActivo(detail.activo);
      setOrden(detail.orden);
      setStopOnMatch(detail.stopOnMatch);
      setPlantillaId(detail.plantillaId || "");
      setAsuntoCustom(detail.asuntoCustom || "");
      setCcJefeProyecto1(detail.ccJefeProyecto1);
      setCcJefeProyecto2(detail.ccJefeProyecto2);
      setConditions(detail.conditions);
      setRecipients(detail.recipients);
      setActions(detail.actions || []);
      setShowModal(true);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar workflow");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    // Recipients are optional if there are actions
    if (recipients.length === 0 && actions.length === 0) {
      setError("Debe agregar al menos un destinatario o una accion");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        trigger,
        activo,
        orden,
        stopOnMatch,
        plantillaId: plantillaId || undefined,
        asuntoCustom: asuntoCustom.trim() || undefined,
        ccJefeProyecto1,
        ccJefeProyecto2,
        conditions,
        recipients,
        actions,
      };

      if (editingId) {
        await updateWorkflow(editingId, payload);
        setSuccess("Workflow actualizado correctamente");
      } else {
        await createWorkflow(payload);
        setSuccess("Workflow creado correctamente");
      }
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: WorkflowListItem) {
    if (!confirm(`¿Eliminar el workflow "${item.nombre}"?`)) return;
    try {
      await deleteWorkflow(item.id);
      setSuccess("Workflow eliminado");
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Error al eliminar");
    }
  }

  async function handleToggle(item: WorkflowListItem) {
    try {
      await toggleWorkflow(item.id);
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Error al cambiar estado");
    }
  }

  async function handleDuplicate(item: WorkflowListItem) {
    try {
      await duplicateWorkflow(item.id);
      setSuccess("Workflow duplicado");
      await loadData();
    } catch (e: any) {
      setError(e?.message ?? "Error al duplicar");
    }
  }

  function addCondition() {
    setConditions([
      ...conditions,
      { field: "CLIENTE_ID", operator: "EQUALS", value: "", orGroup: 0 },
    ]);
  }

  function updateCondition(index: number, updates: Partial<WorkflowCondition>) {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  }

  function removeCondition(index: number) {
    setConditions(conditions.filter((_, i) => i !== index));
  }

  function addRecipient() {
    setRecipients([
      ...recipients,
      { recipientType: "AGENTE_ASIGNADO", value: "", isCc: false },
    ]);
  }

  function updateRecipient(index: number, updates: Partial<WorkflowRecipient>) {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], ...updates };
    setRecipients(newRecipients);
  }

  function removeRecipient(index: number) {
    setRecipients(recipients.filter((_, i) => i !== index));
  }

  function addAction() {
    setActions([
      ...actions,
      { actionType: "CAMBIAR_ESTADO", value: "", orden: actions.length },
    ]);
  }

  function updateAction(index: number, updates: Partial<WorkflowAction>) {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  }

  function removeAction(index: number) {
    setActions(actions.filter((_, i) => i !== index));
  }

  function getActionValueOptions(actionType: WorkflowActionType): LookupItem[] {
    switch (actionType) {
      case "CAMBIAR_ESTADO":
        return estados;
      case "CAMBIAR_PRIORIDAD":
        return prioridades;
      case "CAMBIAR_TIPO":
        return tipos;
      case "ASIGNAR_AGENTE":
        return agentes.map((a) => ({ id: a.id, nombre: a.nombre }));
      case "CAMBIAR_MODULO":
        return modulos;
      case "CAMBIAR_RELEASE":
        return releases;
      default:
        return [];
    }
  }

  function getConditionValueOptions(field: WorkflowConditionField): LookupItem[] {
    switch (field) {
      case "CLIENTE_ID":
        return clientes.map((c) => ({ id: c.id, codigo: c.codigo, descripcion: c.descripcion }));
      case "ESTADO_ID":
      case "ESTADO_ANTERIOR_ID":
      case "ESTADO_NUEVO_ID":
        return estados;
      case "TIPO_ID":
      case "TIPO_ANTERIOR_ID":
      case "TIPO_NUEVO_ID":
        return tipos;
      case "PRIORIDAD_ID":
      case "PRIORIDAD_ANTERIOR_ID":
      case "PRIORIDAD_NUEVA_ID":
        return prioridades;
      case "MODULO_ID":
      case "MODULO_ANTERIOR_ID":
      case "MODULO_NUEVO_ID":
        return modulos;
      case "RELEASE_ID":
      case "HOTFIX_ID":
      case "RELEASE_ANTERIOR_ID":
      case "RELEASE_NUEVO_ID":
        return releases;
      case "ASIGNADO_A_ID":
      case "CREADO_POR_AGENTE_ID":
        return agentes.map((a) => ({ id: a.id, nombre: a.nombre }));
      default:
        return [];
    }
  }

  function getRecipientValueOptions(type: WorkflowRecipientType): { id: string; label: string }[] {
    switch (type) {
      case "AGENTES_ESPECIFICOS":
        return agentes.map((a) => ({ id: a.id, label: a.nombre }));
      case "ROLES_ESPECIFICOS":
        return roles.map((r) => ({ id: r.id, label: r.nombre }));
      default:
        return [];
    }
  }

  function recipientNeedsValue(type: WorkflowRecipientType): boolean {
    return ["AGENTES_ESPECIFICOS", "ROLES_ESPECIFICOS", "EMAILS_MANUALES"].includes(type);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES");
  }

  return (
    <div className="grid">
      <div className="topbar">
        <div className="h1">Workflows de Notificaciones</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Nuevo Workflow
          </button>
          <button className="btn icon" onClick={loadData} disabled={loading} title="Refrescar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px",
            background: "#FEE2E2",
            color: "#DC2626",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "12px", cursor: "pointer" }}>
            ×
          </button>
        </div>
      )}
      {success && (
        <div
          style={{
            padding: "12px",
            background: "#D1FAE5",
            color: "#059669",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {success}
          <button
            onClick={() => setSuccess(null)}
            style={{ marginLeft: "12px", cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--muted)",
                marginBottom: "4px",
              }}
            >
              Trigger
            </label>
            <select
              className="input"
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value as WorkflowTrigger | "")}
              style={{ minWidth: "180px" }}
            >
              <option value="">Todos</option>
              {Object.entries(WORKFLOW_TRIGGER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--muted)",
                marginBottom: "4px",
              }}
            >
              Buscar
            </label>
            <input
              type="text"
              className="input"
              placeholder="Nombre del workflow..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadData()}
              style={{ width: "100%" }}
            />
          </div>
          <button className="btn primary" onClick={loadData}>
            Buscar
          </button>
          <button
            className="btn"
            onClick={() => {
              setTriggerFilter("");
              setSearchFilter("");
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            Cargando...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
            No hay workflows configurados
          </div>
        ) : (
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Trigger</th>
                <th>Condiciones</th>
                <th>Destinatarios</th>
                <th>Acciones Auto</th>
                <th>Plantilla</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.nombre}</div>
                    {item.descripcion && (
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {item.descripcion}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                      Orden: {item.orden} {item.stopOnMatch && "| Detiene"}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        background: "#EFF6FF",
                        color: "#1E40AF",
                      }}
                    >
                      {WORKFLOW_TRIGGER_LABELS[item.trigger] || item.trigger}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      {item.conditionsCount}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      {item.recipientsCount}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>
                      {item.actionsCount}
                    </span>
                  </td>
                  <td>
                    {item.plantilla ? (
                      <span style={{ fontSize: "12px" }}>{item.plantilla.codigo}</span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>-</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(item)}
                      style={{
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 500,
                        background: item.activo ? "#D1FAE5" : "#E5E7EB",
                        color: item.activo ? "#065F46" : "#374151",
                      }}
                    >
                      {item.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn small" onClick={() => handleEdit(item.id)}>
                        Editar
                      </button>
                      <button className="btn small" onClick={() => handleDuplicate(item)}>
                        Duplicar
                      </button>
                      <button
                        className="btn small"
                        onClick={() => handleDelete(item)}
                        style={{ color: "#DC2626" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div
            className="modalCard"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "900px", maxHeight: "90vh", overflow: "auto" }}
          >
            <div className="modalHeader">
              <h2>{editingId ? "Editar Workflow" : "Nuevo Workflow"}</h2>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modalBody" style={{ padding: "20px" }}>
                {error && (
                  <div
                    style={{
                      padding: "10px",
                      background: "#FEE2E2",
                      color: "#DC2626",
                      borderRadius: "6px",
                      marginBottom: "16px",
                      fontSize: "13px",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Basic Info */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div className="field">
                    <div className="label">Nombre *</div>
                    <input
                      className="input"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre del workflow"
                    />
                  </div>
                  <div className="field">
                    <div className="label">Trigger *</div>
                    <select
                      className="input"
                      value={trigger}
                      onChange={(e) => setTrigger(e.target.value as WorkflowTrigger)}
                    >
                      {Object.entries(WORKFLOW_TRIGGER_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field" style={{ marginBottom: "20px" }}>
                  <div className="label">Descripcion</div>
                  <input
                    className="input"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripcion opcional"
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 1fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <div className="field">
                    <div className="label">Orden</div>
                    <input
                      className="input"
                      type="number"
                      value={orden}
                      onChange={(e) => setOrden(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div className="field">
                    <div className="label">Estado</div>
                    <select
                      className="input"
                      value={activo ? "1" : "0"}
                      onChange={(e) => setActivo(e.target.value === "1")}
                    >
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                  </div>
                  <div className="field">
                    <div className="label">Detener al coincidir</div>
                    <select
                      className="input"
                      value={stopOnMatch ? "1" : "0"}
                      onChange={(e) => setStopOnMatch(e.target.value === "1")}
                    >
                      <option value="0">No</option>
                      <option value="1">Si</option>
                    </select>
                  </div>
                </div>

                {/* Template */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
                    Plantilla de Email
                  </h3>
                  <div
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
                  >
                    <div className="field">
                      <div className="label">Plantilla</div>
                      <select
                        className="input"
                        value={plantillaId}
                        onChange={(e) => setPlantillaId(e.target.value)}
                      >
                        <option value="">-- Seleccionar --</option>
                        {plantillas.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.codigo}
                            {p.descripcion ? ` - ${p.descripcion}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <div className="label">Asunto personalizado</div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                        <input
                          ref={asuntoInputRef}
                          className="input"
                          style={{ flex: 1 }}
                          value={asuntoCustom}
                          onChange={(e) => setAsuntoCustom(e.target.value)}
                          placeholder="Dejar vacio para usar asunto por defecto"
                        />
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            className="btn"
                            style={{ height: "100%", padding: "6px 10px", fontSize: 12 }}
                            onClick={() => setShowAsuntoWildcardPicker(!showAsuntoWildcardPicker)}
                            title="Insertar variable"
                          >
                            {"{{}}"}
                          </button>
                          {showAsuntoWildcardPicker && (
                            <WildcardPicker
                              onSelect={(token) => {
                                // Insert at cursor position
                                const input = asuntoInputRef.current;
                                if (input) {
                                  const start = input.selectionStart ?? asuntoCustom.length;
                                  const end = input.selectionEnd ?? asuntoCustom.length;
                                  const newValue = asuntoCustom.slice(0, start) + token + asuntoCustom.slice(end);
                                  setAsuntoCustom(newValue);
                                  // Set cursor after inserted token
                                  setTimeout(() => {
                                    input.focus();
                                    input.setSelectionRange(start + token.length, start + token.length);
                                  }, 0);
                                } else {
                                  setAsuntoCustom(asuntoCustom + token);
                                }
                              }}
                              onClose={() => setShowAsuntoWildcardPicker(false)}
                              position="right"
                            />
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                        Usa variables como {"{{tarea.numero}}"} para insertar datos dinamicos
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="checkbox"
                        checked={ccJefeProyecto1}
                        onChange={(e) => setCcJefeProyecto1(e.target.checked)}
                      />
                      CC a Jefe Proyecto 1
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="checkbox"
                        checked={ccJefeProyecto2}
                        onChange={(e) => setCcJefeProyecto2(e.target.checked)}
                      />
                      CC a Jefe Proyecto 2
                    </label>
                  </div>
                </div>

                {/* Conditions */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h3 style={{ fontSize: "14px", fontWeight: 600 }}>
                      Condiciones{" "}
                      <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                        (opcional - si no hay condiciones, aplica a todas las tareas)
                      </span>
                    </h3>
                    <button type="button" className="btn small" onClick={addCondition}>
                      + Agregar
                    </button>
                  </div>

                  {conditions.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "13px",
                      }}
                    >
                      Sin condiciones - este workflow se ejecutara para todas las tareas
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {conditions.map((cond, index) => (
                        <div
                          key={index}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "80px 1fr 1fr 1fr 40px",
                            gap: "8px",
                            alignItems: "center",
                            padding: "8px",
                            background: "var(--card-bg)",
                            borderRadius: "6px",
                          }}
                        >
                          <div>
                            <select
                              className="input"
                              style={{ padding: "4px 6px", fontSize: "12px" }}
                              value={cond.orGroup || 0}
                              onChange={(e) =>
                                updateCondition(index, { orGroup: parseInt(e.target.value) })
                              }
                            >
                              {[0, 1, 2, 3, 4].map((g) => (
                                <option key={g} value={g}>
                                  Grupo {g}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              className="input"
                              style={{ padding: "4px 6px", fontSize: "12px" }}
                              value={cond.field}
                              onChange={(e) =>
                                updateCondition(index, {
                                  field: e.target.value as WorkflowConditionField,
                                  value: "",
                                })
                              }
                            >
                              {Object.entries(CONDITION_FIELD_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              className="input"
                              style={{ padding: "4px 6px", fontSize: "12px" }}
                              value={cond.operator}
                              onChange={(e) =>
                                updateCondition(index, {
                                  operator: e.target.value as WorkflowConditionOperator,
                                })
                              }
                            >
                              {Object.entries(CONDITION_OPERATOR_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            {NO_VALUE_OPERATORS.includes(cond.operator) ? (
                              <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                                -
                              </span>
                            ) : ID_FIELDS.includes(cond.field) ? (
                              <select
                                className="input"
                                style={{ padding: "4px 6px", fontSize: "12px" }}
                                value={cond.value || ""}
                                onChange={(e) =>
                                  updateCondition(index, { value: e.target.value })
                                }
                              >
                                <option value="">-- Seleccionar --</option>
                                {getConditionValueOptions(cond.field).map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.codigo || opt.nombre || opt.descripcion || opt.id}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className="input"
                                style={{ padding: "4px 6px", fontSize: "12px" }}
                                value={cond.value || ""}
                                onChange={(e) =>
                                  updateCondition(index, { value: e.target.value })
                                }
                                placeholder="Valor"
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            style={{
                              border: "none",
                              background: "none",
                              color: "#DC2626",
                              cursor: "pointer",
                              fontSize: "18px",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          marginTop: "4px",
                        }}
                      >
                        Las condiciones del mismo grupo se evaluan con OR. Diferentes grupos se
                        evaluan con AND.
                      </div>
                    </div>
                  )}
                </div>

                {/* Recipients */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    padding: "16px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Destinatarios *</h3>
                    <button type="button" className="btn small" onClick={addRecipient}>
                      + Agregar
                    </button>
                  </div>

                  {recipients.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#DC2626",
                        fontSize: "13px",
                      }}
                    >
                      Debe agregar al menos un destinatario
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {recipients.map((recip, index) => (
                        <div
                          key={index}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 100px 40px",
                            gap: "8px",
                            alignItems: "center",
                            padding: "8px",
                            background: "var(--card-bg)",
                            borderRadius: "6px",
                          }}
                        >
                          <div>
                            <select
                              className="input"
                              style={{ padding: "4px 6px", fontSize: "12px" }}
                              value={recip.recipientType}
                              onChange={(e) =>
                                updateRecipient(index, {
                                  recipientType: e.target.value as WorkflowRecipientType,
                                  value: "",
                                })
                              }
                            >
                              {Object.entries(RECIPIENT_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            {!recipientNeedsValue(recip.recipientType) ? (
                              <span style={{ color: "var(--muted)", fontSize: "12px" }}>
                                -
                              </span>
                            ) : recip.recipientType === "EMAILS_MANUALES" ? (
                              <input
                                className="input"
                                style={{ padding: "4px 6px", fontSize: "12px" }}
                                value={recip.value || ""}
                                onChange={(e) =>
                                  updateRecipient(index, { value: e.target.value })
                                }
                                placeholder="email1@example.com, email2@example.com"
                              />
                            ) : (
                              <select
                                className="input"
                                style={{ padding: "4px 6px", fontSize: "12px" }}
                                value={recip.value || ""}
                                onChange={(e) =>
                                  updateRecipient(index, { value: e.target.value })
                                }
                              >
                                <option value="">-- Seleccionar --</option>
                                {getRecipientValueOptions(recip.recipientType).map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div>
                            <select
                              className="input"
                              style={{ padding: "4px 6px", fontSize: "12px" }}
                              value={recip.isCc ? "1" : "0"}
                              onChange={(e) =>
                                updateRecipient(index, { isCc: e.target.value === "1" })
                              }
                            >
                              <option value="0">Para (To)</option>
                              <option value="1">CC</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRecipient(index)}
                            style={{
                              border: "none",
                              background: "none",
                              color: "#DC2626",
                              cursor: "pointer",
                              fontSize: "18px",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    padding: "16px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <h3 style={{ fontSize: "14px", fontWeight: 600 }}>
                      Acciones Automaticas{" "}
                      <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                        (opcional - cambios automaticos a aplicar en la tarea)
                      </span>
                    </h3>
                    <button type="button" className="btn small" onClick={addAction}>
                      + Agregar
                    </button>
                  </div>

                  {actions.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "13px",
                      }}
                    >
                      Sin acciones - este workflow solo enviara notificaciones
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {actions.map((action, index) => (
                        <div
                          key={index}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 40px",
                            gap: "8px",
                            alignItems: "center",
                            padding: "8px",
                            background: "var(--card-bg)",
                            borderRadius: "6px",
                          }}
                        >
                          <div>
                            <select
                              className="input"
                              style={{ padding: "4px 6px", fontSize: "12px" }}
                              value={action.actionType}
                              onChange={(e) =>
                                updateAction(index, {
                                  actionType: e.target.value as WorkflowActionType,
                                  value: "",
                                })
                              }
                            >
                              {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              className="input"
                              style={{ padding: "4px 6px", fontSize: "12px" }}
                              value={action.value || ""}
                              onChange={(e) =>
                                updateAction(index, { value: e.target.value })
                              }
                            >
                              <option value="">-- Seleccionar valor --</option>
                              {getActionValueOptions(action.actionType).map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.codigo || opt.nombre || opt.descripcion || opt.id}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAction(index)}
                            style={{
                              border: "none",
                              background: "none",
                              color: "#DC2626",
                              cursor: "pointer",
                              fontSize: "18px",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          marginTop: "4px",
                        }}
                      >
                        Las acciones se ejecutan en orden cuando el workflow coincide. Los cambios generados por acciones no vuelven a disparar workflows (prevencion de loops).
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modalFooter">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
