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
  tablaRelacionada?: string;  // e.g., "EstadoPeticion" - indicates which secondary status table to use
};

export type EstadoTarea = {
  id: string;
  codigo: string;
  descripcion?: string;
  orden: number;
  porDefecto: boolean;
  activo?: boolean;
};

export type EstadoPeticion = {
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
  estadoPeticionId?: string;
  estadoPeticion?: EstadoPeticion;
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
  estadoPeticionId?: string;
}) {
  return request<Tarea>(`/tareas/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function asignarTarea(id: string, agenteId: string) {
  return request<Tarea>(`/tareas/${id}/asignar`, { method: "PUT", body: JSON.stringify({ agenteId }) });
}

export async function cerrarTarea(id: string) {
  return request<Tarea>(`/tareas/${id}/cerrar`, { method: "PUT" });
}

// Global Search Types and Functions
export type TextSearchResult = {
  items: Array<{
    tarea: {
      id: string;
      numero: string;
      titulo: string;
      cliente: { codigo: string; descripcion?: string | null };
      estado: { codigo: string } | null;
      prioridad: { codigo: string; color?: string | null };
      createdAt: string;
    };
    comentarios: Array<{
      id: string;
      tipo: string;
      cuerpo: string | null;
      createdAt: string;
      creadoPorAgente?: { nombre: string } | null;
    }>;
  }>;
  total: number;
};

export async function buscarTextoEnTareas(texto: string, limit = 20): Promise<TextSearchResult> {
  const params = new URLSearchParams();
  params.set("texto", texto);
  if (limit) params.set("limit", String(limit));
  return request<TextSearchResult>(`/tareas/buscar/texto?${params.toString()}`);
}

export async function buscarTareaPorNumero(numero: string): Promise<Tarea | null> {
  return request<Tarea | null>(`/tareas/buscar/numero/${encodeURIComponent(numero)}`);
}

export type PatronSearchResult = {
  items: Array<{
    id: string;
    numero: string;
    titulo: string;
    cliente: { codigo: string; descripcion?: string | null };
    estado: { codigo: string } | null;
    prioridad: { codigo: string; color?: string | null };
    createdAt: string;
  }>;
  total: number;
};

export async function buscarTareaPorPatron(patron: string, limit = 10): Promise<PatronSearchResult> {
  const params = new URLSearchParams();
  params.set("patron", patron);
  if (limit) params.set("limit", String(limit));
  return request<PatronSearchResult>(`/tareas/buscar/patron?${params.toString()}`);
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

export async function createTipoTarea(input: { codigo: string; descripcion?: string; orden?: number; porDefecto?: boolean; activo?: boolean; tablaRelacionada?: string }) {
  return request<TipoTarea>("/admin/lookup/tipos-tarea", { method: "POST", body: JSON.stringify(input) });
}

export async function updateTipoTarea(id: string, input: { codigo?: string; descripcion?: string; orden?: number; porDefecto?: boolean; activo?: boolean; tablaRelacionada?: string }, replacementId?: string) {
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

// Lookup endpoints - EstadoPeticion CRUD
export async function listEstadosPeticion(opts?: { includeInactive?: boolean }) {
  const qs = opts?.includeInactive ? "?includeInactive=1" : "";
  return request<EstadoPeticion[]>(`/admin/lookup/estados-peticion${qs}`);
}

export async function createEstadoPeticion(input: { codigo: string; descripcion?: string; orden?: number; porDefecto?: boolean; activo?: boolean }) {
  return request<EstadoPeticion>("/admin/lookup/estados-peticion", { method: "POST", body: JSON.stringify(input) });
}

export async function updateEstadoPeticion(id: string, input: { codigo?: string; descripcion?: string; orden?: number; porDefecto?: boolean; activo?: boolean }, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<EstadoPeticion>(`/admin/lookup/estados-peticion/${id}${qs}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function deleteEstadoPeticion(id: string, replacementId?: string) {
  const qs = replacementId ? `?replacementId=${encodeURIComponent(replacementId)}` : "";
  return request<void>(`/admin/lookup/estados-peticion/${id}${qs}`, { method: "DELETE" });
}

/**
 * Get allowed Estado Petición values based on flow configuration.
 * Similar to listEstadosPermitidos but for Estado Petición.
 */
export async function listEstadosPeticionPermitidos(opts: {
  tipoTareaId: string;
  estadoActualId?: string;
  actorTipo?: "AGENTE" | "CLIENTE";
}) {
  const params = new URLSearchParams({ tipoTareaId: opts.tipoTareaId });
  if (opts.estadoActualId) params.set("estadoActualId", opts.estadoActualId);
  if (opts.actorTipo) params.set("actorTipo", opts.actorTipo);
  return request<EstadoPeticion[]>(`/admin/lookup/estados-peticion-permitidos?${params}`);
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

export type UnidadComercialLookup = {
  id: string;
  codigo: string;
  descripcion?: string | null;
  scope: string;
};

export async function listUnidadesLookup(clienteId: string) {
  return request<UnidadComercialLookup[]>(`/admin/lookup/clientes/${clienteId}/unidades`);
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

// ==================== NOTIFICATION LOG ====================

export type EstadoNotificacion = "PENDIENTE" | "PROCESANDO" | "ENVIADO" | "ERROR" | "CANCELADO";

export type NotificacionLog = {
  id: string;
  tareaId: string;
  eventoId?: string | null;
  eventoTipo: string;
  tipoNotificacion: string;
  emailsTo: string[];
  emailsCc: string[];
  asunto: string;
  cuerpoHtml: string;
  cuerpoTexto?: string | null;
  estado: EstadoNotificacion;
  prioridad: number;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string | null;
  logEnvio?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  enviadoAt?: string | null;
  tarea?: {
    id: string;
    numero: string;
    titulo: string;
    cliente?: { codigo: string };
  };
  evento?: {
    id: string;
    tipo: string;
    cuerpo?: string | null;
    createdAt: string;
    creadoPorAgente?: { nombre: string };
    creadoPorCliente?: { nombre: string };
  };
};

export type NotificacionLogListResponse = {
  items: NotificacionLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type NotificacionLogStats = {
  pendiente: number;
  procesando: number;
  enviadoHoy: number;
  errorHoy: number;
  total: number;
};

export type ListNotificacionLogParams = {
  estado?: EstadoNotificacion;
  eventoTipo?: string;
  tareaId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function listNotificacionLogs(params: ListNotificacionLogParams = {}) {
  const qs = new URLSearchParams();
  if (params.estado) qs.set("estado", params.estado);
  if (params.eventoTipo) qs.set("eventoTipo", params.eventoTipo);
  if (params.tareaId) qs.set("tareaId", params.tareaId);
  if (params.fechaDesde) qs.set("fechaDesde", params.fechaDesde);
  if (params.fechaHasta) qs.set("fechaHasta", params.fechaHasta);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return request<NotificacionLogListResponse>(`/admin/log-notificaciones${query ? `?${query}` : ""}`);
}

export async function getNotificacionLog(id: string) {
  return request<NotificacionLog>(`/admin/log-notificaciones/${id}`);
}

export async function getNotificacionLogStats() {
  return request<NotificacionLogStats>("/admin/log-notificaciones/stats");
}

export async function retryNotificacion(id: string) {
  return request<{ success: boolean; notificacion: NotificacionLog }>(`/admin/log-notificaciones/${id}/retry`, {
    method: "PUT",
  });
}

export async function cancelNotificacion(id: string) {
  return request<{ success: boolean; notificacion: NotificacionLog }>(`/admin/log-notificaciones/${id}/cancel`, {
    method: "PUT",
  });
}

export async function processNotificacionQueue() {
  return request<{ success: boolean; processed: number; successCount: number; failed: number }>("/admin/log-notificaciones/process", {
    method: "POST",
  });
}

// ==================== NOTIFICATION CONFIG ====================

export type NotificacionConfig = {
  id: string | null;
  eventoTipo: string;
  habilitado: boolean;
  notificarCliente: boolean;
  notificarAgente: boolean;
  plantillaId?: string | null;
  plantilla?: { id: string; codigo: string; descripcion?: string | null } | null;
  asuntoDefault?: string | null;
  descripcionEvento: string;
};

export async function listNotificacionConfigs() {
  return request<NotificacionConfig[]>("/admin/notificacion-config");
}

export async function getNotificacionConfig(eventoTipo: string) {
  return request<NotificacionConfig>(`/admin/notificacion-config/${eventoTipo}`);
}

export async function updateNotificacionConfig(eventoTipo: string, input: {
  habilitado?: boolean;
  notificarCliente?: boolean;
  notificarAgente?: boolean;
  plantillaId?: string | null;
  asuntoDefault?: string;
}) {
  return request<NotificacionConfig>(`/admin/notificacion-config/${eventoTipo}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// ==================== NOTIFICATION WORKFLOWS ====================

export type WorkflowTrigger =
  | "TAREA_CREADA"
  | "TAREA_MODIFICADA"
  | "TAREA_CERRADA"
  | "MENSAJE_CLIENTE"
  | "RESPUESTA_AGENTE"
  | "NOTA_INTERNA"
  | "CAMBIO_ESTADO"
  | "CAMBIO_ASIGNACION"
  | "CAMBIO_PRIORIDAD"
  | "CAMBIO_TIPO"
  | "CAMBIO_MODULO"
  | "CAMBIO_RELEASE"
  | "CAMBIO_ESTADO_PETICION";

export type WorkflowConditionField =
  | "CLIENTE_ID"
  | "CLIENTE_CODIGO"
  | "ESTADO_ID"
  | "ESTADO_CODIGO"
  | "TIPO_ID"
  | "TIPO_CODIGO"
  | "PRIORIDAD_ID"
  | "PRIORIDAD_CODIGO"
  | "MODULO_ID"
  | "MODULO_CODIGO"
  | "RELEASE_ID"
  | "RELEASE_CODIGO"
  | "RELEASE_RAMA"
  | "HOTFIX_ID"
  | "ASIGNADO_A_ID"
  | "CREADO_POR_AGENTE_ID"
  | "CREADO_POR_CLIENTE_ID"
  | "UNIDAD_COMERCIAL_ID"
  | "UNIDAD_COMERCIAL_SCOPE"
  | "REPRODUCIDO"
  | "ESTADO_ANTERIOR_ID"
  | "ESTADO_NUEVO_ID"
  | "PRIORIDAD_ANTERIOR_ID"
  | "PRIORIDAD_NUEVA_ID"
  | "TIPO_ANTERIOR_ID"
  | "TIPO_NUEVO_ID"
  | "MODULO_ANTERIOR_ID"
  | "MODULO_NUEVO_ID"
  | "RELEASE_ANTERIOR_ID"
  | "RELEASE_NUEVO_ID"
  | "ESTADO_PETICION_ID"
  | "ESTADO_PETICION_CODIGO"
  | "ESTADO_PETICION_ANTERIOR_ID"
  | "ESTADO_PETICION_NUEVO_ID"
  | "ESTADO_PETICION_ANTERIOR_CODIGO"
  | "ESTADO_PETICION_NUEVO_CODIGO";

export type WorkflowConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "IN"
  | "NOT_IN"
  | "IS_NULL"
  | "IS_NOT_NULL"
  | "CONTAINS"
  | "STARTS_WITH";

export type WorkflowRecipientType =
  | "USUARIOS_CLIENTE"
  | "USUARIO_CLIENTE_CREADOR"
  | "JEFE_PROYECTO_1"
  | "JEFE_PROYECTO_2"
  | "AGENTE_ASIGNADO"
  | "AGENTE_CREADOR"
  | "AGENTE_REVISOR"
  | "AGENTES_ESPECIFICOS"
  | "ROLES_ESPECIFICOS"
  | "EMAILS_MANUALES";

export type WorkflowCondition = {
  id?: string;
  field: WorkflowConditionField;
  operator: WorkflowConditionOperator;
  value?: string | null;
  orGroup?: number;
};

export type WorkflowRecipient = {
  id?: string;
  recipientType: WorkflowRecipientType;
  value?: string | null;
  isCc?: boolean;
};

export type WorkflowActionType =
  | "CAMBIAR_ESTADO"
  | "CAMBIAR_PRIORIDAD"
  | "CAMBIAR_TIPO"
  | "ASIGNAR_AGENTE"
  | "CAMBIAR_MODULO"
  | "CAMBIAR_RELEASE";

export type WorkflowAction = {
  id?: string;
  actionType: WorkflowActionType;
  value?: string | null;
  orden?: number;
};

export type WorkflowListItem = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  trigger: WorkflowTrigger;
  activo: boolean;
  orden: number;
  stopOnMatch: boolean;
  conditionsCount: number;
  recipientsCount: number;
  actionsCount: number;
  plantilla?: { id: string; codigo: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowDetail = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  trigger: WorkflowTrigger;
  activo: boolean;
  orden: number;
  stopOnMatch: boolean;
  plantillaId?: string | null;
  asuntoCustom?: string | null;
  ccJefeProyecto1: boolean;
  ccJefeProyecto2: boolean;
  plantilla?: { id: string; codigo: string; descripcion?: string | null } | null;
  conditions: WorkflowCondition[];
  recipients: WorkflowRecipient[];
  actions: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkflowInput = {
  nombre: string;
  descripcion?: string;
  trigger: WorkflowTrigger;
  activo?: boolean;
  orden?: number;
  stopOnMatch?: boolean;
  plantillaId?: string;
  asuntoCustom?: string;
  ccJefeProyecto1?: boolean;
  ccJefeProyecto2?: boolean;
  conditions?: WorkflowCondition[];
  recipients?: WorkflowRecipient[];
  actions?: WorkflowAction[];
};

export type UpdateWorkflowInput = Partial<CreateWorkflowInput>;

// Labels for UI
export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
  TAREA_CREADA: "Tarea creada",
  TAREA_MODIFICADA: "Tarea modificada",
  TAREA_CERRADA: "Tarea cerrada",
  MENSAJE_CLIENTE: "Mensaje del cliente",
  RESPUESTA_AGENTE: "Respuesta del agente",
  NOTA_INTERNA: "Nota interna",
  CAMBIO_ESTADO: "Cambio de estado",
  CAMBIO_ASIGNACION: "Cambio de asignacion",
  CAMBIO_PRIORIDAD: "Cambio de prioridad",
  CAMBIO_TIPO: "Cambio de tipo",
  CAMBIO_MODULO: "Cambio de modulo",
  CAMBIO_RELEASE: "Cambio de release/hotfix",
  CAMBIO_ESTADO_PETICION: "Cambio de estado peticion",
};

export const CONDITION_FIELD_LABELS: Record<WorkflowConditionField, string> = {
  CLIENTE_ID: "Cliente",
  CLIENTE_CODIGO: "Codigo de cliente",
  ESTADO_ID: "Estado",
  ESTADO_CODIGO: "Codigo de estado",
  TIPO_ID: "Tipo de tarea",
  TIPO_CODIGO: "Codigo de tipo",
  PRIORIDAD_ID: "Prioridad",
  PRIORIDAD_CODIGO: "Codigo de prioridad",
  MODULO_ID: "Modulo",
  MODULO_CODIGO: "Codigo de modulo",
  RELEASE_ID: "Release",
  RELEASE_CODIGO: "Codigo de release",
  RELEASE_RAMA: "Rama de release",
  HOTFIX_ID: "Hotfix",
  ASIGNADO_A_ID: "Agente asignado",
  CREADO_POR_AGENTE_ID: "Creado por agente",
  CREADO_POR_CLIENTE_ID: "Creado por usuario cliente",
  UNIDAD_COMERCIAL_ID: "Unidad comercial",
  UNIDAD_COMERCIAL_SCOPE: "Ambito unidad comercial",
  REPRODUCIDO: "Bug reproducido",
  ESTADO_ANTERIOR_ID: "Estado anterior",
  ESTADO_NUEVO_ID: "Estado nuevo",
  PRIORIDAD_ANTERIOR_ID: "Prioridad anterior",
  PRIORIDAD_NUEVA_ID: "Prioridad nueva",
  TIPO_ANTERIOR_ID: "Tipo anterior",
  TIPO_NUEVO_ID: "Tipo nuevo",
  MODULO_ANTERIOR_ID: "Modulo anterior",
  MODULO_NUEVO_ID: "Modulo nuevo",
  RELEASE_ANTERIOR_ID: "Release anterior",
  RELEASE_NUEVO_ID: "Release nuevo",
  ESTADO_PETICION_ID: "Estado peticion",
  ESTADO_PETICION_CODIGO: "Codigo estado peticion",
  ESTADO_PETICION_ANTERIOR_ID: "Estado peticion anterior",
  ESTADO_PETICION_NUEVO_ID: "Estado peticion nuevo",
  ESTADO_PETICION_ANTERIOR_CODIGO: "Codigo estado peticion anterior",
  ESTADO_PETICION_NUEVO_CODIGO: "Codigo estado peticion nuevo",
};

export const CONDITION_OPERATOR_LABELS: Record<WorkflowConditionOperator, string> = {
  EQUALS: "es igual a",
  NOT_EQUALS: "no es igual a",
  IN: "esta en",
  NOT_IN: "no esta en",
  IS_NULL: "esta vacio",
  IS_NOT_NULL: "tiene valor",
  CONTAINS: "contiene",
  STARTS_WITH: "empieza con",
};

export const RECIPIENT_TYPE_LABELS: Record<WorkflowRecipientType, string> = {
  USUARIOS_CLIENTE: "Usuarios del cliente",
  USUARIO_CLIENTE_CREADOR: "Usuario cliente creador",
  JEFE_PROYECTO_1: "Jefe de Proyecto 1",
  JEFE_PROYECTO_2: "Jefe de Proyecto 2",
  AGENTE_ASIGNADO: "Agente asignado",
  AGENTE_CREADOR: "Agente creador",
  AGENTE_REVISOR: "Agente revisor",
  AGENTES_ESPECIFICOS: "Agentes especificos",
  ROLES_ESPECIFICOS: "Roles especificos",
  EMAILS_MANUALES: "Emails manuales",
};

export const ACTION_TYPE_LABELS: Record<WorkflowActionType, string> = {
  CAMBIAR_ESTADO: "Cambiar estado",
  CAMBIAR_PRIORIDAD: "Cambiar prioridad",
  CAMBIAR_TIPO: "Cambiar tipo",
  ASIGNAR_AGENTE: "Asignar agente",
  CAMBIAR_MODULO: "Cambiar modulo",
  CAMBIAR_RELEASE: "Cambiar release",
};

export async function listWorkflows(params?: {
  trigger?: WorkflowTrigger;
  activo?: boolean;
  search?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.trigger) qs.set("trigger", params.trigger);
  if (params?.activo !== undefined) qs.set("activo", String(params.activo));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString();
  return request<WorkflowListItem[]>(`/admin/workflows${query ? `?${query}` : ""}`);
}

export async function getWorkflow(id: string) {
  return request<WorkflowDetail>(`/admin/workflows/${id}`);
}

export async function createWorkflow(input: CreateWorkflowInput) {
  return request<WorkflowDetail>("/admin/workflows", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateWorkflow(id: string, input: UpdateWorkflowInput) {
  return request<WorkflowDetail>(`/admin/workflows/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteWorkflow(id: string) {
  return request<{ success: boolean }>(`/admin/workflows/${id}`, { method: "DELETE" });
}

export async function toggleWorkflow(id: string) {
  return request<{ activo: boolean }>(`/admin/workflows/${id}/toggle`, { method: "POST" });
}

export async function duplicateWorkflow(id: string) {
  return request<WorkflowDetail>(`/admin/workflows/${id}/duplicate`, { method: "POST" });
}

// ==================== ESTADO FLOWS (Task State Machine) ====================

export type EstadoPermitido = {
  id?: string;
  estadoId: string;
  orden?: number;
  visibleCliente?: boolean;
};

export type Transicion = {
  id?: string;
  estadoOrigenId: string;
  estadoDestinoId: string;
  permiteAgente?: boolean;
  permiteCliente?: boolean;
  notificar?: boolean;
  orden?: number;
};

export type EstadoFlowListItem = {
  id: string;
  tipoTareaId: string;
  tipoTarea: { id: string; codigo: string; descripcion: string | null };
  estadoInicial: { id: string; codigo: string } | null;
  estadosCount: number;
  transicionesCount: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EstadoFlowDetail = {
  id: string;
  tipoTareaId: string;
  tipoTarea: { id: string; codigo: string; descripcion: string | null };
  estadoInicialId: string | null;
  estadoInicial: { id: string; codigo: string; descripcion: string | null } | null;
  estadosPermitidos: {
    id: string;
    estadoId: string;
    estado: { id: string; codigo: string; descripcion: string | null };
    orden: number;
    visibleCliente: boolean;
  }[];
  transiciones: {
    id: string;
    estadoOrigenId: string;
    estadoOrigen: { id: string; codigo: string };
    estadoDestinoId: string;
    estadoDestino: { id: string; codigo: string };
    permiteAgente: boolean;
    permiteCliente: boolean;
    notificar: boolean;
    orden: number;
  }[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateEstadoFlowInput = {
  tipoTareaId: string;
  estadoInicialId?: string;
  estadosPermitidos: EstadoPermitido[];
  transiciones: Transicion[];
  activo?: boolean;
};

export type UpdateEstadoFlowInput = Partial<Omit<CreateEstadoFlowInput, "tipoTareaId">>;

export async function listEstadoFlows() {
  return request<EstadoFlowListItem[]>("/admin/estado-flows");
}

export async function getEstadoFlow(id: string) {
  return request<EstadoFlowDetail>(`/admin/estado-flows/${id}`);
}

export async function getEstadoFlowByTipoTarea(tipoTareaId: string) {
  return request<EstadoFlowDetail | null>(`/admin/estado-flows/by-tipo/${tipoTareaId}`);
}

export async function createEstadoFlow(input: CreateEstadoFlowInput) {
  return request<EstadoFlowDetail>("/admin/estado-flows", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateEstadoFlow(id: string, input: UpdateEstadoFlowInput) {
  return request<EstadoFlowDetail>(`/admin/estado-flows/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteEstadoFlow(tipoTareaId: string) {
  return request<{ success: boolean }>(`/admin/estado-flows/${tipoTareaId}`, { method: "DELETE" });
}

export async function toggleEstadoFlow(id: string) {
  return request<{ activo: boolean }>(`/admin/estado-flows/${id}/toggle`, { method: "POST" });
}

/**
 * Get allowed next statuses based on task type, current status, and actor type.
 * Used for filtering status dropdowns in task edit forms.
 */
export async function listEstadosPermitidos(
  tipoTareaId: string,
  estadoActualId?: string | null,
  actorTipo: "AGENTE" | "CLIENTE" = "AGENTE"
) {
  const params = new URLSearchParams();
  params.set("tipoTareaId", tipoTareaId);
  if (estadoActualId) params.set("estadoActualId", estadoActualId);
  params.set("actorTipo", actorTipo);
  return request<EstadoTarea[]>(`/admin/lookup/estados-permitidos?${params.toString()}`);
}

/**
 * Get the initial status for a task type based on flow configuration.
 */
export async function getEstadoInicial(tipoTareaId: string) {
  return request<EstadoTarea>(`/admin/lookup/estado-inicial/${tipoTareaId}`);
}

// ==================== ESTADO PETICION FLOWS (Secondary Status Machine) ====================

export type EstadoPeticionFlowListItem = {
  id: string;
  tipoTareaId: string;
  tipoTarea: { id: string; codigo: string; descripcion: string | null };
  estadoInicial: { id: string; codigo: string } | null;
  estadosCount: number;
  transicionesCount: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EstadoPeticionFlowDetail = {
  id: string;
  tipoTareaId: string;
  tipoTarea: { id: string; codigo: string; descripcion: string | null };
  estadoInicialId: string | null;
  estadoInicial: { id: string; codigo: string; descripcion: string | null } | null;
  estadosPermitidos: {
    id: string;
    estadoId: string;
    estado: { id: string; codigo: string; descripcion: string | null };
    orden: number;
    visibleCliente: boolean;
  }[];
  transiciones: {
    id: string;
    estadoOrigenId: string;
    estadoOrigen: { id: string; codigo: string };
    estadoDestinoId: string;
    estadoDestino: { id: string; codigo: string };
    permiteAgente: boolean;
    permiteCliente: boolean;
    notificar: boolean;
    orden: number;
  }[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateEstadoPeticionFlowInput = {
  tipoTareaId: string;
  estadoInicialId?: string;
  estadosPermitidos: EstadoPermitido[];
  transiciones: Transicion[];
  activo?: boolean;
};

export type UpdateEstadoPeticionFlowInput = Partial<Omit<CreateEstadoPeticionFlowInput, "tipoTareaId">>;

export async function listEstadoPeticionFlows() {
  return request<EstadoPeticionFlowListItem[]>("/admin/estado-peticion-flows");
}

export async function getEstadoPeticionFlow(id: string) {
  return request<EstadoPeticionFlowDetail>(`/admin/estado-peticion-flows/${id}`);
}

export async function getEstadoPeticionFlowByTipoTarea(tipoTareaId: string) {
  return request<EstadoPeticionFlowDetail | null>(`/admin/estado-peticion-flows/by-tipo/${tipoTareaId}`);
}

export async function createEstadoPeticionFlow(input: CreateEstadoPeticionFlowInput) {
  return request<EstadoPeticionFlowDetail>("/admin/estado-peticion-flows", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateEstadoPeticionFlow(id: string, input: UpdateEstadoPeticionFlowInput) {
  return request<EstadoPeticionFlowDetail>(`/admin/estado-peticion-flows/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteEstadoPeticionFlow(tipoTareaId: string) {
  return request<{ success: boolean }>(`/admin/estado-peticion-flows/${tipoTareaId}`, { method: "DELETE" });
}

export async function toggleEstadoPeticionFlow(id: string) {
  return request<{ activo: boolean }>(`/admin/estado-peticion-flows/${id}/toggle`, { method: "POST" });
}
