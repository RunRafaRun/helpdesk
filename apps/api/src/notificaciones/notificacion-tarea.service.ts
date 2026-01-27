import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { EventoTipo, EstadoNotificacion, TipoNotificacion, WorkflowTrigger } from "@prisma/client";
import { resolveWildcards, WildcardContext } from "../utils/wildcard-resolver";
import { WorkflowEvaluationService, WorkflowContext } from "./workflow-evaluation.service";

export interface QueueNotificationParams {
  tareaId: string;
  eventoId?: string;
  eventoTipo: EventoTipo;
  // Optional: change context for workflow conditions
  changes?: {
    estadoAnteriorId?: string | null;
    estadoNuevoId?: string | null;
    prioridadAnteriorId?: string | null;
    prioridadNuevaId?: string | null;
    asignadoAnteriorId?: string | null;
    asignadoNuevoId?: string | null;
  };
}

@Injectable()
export class NotificacionTareaService {
  private readonly logger = new Logger(NotificacionTareaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: WorkflowEvaluationService
  ) {}

  /**
   * Queue a notification for a task event
   * Uses workflow system if workflows exist, otherwise falls back to legacy config
   */
  async queueNotification(params: QueueNotificationParams): Promise<void> {
    const { tareaId, eventoId, eventoTipo, changes } = params;

    try {
      // Get full tarea data with all relations needed for workflow evaluation
      const tarea = await this.prisma.tarea.findUnique({
        where: { id: tareaId },
        include: {
          cliente: true,
          unidadComercial: true,
          asignadoA: true,
          tipo: true,
          estado: true,
          prioridad: true,
          modulo: true,
          release: true,
          hotfix: true,
          revisadoPor: true,
          creadoPorAgente: true,
          creadoPorCliente: true,
        },
      });

      if (!tarea) {
        this.logger.warn(`Task not found: ${tareaId}`);
        return;
      }

      // Get the event if provided
      let evento: any = null;
      if (eventoId) {
        evento = await this.prisma.tareaEvento.findUnique({
          where: { id: eventoId },
          include: {
            creadoPorAgente: true,
            creadoPorCliente: true,
          },
        });
      }

      // Map EventoTipo to WorkflowTrigger
      const trigger = this.workflowService.eventToTrigger(eventoTipo);

      // Try workflow-based notification first
      if (trigger) {
        const hasWorkflows = await this.prisma.notificationWorkflow.count({
          where: { trigger, activo: true },
        });

        if (hasWorkflows > 0) {
          await this.queueWithWorkflows(tarea, evento, eventoTipo, trigger, changes);
          return;
        }
      }

      // Fall back to legacy config-based system
      await this.queueWithLegacyConfig(tarea, evento, eventoTipo);
    } catch (error: any) {
      this.logger.error(`Error queuing notification: ${error.message}`, error.stack);
    }
  }

  /**
   * Queue notification using workflow system
   */
  private async queueWithWorkflows(
    tarea: any,
    evento: any,
    eventoTipo: EventoTipo,
    trigger: WorkflowTrigger,
    changes?: QueueNotificationParams["changes"]
  ): Promise<void> {
    const context: WorkflowContext = {
      tarea,
      evento,
      trigger,
      changes,
    };

    // Evaluate all workflows and get aggregated recipients
    const result = await this.workflowService.evaluateWorkflows(context);

    if (result.to.length === 0) {
      this.logger.debug(`No workflow recipients for: ${tarea.numero} / ${eventoTipo}`);
      return;
    }

    // Build email content
    const { asunto, cuerpoHtml, cuerpoTexto } = await this.buildEmailContentWithWorkflow(
      tarea,
      evento,
      eventoTipo,
      result.plantillaId,
      result.asuntoCustom
    );

    // Create notification queue entry
    await this.prisma.notificacionTarea.create({
      data: {
        tareaId: tarea.id,
        eventoId: evento?.id || null,
        eventoTipo,
        tipoNotificacion: TipoNotificacion.EMAIL,
        emailsTo: result.to,
        emailsCc: result.cc,
        asunto,
        cuerpoHtml,
        cuerpoTexto,
        estado: EstadoNotificacion.PENDIENTE,
        prioridad: this.getEventPriority(eventoTipo),
      },
    });

    this.logger.log(
      `Workflow notification queued: ${tarea.numero} / ${eventoTipo} -> ${result.to.length} to, ${result.cc.length} cc`
    );
  }

  /**
   * Build email content using workflow template or defaults
   */
  private async buildEmailContentWithWorkflow(
    tarea: any,
    evento: any,
    eventoTipo: EventoTipo,
    plantillaId?: string | null,
    asuntoCustom?: string | null
  ): Promise<{ asunto: string; cuerpoHtml: string; cuerpoTexto: string }> {
    // Get site URL from config
    const siteUrl = process.env.SITE_URL || "http://localhost:5173";

    // Build context for wildcards
    const context = this.buildWildcardContext(tarea, evento, siteUrl);

    // Get subject
    let asunto = asuntoCustom || this.getDefaultSubject(eventoTipo);
    asunto = resolveWildcards(asunto, context);

    // Get template if specified
    let plantilla: any = null;
    if (plantillaId) {
      plantilla = await this.prisma.plantilla.findUnique({
        where: { id: plantillaId },
      });
    }

    // Build body from template or default
    let cuerpoHtml: string;
    if (plantilla?.texto) {
      cuerpoHtml = resolveWildcards(plantilla.texto, context);
    } else {
      cuerpoHtml = this.getDefaultBody(eventoTipo, context);
    }

    // Get mail signature
    const mailConfig = await this.prisma.configuracionMail.findFirst({
      where: { activo: true },
    });
    if (mailConfig?.firmaHtml) {
      cuerpoHtml += `<br><br>${mailConfig.firmaHtml}`;
    }

    // Generate plain text version
    const cuerpoTexto = this.htmlToText(cuerpoHtml);

    return { asunto, cuerpoHtml, cuerpoTexto };
  }

  /**
   * Queue notification using legacy config system (backwards compatibility)
   */
  private async queueWithLegacyConfig(
    tarea: any,
    evento: any,
    eventoTipo: EventoTipo
  ): Promise<void> {
    // Check if notifications are enabled for this event type
    const config = await this.prisma.notificacionConfigEvento.findUnique({
      where: { eventoTipo },
      include: { plantilla: true },
    });

    if (!config || !config.habilitado) {
      this.logger.debug(`Notifications disabled for event type: ${eventoTipo}`);
      return;
    }

    // Determine recipients using legacy logic
    const recipients = await this.getRecipientsLegacy(tarea, evento, eventoTipo, config);

    if (recipients.to.length === 0) {
      this.logger.debug(`No recipients for notification: ${tarea.id} / ${eventoTipo}`);
      return;
    }

    // Build email content
    const { asunto, cuerpoHtml, cuerpoTexto } = await this.buildEmailContentLegacy(
      tarea,
      evento,
      eventoTipo,
      config
    );

    // Create notification queue entry
    await this.prisma.notificacionTarea.create({
      data: {
        tareaId: tarea.id,
        eventoId: evento?.id || null,
        eventoTipo,
        tipoNotificacion: TipoNotificacion.EMAIL,
        emailsTo: recipients.to,
        emailsCc: recipients.cc,
        asunto,
        cuerpoHtml,
        cuerpoTexto,
        estado: EstadoNotificacion.PENDIENTE,
        prioridad: this.getEventPriority(eventoTipo),
      },
    });

    this.logger.log(`Legacy notification queued: ${tarea.numero} / ${eventoTipo} -> ${recipients.to.length} recipients`);
  }

  /**
   * Build wildcard context from task and event
   */
  private buildWildcardContext(tarea: any, evento: any, siteUrl: string): WildcardContext {
    return {
      tarea: {
        id: tarea.id,
        numero: tarea.numero,
        titulo: tarea.titulo,
        createdAt: tarea.createdAt,
      },
      cliente: {
        codigo: tarea.cliente?.codigo,
        descripcion: tarea.cliente?.descripcion,
      },
      unidadComercial: {
        codigo: tarea.unidadComercial?.codigo,
        descripcion: tarea.unidadComercial?.descripcion,
      },
      agente: evento?.creadoPorAgente
        ? {
            nombre: evento.creadoPorAgente.nombre,
            email: evento.creadoPorAgente.email,
          }
        : tarea.asignadoA
        ? {
            nombre: tarea.asignadoA.nombre,
            email: tarea.asignadoA.email,
          }
        : undefined,
      evento: evento
        ? {
            fecha: evento.createdAt,
            contenido: evento.cuerpo || "",
            tipo: evento.tipo,
          }
        : undefined,
      siteUrl,
    };
  }

  /**
   * Determine recipients based on event type and configuration (legacy)
   */
  private async getRecipientsLegacy(
    tarea: any,
    evento: any,
    eventoTipo: EventoTipo,
    config: any
  ): Promise<{ to: string[]; cc: string[] }> {
    const toEmails: string[] = [];
    const ccEmails: string[] = [];

    // Get client users if notifying client
    if (config.notificarCliente) {
      const clienteUsuarios = await this.prisma.clienteUsuario.findMany({
        where: {
          clienteId: tarea.clienteId,
          activo: true,
          recibeNotificaciones: true,
          email: { not: null },
        },
        select: { email: true, nombre: true },
      });

      for (const usuario of clienteUsuarios) {
        if (usuario.email) {
          // Don't notify the client user who created the event (for client messages)
          if (eventoTipo === EventoTipo.MENSAJE_CLIENTE &&
              evento?.creadoPorCliente?.email === usuario.email) {
            continue;
          }
          toEmails.push(usuario.email);
        }
      }
    }

    // Get assigned agent if notifying agent
    if (config.notificarAgente && tarea.asignadoA) {
      // Don't notify the agent who triggered the event
      if (evento?.creadoPorAgente?.id !== tarea.asignadoA.id) {
        if (tarea.asignadoA.email) {
          toEmails.push(tarea.asignadoA.email);
        }
      }
    }

    // For assignment events, notify the new assignee
    if (eventoTipo === EventoTipo.ASIGNACION && evento?.payload) {
      const payload = evento.payload as any;
      if (payload.nuevoAgenteId) {
        const nuevoAgente = await this.prisma.agente.findUnique({
          where: { id: payload.nuevoAgenteId },
          select: { email: true, nombre: true },
        });
        if (nuevoAgente?.email && !toEmails.includes(nuevoAgente.email)) {
          toEmails.push(nuevoAgente.email);
        }
      }
    }

    // Remove duplicates
    const uniqueTo = [...new Set(toEmails)];
    const uniqueCc = [...new Set(ccEmails.filter((e) => !uniqueTo.includes(e)))];

    return { to: uniqueTo, cc: uniqueCc };
  }

  /**
   * Build email content from template or defaults (legacy)
   */
  private async buildEmailContentLegacy(
    tarea: any,
    evento: any,
    eventoTipo: EventoTipo,
    config: any
  ): Promise<{ asunto: string; cuerpoHtml: string; cuerpoTexto: string }> {
    const siteUrl = process.env.SITE_URL || "http://localhost:5173";
    const context = this.buildWildcardContext(tarea, evento, siteUrl);

    // Get subject
    let asunto = config.asuntoDefault || this.getDefaultSubject(eventoTipo);
    asunto = resolveWildcards(asunto, context);

    // Build body from template or default
    let cuerpoHtml: string;
    if (config.plantilla?.texto) {
      cuerpoHtml = resolveWildcards(config.plantilla.texto, context);
    } else {
      cuerpoHtml = this.getDefaultBody(eventoTipo, context);
    }

    // Get mail signature
    const mailConfig = await this.prisma.configuracionMail.findFirst({
      where: { activo: true },
    });
    if (mailConfig?.firmaHtml) {
      cuerpoHtml += `<br><br>${mailConfig.firmaHtml}`;
    }

    // Generate plain text version
    const cuerpoTexto = this.htmlToText(cuerpoHtml);

    return { asunto, cuerpoHtml, cuerpoTexto };
  }

  /**
   * Get default subject based on event type
   */
  private getDefaultSubject(eventoTipo: EventoTipo): string {
    const subjects: Record<EventoTipo, string> = {
      [EventoTipo.MENSAJE_CLIENTE]: "[Ticket #{{tarea.numero}}] Nuevo mensaje del cliente",
      [EventoTipo.RESPUESTA_AGENTE]: "[Ticket #{{tarea.numero}}] Respuesta de soporte",
      [EventoTipo.NOTA_INTERNA]: "[Ticket #{{tarea.numero}}] Nueva nota interna",
      [EventoTipo.CAMBIO_ESTADO]: "[Ticket #{{tarea.numero}}] Cambio de estado",
      [EventoTipo.ASIGNACION]: "[Ticket #{{tarea.numero}}] Tarea asignada",
      [EventoTipo.CAMBIO_PRIORIDAD]: "[Ticket #{{tarea.numero}}] Cambio de prioridad",
      [EventoTipo.CAMBIO_TIPO]: "[Ticket #{{tarea.numero}}] Cambio de tipo",
      [EventoTipo.CAMBIO_MODULO]: "[Ticket #{{tarea.numero}}] Cambio de modulo",
      [EventoTipo.CAMBIO_RELEASE_HOTFIX]: "[Ticket #{{tarea.numero}}] Cambio de release/hotfix",
      [EventoTipo.SISTEMA]: "[Ticket #{{tarea.numero}}] Notificacion del sistema",
    };
    return subjects[eventoTipo] || "[Ticket #{{tarea.numero}}] Actualizacion";
  }

  /**
   * Get default body based on event type
   */
  private getDefaultBody(eventoTipo: EventoTipo, context: WildcardContext): string {
    const tareaLink = `<a href="${context.siteUrl}/tareas/${context.tarea?.id}">Ver tarea #${context.tarea?.numero}</a>`;

    switch (eventoTipo) {
      case EventoTipo.MENSAJE_CLIENTE:
        return `
          <p>Se ha recibido un nuevo mensaje del cliente en la tarea <strong>#${context.tarea?.numero}</strong>:</p>
          <p><strong>${context.tarea?.titulo}</strong></p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; margin-left: 0;">
            ${context.evento?.contenido || ""}
          </blockquote>
          <p>${tareaLink}</p>
        `;

      case EventoTipo.RESPUESTA_AGENTE:
        return `
          <p>Hay una nueva respuesta de ${context.agente?.nombre || "soporte"} en su ticket <strong>#${context.tarea?.numero}</strong>:</p>
          <p><strong>${context.tarea?.titulo}</strong></p>
          <blockquote style="border-left: 3px solid #2563eb; padding-left: 12px; margin-left: 0;">
            ${context.evento?.contenido || ""}
          </blockquote>
          <p>${tareaLink}</p>
        `;

      case EventoTipo.ASIGNACION:
        return `
          <p>Se le ha asignado la tarea <strong>#${context.tarea?.numero}</strong>:</p>
          <p><strong>${context.tarea?.titulo}</strong></p>
          <p>Cliente: ${context.cliente?.descripcion || context.cliente?.codigo}</p>
          <p>${tareaLink}</p>
        `;

      case EventoTipo.CAMBIO_ESTADO:
        return `
          <p>El estado de la tarea <strong>#${context.tarea?.numero}</strong> ha cambiado:</p>
          <p><strong>${context.tarea?.titulo}</strong></p>
          <p>${context.evento?.contenido || ""}</p>
          <p>${tareaLink}</p>
        `;

      default:
        return `
          <p>Hay una actualizacion en la tarea <strong>#${context.tarea?.numero}</strong>:</p>
          <p><strong>${context.tarea?.titulo}</strong></p>
          <p>${context.evento?.contenido || ""}</p>
          <p>${tareaLink}</p>
        `;
    }
  }

  /**
   * Get priority based on event type (lower = higher priority)
   */
  private getEventPriority(eventoTipo: EventoTipo): number {
    const priorities: Partial<Record<EventoTipo, number>> = {
      [EventoTipo.MENSAJE_CLIENTE]: 1, // High priority
      [EventoTipo.RESPUESTA_AGENTE]: 2,
      [EventoTipo.ASIGNACION]: 3,
      [EventoTipo.CAMBIO_ESTADO]: 4,
    };
    return priorities[eventoTipo] ?? 5;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }
}
