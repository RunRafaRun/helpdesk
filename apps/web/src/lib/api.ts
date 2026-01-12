export type Me = { id: string; usuario: string; role: string; roles: string[]; permisos: string[] } | null;

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

export type Agente = { id: string; nombre: string; usuario: string; email?: string | null; role: "ADMIN" | "AGENTE"; createdAt: string };

export async function listAgentes() {
  return request<Agente[]>("/admin/agentes");
}

export async function createAgente(input: { nombre: string; usuario: string; password: string; role?: "ADMIN" | "AGENTE"; email?: string }) {
  return request<Agente>("/admin/agentes", { method: "POST", body: JSON.stringify(input) });
}

export type Cliente = { id: string; codigo: string; descripcion?: string | null };

export async function listClientes() {
  return request<Cliente[]>("/admin/clientes");
}

export async function createCliente(input: { codigo: string; descripcion?: string }) {
  return request<Cliente>("/admin/clientes", { method: "POST", body: JSON.stringify(input) });
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

export type Modulo = { id: string; codigo: string; descripcion?: string | null; createdAt: string };

export async function listModulos() {
  return request<Modulo[]>("/admin/modulos");
}

export async function createModulo(input: { codigo: string; descripcion?: string }) {
  return request<Modulo>("/admin/modulos", { method: "POST", body: JSON.stringify(input) });
}

export async function deleteModulo(id: string) {
  return request<void>(`/admin/modulos/${id}`, { method: "DELETE" });
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
