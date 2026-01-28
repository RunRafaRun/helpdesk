import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { EventoTipo, EstadoNotificacion, TipoNotificacion, WorkflowTrigger, WorkflowActionType, ActorTipo } from "@prisma/client";
import { resolveWildcards, WildcardContext } from "../utils/wildcard-resolver";
import { WorkflowEvaluationService, WorkflowContext, WorkflowActionResult } from "./workflow-evaluation.service";

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
    tipoAnteriorId?: string | null;
    tipoNuevoId?: string | null;
    moduloAnteriorId?: string | null;
    moduloNuevoId?: string | null;
    releaseAnteriorId?: string | null;
    releaseNuevoId?: string | null;
  };
  // Flag to prevent infinite loops from workflow-triggered changes
  fromWorkflow?: boolean;
}

export interface QueueNotificationByTriggerParams {
  tareaId: string;
  eventoId?: string;
  trigger: "TAREA_CREADA" | "TAREA_CERRADA" | "TAREA_MODIFICADA";
  // Optional: change context for TAREA_MODIFICADA workflow conditions
  changes?: {
    estadoAnteriorId?: string | null;
    estadoNuevoId?: string | null;
    prioridadAnteriorId?: string | null;
    prioridadNuevaId?: string | null;
    tipoAnteriorId?: string | null;
    tipoNuevoId?: string | null;
    moduloAnteriorId?: string | null;
    moduloNuevoId?: string | null;
    releaseAnteriorId?: string | null;
    releaseNuevoId?: string | null;
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
    const { tareaId, eventoId, eventoTipo, changes, fromWorkflow } = params;

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

      // Only use workflow-based notifications (no legacy fallback)
      if (!trigger) {
        this.logger.debug(`No workflow trigger mapping for event type: ${eventoTipo}`);
        return;
      }

      const hasWorkflows = await this.prisma.notificationWorkflow.count({
        where: { trigger, activo: true },
      });

      if (hasWorkflows === 0) {
        this.logger.debug(`No active workflows for trigger: ${trigger} (event: ${eventoTipo})`);
        return;
      }

      await this.queueWithWorkflows(tarea, evento, eventoTipo, trigger, changes, fromWorkflow);
    } catch (error: any) {
      this.logger.error(`Error queuing notification: ${error.message}`, error.stack);
    }
  }

  /**
   * Queue a notification by direct trigger type (for TAREA_CREADA, TAREA_CERRADA, TAREA_MODIFICADA)
   * These triggers don't have a corresponding EventoTipo or need special handling
   */
  async queueNotificationByTrigger(params: QueueNotificationByTriggerParams): Promise<void> {
    const { tareaId, eventoId, trigger, changes } = params;

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

      // Map trigger string to WorkflowTrigger enum
      let workflowTrigger: WorkflowTrigger;
      if (trigger === "TAREA_CREADA") {
        workflowTrigger = WorkflowTrigger.TAREA_CREADA;
      } else if (trigger === "TAREA_CERRADA") {
        workflowTrigger = WorkflowTrigger.TAREA_CERRADA;
      } else {
        workflowTrigger = WorkflowTrigger.TAREA_MODIFICADA;
      }

      // Check if there are workflows for this trigger
      const hasWorkflows = await this.prisma.notificationWorkflow.count({
        where: { trigger: workflowTrigger, activo: true },
      });

      if (hasWorkflows === 0) {
        this.logger.debug(`No active workflows for trigger: ${trigger}`);
        return;
      }

      // Evaluate workflows and get recipients
      const context: WorkflowContext = {
        tarea,
        evento,
        trigger: workflowTrigger,
        changes, // Include changes for TAREA_MODIFICADA workflow conditions
      };

      const result = await this.workflowService.evaluateWorkflows(context);

      // Execute any actions
      if (result.actions.length > 0) {
        await this.executeActions(tarea.id, result.actions);
      }

      if (result.to.length === 0) {
        this.logger.debug(`No workflow recipients for: ${tarea.numero} / ${trigger}`);
        return;
      }

      // Determine event type for the notification record
      let eventoTipo: EventoTipo;
      if (trigger === "TAREA_CREADA") {
        eventoTipo = EventoTipo.MENSAJE_CLIENTE; // Task creation is associated with initial client message
      } else if (trigger === "TAREA_CERRADA") {
        eventoTipo = EventoTipo.CAMBIO_ESTADO;  // Task closure is a state change
      } else {
        eventoTipo = EventoTipo.SISTEMA; // TAREA_MODIFICADA uses SISTEMA event type
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
          prioridad: 1, // High priority for task creation/closure
        },
      });

      this.logger.log(
        `Workflow notification queued (${trigger}): ${tarea.numero} -> ${result.to.length} to, ${result.cc.length} cc`
      );
    } catch (error: any) {
      this.logger.error(`Error queuing notification by trigger: ${error.message}`, error.stack);
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
    changes?: QueueNotificationParams["changes"],
    fromWorkflow?: boolean
  ): Promise<void> {
    const context: WorkflowContext = {
      tarea,
      evento,
      trigger,
      changes,
    };

    // Evaluate all workflows and get aggregated recipients
    const result = await this.workflowService.evaluateWorkflows(context);

    // Execute actions if this notification was NOT triggered by a workflow action
    // This prevents infinite loops
    if (!fromWorkflow && result.actions.length > 0) {
      await this.executeActions(tarea.id, result.actions);
    }

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

  /**
   * Execute workflow actions on a task
   * This modifies task fields and creates events with fromWorkflow flag
   */
  private async executeActions(
    tareaId: string,
    actions: WorkflowActionResult[]
  ): Promise<void> {
    if (actions.length === 0) return;

    for (const action of actions) {
      try {
        await this.executeAction(tareaId, action);
      } catch (error: any) {
        this.logger.error(
          `Error executing action ${action.actionType} on task ${tareaId}: ${error.message}`
        );
      }
    }
  }

  /**
   * Execute a single workflow action
   */
  private async executeAction(
    tareaId: string,
    action: WorkflowActionResult
  ): Promise<void> {
    if (!action.value) {
      this.logger.warn(`Action ${action.actionType} has no value, skipping`);
      return;
    }

    const tarea = await this.prisma.tarea.findUnique({
      where: { id: tareaId },
      include: {
        estado: true,
        tipo: true,
        prioridad: true,
        modulo: true,
        release: true,
        asignadoA: true,
      },
    });

    if (!tarea) {
      this.logger.warn(`Task ${tareaId} not found, skipping action`);
      return;
    }

    switch (action.actionType) {
      case WorkflowActionType.CAMBIAR_ESTADO:
        await this.applyEstadoChange(tarea, action.value);
        break;
      case WorkflowActionType.CAMBIAR_PRIORIDAD:
        await this.applyPrioridadChange(tarea, action.value);
        break;
      case WorkflowActionType.CAMBIAR_TIPO:
        await this.applyTipoChange(tarea, action.value);
        break;
      case WorkflowActionType.ASIGNAR_AGENTE:
        await this.applyAgenteChange(tarea, action.value);
        break;
      case WorkflowActionType.CAMBIAR_MODULO:
        await this.applyModuloChange(tarea, action.value);
        break;
      case WorkflowActionType.CAMBIAR_RELEASE:
        await this.applyReleaseChange(tarea, action.value);
        break;
      default:
        this.logger.warn(`Unknown action type: ${action.actionType}`);
    }
  }

  /**
   * Apply estado change from workflow action
   */
  private async applyEstadoChange(tarea: any, nuevoEstadoId: string): Promise<void> {
    if (tarea.estadoId === nuevoEstadoId) {
      this.logger.debug(`Estado already ${nuevoEstadoId}, skipping`);
      return;
    }

    const nuevoEstado = await this.prisma.estadoTarea.findUnique({
      where: { id: nuevoEstadoId },
    });
    if (!nuevoEstado) {
      this.logger.warn(`Estado ${nuevoEstadoId} not found`);
      return;
    }

    await this.prisma.tarea.update({
      where: { id: tarea.id },
      data: { estadoId: nuevoEstadoId },
    });

    // Create event for the change (marked as from workflow to prevent loops)
    const evento = await this.prisma.tareaEvento.create({
      data: {
        tareaId: tarea.id,
        tipo: EventoTipo.CAMBIO_ESTADO,
        cuerpo: `Estado: ${tarea.estado?.codigo ?? "(vacío)"} → ${nuevoEstado.codigo} (automático)`,
        actorTipo: ActorTipo.AGENTE,
        visibleEnTimeline: true,
        visibleParaCliente: false,
        payload: {
          field: "estado",
          oldValue: tarea.estado?.codigo ?? null,
          newValue: nuevoEstado.codigo,
          fromWorkflow: true,
        },
      },
    });

    this.logger.log(
      `Workflow action: Changed estado of ${tarea.numero} to ${nuevoEstado.codigo}`
    );

    // Queue notification for this change, but mark it as from workflow
    await this.queueNotification({
      tareaId: tarea.id,
      eventoId: evento.id,
      eventoTipo: EventoTipo.CAMBIO_ESTADO,
      changes: {
        estadoAnteriorId: tarea.estadoId,
        estadoNuevoId: nuevoEstadoId,
      },
      fromWorkflow: true,
    });
  }

  /**
   * Apply prioridad change from workflow action
   */
  private async applyPrioridadChange(tarea: any, nuevaPrioridadId: string): Promise<void> {
    if (tarea.prioridadId === nuevaPrioridadId) {
      this.logger.debug(`Prioridad already ${nuevaPrioridadId}, skipping`);
      return;
    }

    const nuevaPrioridad = await this.prisma.prioridadTarea.findUnique({
      where: { id: nuevaPrioridadId },
    });
    if (!nuevaPrioridad) {
      this.logger.warn(`Prioridad ${nuevaPrioridadId} not found`);
      return;
    }

    await this.prisma.tarea.update({
      where: { id: tarea.id },
      data: { prioridadId: nuevaPrioridadId },
    });

    const evento = await this.prisma.tareaEvento.create({
      data: {
        tareaId: tarea.id,
        tipo: EventoTipo.CAMBIO_PRIORIDAD,
        cuerpo: `Prioridad: ${tarea.prioridad?.codigo ?? "(vacío)"} → ${nuevaPrioridad.codigo} (automático)`,
        actorTipo: ActorTipo.AGENTE,
        visibleEnTimeline: true,
        visibleParaCliente: false,
        payload: {
          field: "prioridad",
          oldValue: tarea.prioridad?.codigo ?? null,
          newValue: nuevaPrioridad.codigo,
          fromWorkflow: true,
        },
      },
    });

    this.logger.log(
      `Workflow action: Changed prioridad of ${tarea.numero} to ${nuevaPrioridad.codigo}`
    );

    await this.queueNotification({
      tareaId: tarea.id,
      eventoId: evento.id,
      eventoTipo: EventoTipo.CAMBIO_PRIORIDAD,
      changes: {
        prioridadAnteriorId: tarea.prioridadId,
        prioridadNuevaId: nuevaPrioridadId,
      },
      fromWorkflow: true,
    });
  }

  /**
   * Apply tipo change from workflow action
   */
  private async applyTipoChange(tarea: any, nuevoTipoId: string): Promise<void> {
    if (tarea.tipoId === nuevoTipoId) {
      this.logger.debug(`Tipo already ${nuevoTipoId}, skipping`);
      return;
    }

    const nuevoTipo = await this.prisma.tipoTarea.findUnique({
      where: { id: nuevoTipoId },
    });
    if (!nuevoTipo) {
      this.logger.warn(`Tipo ${nuevoTipoId} not found`);
      return;
    }

    await this.prisma.tarea.update({
      where: { id: tarea.id },
      data: { tipoId: nuevoTipoId },
    });

    const evento = await this.prisma.tareaEvento.create({
      data: {
        tareaId: tarea.id,
        tipo: EventoTipo.CAMBIO_TIPO,
        cuerpo: `Tipo: ${tarea.tipo?.codigo ?? "(vacío)"} → ${nuevoTipo.codigo} (automático)`,
        actorTipo: ActorTipo.AGENTE,
        visibleEnTimeline: true,
        visibleParaCliente: false,
        payload: {
          field: "tipo",
          oldValue: tarea.tipo?.codigo ?? null,
          newValue: nuevoTipo.codigo,
          fromWorkflow: true,
        },
      },
    });

    this.logger.log(
      `Workflow action: Changed tipo of ${tarea.numero} to ${nuevoTipo.codigo}`
    );

    await this.queueNotification({
      tareaId: tarea.id,
      eventoId: evento.id,
      eventoTipo: EventoTipo.CAMBIO_TIPO,
      changes: {
        tipoAnteriorId: tarea.tipoId,
        tipoNuevoId: nuevoTipoId,
      },
      fromWorkflow: true,
    });
  }

  /**
   * Apply agente assignment from workflow action
   */
  private async applyAgenteChange(tarea: any, nuevoAgenteId: string): Promise<void> {
    if (tarea.asignadoAId === nuevoAgenteId) {
      this.logger.debug(`Agente already ${nuevoAgenteId}, skipping`);
      return;
    }

    const nuevoAgente = await this.prisma.agente.findUnique({
      where: { id: nuevoAgenteId },
    });
    if (!nuevoAgente) {
      this.logger.warn(`Agente ${nuevoAgenteId} not found`);
      return;
    }

    await this.prisma.tarea.update({
      where: { id: tarea.id },
      data: { asignadoAId: nuevoAgenteId },
    });

    const evento = await this.prisma.tareaEvento.create({
      data: {
        tareaId: tarea.id,
        tipo: EventoTipo.ASIGNACION,
        cuerpo: tarea.asignadoA
          ? `Reasignado de ${tarea.asignadoA.nombre} a ${nuevoAgente.nombre} (automático)`
          : `Asignado a ${nuevoAgente.nombre} (automático)`,
        actorTipo: ActorTipo.AGENTE,
        visibleEnTimeline: true,
        visibleParaCliente: false,
        payload: {
          agenteAnteriorId: tarea.asignadoAId ?? null,
          agenteAnteriorNombre: tarea.asignadoA?.nombre ?? null,
          nuevoAgenteId: nuevoAgente.id,
          nuevoAgenteNombre: nuevoAgente.nombre,
          fromWorkflow: true,
        },
      },
    });

    this.logger.log(
      `Workflow action: Assigned ${tarea.numero} to ${nuevoAgente.nombre}`
    );

    await this.queueNotification({
      tareaId: tarea.id,
      eventoId: evento.id,
      eventoTipo: EventoTipo.ASIGNACION,
      changes: {
        asignadoAnteriorId: tarea.asignadoAId,
        asignadoNuevoId: nuevoAgenteId,
      },
      fromWorkflow: true,
    });
  }

  /**
   * Apply modulo change from workflow action
   */
  private async applyModuloChange(tarea: any, nuevoModuloId: string): Promise<void> {
    if (tarea.moduloId === nuevoModuloId) {
      this.logger.debug(`Modulo already ${nuevoModuloId}, skipping`);
      return;
    }

    const nuevoModulo = await this.prisma.modulo.findUnique({
      where: { id: nuevoModuloId },
    });
    if (!nuevoModulo) {
      this.logger.warn(`Modulo ${nuevoModuloId} not found`);
      return;
    }

    await this.prisma.tarea.update({
      where: { id: tarea.id },
      data: { moduloId: nuevoModuloId },
    });

    const evento = await this.prisma.tareaEvento.create({
      data: {
        tareaId: tarea.id,
        tipo: EventoTipo.CAMBIO_MODULO,
        cuerpo: `Modulo: ${tarea.modulo?.codigo ?? "(vacío)"} → ${nuevoModulo.codigo} (automático)`,
        actorTipo: ActorTipo.AGENTE,
        visibleEnTimeline: true,
        visibleParaCliente: false,
        payload: {
          field: "modulo",
          oldValue: tarea.modulo?.codigo ?? null,
          newValue: nuevoModulo.codigo,
          fromWorkflow: true,
        },
      },
    });

    this.logger.log(
      `Workflow action: Changed modulo of ${tarea.numero} to ${nuevoModulo.codigo}`
    );

    await this.queueNotification({
      tareaId: tarea.id,
      eventoId: evento.id,
      eventoTipo: EventoTipo.CAMBIO_MODULO,
      changes: {
        moduloAnteriorId: tarea.moduloId,
        moduloNuevoId: nuevoModuloId,
      },
      fromWorkflow: true,
    });
  }

  /**
   * Apply release change from workflow action
   */
  private async applyReleaseChange(tarea: any, nuevoReleaseId: string): Promise<void> {
    if (tarea.releaseId === nuevoReleaseId) {
      this.logger.debug(`Release already ${nuevoReleaseId}, skipping`);
      return;
    }

    const nuevoRelease = await this.prisma.release.findUnique({
      where: { id: nuevoReleaseId },
    });
    if (!nuevoRelease) {
      this.logger.warn(`Release ${nuevoReleaseId} not found`);
      return;
    }

    await this.prisma.tarea.update({
      where: { id: tarea.id },
      data: { releaseId: nuevoReleaseId },
    });

    const evento = await this.prisma.tareaEvento.create({
      data: {
        tareaId: tarea.id,
        tipo: EventoTipo.CAMBIO_RELEASE_HOTFIX,
        cuerpo: `Release: ${tarea.release?.codigo ?? "(vacío)"} → ${nuevoRelease.codigo} (automático)`,
        actorTipo: ActorTipo.AGENTE,
        visibleEnTimeline: true,
        visibleParaCliente: false,
        payload: {
          field: "release",
          oldValue: tarea.release?.codigo ?? null,
          newValue: nuevoRelease.codigo,
          fromWorkflow: true,
        },
      },
    });

    this.logger.log(
      `Workflow action: Changed release of ${tarea.numero} to ${nuevoRelease.codigo}`
    );

    await this.queueNotification({
      tareaId: tarea.id,
      eventoId: evento.id,
      eventoTipo: EventoTipo.CAMBIO_RELEASE_HOTFIX,
      changes: {
        releaseAnteriorId: tarea.releaseId,
        releaseNuevoId: nuevoReleaseId,
      },
      fromWorkflow: true,
    });
  }
}
