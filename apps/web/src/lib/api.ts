export type Me = { id: string; usuario: string; role: string; roles: string[]; permisos: string[]; nombre?: string; avatar?: string | null } | null;

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem("accessToken");
  else localStorage.setItem("accessToken", token);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers ?? {});
  headers.set("accept", "application/json");
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as any;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message ?? res.statusText ?? "Error";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data as T;
}

export async function login(usuario: string, password: string) {
  const data = await request<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
  setToken(data.accessToken);
  return data;
}

export async function me(): Promise<Me> {
  try {
    return await request<Me>("/auth/me");
  } catch {
    return null;
  }
}

export type Agente = { id: string; nombre: string; usuario: string; email?: string | null; role: "ADMIN" | "AGENTE"; activo: boolean; createdAt: string; avatar?: string | null };

export async function listAgentes(opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<Agente[]>(`/admin/agentes${qs}`);
}

export async function createAgente(input: { nombre: string; usuario: string; password: string; role?: "ADMIN" | "AGENTE"; email?: string; activo?: boolean; avatar?: string | null }) {
  return request<Agente>("/admin/agentes", { method: "POST", body: JSON.stringify(input) });
}

export async function updateAgente(id: string, input: { nombre?: string; usuario?: string; password?: string; role?: "ADMIN" | "AGENTE"; email?: string | null; activo?: boolean; avatar?: string | null }, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<Agente>(`/admin/agentes/${id}${qs}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteAgente(id: string, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<void>(`/admin/agentes/${id}${qs}`, { method: "DELETE" });
}

export type Cliente = {
  id: string;
  codigo: string;
  descripcion?: string | null;
  jefeProyecto1?: string | null;
  jefeProyecto2?: string | null;
  licenciaTipo?: "AAM" | "PPU" | null;
  currentRelease?: string | null;
  activo?: boolean;
};

export async function listClientes(opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<Cliente[]>(`/admin/clientes${qs}`);
}

export async function createCliente(input: {
  codigo: string;
  descripcion?: string;
  jefeProyecto1?: string | null;
  jefeProyecto2?: string | null;
  licenciaTipo?: "AAM" | "PPU" | null;
  activo?: boolean;
}) {
  return request<Cliente>("/admin/clientes", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCliente(id: string, input: {
  codigo?: string;
  descripcion?: string | null;
  jefeProyecto1?: string | null;
  jefeProyecto2?: string | null;
  licenciaTipo?: "AAM" | "PPU" | null;
  activo?: boolean;
}, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<Cliente>(`/admin/clientes/${id}${qs}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteCliente(id: string, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<void>(`/admin/clientes/${id}${qs}`, { method: "DELETE" });
}

export async function createUnidad(clienteId: string, input: { codigo: string; descripcion?: string; scope: "HOTEL" | "CENTRAL" | "TODOS"; activo?: boolean }) {
  return request<any>(`/admin/clientes/${clienteId}/unidades`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateUnidad(clienteId: string, unidadId: string, input: { codigo?: string; descripcion?: string | null; scope?: "HOTEL" | "CENTRAL" | "TODOS"; activo?: boolean }) {
  return request<any>(`/admin/clientes/${clienteId}/unidades/${unidadId}`, { method: "PUT", body: JSON.stringify(input) });
}


export async function getCliente(id: string) {
  return request<any>(`/admin/clientes/${id}`);
}

export async function listUnidades(clienteId: string, opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<any[]>(`/admin/clientes/${clienteId}/unidades${qs}`);
}

export async function listUsuariosCliente(clienteId: string, opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<any[]>(`/admin/clientes/${clienteId}/usuarios${qs}`);
}



export type ClienteContactoDto = {
  nombre: string;
  cargo?: string | null;
  email?: string | null;
  movil?: string | null;
  principal?: boolean;
  notas?: string | null;
  activo?: boolean;
};

export async function listContactos(clienteId: string, opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<any[]>(`/admin/clientes/${clienteId}/contactos${qs}`);
}

export async function createContacto(clienteId: string, dto: ClienteContactoDto) {
  return request<any>(`/admin/clientes/${clienteId}/contactos`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateContacto(clienteId: string, contactoId: string, dto: ClienteContactoDto) {
  return request<any>(`/admin/clientes/${clienteId}/contactos/${contactoId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deactivateContacto(clienteId: string, contactoId: string) {
  return request<any>(`/admin/clientes/${clienteId}/contactos/${contactoId}`, { method: "DELETE" });
}

export async function listClienteSoftware(clienteId: string) {
  return request<any[]>(`/admin/clientes/${clienteId}/software`);
}

export async function listClienteConexiones(clienteId: string) {
  return request<any[]>(`/admin/clientes/${clienteId}/conexiones`);
}

export async function listClienteCentrosTrabajo(clienteId: string) {
  return request<any[]>(`/admin/clientes/${clienteId}/centros-trabajo`);
}

export async function listClienteReleasesPlan(clienteId: string) {
  return request<any[]>(`/clientes/${clienteId}/releases-plan`);
}

export async function listClienteComentarios(clienteId: string) {
  return request<any[]>(`/clientes/${clienteId}/comentarios`);
}

export interface DashboardStats {
  totals: {
    abiertas: number;
    cerradas: number;
    sinAsignar: number;
    pendientes: number;
  };
  byEstado: Array<{ estado: { codigo: string; id: string | null }; count: number }>;
  byTipo: Array<{ tipo: { codigo: string; id: string | null }; count: number }>;
  byCliente: Array<{ cliente: { codigo: string; descripcion?: string; id: string | null }; count: number }>;
  byPrioridad: Array<{ prioridad: { codigo: string; id: string | null }; count: number }>;
  byPrioridadPendientes: Array<{ prioridad: { codigo: string; id: string | null }; count: number }>;
  ticketsNuevosPendientes: Array<{
    id: string;
    numero: string;
    titulo: string;
    createdAt: string;
    cliente: { codigo: string };
    estado: { codigo: string } | null;
    prioridad: { codigo: string; color?: string | null };
  }>;
  resumenClienteEstado: Array<{
    cliente: { id: string; codigo: string };
    byEstado: Record<string, number>;
    total: number;
  }>;
  estados: Array<{ id: string; codigo: string; orden: number }>;
  latestComments: Array<{
    id: string;
    tipo: string;
    cuerpo: string;
    createdAt: string;
    tarea: { id: string; numero: string; titulo: string; cliente: { codigo: string } };
    creadoPorAgente?: { nombre: string };
  }>;
  nextReleases: Array<{
    id: string;
    fechaPrevista: string;
    cliente: { codigo: string; descripcion: string };
    release: { codigo: string };
    hotfix?: { codigo: string };
    agente?: { nombre: string };
  }>;
  latestRelease?: {
    codigo: string;
    hotfixes: Array<{ codigo: string }>;
  };
  releaseStatus?: {
    desarrolloRelease: {
      id: string;
      codigo: string;
      descripcion?: string | null;
      rama: RamaTipo;
    } | null;
    produccionRelease: {
      id: string;
      codigo: string;
      descripcion?: string | null;
      rama: RamaTipo;
      desarrolloHotfix: {
        id: string;
        codigo: string;
        descripcion?: string | null;
        rama: RamaTipo;
      } | null;
      produccionHotfix: {
        id: string;
        codigo: string;
        descripcion?: string | null;
        rama: RamaTipo;
      } | null;
    } | null;
  };
}

export async function getDashboardStats() {
  return request<DashboardStats>("/tareas/dashboard");
}

// Site configuration
export interface SiteConfig {
  siteName: string;
  siteUrl: string;
  siteLogo: string;
  sslCertificate: string;
  sslKey: string;
}

export async function getSiteConfig() {
  return request<SiteConfig>("/admin/configuracion/site");
}

export async function updateSiteConfig(config: Partial<SiteConfig>) {
  return request<SiteConfig>("/admin/configuracion/site", {
    method: "PUT",
    body: JSON.stringify(config),
  });
}

export type Modulo = { id: string; codigo: string; descripcion?: string | null; activo: boolean; createdAt: string };

export async function listModulos(opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<Modulo[]>(`/admin/modulos${qs}`);
}

export async function createModulo(input: { codigo: string; descripcion?: string; activo?: boolean }) {
  return request<Modulo>("/admin/modulos", { method: "POST", body: JSON.stringify(input) });
}

export async function updateModulo(id: string, input: { codigo?: string; descripcion?: string; activo?: boolean }, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<Modulo>(`/admin/modulos/${id}${qs}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteModulo(id: string, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<void>(`/admin/modulos/${id}${qs}`, { method: "DELETE" });
}

export async function listRoles() {
  return request<any[]>("/admin/rbac/roles");
}

export async function listPermisos() {
  return request<{ codigo: string }[]>("/admin/rbac/permisos");
}

export async function createRole(input: { codigo: string; nombre: string; descripcion?: string }) {
  return request<any>("/admin/rbac/roles", { method: "POST", body: JSON.stringify(input) });
}

export async function setRolePermisos(roleId: string, permisos: string[]) {
  return request<any>(`/admin/rbac/roles/${roleId}/permisos`, { method: "PUT", body: JSON.stringify({ permisos }) });
}

export async function setAgenteRoles(agenteId: string, roleIds: string[]) {
  return request<any>(`/admin/rbac/agentes/${agenteId}/roles`, { method: "PUT", body: JSON.stringify({ roleIds }) });
}


export async function createUsuarioCliente(clienteId: string, dto: {
  nombre: string;
  usuario: string;
  password: string;
  email?: string | null;
  telefono?: string | null;
  tipo?: string | null;
  recibeNotificaciones?: boolean;
  recibeTodasLasTareas?: boolean;
  activo?: boolean;
}) {
  return request<any>(`/admin/clientes/${clienteId}/usuarios`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateUsuarioCliente(clienteId: string, usuarioId: string, dto: {
  nombre?: string;
  usuario?: string;
  password?: string;
  email?: string | null;
  telefono?: string | null;
  tipo?: string | null;
  recibeNotificaciones?: boolean;
  recibeTodasLasTareas?: boolean;
  activo?: boolean;
}) {
  return request<any>(`/admin/clientes/${clienteId}/usuarios/${usuarioId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

// Releases and Hotfixes
export type RamaTipo = "DESARROLLO" | "PRODUCCION";

export type Hotfix = {
  id: string;
  codigo: string;
  descripcion?: string | null;
  rama: RamaTipo;
  releaseId: string;
};

export type Release = {
  id: string;
  codigo: string;
  descripcion?: string | null;
  rama: RamaTipo;
  hotfixes: Hotfix[];
};

export type ReleaseConfirmationResponse = {
  requiresConfirmation: true;
  existingDesarrolloRelease?: Release;
  existingDesarrolloHotfix?: Hotfix;
  message: string;
};

export function isReleaseConfirmationResponse(obj: any): obj is ReleaseConfirmationResponse {
  return obj && obj.requiresConfirmation === true;
}

export async function listReleases() {
  return request<Release[]>("/admin/releases");
}

export async function createRelease(input: { codigo: string; descripcion?: string; rama?: RamaTipo; confirmMoveToProduccion?: boolean }) {
  return request<Release | ReleaseConfirmationResponse>("/admin/releases", { method: "POST", body: JSON.stringify(input) });
}

export async function updateRelease(id: string, input: { codigo?: string; descripcion?: string; rama?: RamaTipo; confirmMoveToProduccion?: boolean }) {
  return request<Release | ReleaseConfirmationResponse>(`/admin/releases/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteRelease(id: string) {
  return request<void>(`/admin/releases/${id}`, { method: "DELETE" });
}

export async function createHotfix(releaseId: string, input: { codigo: string; descripcion?: string; rama?: RamaTipo; confirmMoveToProduccion?: boolean }) {
  return request<Hotfix | ReleaseConfirmationResponse>(`/admin/releases/${releaseId}/hotfixes`, { method: "POST", body: JSON.stringify(input) });
}

export async function updateHotfix(releaseId: string, hotfixId: string, input: { codigo?: string; descripcion?: string; rama?: RamaTipo; confirmMoveToProduccion?: boolean }) {
  return request<Hotfix | ReleaseConfirmationResponse>(`/admin/releases/${releaseId}/hotfixes/${hotfixId}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteHotfix(releaseId: string, hotfixId: string) {
  return request<void>(`/admin/releases/${releaseId}/hotfixes/${hotfixId}`, { method: "DELETE" });
}

// Client Release Plan - get latest installed release for a client
export type ClienteReleasePlan = {
  id: string;
  clienteId: string;
  releaseId: string;
  hotfixId: string | null;
  fechaPrevista: string | null;
  fechaInstalada: string | null;
  estado: "PLANIFICADO" | "INSTALADO" | "CANCELADO";
  release: { id: string; codigo: string; descripcion?: string | null };
  hotfix?: { id: string; codigo: string; descripcion?: string | null } | null;
};

export async function getClienteLatestReleasePlan(clienteId: string): Promise<ClienteReleasePlan | null> {
  return request<ClienteReleasePlan | null>(`/clientes/${clienteId}/releases-plan/latest`);
}

// Mail Configuration
export type TipoSeguridad = "NINGUNO" | "TLS" | "SSL" | "AZURE";

export type MailConfig = {
  id: string | null;
  tipoSeguridad: TipoSeguridad;
  urlServidor: string | null;
  puerto: number | null;
  cuentaMail: string | null;
  usuarioMail: string | null;
  passwordMail: string | null;
  firmaHtml?: string | null;
  azureClientId: string | null;
  azureTenantId: string | null;
  azureClientSecret: string | null;
  azureConnected: boolean;
};

export async function getMailConfig() {
  return request<MailConfig>("/admin/configuracion/mail");
}

export async function updateMailConfig(input: {
  tipoSeguridad: TipoSeguridad;
  urlServidor?: string;
  puerto?: number;
  cuentaMail?: string;
  usuarioMail?: string;
  passwordMail?: string;
  firmaHtml?: string | null;
  azureClientId?: string;
  azureTenantId?: string;
  azureClientSecret?: string;
}) {
  return request<any>("/admin/configuracion/mail", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function testMailConnection() {
  return request<{ success: boolean; error?: string }>("/admin/configuracion/mail/test", {
    method: "POST",
  });
}

export async function connectAzure() {
  return request<{ success: boolean; message?: string; error?: string }>("/admin/configuracion/mail/azure-connect", {
    method: "POST",
  });
}

// Notificaciones Masivas
export type Adjunto = {
  nombre: string;
  tipo: string;
  datos: string; // Base64
};

export type NotificacionMasiva = {
  id: string;
  asunto: string;
  cuerpoHtml: string;
  cuerpoTexto?: string;
  clienteIds: string[];
  emailsManuales: string[];
  emailsTo: string[];
  emailsCc: string[];
  roleCcId?: string;
  adjuntos?: Adjunto[];
  programadoAt?: string;
  enviadoPor: string;
  agente: { id: string; nombre: string; usuario: string };
  estado: string;
  enviados: number;
  errores: number;
  logEnvio?: string;
  createdAt: string;
  enviadoAt?: string;
};

export async function listNotificaciones() {
  return request<NotificacionMasiva[]>("/admin/notificaciones");
}

export async function getNotificacion(id: string) {
  return request<NotificacionMasiva>(`/admin/notificaciones/${id}`);
}

export async function sendNotificacion(input: {
  clienteIds?: string[];
  emailsManuales?: string[];
  roleCcId?: string;
  asunto: string;
  cuerpoHtml: string;
  cuerpoTexto?: string;
  adjuntos?: Adjunto[];
  programadoAt?: string;
}) {
  return request<{
    success: boolean;
    notificacion?: NotificacionMasiva;
    destinatarios?: number;
    cc?: number;
    error?: string;
    scheduled?: boolean;
  }>("/admin/notificaciones/send", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Tareas (Tasks)
export type TipoTarea = {
  id: string;
  codigo: string;
  descripcion?: string;
  orden: number;
  porDefecto: boolean;
  activo?: boolean;
};

export type EstadoTarea = {
  id: string;
  codigo: string;
  descripcion?: string;
  orden: number;
  porDefecto: boolean;
  activo?: boolean;
};

export type PrioridadTarea = {
  id: string;
  codigo: string;
  descripcion?: string;
  orden: number;
  porDefecto: boolean;
  color?: string;
  activo?: boolean;
};

export type TareaEvento = {
  id: string;
  tareaId: string;
  tipo: string;
  canal?: string;
  asunto?: string;
  cuerpo?: string;
  payload?: any;
  actorTipo: "AGENTE" | "CLIENTE";
  creadoPorAgenteId?: string;
  creadoPorClienteId?: string;
  visibleEnTimeline: boolean;
  visibleParaCliente: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type Tarea = {
  id: string;
  numero: string;
  titulo: string;
  clienteId: string;
  cliente: Cliente;
  unidadComercialId: string;
  unidadComercial: { id: string; codigo: string; descripcion?: string };
  tipoId: string;
  tipo: TipoTarea;
  estadoId?: string;
  estado?: EstadoTarea;
  prioridadId: string;
  prioridad: PrioridadTarea;
  moduloId?: string;
  modulo?: Modulo;
  releaseId?: string;
  release?: { id: string; codigo: string; version?: string };
  hotfixId?: string;
  hotfix?: { id: string; codigo: string; version?: string; release?: { id: string; version?: string } };
  reproducido: boolean;
  asignadoAId?: string;
  asignadoA?: Agente;
  creadoPorAgenteId?: string;
  creadoPorClienteId?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
};

export type TareaListResponse = {
  items: Tarea[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListarTareasParams = {
  clienteId?: string;
  estadoId?: string;
  prioridadId?: string;
  tipoId?: string;
  asignadoAId?: string;
  moduloId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function listTareas(params: ListarTareasParams = {}) {
  const qs = new URLSearchParams();
  if (params.clienteId) qs.set("clienteId", params.clienteId);
  if (params.estadoId) qs.set("estadoId", params.estadoId);
  if (params.prioridadId) qs.set("prioridadId", params.prioridadId);
  if (params.tipoId) qs.set("tipoId", params.tipoId);
  if (params.asignadoAId) qs.set("asignadoAId", params.asignadoAId);
  if (params.moduloId) qs.set("moduloId", params.moduloId);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return request<TareaListResponse>(`/tareas${query ? `?${query}` : ""}`);
}

export async function getTarea(id: string) {
  return request<Tarea>(`/tareas/${id}`);
}

export async function getTareaTimeline(id: string, includeInternal = true) {
  return request<TareaEvento[]>(`/tareas/${id}/timeline?includeInternal=${includeInternal ? "1" : "0"}`);
}

export async function createTarea(input: {
  titulo: string;
  clienteCodigo: string;
  unidadComercialCodigo: string;
  mensajeInicial: string;
  moduloCodigo?: string;
  tipoCodigo?: string;
  prioridadCodigo?: string;
  estadoCodigo?: string;
  releaseId?: string;
  hotfixId?: string;
  canal?: string;
}) {
  return request<Tarea>("/tareas", { method: "POST", body: JSON.stringify(input) });
}

export async function updateTarea(id: string, input: {
  titulo?: string;
  estadoId?: string;
  prioridadId?: string;
  tipoId?: string;
  moduloId?: string;
  releaseId?: string;
  hotfixId?: string;
  reproducido?: boolean;
}) {
  return request<Tarea>(`/tareas/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function asignarTarea(id: string, agenteId: string) {
  return request<Tarea>(`/tareas/${id}/asignar`, { method: "PUT", body: JSON.stringify({ agenteId }) });
}

export async function cerrarTarea(id: string) {
  return request<Tarea>(`/tareas/${id}/cerrar`, { method: "PUT" });
}

export async function addComentarioTarea(id: string, input: {
  tipo: "MENSAJE_CLIENTE" | "RESPUESTA_AGENTE" | "NOTA_INTERNA";
  cuerpo: string;
  canal?: string;
  visibleParaCliente?: boolean;
  relatedToId?: string;
  notifyAgentIds?: string[]; // For future notification system (not currently used)
}) {
  // Remove notifyAgentIds before sending to API as it's not expected by the backend yet
  const { notifyAgentIds, ...apiInput } = input;
  return request<TareaEvento[]>(`/tareas/${id}/comentarios`, { method: "POST", body: JSON.stringify(apiInput) });
}

export async function updateComentarioTarea(tareaId: string, eventoId: string, input: { cuerpo: string }) {
  return request<TareaEvento[]>(`/tareas/${tareaId}/comentarios/${eventoId}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteComentarioTarea(tareaId: string, eventoId: string) {
  return request<TareaEvento[]>(`/tareas/${tareaId}/comentarios/${eventoId}`, { method: "DELETE" });
}

// Lookup endpoints - TipoTarea CRUD
export async function listTiposTarea(opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<TipoTarea[]>(`/admin/lookup/tipos-tarea${qs}`);
}

export async function createTipoTarea(input: { codigo: string; descripcion?: string; orden?: number; porDefecto?: boolean; activo?: boolean }) {
  return request<TipoTarea>("/admin/lookup/tipos-tarea", { method: "POST", body: JSON.stringify(input) });
}

export async function updateTipoTarea(id: string, input: { codigo?: string; descripcion?: string; orden?: number; porDefecto?: boolean; activo?: boolean }, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<TipoTarea>(`/admin/lookup/tipos-tarea/${id}${qs}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteTipoTarea(id: string, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<void>(`/admin/lookup/tipos-tarea/${id}${qs}`, { method: "DELETE" });
}

// Lookup endpoints - EstadoTarea CRUD
export async function listEstadosTarea(opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<EstadoTarea[]>(`/admin/lookup/estados-tarea${qs}`);
}

export async function createEstadoTarea(input: { codigo: string; descripcion?: string; orden?: number; porDefecto?: boolean; activo?: boolean }) {
  return request<EstadoTarea>("/admin/lookup/estados-tarea", { method: "POST", body: JSON.stringify(input) });
}

export async function updateEstadoTarea(id: string, input: { codigo?: string; descripcion?: string; orden?: number; porDefecto?: boolean; activo?: boolean }, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<EstadoTarea>(`/admin/lookup/estados-tarea/${id}${qs}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteEstadoTarea(id: string, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<void>(`/admin/lookup/estados-tarea/${id}${qs}`, { method: "DELETE" });
}

// Lookup endpoints - PrioridadTarea CRUD
export async function listPrioridadesTarea(opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<PrioridadTarea[]>(`/admin/lookup/prioridades-tarea${qs}`);
}

export async function createPrioridadTarea(input: { codigo: string; descripcion?: string; orden?: number; porDefecto?: boolean; color?: string; activo?: boolean }) {
  return request<PrioridadTarea>("/admin/lookup/prioridades-tarea", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePrioridadTarea(id: string, input: { codigo?: string; descripcion?: string; orden?: number; porDefecto?: boolean; color?: string; activo?: boolean }, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<PrioridadTarea>(`/admin/lookup/prioridades-tarea/${id}${qs}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deletePrioridadTarea(id: string, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<void>(`/admin/lookup/prioridades-tarea/${id}${qs}`, { method: "DELETE" });
}

// ==================== LOOKUP ENDPOINTS (no permissions required) ====================
// These are read-only endpoints for dropdowns, available to any authenticated user

export type ClienteLookup = {
  id: string;
  codigo: string;
  descripcion?: string | null;
  jefeProyecto1?: string | null;
  jefeProyecto2?: string | null;
};

export async function listClientesLookup() {
  return request<ClienteLookup[]>("/admin/lookup/clientes");
}

export type ModuloLookup = {
  id: string;
  codigo: string;
  descripcion?: string | null;
};

export async function listModulosLookup() {
  return request<ModuloLookup[]>("/admin/lookup/modulos");
}

export async function listReleasesLookup() {
  return request<Release[]>("/admin/lookup/releases");
}

// Plantillas (Templates)
export type Plantilla = {
  id: string;
  codigo: string;
  descripcion?: string | null;
  texto: string;
  categoria?: string | null;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listPlantillas(opts?: { includeInactive?: boolean; categoria?: string }) {
  const params = new URLSearchParams();
  if (opts?.includeInactive) params.set("includeInactive", "1");
  if (opts?.categoria) params.set("categoria", opts.categoria);
  const qs = params.toString();
  return request<Plantilla[]>(`/admin/plantillas${qs ? `?${qs}` : ""}`);
}

export async function getPlantilla(id: string) {
  return request<Plantilla>(`/admin/plantillas/${id}`);
}

export async function createPlantilla(input: {
  codigo: string;
  descripcion?: string;
  texto: string;
  categoria?: string;
  orden?: number;
  activo?: boolean;
}) {
  return request<Plantilla>("/admin/plantillas", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePlantilla(id: string, input: {
  codigo?: string;
  descripcion?: string;
  texto?: string;
  categoria?: string;
  orden?: number;
  activo?: boolean;
}) {
  return request<Plantilla>(`/admin/plantillas/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deletePlantilla(id: string) {
  return request<void>(`/admin/plantillas/${id}`, { method: "DELETE" });
}

// Dashboard Configuration
export type WidgetType = 
  | "releaseStatus"
  | "sinAsignar" 
  | "prioridadPendientes"
  | "ticketsNuevosPendientes"
  | "resumenClienteEstado"
  | "ultimosComentarios";

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  visible: boolean;
  filters?: Record<string, unknown>;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export interface DashboardConfigResponse {
  id: string;
  nombre: string;
  layout: DashboardLayout;
  updatedAt: string;
}

export async function getDashboardConfig() {
  return request<DashboardConfigResponse>("/admin/dashboard/config");
}

export async function updateDashboardConfig(layout: DashboardLayout, nombre?: string) {
  return request<DashboardConfigResponse>("/admin/dashboard/config", {
    method: "PUT",
    body: JSON.stringify({ layout, nombre }),
  });
}

export async function resetDashboardConfig() {
  return request<DashboardConfigResponse>("/admin/dashboard/config/reset", {
    method: "PUT",
  });
}
