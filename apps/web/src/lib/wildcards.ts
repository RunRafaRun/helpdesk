// Wildcard definitions for templates - synced with backend wildcard-resolver.ts
export interface Wildcard {
  token: string;
  label: string;
  category: string;
  description: string;
}

export const WILDCARD_LIST: Wildcard[] = [
  // ============================================================================
  // TAREA
  // ============================================================================
  { token: "{{tarea.numero}}", label: "Número de Tarea", category: "Tarea", description: "Número de la tarea (ej: 202512345)" },
  { token: "{{tarea.titulo}}", label: "Título", category: "Tarea", description: "Título de la tarea" },
  { token: "{{tarea.link}}", label: "Link a Tarea", category: "Tarea", description: "URL directa a la tarea" },
  { token: "{{tarea.fechaCreacion}}", label: "Fecha Creación", category: "Tarea", description: "Fecha y hora de creación" },
  { token: "{{tarea.fechaCierre}}", label: "Fecha Cierre", category: "Tarea", description: "Fecha y hora de cierre" },
  { token: "{{tarea.reproducido}}", label: "Reproducido", category: "Tarea", description: "Bug reproducido (Sí/No)" },

  // ============================================================================
  // ESTADO
  // ============================================================================
  { token: "{{estado.codigo}}", label: "Código Estado", category: "Estado", description: "Código del estado actual" },
  { token: "{{estado.descripcion}}", label: "Descripción Estado", category: "Estado", description: "Descripción del estado" },

  // ============================================================================
  // TIPO
  // ============================================================================
  { token: "{{tipo.codigo}}", label: "Código Tipo", category: "Tipo", description: "Código del tipo de tarea" },
  { token: "{{tipo.descripcion}}", label: "Descripción Tipo", category: "Tipo", description: "Descripción del tipo" },

  // ============================================================================
  // PRIORIDAD
  // ============================================================================
  { token: "{{prioridad.codigo}}", label: "Código Prioridad", category: "Prioridad", description: "Código de prioridad" },
  { token: "{{prioridad.descripcion}}", label: "Descripción Prioridad", category: "Prioridad", description: "Descripción de la prioridad" },
  { token: "{{prioridad.color}}", label: "Color Prioridad", category: "Prioridad", description: "Color asignado a la prioridad" },

  // ============================================================================
  // MÓDULO
  // ============================================================================
  { token: "{{modulo.codigo}}", label: "Código Módulo", category: "Módulo", description: "Código del módulo" },
  { token: "{{modulo.descripcion}}", label: "Descripción Módulo", category: "Módulo", description: "Descripción del módulo" },

  // ============================================================================
  // RELEASE
  // ============================================================================
  { token: "{{release.codigo}}", label: "Código Release", category: "Release", description: "Código del release (ej: R35)" },
  { token: "{{release.descripcion}}", label: "Descripción Release", category: "Release", description: "Descripción del release" },
  { token: "{{release.rama}}", label: "Rama Release", category: "Release", description: "Rama (DESARROLLO/PRODUCCION)" },

  // ============================================================================
  // HOTFIX
  // ============================================================================
  { token: "{{hotfix.codigo}}", label: "Código Hotfix", category: "Hotfix", description: "Código del hotfix (ej: HF01)" },
  { token: "{{hotfix.descripcion}}", label: "Descripción Hotfix", category: "Hotfix", description: "Descripción del hotfix" },
  { token: "{{hotfix.rama}}", label: "Rama Hotfix", category: "Hotfix", description: "Rama del hotfix" },

  // ============================================================================
  // CLIENTE
  // ============================================================================
  { token: "{{cliente.codigo}}", label: "Código Cliente", category: "Cliente", description: "Código del cliente" },
  { token: "{{cliente.nombre}}", label: "Nombre Cliente", category: "Cliente", description: "Nombre del cliente" },
  { token: "{{cliente.descripcion}}", label: "Descripción Cliente", category: "Cliente", description: "Descripción del cliente" },
  { token: "{{cliente.jefeProyecto1}}", label: "Jefe Proyecto 1", category: "Cliente", description: "Jefe de Proyecto 1" },
  { token: "{{cliente.jefeProyecto2}}", label: "Jefe Proyecto 2", category: "Cliente", description: "Jefe de Proyecto 2" },
  { token: "{{cliente.licencia}}", label: "Tipo Licencia", category: "Cliente", description: "Tipo de licencia del cliente" },

  // ============================================================================
  // UNIDAD COMERCIAL
  // ============================================================================
  { token: "{{unidad.codigo}}", label: "Código Unidad", category: "Unidad Comercial", description: "Código de unidad comercial" },
  { token: "{{unidad.nombre}}", label: "Nombre Unidad", category: "Unidad Comercial", description: "Nombre de unidad comercial" },
  { token: "{{unidad.descripcion}}", label: "Descripción Unidad", category: "Unidad Comercial", description: "Descripción de unidad comercial" },
  { token: "{{unidad.scope}}", label: "Ámbito Unidad", category: "Unidad Comercial", description: "Ámbito (HOTEL/CENTRAL/TODOS)" },

  // ============================================================================
  // AGENTE (genérico - del evento)
  // ============================================================================
  { token: "{{agente.nombre}}", label: "Nombre Agente", category: "Agente", description: "Nombre del agente del evento" },
  { token: "{{agente.email}}", label: "Email Agente", category: "Agente", description: "Email del agente del evento" },

  // ============================================================================
  // AGENTE ASIGNADO
  // ============================================================================
  { token: "{{agenteAsignado.nombre}}", label: "Nombre Asignado", category: "Agente Asignado", description: "Nombre del agente asignado" },
  { token: "{{agenteAsignado.email}}", label: "Email Asignado", category: "Agente Asignado", description: "Email del agente asignado" },

  // ============================================================================
  // AGENTE CREADOR
  // ============================================================================
  { token: "{{agenteCreador.nombre}}", label: "Nombre Creador", category: "Agente Creador", description: "Nombre del agente creador" },
  { token: "{{agenteCreador.email}}", label: "Email Creador", category: "Agente Creador", description: "Email del agente creador" },

  // ============================================================================
  // AGENTE REVISOR
  // ============================================================================
  { token: "{{agenteRevisor.nombre}}", label: "Nombre Revisor", category: "Agente Revisor", description: "Nombre del agente revisor" },
  { token: "{{agenteRevisor.email}}", label: "Email Revisor", category: "Agente Revisor", description: "Email del agente revisor" },

  // ============================================================================
  // USUARIO CLIENTE CREADOR
  // ============================================================================
  { token: "{{usuarioCreador.nombre}}", label: "Usuario Creador", category: "Usuario Cliente", description: "Nombre del usuario cliente creador" },
  { token: "{{usuarioCreador.email}}", label: "Email Usuario Creador", category: "Usuario Cliente", description: "Email del usuario cliente creador" },

  // ============================================================================
  // EVENTO
  // ============================================================================
  { token: "{{evento.fecha}}", label: "Fecha Evento", category: "Evento", description: "Fecha y hora del evento" },
  { token: "{{evento.contenido}}", label: "Contenido Evento", category: "Evento", description: "Contenido del comentario/mensaje" },
  { token: "{{evento.tipo}}", label: "Tipo Evento", category: "Evento", description: "Tipo de evento" },

  // ============================================================================
  // CAMBIO (para notificaciones de cambios)
  // ============================================================================
  { token: "{{cambio.campo}}", label: "Campo Cambiado", category: "Cambio", description: "Campo que cambió" },
  { token: "{{cambio.anterior}}", label: "Valor Anterior", category: "Cambio", description: "Valor anterior" },
  { token: "{{cambio.nuevo}}", label: "Valor Nuevo", category: "Cambio", description: "Valor nuevo" },

  // ============================================================================
  // DESTINATARIO
  // ============================================================================
  { token: "{{destinatario.nombre}}", label: "Nombre Destinatario", category: "Destinatario", description: "Nombre del destinatario" },
  { token: "{{destinatario.email}}", label: "Email Destinatario", category: "Destinatario", description: "Email del destinatario" },

  // ============================================================================
  // FECHA/HORA ACTUAL
  // ============================================================================
  { token: "{{fecha.actual}}", label: "Fecha Actual", category: "Fecha", description: "Fecha actual (DD/MM/YYYY)" },
  { token: "{{fecha.hora}}", label: "Hora Actual", category: "Fecha", description: "Hora actual (HH:MM)" },
  { token: "{{fecha.completa}}", label: "Fecha y Hora", category: "Fecha", description: "Fecha y hora actuales" },
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

// Context interface for wildcard resolution (for preview)
export interface WildcardContext {
  tarea?: {
    id?: string | null;
    numero?: string | null;
    titulo?: string | null;
    createdAt?: Date | null;
    closedAt?: Date | null;
    reproducido?: boolean | null;
  } | null;
  cliente?: {
    codigo?: string | null;
    descripcion?: string | null;
    jefeProyecto1?: string | null;
    jefeProyecto2?: string | null;
    licenciaTipo?: string | null;
  } | null;
  unidadComercial?: {
    codigo?: string | null;
    descripcion?: string | null;
    scope?: string | null;
  } | null;
  estado?: {
    codigo?: string | null;
    descripcion?: string | null;
  } | null;
  tipo?: {
    codigo?: string | null;
    descripcion?: string | null;
  } | null;
  prioridad?: {
    codigo?: string | null;
    descripcion?: string | null;
    color?: string | null;
  } | null;
  modulo?: {
    codigo?: string | null;
    descripcion?: string | null;
  } | null;
  release?: {
    codigo?: string | null;
    descripcion?: string | null;
    rama?: string | null;
  } | null;
  hotfix?: {
    codigo?: string | null;
    descripcion?: string | null;
    rama?: string | null;
  } | null;
  agente?: {
    nombre?: string | null;
    email?: string | null;
  } | null;
  agenteAsignado?: {
    nombre?: string | null;
    email?: string | null;
  } | null;
  agenteCreador?: {
    nombre?: string | null;
    email?: string | null;
  } | null;
  agenteRevisor?: {
    nombre?: string | null;
    email?: string | null;
  } | null;
  usuarioCreador?: {
    nombre?: string | null;
    email?: string | null;
  } | null;
  evento?: {
    fecha?: Date | null;
    contenido?: string | null;
    tipo?: string | null;
  } | null;
  destinatario?: {
    nombre?: string | null;
    email?: string | null;
  } | null;
  cambio?: {
    campo?: string | null;
    anterior?: string | null;
    nuevo?: string | null;
  } | null;
  siteUrl?: string;
}

// Helper to format date
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

// Resolve wildcards in template text with actual values from context
export function resolveWildcards(template: string, context: WildcardContext): string {
  let result = template;
  const siteUrl = context.siteUrl || "http://localhost:5173";
  const now = new Date();

  // Build replacements map
  const replacements: Record<string, string> = {
    // Tarea
    "{{tarea.id}}": context.tarea?.id ?? "",
    "{{tarea.numero}}": context.tarea?.numero ?? "",
    "{{tarea.titulo}}": context.tarea?.titulo ?? "",
    "{{tarea.link}}": context.tarea?.id ? `${siteUrl}/tareas/${context.tarea.id}` : "",
    "{{tarea.fechaCreacion}}": context.tarea?.createdAt ? formatDateTime(new Date(context.tarea.createdAt)) : "",
    "{{tarea.fechaCierre}}": context.tarea?.closedAt ? formatDateTime(new Date(context.tarea.closedAt)) : "",
    "{{tarea.reproducido}}": context.tarea?.reproducido ? "Sí" : "No",
    // Backward compatibility
    "{{tarea.estado}}": context.estado?.codigo ?? "",
    "{{tarea.prioridad}}": context.prioridad?.codigo ?? "",
    "{{tarea.tipo}}": context.tipo?.codigo ?? "",
    "{{tarea.modulo}}": context.modulo?.codigo ?? "",

    // Estado
    "{{estado.codigo}}": context.estado?.codigo ?? "",
    "{{estado.descripcion}}": context.estado?.descripcion ?? context.estado?.codigo ?? "",

    // Tipo
    "{{tipo.codigo}}": context.tipo?.codigo ?? "",
    "{{tipo.descripcion}}": context.tipo?.descripcion ?? context.tipo?.codigo ?? "",

    // Prioridad
    "{{prioridad.codigo}}": context.prioridad?.codigo ?? "",
    "{{prioridad.descripcion}}": context.prioridad?.descripcion ?? context.prioridad?.codigo ?? "",
    "{{prioridad.color}}": context.prioridad?.color ?? "",

    // Módulo
    "{{modulo.codigo}}": context.modulo?.codigo ?? "",
    "{{modulo.descripcion}}": context.modulo?.descripcion ?? context.modulo?.codigo ?? "",

    // Release
    "{{release.codigo}}": context.release?.codigo ?? "",
    "{{release.descripcion}}": context.release?.descripcion ?? context.release?.codigo ?? "",
    "{{release.rama}}": context.release?.rama ?? "",

    // Hotfix
    "{{hotfix.codigo}}": context.hotfix?.codigo ?? "",
    "{{hotfix.descripcion}}": context.hotfix?.descripcion ?? context.hotfix?.codigo ?? "",
    "{{hotfix.rama}}": context.hotfix?.rama ?? "",

    // Cliente
    "{{cliente.codigo}}": context.cliente?.codigo ?? "",
    "{{cliente.nombre}}": context.cliente?.descripcion ?? context.cliente?.codigo ?? "",
    "{{cliente.descripcion}}": context.cliente?.descripcion ?? "",
    "{{cliente.jefeProyecto1}}": context.cliente?.jefeProyecto1 ?? "",
    "{{cliente.jefeProyecto2}}": context.cliente?.jefeProyecto2 ?? "",
    "{{cliente.licencia}}": context.cliente?.licenciaTipo ?? "",

    // Unidad Comercial
    "{{unidad.codigo}}": context.unidadComercial?.codigo ?? "",
    "{{unidad.nombre}}": context.unidadComercial?.descripcion ?? context.unidadComercial?.codigo ?? "",
    "{{unidad.descripcion}}": context.unidadComercial?.descripcion ?? "",
    "{{unidad.scope}}": context.unidadComercial?.scope ?? "",

    // Agente
    "{{agente.nombre}}": context.agente?.nombre ?? "",
    "{{agente.email}}": context.agente?.email ?? "",

    // Agente Asignado
    "{{agenteAsignado.nombre}}": context.agenteAsignado?.nombre ?? "Sin asignar",
    "{{agenteAsignado.email}}": context.agenteAsignado?.email ?? "",

    // Agente Creador
    "{{agenteCreador.nombre}}": context.agenteCreador?.nombre ?? "",
    "{{agenteCreador.email}}": context.agenteCreador?.email ?? "",

    // Agente Revisor
    "{{agenteRevisor.nombre}}": context.agenteRevisor?.nombre ?? "",
    "{{agenteRevisor.email}}": context.agenteRevisor?.email ?? "",

    // Usuario Cliente Creador
    "{{usuarioCreador.nombre}}": context.usuarioCreador?.nombre ?? "",
    "{{usuarioCreador.email}}": context.usuarioCreador?.email ?? "",

    // Evento
    "{{evento.fecha}}": context.evento?.fecha ? formatDateTime(new Date(context.evento.fecha)) : "",
    "{{evento.contenido}}": context.evento?.contenido ?? "",
    "{{evento.tipo}}": context.evento?.tipo ?? "",

    // Cambio
    "{{cambio.campo}}": context.cambio?.campo ?? "",
    "{{cambio.anterior}}": context.cambio?.anterior ?? "(vacío)",
    "{{cambio.nuevo}}": context.cambio?.nuevo ?? "(vacío)",

    // Destinatario
    "{{destinatario.nombre}}": context.destinatario?.nombre ?? "",
    "{{destinatario.email}}": context.destinatario?.email ?? "",

    // Fecha/Hora
    "{{fecha.actual}}": formatDate(now),
    "{{fecha.hora}}": formatTime(now),
    "{{fecha.completa}}": `${formatDate(now)} ${formatTime(now)}`,
  };

  // Apply replacements
  for (const [wildcard, value] of Object.entries(replacements)) {
    result = result.split(wildcard).join(value);
  }

  return result;
}

// Get sample context for preview
export function getSampleContext(): WildcardContext {
  const now = new Date();
  return {
    tarea: {
      id: "sample-task-id-123",
      numero: "202501234",
      titulo: "Problema con módulo de reservas",
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      closedAt: null,
      reproducido: true,
    },
    cliente: {
      codigo: "HOTEL_DEMO",
      descripcion: "Hotel Demo S.A.",
      jefeProyecto1: "Juan García",
      jefeProyecto2: "María López",
      licenciaTipo: "PPU",
    },
    unidadComercial: {
      codigo: "HC001",
      descripcion: "Hotel Central",
      scope: "HOTEL",
    },
    estado: {
      codigo: "ACEPTADA",
      descripcion: "Aceptada",
    },
    tipo: {
      codigo: "BUG",
      descripcion: "Bug/Error",
    },
    prioridad: {
      codigo: "ALTA",
      descripcion: "Alta",
      color: "#DC2626",
    },
    modulo: {
      codigo: "RESERVAS",
      descripcion: "Módulo de Reservas",
    },
    release: {
      codigo: "R35",
      descripcion: "Release 35 - Marzo 2025",
      rama: "DESARROLLO",
    },
    hotfix: {
      codigo: "HF01",
      descripcion: "Hotfix 01",
      rama: "PRODUCCION",
    },
    agente: {
      nombre: "Pedro Soporte",
      email: "pedro.soporte@empresa.com",
    },
    agenteAsignado: {
      nombre: "Ana Técnica",
      email: "ana.tecnica@empresa.com",
    },
    agenteCreador: {
      nombre: "Carlos Admin",
      email: "carlos.admin@empresa.com",
    },
    agenteRevisor: {
      nombre: "Luis Revisor",
      email: "luis.revisor@empresa.com",
    },
    usuarioCreador: {
      nombre: "Usuario Cliente",
      email: "usuario@hotel-demo.com",
    },
    evento: {
      fecha: now,
      contenido: "Este es un mensaje de ejemplo del cliente solicitando soporte.",
      tipo: "MENSAJE_CLIENTE",
    },
    cambio: {
      campo: "estado",
      anterior: "NUEVA",
      nuevo: "ACEPTADA",
    },
    destinatario: {
      nombre: "Destinatario Ejemplo",
      email: "destinatario@ejemplo.com",
    },
    siteUrl: "https://helpdesk.empresa.com",
  };
}
