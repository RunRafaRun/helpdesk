import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  WorkflowTrigger,
  WorkflowConditionField,
  WorkflowConditionOperator,
  WorkflowRecipientType,
  NotificationWorkflow,
  NotificationWorkflowCondition,
  NotificationWorkflowRecipient,
  Tarea,
  EventoTipo,
} from "@prisma/client";

// Context passed to workflow evaluation
export interface WorkflowContext {
  tarea: any; // Full task with relations
  evento?: any; // The event that triggered this
  trigger: WorkflowTrigger;
  // For change events, the old and new values
  changes?: {
    estadoAnteriorId?: string | null;
    estadoNuevoId?: string | null;
    prioridadAnteriorId?: string | null;
    prioridadNuevaId?: string | null;
    asignadoAnteriorId?: string | null;
    asignadoNuevoId?: string | null;
  };
}

// Result of evaluating a workflow
export interface WorkflowResult {
  workflowId: string;
  workflowName: string;
  matched: boolean;
  recipients: {
    to: string[];
    cc: string[];
  };
  plantillaId?: string | null;
  asuntoCustom?: string | null;
  stopOnMatch: boolean;
}

// Aggregated result of all matching workflows
export interface NotificationRecipients {
  to: string[];
  cc: string[];
  plantillaId?: string | null;
  asuntoCustom?: string | null;
}

type WorkflowWithRelations = NotificationWorkflow & {
  conditions: NotificationWorkflowCondition[];
  recipients: NotificationWorkflowRecipient[];
};

@Injectable()
export class WorkflowEvaluationService {
  private readonly logger = new Logger(WorkflowEvaluationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Map EventoTipo to WorkflowTrigger
   */
  eventToTrigger(eventoTipo: EventoTipo): WorkflowTrigger | null {
    const mapping: Record<EventoTipo, WorkflowTrigger> = {
      [EventoTipo.MENSAJE_CLIENTE]: WorkflowTrigger.MENSAJE_CLIENTE,
      [EventoTipo.RESPUESTA_AGENTE]: WorkflowTrigger.RESPUESTA_AGENTE,
      [EventoTipo.NOTA_INTERNA]: WorkflowTrigger.NOTA_INTERNA,
      [EventoTipo.CAMBIO_ESTADO]: WorkflowTrigger.CAMBIO_ESTADO,
      [EventoTipo.ASIGNACION]: WorkflowTrigger.CAMBIO_ASIGNACION,
      [EventoTipo.CAMBIO_PRIORIDAD]: WorkflowTrigger.CAMBIO_PRIORIDAD,
      [EventoTipo.CAMBIO_TIPO]: WorkflowTrigger.CAMBIO_TIPO,
      [EventoTipo.CAMBIO_MODULO]: WorkflowTrigger.CAMBIO_MODULO,
      [EventoTipo.CAMBIO_RELEASE_HOTFIX]: WorkflowTrigger.CAMBIO_RELEASE,
      [EventoTipo.SISTEMA]: WorkflowTrigger.TAREA_MODIFICADA, // Default for system events
    };
    return mapping[eventoTipo] || null;
  }

  /**
   * Evaluate all active workflows for a given trigger and return aggregated recipients
   */
  async evaluateWorkflows(
    context: WorkflowContext
  ): Promise<NotificationRecipients> {
    const { trigger, tarea } = context;

    // Fetch all active workflows for this trigger
    const workflows = await this.prisma.notificationWorkflow.findMany({
      where: {
        trigger,
        activo: true,
      },
      include: {
        conditions: true,
        recipients: true,
      },
      orderBy: { orden: "asc" },
    });

    if (workflows.length === 0) {
      this.logger.debug(`No active workflows for trigger: ${trigger}`);
      return { to: [], cc: [] };
    }

    const allTo = new Set<string>();
    const allCc = new Set<string>();
    let selectedPlantillaId: string | null = null;
    let selectedAsuntoCustom: string | null = null;

    for (const workflow of workflows) {
      const result = await this.evaluateWorkflow(workflow, context);

      if (result.matched) {
        this.logger.log(
          `Workflow "${result.workflowName}" matched for task ${tarea.numero}`
        );

        // Add recipients
        result.recipients.to.forEach((email) => allTo.add(email));
        result.recipients.cc.forEach((email) => allCc.add(email));

        // Use first matching workflow's template/subject if not already set
        if (!selectedPlantillaId && result.plantillaId) {
          selectedPlantillaId = result.plantillaId;
        }
        if (!selectedAsuntoCustom && result.asuntoCustom) {
          selectedAsuntoCustom = result.asuntoCustom;
        }

        // Stop processing if this workflow has stopOnMatch
        if (result.stopOnMatch) {
          this.logger.debug(
            `Stopping workflow evaluation due to stopOnMatch on "${result.workflowName}"`
          );
          break;
        }
      }
    }

    // Remove any cc that are already in to
    const ccArray = Array.from(allCc).filter((email) => !allTo.has(email));

    return {
      to: Array.from(allTo),
      cc: ccArray,
      plantillaId: selectedPlantillaId,
      asuntoCustom: selectedAsuntoCustom,
    };
  }

  /**
   * Evaluate a single workflow against the context
   */
  private async evaluateWorkflow(
    workflow: WorkflowWithRelations,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const { tarea } = context;

    // Check if all conditions match
    const conditionsMatch = await this.evaluateConditions(
      workflow.conditions,
      context
    );

    if (!conditionsMatch) {
      return {
        workflowId: workflow.id,
        workflowName: workflow.nombre,
        matched: false,
        recipients: { to: [], cc: [] },
        stopOnMatch: workflow.stopOnMatch,
      };
    }

    // Resolve recipients
    const recipients = await this.resolveRecipients(
      workflow,
      tarea
    );

    return {
      workflowId: workflow.id,
      workflowName: workflow.nombre,
      matched: true,
      recipients,
      plantillaId: workflow.plantillaId,
      asuntoCustom: workflow.asuntoCustom,
      stopOnMatch: workflow.stopOnMatch,
    };
  }

  /**
   * Evaluate conditions with AND/OR logic
   * Conditions in different orGroups use AND logic
   * Conditions in the same orGroup use OR logic
   */
  private async evaluateConditions(
    conditions: NotificationWorkflowCondition[],
    context: WorkflowContext
  ): Promise<boolean> {
    if (conditions.length === 0) {
      // No conditions = always match
      return true;
    }

    // Group conditions by orGroup
    const groups = new Map<number, NotificationWorkflowCondition[]>();
    for (const condition of conditions) {
      const group = condition.orGroup || 0;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(condition);
    }

    // Each group must have at least one matching condition (AND between groups)
    for (const [groupId, groupConditions] of groups) {
      // Within a group, any condition matching is enough (OR within group)
      const groupMatched = groupConditions.some((c) =>
        this.evaluateCondition(c, context)
      );
      if (!groupMatched) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: NotificationWorkflowCondition,
    context: WorkflowContext
  ): boolean {
    const { tarea, changes } = context;
    const { field, operator, value } = condition;

    // Get the actual value from the task/context
    const actualValue = this.getFieldValue(field, tarea, changes);

    // Apply the operator
    return this.applyOperator(operator, actualValue, value);
  }

  /**
   * Get the value of a field from the task or change context
   */
  private getFieldValue(
    field: WorkflowConditionField,
    tarea: any,
    changes?: WorkflowContext["changes"]
  ): any {
    switch (field) {
      case WorkflowConditionField.CLIENTE_ID:
        return tarea.clienteId;
      case WorkflowConditionField.CLIENTE_CODIGO:
        return tarea.cliente?.codigo;
      case WorkflowConditionField.ESTADO_ID:
        return tarea.estadoId;
      case WorkflowConditionField.ESTADO_CODIGO:
        return tarea.estado?.codigo;
      case WorkflowConditionField.TIPO_ID:
        return tarea.tipoId;
      case WorkflowConditionField.TIPO_CODIGO:
        return tarea.tipo?.codigo;
      case WorkflowConditionField.PRIORIDAD_ID:
        return tarea.prioridadId;
      case WorkflowConditionField.PRIORIDAD_CODIGO:
        return tarea.prioridad?.codigo;
      case WorkflowConditionField.MODULO_ID:
        return tarea.moduloId;
      case WorkflowConditionField.MODULO_CODIGO:
        return tarea.modulo?.codigo;
      case WorkflowConditionField.RELEASE_ID:
        return tarea.releaseId;
      case WorkflowConditionField.RELEASE_CODIGO:
        return tarea.release?.codigo;
      case WorkflowConditionField.RELEASE_RAMA:
        return tarea.release?.rama;
      case WorkflowConditionField.HOTFIX_ID:
        return tarea.hotfixId;
      case WorkflowConditionField.ASIGNADO_A_ID:
        return tarea.asignadoAId;
      case WorkflowConditionField.CREADO_POR_AGENTE_ID:
        return tarea.creadoPorAgenteId;
      case WorkflowConditionField.CREADO_POR_CLIENTE_ID:
        return tarea.creadoPorClienteId;
      case WorkflowConditionField.UNIDAD_COMERCIAL_ID:
        return tarea.unidadComercialId;
      case WorkflowConditionField.UNIDAD_COMERCIAL_SCOPE:
        return tarea.unidadComercial?.scope;
      case WorkflowConditionField.REPRODUCIDO:
        return tarea.reproducido;
      // Change-specific fields
      case WorkflowConditionField.ESTADO_ANTERIOR_ID:
        return changes?.estadoAnteriorId;
      case WorkflowConditionField.ESTADO_NUEVO_ID:
        return changes?.estadoNuevoId;
      case WorkflowConditionField.PRIORIDAD_ANTERIOR_ID:
        return changes?.prioridadAnteriorId;
      case WorkflowConditionField.PRIORIDAD_NUEVA_ID:
        return changes?.prioridadNuevaId;
      default:
        return undefined;
    }
  }

  /**
   * Apply comparison operator
   */
  private applyOperator(
    operator: WorkflowConditionOperator,
    actualValue: any,
    conditionValue: string | null
  ): boolean {
    switch (operator) {
      case WorkflowConditionOperator.IS_NULL:
        return actualValue == null || actualValue === "";

      case WorkflowConditionOperator.IS_NOT_NULL:
        return actualValue != null && actualValue !== "";

      case WorkflowConditionOperator.EQUALS:
        if (typeof actualValue === "boolean") {
          return actualValue === (conditionValue === "true");
        }
        return String(actualValue) === conditionValue;

      case WorkflowConditionOperator.NOT_EQUALS:
        if (typeof actualValue === "boolean") {
          return actualValue !== (conditionValue === "true");
        }
        return String(actualValue) !== conditionValue;

      case WorkflowConditionOperator.IN:
        if (!conditionValue) return false;
        try {
          const values = JSON.parse(conditionValue) as string[];
          return values.includes(String(actualValue));
        } catch {
          return conditionValue.split(",").includes(String(actualValue));
        }

      case WorkflowConditionOperator.NOT_IN:
        if (!conditionValue) return true;
        try {
          const values = JSON.parse(conditionValue) as string[];
          return !values.includes(String(actualValue));
        } catch {
          return !conditionValue.split(",").includes(String(actualValue));
        }

      case WorkflowConditionOperator.CONTAINS:
        if (!conditionValue || actualValue == null) return false;
        return String(actualValue)
          .toLowerCase()
          .includes(conditionValue.toLowerCase());

      case WorkflowConditionOperator.STARTS_WITH:
        if (!conditionValue || actualValue == null) return false;
        return String(actualValue)
          .toLowerCase()
          .startsWith(conditionValue.toLowerCase());

      default:
        return false;
    }
  }

  /**
   * Resolve recipient types to actual email addresses
   */
  private async resolveRecipients(
    workflow: WorkflowWithRelations,
    tarea: any
  ): Promise<{ to: string[]; cc: string[] }> {
    const toEmails = new Set<string>();
    const ccEmails = new Set<string>();

    for (const recipient of workflow.recipients) {
      const emails = await this.resolveRecipientType(
        recipient.recipientType,
        recipient.value,
        tarea
      );

      for (const email of emails) {
        if (recipient.isCc) {
          ccEmails.add(email);
        } else {
          toEmails.add(email);
        }
      }
    }

    // Add CC for JP1/JP2 if configured on workflow
    if (workflow.ccJefeProyecto1) {
      const jp1Emails = await this.resolveRecipientType(
        WorkflowRecipientType.JEFE_PROYECTO_1,
        null,
        tarea
      );
      jp1Emails.forEach((e) => ccEmails.add(e));
    }

    if (workflow.ccJefeProyecto2) {
      const jp2Emails = await this.resolveRecipientType(
        WorkflowRecipientType.JEFE_PROYECTO_2,
        null,
        tarea
      );
      jp2Emails.forEach((e) => ccEmails.add(e));
    }

    return {
      to: Array.from(toEmails),
      cc: Array.from(ccEmails).filter((e) => !toEmails.has(e)),
    };
  }

  /**
   * Resolve a single recipient type to email addresses
   */
  private async resolveRecipientType(
    type: WorkflowRecipientType,
    value: string | null,
    tarea: any
  ): Promise<string[]> {
    const emails: string[] = [];

    switch (type) {
      case WorkflowRecipientType.USUARIOS_CLIENTE: {
        const usuarios = await this.prisma.clienteUsuario.findMany({
          where: {
            clienteId: tarea.clienteId,
            activo: true,
            recibeNotificaciones: true,
            email: { not: null },
          },
          select: { email: true },
        });
        usuarios.forEach((u) => {
          if (u.email) emails.push(u.email);
        });
        break;
      }

      case WorkflowRecipientType.USUARIO_CLIENTE_CREADOR: {
        if (tarea.creadoPorClienteId) {
          const usuario = await this.prisma.clienteUsuario.findUnique({
            where: { id: tarea.creadoPorClienteId },
            select: { email: true, activo: true, recibeNotificaciones: true },
          });
          if (usuario?.email && usuario.activo && usuario.recibeNotificaciones) {
            emails.push(usuario.email);
          }
        }
        break;
      }

      case WorkflowRecipientType.JEFE_PROYECTO_1: {
        const cliente = await this.prisma.cliente.findUnique({
          where: { id: tarea.clienteId },
          select: { jefeProyecto1: true },
        });
        if (cliente?.jefeProyecto1) {
          // jefeProyecto1 might be agent username, look up email
          const agente = await this.prisma.agente.findFirst({
            where: {
              OR: [
                { usuario: cliente.jefeProyecto1 },
                { email: cliente.jefeProyecto1 },
              ],
              activo: true,
            },
            select: { email: true },
          });
          if (agente?.email) emails.push(agente.email);
        }
        break;
      }

      case WorkflowRecipientType.JEFE_PROYECTO_2: {
        const cliente = await this.prisma.cliente.findUnique({
          where: { id: tarea.clienteId },
          select: { jefeProyecto2: true },
        });
        if (cliente?.jefeProyecto2) {
          const agente = await this.prisma.agente.findFirst({
            where: {
              OR: [
                { usuario: cliente.jefeProyecto2 },
                { email: cliente.jefeProyecto2 },
              ],
              activo: true,
            },
            select: { email: true },
          });
          if (agente?.email) emails.push(agente.email);
        }
        break;
      }

      case WorkflowRecipientType.AGENTE_ASIGNADO: {
        if (tarea.asignadoAId) {
          const agente =
            tarea.asignadoA ||
            (await this.prisma.agente.findUnique({
              where: { id: tarea.asignadoAId },
              select: { email: true, activo: true },
            }));
          if (agente?.email && agente.activo !== false) {
            emails.push(agente.email);
          }
        }
        break;
      }

      case WorkflowRecipientType.AGENTE_CREADOR: {
        if (tarea.creadoPorAgenteId) {
          const agente = await this.prisma.agente.findUnique({
            where: { id: tarea.creadoPorAgenteId },
            select: { email: true, activo: true },
          });
          if (agente?.email && agente.activo) {
            emails.push(agente.email);
          }
        }
        break;
      }

      case WorkflowRecipientType.AGENTE_REVISOR: {
        if (tarea.revisadoPorId) {
          const agente = await this.prisma.agente.findUnique({
            where: { id: tarea.revisadoPorId },
            select: { email: true, activo: true },
          });
          if (agente?.email && agente.activo) {
            emails.push(agente.email);
          }
        }
        break;
      }

      case WorkflowRecipientType.AGENTES_ESPECIFICOS: {
        if (value) {
          try {
            const agenteIds = JSON.parse(value) as string[];
            const agentes = await this.prisma.agente.findMany({
              where: {
                id: { in: agenteIds },
                activo: true,
                email: { not: null },
              },
              select: { email: true },
            });
            agentes.forEach((a) => {
              if (a.email) emails.push(a.email);
            });
          } catch (e) {
            this.logger.warn(`Invalid agent IDs in workflow recipient: ${value}`);
          }
        }
        break;
      }

      case WorkflowRecipientType.ROLES_ESPECIFICOS: {
        if (value) {
          try {
            const roleIds = JSON.parse(value) as string[];
            const assignments = await this.prisma.agenteRoleAssignment.findMany({
              where: {
                roleId: { in: roleIds },
                agente: {
                  activo: true,
                  email: { not: null },
                },
              },
              include: {
                agente: { select: { email: true } },
              },
            });
            assignments.forEach((a) => {
              if (a.agente.email) emails.push(a.agente.email);
            });
          } catch (e) {
            this.logger.warn(`Invalid role IDs in workflow recipient: ${value}`);
          }
        }
        break;
      }

      case WorkflowRecipientType.EMAILS_MANUALES: {
        if (value) {
          try {
            const manualEmails = JSON.parse(value) as string[];
            emails.push(...manualEmails.filter((e) => e && e.includes("@")));
          } catch {
            // Try comma-separated
            value.split(",").forEach((e) => {
              const trimmed = e.trim();
              if (trimmed && trimmed.includes("@")) {
                emails.push(trimmed);
              }
            });
          }
        }
        break;
      }
    }

    return emails;
  }
}
