/**
 * Wildcard resolver for notification templates
 * Resolves placeholders like {{tarea.numero}}, {{cliente.nombre}}, etc.
 */

export interface WildcardContext {
  tarea?: {
    id?: string;
    numero?: string;
    titulo?: string;
    createdAt?: Date;
  };
  cliente?: {
    codigo?: string;
    descripcion?: string;
  };
  unidadComercial?: {
    codigo?: string;
    descripcion?: string;
  };
  agente?: {
    nombre?: string;
    email?: string;
  };
  evento?: {
    fecha?: Date;
    contenido?: string;
    tipo?: string;
  };
  destinatario?: {
    nombre?: string;
    email?: string;
  };
  siteUrl?: string;
}

/**
 * Resolves wildcards in a template string
 * Supports both {{wildcard}} and {WILDCARD} formats
 */
export function resolveWildcards(template: string, context: WildcardContext): string {
  if (!template) return "";

  const siteUrl = context.siteUrl || "http://localhost:5173";

  const replacements: Record<string, string> = {
    // Tarea wildcards
    "{{tarea.id}}": context.tarea?.id || "",
    "{{tarea.numero}}": context.tarea?.numero || "",
    "{{tarea.titulo}}": context.tarea?.titulo || "",
    "{{tarea.link}}": context.tarea?.id ? `${siteUrl}/tareas/${context.tarea.id}` : "",
    "{{tarea.fecha}}": context.tarea?.createdAt
      ? formatDate(context.tarea.createdAt)
      : "",
    "{TAREA_NUMERO}": context.tarea?.numero || "",
    "{TAREA_TITULO}": context.tarea?.titulo || "",
    "{TAREA_LINK}": context.tarea?.id ? `${siteUrl}/tareas/${context.tarea.id}` : "",

    // Cliente wildcards
    "{{cliente.codigo}}": context.cliente?.codigo || "",
    "{{cliente.nombre}}": context.cliente?.descripcion || context.cliente?.codigo || "",
    "{CLIENTE_CODIGO}": context.cliente?.codigo || "",
    "{CLIENTE_NOMBRE}": context.cliente?.descripcion || context.cliente?.codigo || "",

    // Unidad comercial
    "{{unidad.codigo}}": context.unidadComercial?.codigo || "",
    "{{unidad.nombre}}": context.unidadComercial?.descripcion || context.unidadComercial?.codigo || "",
    "{UNIDAD_CODIGO}": context.unidadComercial?.codigo || "",
    "{UNIDAD_NOMBRE}": context.unidadComercial?.descripcion || context.unidadComercial?.codigo || "",

    // Agente wildcards
    "{{agente.nombre}}": context.agente?.nombre || "",
    "{{agente.email}}": context.agente?.email || "",
    "{AGENTE_NOMBRE}": context.agente?.nombre || "",

    // Evento wildcards
    "{{evento.fecha}}": context.evento?.fecha
      ? formatDateTime(context.evento.fecha)
      : "",
    "{{evento.contenido}}": context.evento?.contenido || "",
    "{{evento.tipo}}": context.evento?.tipo || "",
    "{EVENTO_FECHA}": context.evento?.fecha
      ? formatDateTime(context.evento.fecha)
      : "",
    "{EVENTO_CONTENIDO}": context.evento?.contenido || "",

    // Destinatario wildcards
    "{{destinatario.nombre}}": context.destinatario?.nombre || "",
    "{{destinatario.email}}": context.destinatario?.email || "",
    "{DESTINATARIO_NOMBRE}": context.destinatario?.nombre || "",
  };

  let result = template;
  for (const [wildcard, value] of Object.entries(replacements)) {
    result = result.split(wildcard).join(value);
  }

  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Gets a list of available wildcards with descriptions
 */
export function getAvailableWildcards(): Array<{
  wildcard: string;
  description: string;
  category: string;
}> {
  return [
    // Tarea
    { wildcard: "{{tarea.numero}}", description: "Numero de la tarea", category: "Tarea" },
    { wildcard: "{{tarea.titulo}}", description: "Titulo de la tarea", category: "Tarea" },
    { wildcard: "{{tarea.link}}", description: "URL directa a la tarea", category: "Tarea" },
    { wildcard: "{{tarea.fecha}}", description: "Fecha de creacion", category: "Tarea" },
    // Cliente
    { wildcard: "{{cliente.codigo}}", description: "Codigo del cliente", category: "Cliente" },
    { wildcard: "{{cliente.nombre}}", description: "Nombre del cliente", category: "Cliente" },
    // Unidad
    { wildcard: "{{unidad.codigo}}", description: "Codigo de la unidad comercial", category: "Unidad" },
    { wildcard: "{{unidad.nombre}}", description: "Nombre de la unidad comercial", category: "Unidad" },
    // Agente
    { wildcard: "{{agente.nombre}}", description: "Nombre del agente", category: "Agente" },
    { wildcard: "{{agente.email}}", description: "Email del agente", category: "Agente" },
    // Evento
    { wildcard: "{{evento.fecha}}", description: "Fecha y hora del evento", category: "Evento" },
    { wildcard: "{{evento.contenido}}", description: "Contenido del comentario", category: "Evento" },
    { wildcard: "{{evento.tipo}}", description: "Tipo de evento", category: "Evento" },
    // Destinatario
    { wildcard: "{{destinatario.nombre}}", description: "Nombre del destinatario", category: "Destinatario" },
  ];
}
