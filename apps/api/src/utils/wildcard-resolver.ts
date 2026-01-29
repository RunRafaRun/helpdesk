/**
 * Wildcard resolver for notification templates
 * Resolves placeholders like {{tarea.numero}}, {{cliente.nombre}}, etc.
 *
 * Supports both formats:
 *   - {{wildcard.field}} - Standard format
 *   - {WILDCARD_FIELD} - Legacy uppercase format
 */

export interface WildcardContext {
  tarea?: {
    id?: string;
    numero?: string;
    titulo?: string;
    createdAt?: Date;
    closedAt?: Date | null;
    reproducido?: boolean;
  };
  cliente?: {
    codigo?: string;
    descripcion?: string;
    jefeProyecto1?: string | null;
    jefeProyecto2?: string | null;
    licenciaTipo?: string | null;
  };
  unidadComercial?: {
    codigo?: string;
    descripcion?: string;
    scope?: string;
  };
  estado?: {
    codigo?: string;
    descripcion?: string | null;
  };
  tipo?: {
    codigo?: string;
    descripcion?: string | null;
  };
  prioridad?: {
    codigo?: string;
    descripcion?: string | null;
    color?: string | null;
  };
  modulo?: {
    codigo?: string;
    descripcion?: string | null;
  } | null;
  release?: {
    codigo?: string;
    descripcion?: string | null;
    rama?: string;
  } | null;
  hotfix?: {
    codigo?: string;
    descripcion?: string | null;
    rama?: string;
  } | null;
  agente?: {
    nombre?: string;
    email?: string | null;
  };
  agenteAsignado?: {
    nombre?: string;
    email?: string | null;
  } | null;
  agenteCreador?: {
    nombre?: string;
    email?: string | null;
  } | null;
  agenteRevisor?: {
    nombre?: string;
    email?: string | null;
  } | null;
  usuarioCreador?: {
    nombre?: string;
    email?: string | null;
  } | null;
  evento?: {
    fecha?: Date;
    contenido?: string;
    tipo?: string;
  };
  destinatario?: {
    nombre?: string;
    email?: string;
  };
  cambio?: {
    campo?: string;
    anterior?: string | null;
    nuevo?: string | null;
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
  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = formatTime(now);

  const replacements: Record<string, string> = {
    // ============================================================================
    // TAREA
    // ============================================================================
    "{{tarea.id}}": context.tarea?.id || "",
    "{{tarea.numero}}": context.tarea?.numero || "",
    "{{tarea.titulo}}": context.tarea?.titulo || "",
    "{{tarea.link}}": context.tarea?.id ? `${siteUrl}/tareas/${context.tarea.id}` : "",
    "{{tarea.fechaCreacion}}": context.tarea?.createdAt ? formatDateTime(context.tarea.createdAt) : "",
    "{{tarea.fechaCierre}}": context.tarea?.closedAt ? formatDateTime(context.tarea.closedAt) : "",
    "{{tarea.reproducido}}": context.tarea?.reproducido ? "Sí" : "No",
    // Legacy
    "{TAREA_NUMERO}": context.tarea?.numero || "",
    "{TAREA_TITULO}": context.tarea?.titulo || "",
    "{TAREA_LINK}": context.tarea?.id ? `${siteUrl}/tareas/${context.tarea.id}` : "",
    // Backward compatibility
    "{{tarea.fecha}}": context.tarea?.createdAt ? formatDate(context.tarea.createdAt) : "",

    // ============================================================================
    // ESTADO
    // ============================================================================
    "{{estado.codigo}}": context.estado?.codigo || "",
    "{{estado.descripcion}}": context.estado?.descripcion || context.estado?.codigo || "",
    // Backward compatibility with tarea.estado
    "{{tarea.estado}}": context.estado?.codigo || "",

    // ============================================================================
    // TIPO
    // ============================================================================
    "{{tipo.codigo}}": context.tipo?.codigo || "",
    "{{tipo.descripcion}}": context.tipo?.descripcion || context.tipo?.codigo || "",
    // Backward compatibility with tarea.tipo
    "{{tarea.tipo}}": context.tipo?.codigo || "",

    // ============================================================================
    // PRIORIDAD
    // ============================================================================
    "{{prioridad.codigo}}": context.prioridad?.codigo || "",
    "{{prioridad.descripcion}}": context.prioridad?.descripcion || context.prioridad?.codigo || "",
    "{{prioridad.color}}": context.prioridad?.color || "",
    // Backward compatibility with tarea.prioridad
    "{{tarea.prioridad}}": context.prioridad?.codigo || "",

    // ============================================================================
    // MODULO
    // ============================================================================
    "{{modulo.codigo}}": context.modulo?.codigo || "",
    "{{modulo.descripcion}}": context.modulo?.descripcion || context.modulo?.codigo || "",
    // Backward compatibility with tarea.modulo
    "{{tarea.modulo}}": context.modulo?.codigo || "",

    // ============================================================================
    // RELEASE
    // ============================================================================
    "{{release.codigo}}": context.release?.codigo || "",
    "{{release.descripcion}}": context.release?.descripcion || context.release?.codigo || "",
    "{{release.rama}}": context.release?.rama || "",

    // ============================================================================
    // HOTFIX
    // ============================================================================
    "{{hotfix.codigo}}": context.hotfix?.codigo || "",
    "{{hotfix.descripcion}}": context.hotfix?.descripcion || context.hotfix?.codigo || "",
    "{{hotfix.rama}}": context.hotfix?.rama || "",

    // ============================================================================
    // CLIENTE
    // ============================================================================
    "{{cliente.codigo}}": context.cliente?.codigo || "",
    "{{cliente.nombre}}": context.cliente?.descripcion || context.cliente?.codigo || "",
    "{{cliente.descripcion}}": context.cliente?.descripcion || "",
    "{{cliente.jefeProyecto1}}": context.cliente?.jefeProyecto1 || "",
    "{{cliente.jefeProyecto2}}": context.cliente?.jefeProyecto2 || "",
    "{{cliente.licencia}}": context.cliente?.licenciaTipo || "",
    // Legacy
    "{CLIENTE_CODIGO}": context.cliente?.codigo || "",
    "{CLIENTE_NOMBRE}": context.cliente?.descripcion || context.cliente?.codigo || "",

    // ============================================================================
    // UNIDAD COMERCIAL
    // ============================================================================
    "{{unidad.codigo}}": context.unidadComercial?.codigo || "",
    "{{unidad.nombre}}": context.unidadComercial?.descripcion || context.unidadComercial?.codigo || "",
    "{{unidad.descripcion}}": context.unidadComercial?.descripcion || "",
    "{{unidad.scope}}": context.unidadComercial?.scope || "",
    // Legacy
    "{UNIDAD_CODIGO}": context.unidadComercial?.codigo || "",
    "{UNIDAD_NOMBRE}": context.unidadComercial?.descripcion || context.unidadComercial?.codigo || "",

    // ============================================================================
    // AGENTE (del evento o genérico)
    // ============================================================================
    "{{agente.nombre}}": context.agente?.nombre || "",
    "{{agente.email}}": context.agente?.email || "",
    "{AGENTE_NOMBRE}": context.agente?.nombre || "",

    // ============================================================================
    // AGENTE ASIGNADO
    // ============================================================================
    "{{agenteAsignado.nombre}}": context.agenteAsignado?.nombre || "Sin asignar",
    "{{agenteAsignado.email}}": context.agenteAsignado?.email || "",

    // ============================================================================
    // AGENTE CREADOR
    // ============================================================================
    "{{agenteCreador.nombre}}": context.agenteCreador?.nombre || "",
    "{{agenteCreador.email}}": context.agenteCreador?.email || "",

    // ============================================================================
    // AGENTE REVISOR
    // ============================================================================
    "{{agenteRevisor.nombre}}": context.agenteRevisor?.nombre || "",
    "{{agenteRevisor.email}}": context.agenteRevisor?.email || "",

    // ============================================================================
    // USUARIO CLIENTE CREADOR
    // ============================================================================
    "{{usuarioCreador.nombre}}": context.usuarioCreador?.nombre || "",
    "{{usuarioCreador.email}}": context.usuarioCreador?.email || "",

    // ============================================================================
    // EVENTO
    // ============================================================================
    "{{evento.fecha}}": context.evento?.fecha ? formatDateTime(context.evento.fecha) : "",
    "{{evento.contenido}}": context.evento?.contenido || "",
    "{{evento.tipo}}": context.evento?.tipo || "",
    // Legacy
    "{EVENTO_FECHA}": context.evento?.fecha ? formatDateTime(context.evento.fecha) : "",
    "{EVENTO_CONTENIDO}": context.evento?.contenido || "",

    // ============================================================================
    // DESTINATARIO
    // ============================================================================
    "{{destinatario.nombre}}": context.destinatario?.nombre || "",
    "{{destinatario.email}}": context.destinatario?.email || "",
    "{DESTINATARIO_NOMBRE}": context.destinatario?.nombre || "",

    // ============================================================================
    // CAMBIO (para notificaciones de cambios)
    // ============================================================================
    "{{cambio.campo}}": context.cambio?.campo || "",
    "{{cambio.anterior}}": context.cambio?.anterior || "(vacío)",
    "{{cambio.nuevo}}": context.cambio?.nuevo || "(vacío)",

    // ============================================================================
    // FECHA/HORA ACTUAL
    // ============================================================================
    "{{fecha.actual}}": dateStr,
    "{{fecha.hora}}": timeStr,
    "{{fecha.completa}}": `${dateStr} ${timeStr}`,
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
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
 * Gets a list of available wildcards with descriptions, organized by category
 */
export function getAvailableWildcards(): Array<{
  wildcard: string;
  description: string;
  category: string;
}> {
  return [
    // Tarea
    { wildcard: "{{tarea.numero}}", description: "Número de la tarea (ej: 202512345)", category: "Tarea" },
    { wildcard: "{{tarea.titulo}}", description: "Título de la tarea", category: "Tarea" },
    { wildcard: "{{tarea.link}}", description: "URL directa a la tarea", category: "Tarea" },
    { wildcard: "{{tarea.fechaCreacion}}", description: "Fecha y hora de creación", category: "Tarea" },
    { wildcard: "{{tarea.fechaCierre}}", description: "Fecha y hora de cierre", category: "Tarea" },
    { wildcard: "{{tarea.reproducido}}", description: "Bug reproducido (Sí/No)", category: "Tarea" },

    // Estado
    { wildcard: "{{estado.codigo}}", description: "Código del estado actual", category: "Estado" },
    { wildcard: "{{estado.descripcion}}", description: "Descripción del estado", category: "Estado" },

    // Tipo
    { wildcard: "{{tipo.codigo}}", description: "Código del tipo de tarea", category: "Tipo" },
    { wildcard: "{{tipo.descripcion}}", description: "Descripción del tipo", category: "Tipo" },

    // Prioridad
    { wildcard: "{{prioridad.codigo}}", description: "Código de prioridad", category: "Prioridad" },
    { wildcard: "{{prioridad.descripcion}}", description: "Descripción de prioridad", category: "Prioridad" },

    // Módulo
    { wildcard: "{{modulo.codigo}}", description: "Código del módulo", category: "Módulo" },
    { wildcard: "{{modulo.descripcion}}", description: "Descripción del módulo", category: "Módulo" },

    // Release
    { wildcard: "{{release.codigo}}", description: "Código del release (ej: R35)", category: "Release" },
    { wildcard: "{{release.descripcion}}", description: "Descripción del release", category: "Release" },
    { wildcard: "{{release.rama}}", description: "Rama (DESARROLLO/PRODUCCION)", category: "Release" },

    // Hotfix
    { wildcard: "{{hotfix.codigo}}", description: "Código del hotfix (ej: HF01)", category: "Hotfix" },
    { wildcard: "{{hotfix.descripcion}}", description: "Descripción del hotfix", category: "Hotfix" },

    // Cliente
    { wildcard: "{{cliente.codigo}}", description: "Código del cliente", category: "Cliente" },
    { wildcard: "{{cliente.nombre}}", description: "Nombre del cliente", category: "Cliente" },
    { wildcard: "{{cliente.jefeProyecto1}}", description: "Jefe de Proyecto 1", category: "Cliente" },
    { wildcard: "{{cliente.jefeProyecto2}}", description: "Jefe de Proyecto 2", category: "Cliente" },
    { wildcard: "{{cliente.licencia}}", description: "Tipo de licencia", category: "Cliente" },

    // Unidad Comercial
    { wildcard: "{{unidad.codigo}}", description: "Código de unidad comercial", category: "Unidad" },
    { wildcard: "{{unidad.nombre}}", description: "Nombre de unidad comercial", category: "Unidad" },
    { wildcard: "{{unidad.scope}}", description: "Ámbito (HOTEL/CENTRAL/TODOS)", category: "Unidad" },

    // Agente (genérico)
    { wildcard: "{{agente.nombre}}", description: "Nombre del agente del evento", category: "Agente" },
    { wildcard: "{{agente.email}}", description: "Email del agente del evento", category: "Agente" },

    // Agente Asignado
    { wildcard: "{{agenteAsignado.nombre}}", description: "Nombre del agente asignado", category: "Agente Asignado" },
    { wildcard: "{{agenteAsignado.email}}", description: "Email del agente asignado", category: "Agente Asignado" },

    // Agente Creador
    { wildcard: "{{agenteCreador.nombre}}", description: "Nombre del agente creador", category: "Agente Creador" },
    { wildcard: "{{agenteCreador.email}}", description: "Email del agente creador", category: "Agente Creador" },

    // Usuario Cliente
    { wildcard: "{{usuarioCreador.nombre}}", description: "Nombre del usuario cliente creador", category: "Usuario Cliente" },
    { wildcard: "{{usuarioCreador.email}}", description: "Email del usuario cliente creador", category: "Usuario Cliente" },

    // Evento
    { wildcard: "{{evento.fecha}}", description: "Fecha y hora del evento", category: "Evento" },
    { wildcard: "{{evento.contenido}}", description: "Contenido del comentario", category: "Evento" },
    { wildcard: "{{evento.tipo}}", description: "Tipo de evento", category: "Evento" },

    // Cambio
    { wildcard: "{{cambio.campo}}", description: "Campo que cambió", category: "Cambio" },
    { wildcard: "{{cambio.anterior}}", description: "Valor anterior", category: "Cambio" },
    { wildcard: "{{cambio.nuevo}}", description: "Valor nuevo", category: "Cambio" },

    // Destinatario
    { wildcard: "{{destinatario.nombre}}", description: "Nombre del destinatario", category: "Destinatario" },
    { wildcard: "{{destinatario.email}}", description: "Email del destinatario", category: "Destinatario" },

    // Fecha/Hora
    { wildcard: "{{fecha.actual}}", description: "Fecha actual (DD/MM/YYYY)", category: "Fecha" },
    { wildcard: "{{fecha.hora}}", description: "Hora actual (HH:MM)", category: "Fecha" },
    { wildcard: "{{fecha.completa}}", description: "Fecha y hora actuales", category: "Fecha" },
  ];
}
