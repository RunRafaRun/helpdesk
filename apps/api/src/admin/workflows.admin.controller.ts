import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard, RequirePermissions } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { PermisoCodigo, WorkflowTrigger } from "@prisma/client";
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowListItem,
  WorkflowDetail,
} from "../notificaciones/dto/workflow.dto";

@ApiTags("admin/workflows")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/workflows")
@RequirePermissions(PermisoCodigo.CONFIG_NOTIFICACIONES)
export class WorkflowsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all workflows with optional filters
   */
  @Get()
  async list(
    @Query("trigger") trigger?: WorkflowTrigger,
    @Query("activo") activo?: string,
    @Query("search") search?: string
  ): Promise<WorkflowListItem[]> {
    const whereActivo =
      activo === "true" ? true : activo === "false" ? false : undefined;

    const workflows = await this.prisma.notificationWorkflow.findMany({
      where: {
        ...(trigger ? { trigger } : {}),
        ...(whereActivo !== undefined ? { activo: whereActivo } : {}),
        ...(search
          ? {
              OR: [
                { nombre: { contains: search, mode: "insensitive" as const } },
                { descripcion: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: {
        plantilla: { select: { id: true, codigo: true } },
        _count: {
          select: {
            conditions: true,
            recipients: true,
          },
        },
      },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    return workflows.map((w) => ({
      id: w.id,
      nombre: w.nombre,
      descripcion: w.descripcion,
      trigger: w.trigger,
      activo: w.activo,
      orden: w.orden,
      stopOnMatch: w.stopOnMatch,
      conditionsCount: w._count.conditions,
      recipientsCount: w._count.recipients,
      plantilla: w.plantilla,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
  }

  /**
   * Get workflow by ID with full details
   */
  @Get(":id")
  async get(@Param("id") id: string): Promise<WorkflowDetail> {
    const workflow = await this.prisma.notificationWorkflow.findUnique({
      where: { id },
      include: {
        plantilla: { select: { id: true, codigo: true, descripcion: true } },
        conditions: {
          orderBy: [{ orGroup: "asc" }, { field: "asc" }],
        },
        recipients: {
          orderBy: { recipientType: "asc" },
        },
      },
    });

    if (!workflow) {
      throw new BadRequestException("Workflow no encontrado");
    }

    return {
      id: workflow.id,
      nombre: workflow.nombre,
      descripcion: workflow.descripcion,
      trigger: workflow.trigger,
      activo: workflow.activo,
      orden: workflow.orden,
      stopOnMatch: workflow.stopOnMatch,
      plantillaId: workflow.plantillaId,
      asuntoCustom: workflow.asuntoCustom,
      ccJefeProyecto1: workflow.ccJefeProyecto1,
      ccJefeProyecto2: workflow.ccJefeProyecto2,
      plantilla: workflow.plantilla,
      conditions: workflow.conditions.map((c) => ({
        id: c.id,
        field: c.field,
        operator: c.operator,
        value: c.value,
        orGroup: c.orGroup,
      })),
      recipients: workflow.recipients.map((r) => ({
        id: r.id,
        recipientType: r.recipientType,
        value: r.value,
        isCc: r.isCc,
      })),
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  /**
   * Create a new workflow with conditions and recipients
   */
  @Post()
  async create(@Body() dto: CreateWorkflowDto): Promise<WorkflowDetail> {
    const workflow = await this.prisma.notificationWorkflow.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        trigger: dto.trigger,
        activo: dto.activo ?? true,
        orden: dto.orden ?? 0,
        stopOnMatch: dto.stopOnMatch ?? false,
        plantillaId: dto.plantillaId,
        asuntoCustom: dto.asuntoCustom,
        ccJefeProyecto1: dto.ccJefeProyecto1 ?? false,
        ccJefeProyecto2: dto.ccJefeProyecto2 ?? false,
        conditions: dto.conditions
          ? {
              create: dto.conditions.map((c) => ({
                field: c.field,
                operator: c.operator,
                value: c.value,
                orGroup: c.orGroup ?? 0,
              })),
            }
          : undefined,
        recipients: dto.recipients
          ? {
              create: dto.recipients.map((r) => ({
                recipientType: r.recipientType,
                value: r.value,
                isCc: r.isCc ?? false,
              })),
            }
          : undefined,
      },
      include: {
        plantilla: { select: { id: true, codigo: true, descripcion: true } },
        conditions: true,
        recipients: true,
      },
    });

    return this.mapToDetail(workflow);
  }

  /**
   * Update a workflow and its conditions/recipients
   */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateWorkflowDto
  ): Promise<WorkflowDetail> {
    const existing = await this.prisma.notificationWorkflow.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new BadRequestException("Workflow no encontrado");
    }

    // Use transaction to update workflow and replace conditions/recipients
    await this.prisma.$transaction(async (tx) => {
      // Update main workflow fields
      await tx.notificationWorkflow.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
          ...(dto.descripcion !== undefined
            ? { descripcion: dto.descripcion }
            : {}),
          ...(dto.trigger !== undefined ? { trigger: dto.trigger } : {}),
          ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
          ...(dto.orden !== undefined ? { orden: dto.orden } : {}),
          ...(dto.stopOnMatch !== undefined
            ? { stopOnMatch: dto.stopOnMatch }
            : {}),
          ...(dto.plantillaId !== undefined
            ? { plantillaId: dto.plantillaId }
            : {}),
          ...(dto.asuntoCustom !== undefined
            ? { asuntoCustom: dto.asuntoCustom }
            : {}),
          ...(dto.ccJefeProyecto1 !== undefined
            ? { ccJefeProyecto1: dto.ccJefeProyecto1 }
            : {}),
          ...(dto.ccJefeProyecto2 !== undefined
            ? { ccJefeProyecto2: dto.ccJefeProyecto2 }
            : {}),
        },
      });

      // Replace conditions if provided
      if (dto.conditions !== undefined) {
        // Delete all existing conditions
        await tx.notificationWorkflowCondition.deleteMany({
          where: { workflowId: id },
        });
        // Create new conditions
        if (dto.conditions.length > 0) {
          await tx.notificationWorkflowCondition.createMany({
            data: dto.conditions.map((c) => ({
              workflowId: id,
              field: c.field,
              operator: c.operator,
              value: c.value,
              orGroup: c.orGroup ?? 0,
            })),
          });
        }
      }

      // Replace recipients if provided
      if (dto.recipients !== undefined) {
        // Delete all existing recipients
        await tx.notificationWorkflowRecipient.deleteMany({
          where: { workflowId: id },
        });
        // Create new recipients
        if (dto.recipients.length > 0) {
          await tx.notificationWorkflowRecipient.createMany({
            data: dto.recipients.map((r) => ({
              workflowId: id,
              recipientType: r.recipientType,
              value: r.value,
              isCc: r.isCc ?? false,
            })),
          });
        }
      }
    });

    // Fetch and return updated workflow
    return this.get(id);
  }

  /**
   * Delete a workflow
   */
  @Delete(":id")
  async remove(@Param("id") id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.notificationWorkflow.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new BadRequestException("Workflow no encontrado");
    }

    await this.prisma.notificationWorkflow.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Toggle workflow active status
   */
  @Post(":id/toggle")
  async toggle(@Param("id") id: string): Promise<{ activo: boolean }> {
    const existing = await this.prisma.notificationWorkflow.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new BadRequestException("Workflow no encontrado");
    }

    const updated = await this.prisma.notificationWorkflow.update({
      where: { id },
      data: { activo: !existing.activo },
    });

    return { activo: updated.activo };
  }

  /**
   * Duplicate a workflow
   */
  @Post(":id/duplicate")
  async duplicate(@Param("id") id: string): Promise<WorkflowDetail> {
    const original = await this.prisma.notificationWorkflow.findUnique({
      where: { id },
      include: {
        conditions: true,
        recipients: true,
      },
    });

    if (!original) {
      throw new BadRequestException("Workflow no encontrado");
    }

    const duplicated = await this.prisma.notificationWorkflow.create({
      data: {
        nombre: `${original.nombre} (copia)`,
        descripcion: original.descripcion,
        trigger: original.trigger,
        activo: false, // Start inactive
        orden: original.orden,
        stopOnMatch: original.stopOnMatch,
        plantillaId: original.plantillaId,
        asuntoCustom: original.asuntoCustom,
        ccJefeProyecto1: original.ccJefeProyecto1,
        ccJefeProyecto2: original.ccJefeProyecto2,
        conditions: {
          create: original.conditions.map((c) => ({
            field: c.field,
            operator: c.operator,
            value: c.value,
            orGroup: c.orGroup,
          })),
        },
        recipients: {
          create: original.recipients.map((r) => ({
            recipientType: r.recipientType,
            value: r.value,
            isCc: r.isCc,
          })),
        },
      },
      include: {
        plantilla: { select: { id: true, codigo: true, descripcion: true } },
        conditions: true,
        recipients: true,
      },
    });

    return this.mapToDetail(duplicated);
  }

  /**
   * Get available trigger types
   */
  @Get("meta/triggers")
  getTriggers() {
    return Object.values(WorkflowTrigger).map((trigger) => ({
      value: trigger,
      label: this.getTriggerLabel(trigger),
    }));
  }

  private mapToDetail(workflow: any): WorkflowDetail {
    return {
      id: workflow.id,
      nombre: workflow.nombre,
      descripcion: workflow.descripcion,
      trigger: workflow.trigger,
      activo: workflow.activo,
      orden: workflow.orden,
      stopOnMatch: workflow.stopOnMatch,
      plantillaId: workflow.plantillaId,
      asuntoCustom: workflow.asuntoCustom,
      ccJefeProyecto1: workflow.ccJefeProyecto1,
      ccJefeProyecto2: workflow.ccJefeProyecto2,
      plantilla: workflow.plantilla,
      conditions: workflow.conditions.map((c: any) => ({
        id: c.id,
        field: c.field,
        operator: c.operator,
        value: c.value,
        orGroup: c.orGroup,
      })),
      recipients: workflow.recipients.map((r: any) => ({
        id: r.id,
        recipientType: r.recipientType,
        value: r.value,
        isCc: r.isCc,
      })),
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  private getTriggerLabel(trigger: WorkflowTrigger): string {
    const labels: Record<WorkflowTrigger, string> = {
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
    };
    return labels[trigger] || trigger;
  }
}
