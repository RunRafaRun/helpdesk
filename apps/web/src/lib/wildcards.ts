// Wildcard definitions for templates
export interface Wildcard {
  token: string;
  label: string;
  category: string;
  description: string;
}

export const WILDCARD_LIST: Wildcard[] = [
  // Cliente
  { token: "{{cliente.codigo}}", label: "Código Cliente", category: "Cliente", description: "Código del cliente" },
  { token: "{{cliente.descripcion}}", label: "Descripción Cliente", category: "Cliente", description: "Descripción del cliente" },
  { token: "{{cliente.jefeProyecto1}}", label: "Jefe Proyecto 1", category: "Cliente", description: "Nombre del jefe de proyecto 1" },
  { token: "{{cliente.jefeProyecto2}}", label: "Jefe Proyecto 2", category: "Cliente", description: "Nombre del jefe de proyecto 2" },

  // Tarea
  { token: "{{tarea.numero}}", label: "Número Tarea", category: "Tarea", description: "Número de la tarea" },
  { token: "{{tarea.titulo}}", label: "Título Tarea", category: "Tarea", description: "Título de la tarea" },
  { token: "{{tarea.estado}}", label: "Estado Tarea", category: "Tarea", description: "Estado actual de la tarea" },
  { token: "{{tarea.prioridad}}", label: "Prioridad Tarea", category: "Tarea", description: "Prioridad de la tarea" },
  { token: "{{tarea.modulo}}", label: "Módulo Tarea", category: "Tarea", description: "Módulo de la tarea" },

  // Agente
  { token: "{{agente.nombre}}", label: "Nombre Agente", category: "Agente", description: "Nombre del agente" },
  { token: "{{agente.email}}", label: "Email Agente", category: "Agente", description: "Email del agente" },

  // Fecha
  { token: "{{fecha.actual}}", label: "Fecha Actual", category: "Fecha", description: "Fecha actual (formato DD/MM/YYYY)" },
  { token: "{{fecha.hora}}", label: "Hora Actual", category: "Fecha", description: "Hora actual (formato HH:MM)" },
];

// Group wildcards by category
export function getWildcardsByCategory(): Record<string, Wildcard[]> {
  const grouped: Record<string, Wildcard[]> = {};
  for (const wildcard of WILDCARD_LIST) {
    if (!grouped[wildcard.category]) {
      grouped[wildcard.category] = [];
    }
    grouped[wildcard.category].push(wildcard);
  }
  return grouped;
}

// Context interface for wildcard resolution
export interface WildcardContext {
  cliente?: {
    codigo?: string | null;
    descripcion?: string | null;
    jefeProyecto1?: string | null;
    jefeProyecto2?: string | null;
  } | null;
  tarea?: {
    numero?: string | null;
    titulo?: string | null;
    estado?: { codigo?: string | null } | null;
    prioridad?: { codigo?: string | null } | null;
    modulo?: { codigo?: string | null } | null;
  } | null;
  agente?: {
    nombre?: string | null;
    email?: string | null;
  } | null;
}

// Resolve wildcards in template text with actual values from context
export function resolveWildcards(template: string, context: WildcardContext): string {
  let result = template;

  // Current date/time
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  // Replace each wildcard
  result = result.replace(/\{\{cliente\.codigo\}\}/g, context.cliente?.codigo ?? "");
  result = result.replace(/\{\{cliente\.descripcion\}\}/g, context.cliente?.descripcion ?? "");
  result = result.replace(/\{\{cliente\.jefeProyecto1\}\}/g, context.cliente?.jefeProyecto1 ?? "");
  result = result.replace(/\{\{cliente\.jefeProyecto2\}\}/g, context.cliente?.jefeProyecto2 ?? "");

  result = result.replace(/\{\{tarea\.numero\}\}/g, context.tarea?.numero ?? "");
  result = result.replace(/\{\{tarea\.titulo\}\}/g, context.tarea?.titulo ?? "");
  result = result.replace(/\{\{tarea\.estado\}\}/g, context.tarea?.estado?.codigo ?? "");
  result = result.replace(/\{\{tarea\.prioridad\}\}/g, context.tarea?.prioridad?.codigo ?? "");
  result = result.replace(/\{\{tarea\.modulo\}\}/g, context.tarea?.modulo?.codigo ?? "");

  result = result.replace(/\{\{agente\.nombre\}\}/g, context.agente?.nombre ?? "");
  result = result.replace(/\{\{agente\.email\}\}/g, context.agente?.email ?? "");

  result = result.replace(/\{\{fecha\.actual\}\}/g, dateStr);
  result = result.replace(/\{\{fecha\.hora\}\}/g, timeStr);

  return result;
}

// Get sample context for preview
export function getSampleContext(): WildcardContext {
  return {
    cliente: {
      codigo: "HOTEL_EJEMPLO",
      descripcion: "Hotel de Ejemplo S.A.",
      jefeProyecto1: "Juan García",
      jefeProyecto2: "María López",
    },
    tarea: {
      numero: "T-2024-001",
      titulo: "Problema con reservas",
      estado: { codigo: "ACEPTADA" },
      prioridad: { codigo: "ALTA" },
      modulo: { codigo: "RESERVAS" },
    },
    agente: {
      nombre: "Pedro Agente",
      email: "pedro.agente@helpdesk.com",
    },
  };
}
