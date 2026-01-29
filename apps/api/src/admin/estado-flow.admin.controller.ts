import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard, RequirePermissions } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { PermisoCodigo } from "@prisma/client";
import { CreateEstadoFlowDto, UpdateEstadoFlowDto } from "./dto";

export interface EstadoFlowListItem {
  id: string;
  tipoTareaId: string;
  tipoTarea: { id: string; codigo: string; descripcion: string | null };
  estadoInicial: { id: string; codigo: string } | null;
  estadosCount: number;
  transicionesCount: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstadoFlowDetail {
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
  createdAt: Date;
  updatedAt: Date;
}

@ApiTags("admin/estado-flows")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/estado-flows")
@RequirePermissions(PermisoCodigo.CONFIG_MAESTROS)
export class EstadoFlowAdminController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all estado flows
   */
  @Get()
  async list(): Promise<EstadoFlowListItem[]> {
    const flows = await this.prisma.tipoTareaEstadoFlow.findMany({
      include: {
        tipoTarea: { select: { id: true, codigo: true, descripcion: true } },
        estadoInicial: { select: { id: true, codigo: true } },
        _count: {
          select: {
            estadosPermitidos: true,
            transiciones: true,
          },
        },
      },
      orderBy: { tipoTarea: { orden: "asc" } },
    });

    return flows.map((f) => ({
      id: f.id,
      tipoTareaId: f.tipoTareaId,
      tipoTarea: f.tipoTarea,
      estadoInicial: f.estadoInicial,
      estadosCount: f._count.estadosPermitidos,
      transicionesCount: f._count.transiciones,
      activo: f.activo,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));
  }

  /**
   * Get estado flow by tipo tarea ID
   */
  @Get("by-tipo/:tipoTareaId")
  async getByTipoTarea(@Param("tipoTareaId") tipoTareaId: string): Promise<EstadoFlowDetail | null> {
    const flow = await this.prisma.tipoTareaEstadoFlow.findUnique({
      where: { tipoTareaId },
      include: {
        tipoTarea: { select: { id: true, codigo: true, descripcion: true } },
        estadoInicial: { select: { id: true, codigo: true, descripcion: true } },
        estadosPermitidos: {
          include: {
            estado: { select: { id: true, codigo: true, descripcion: true } },
          },
          orderBy: { orden: "asc" },
        },
        transiciones: {
          include: {
            estadoOrigen: { select: { id: true, codigo: true } },
            estadoDestino: { select: { id: true, codigo: true } },
          },
          orderBy: [{ estadoOrigenId: "asc" }, { orden: "asc" }],
        },
      },
    });

    if (!flow) {
      return null;
    }

    return this.mapToDetail(flow);
  }

  /**
   * Get estado flow by ID
   */
  @Get(":id")
  async get(@Param("id") id: string): Promise<EstadoFlowDetail> {
    const flow = await this.prisma.tipoTareaEstadoFlow.findUnique({
      where: { id },
      include: {
        tipoTarea: { select: { id: true, codigo: true, descripcion: true } },
        estadoInicial: { select: { id: true, codigo: true, descripcion: true } },
        estadosPermitidos: {
          include: {
            estado: { select: { id: true, codigo: true, descripcion: true } },
          },
          orderBy: { orden: "asc" },
        },
        transiciones: {
          include: {
            estadoOrigen: { select: { id: true, codigo: true } },
            estadoDestino: { select: { id: true, codigo: true } },
          },
          orderBy: [{ estadoOrigenId: "asc" }, { orden: "asc" }],
        },
      },
    });

    if (!flow) {
      throw new NotFoundException("Flujo de estados no encontrado");
    }

    return this.mapToDetail(flow);
  }

  /**
   * Create or update estado flow for a tipo tarea
   */
  @Post()
  async create(@Body() dto: CreateEstadoFlowDto): Promise<EstadoFlowDetail> {
    // Validate tipoTarea exists
    const tipoTarea = await this.prisma.tipoTarea.findUnique({
      where: { id: dto.tipoTareaId },
    });
    if (!tipoTarea) {
      throw new BadRequestException("Tipo de tarea no encontrado");
    }

    // Check if flow already exists
    const existing = await this.prisma.tipoTareaEstadoFlow.findUnique({
      where: { tipoTareaId: dto.tipoTareaId },
    });

    if (existing) {
      // Update existing flow
      return this.update(existing.id, dto);
    }

    // Validate estadoInicial if provided
    if (dto.estadoInicialId) {
      const estado = await this.prisma.estadoTarea.findUnique({
        where: { id: dto.estadoInicialId },
      });
      if (!estado) {
        throw new BadRequestException("Estado inicial no encontrado");
      }
    }

    // Create new flow
    const flow = await this.prisma.tipoTareaEstadoFlow.create({
      data: {
        tipoTareaId: dto.tipoTareaId,
        estadoInicialId: dto.estadoInicialId,
        activo: dto.activo ?? true,
        estadosPermitidos: {
          create: dto.estadosPermitidos.map((e) => ({
            estadoId: e.estadoId,
            orden: e.orden ?? 0,
            visibleCliente: e.visibleCliente ?? true,
          })),
        },
        transiciones: {
          create: dto.transiciones.map((t) => ({
            estadoOrigenId: t.estadoOrigenId,
            estadoDestinoId: t.estadoDestinoId,
            permiteAgente: t.permiteAgente ?? true,
            permiteCliente: t.permiteCliente ?? false,
            notificar: t.notificar ?? false,
            orden: t.orden ?? 0,
          })),
        },
      },
      include: {
        tipoTarea: { select: { id: true, codigo: true, descripcion: true } },
        estadoInicial: { select: { id: true, codigo: true, descripcion: true } },
        estadosPermitidos: {
          include: {
            estado: { select: { id: true, codigo: true, descripcion: true } },
          },
          orderBy: { orden: "asc" },
        },
        transiciones: {
          include: {
            estadoOrigen: { select: { id: true, codigo: true } },
            estadoDestino: { select: { id: true, codigo: true } },
          },
          orderBy: [{ estadoOrigenId: "asc" }, { orden: "asc" }],
        },
      },
    });

    return this.mapToDetail(flow);
  }

  /**
   * Update estado flow
   */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateEstadoFlowDto
  ): Promise<EstadoFlowDetail> {
    const existing = await this.prisma.tipoTareaEstadoFlow.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Flujo de estados no encontrado");
    }

    // Validate estadoInicial if provided
    if (dto.estadoInicialId) {
      const estado = await this.prisma.estadoTarea.findUnique({
        where: { id: dto.estadoInicialId },
      });
      if (!estado) {
        throw new BadRequestException("Estado inicial no encontrado");
      }
    }

    // Use transaction to update flow
    await this.prisma.$transaction(async (tx) => {
      // Update main flow fields
      await tx.tipoTareaEstadoFlow.update({
        where: { id },
        data: {
          ...(dto.estadoInicialId !== undefined
            ? { estadoInicialId: dto.estadoInicialId }
            : {}),
          ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
        },
      });

      // Replace estadosPermitidos if provided
      if (dto.estadosPermitidos !== undefined) {
        await tx.tipoTareaEstado.deleteMany({
          where: { flowId: id },
        });
        if (dto.estadosPermitidos.length > 0) {
          await tx.tipoTareaEstado.createMany({
            data: dto.estadosPermitidos.map((e) => ({
              flowId: id,
              estadoId: e.estadoId,
              orden: e.orden ?? 0,
              visibleCliente: e.visibleCliente ?? true,
            })),
          });
        }
      }

      // Replace transiciones if provided
      if (dto.transiciones !== undefined) {
        await tx.tipoTareaTransicion.deleteMany({
          where: { flowId: id },
        });
        if (dto.transiciones.length > 0) {
          await tx.tipoTareaTransicion.createMany({
            data: dto.transiciones.map((t) => ({
              flowId: id,
              estadoOrigenId: t.estadoOrigenId,
              estadoDestinoId: t.estadoDestinoId,
              permiteAgente: t.permiteAgente ?? true,
              permiteCliente: t.permiteCliente ?? false,
              notificar: t.notificar ?? false,
              orden: t.orden ?? 0,
            })),
          });
        }
      }
    });

    return this.get(id);
  }

  /**
   * Delete estado flow for a tipo tarea
   */
  @Delete(":tipoTareaId")
  async remove(@Param("tipoTareaId") tipoTareaId: string): Promise<{ success: boolean }> {
    const flow = await this.prisma.tipoTareaEstadoFlow.findUnique({
      where: { tipoTareaId },
    });
    if (!flow) {
      throw new NotFoundException("Flujo de estados no encontrado");
    }

    await this.prisma.tipoTareaEstadoFlow.delete({
      where: { tipoTareaId },
    });

    return { success: true };
  }

  /**
   * Toggle flow active status
   */
  @Post(":id/toggle")
  async toggle(@Param("id") id: string): Promise<{ activo: boolean }> {
    const existing = await this.prisma.tipoTareaEstadoFlow.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Flujo de estados no encontrado");
    }

    const updated = await this.prisma.tipoTareaEstadoFlow.update({
      where: { id },
      data: { activo: !existing.activo },
    });

    return { activo: updated.activo };
  }

  private mapToDetail(flow: any): EstadoFlowDetail {
    return {
      id: flow.id,
      tipoTareaId: flow.tipoTareaId,
      tipoTarea: flow.tipoTarea,
      estadoInicialId: flow.estadoInicialId,
      estadoInicial: flow.estadoInicial,
      estadosPermitidos: flow.estadosPermitidos.map((e: any) => ({
        id: e.id,
        estadoId: e.estadoId,
        estado: e.estado,
        orden: e.orden,
        visibleCliente: e.visibleCliente,
      })),
      transiciones: flow.transiciones.map((t: any) => ({
        id: t.id,
        estadoOrigenId: t.estadoOrigenId,
        estadoOrigen: t.estadoOrigen,
        estadoDestinoId: t.estadoDestinoId,
        estadoDestino: t.estadoDestino,
        permiteAgente: t.permiteAgente,
        permiteCliente: t.permiteCliente,
        notificar: t.notificar,
        orden: t.orden,
      })),
      activo: flow.activo,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    };
  }
}
