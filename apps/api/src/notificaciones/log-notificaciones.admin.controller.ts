import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard, RequirePermissions } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { NotificationQueueService } from "./notification-queue.service";
import { PermisoCodigo, EstadoNotificacion, Prisma } from "@prisma/client";
import { ListNotificacionLogDto } from "./dto/notificacion-log.dto";

@ApiTags("admin/log-notificaciones")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/log-notificaciones")
@RequirePermissions(PermisoCodigo.CONFIG_NOTIFICACIONES)
export class LogNotificacionesAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: NotificationQueueService
  ) {}

  @Get()
  async list(@Query() dto: ListNotificacionLogDto) {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.NotificacionTareaWhereInput = {};

    if (dto.estado) {
      where.estado = dto.estado;
    }

    if (dto.eventoTipo) {
      where.eventoTipo = dto.eventoTipo;
    }

    if (dto.tareaId) {
      where.tareaId = dto.tareaId;
    }

    if (dto.fechaDesde) {
      where.createdAt = { gte: new Date(dto.fechaDesde) };
    }

    if (dto.fechaHasta) {
      where.createdAt = {
        ...((where.createdAt as any) || {}),
        lte: new Date(dto.fechaHasta),
      };
    }

    if (dto.search) {
      where.OR = [
        { asunto: { contains: dto.search, mode: "insensitive" } },
        { tarea: { numero: { contains: dto.search, mode: "insensitive" } } },
        { tarea: { titulo: { contains: dto.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.notificacionTarea.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tarea: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              cliente: { select: { codigo: true } },
            },
          },
        },
      }),
      this.prisma.notificacionTarea.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get("stats")
  async getStats() {
    return this.queueService.getStats();
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const notificacion = await this.prisma.notificacionTarea.findUniqueOrThrow({
      where: { id },
      include: {
        tarea: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            cliente: { select: { codigo: true, descripcion: true } },
          },
        },
        evento: {
          select: {
            id: true,
            tipo: true,
            cuerpo: true,
            createdAt: true,
            creadoPorAgente: { select: { nombre: true } },
            creadoPorCliente: { select: { nombre: true } },
          },
        },
      },
    });

    return notificacion;
  }

  @Put(":id/retry")
  async retry(@Param("id") id: string) {
    const notificacion = await this.prisma.notificacionTarea.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new Error("Notificacion no encontrada");
    }

    // Only allow retry for ERROR or CANCELADO states
    if (
      notificacion.estado !== EstadoNotificacion.ERROR &&
      notificacion.estado !== EstadoNotificacion.CANCELADO
    ) {
      throw new Error(
        "Solo se puede reintentar notificaciones en estado ERROR o CANCELADO"
      );
    }

    const updated = await this.prisma.notificacionTarea.update({
      where: { id },
      data: {
        estado: EstadoNotificacion.PENDIENTE,
        retryCount: 0,
        nextRetryAt: null,
        errorMessage: null,
      },
    });

    return {
      success: true,
      notificacion: updated,
    };
  }

  @Put(":id/cancel")
  async cancel(@Param("id") id: string) {
    const notificacion = await this.prisma.notificacionTarea.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new Error("Notificacion no encontrada");
    }

    // Only allow cancellation for PENDIENTE state
    if (notificacion.estado !== EstadoNotificacion.PENDIENTE) {
      throw new Error("Solo se puede cancelar notificaciones en estado PENDIENTE");
    }

    const updated = await this.prisma.notificacionTarea.update({
      where: { id },
      data: {
        estado: EstadoNotificacion.CANCELADO,
      },
    });

    return {
      success: true,
      notificacion: updated,
    };
  }

  @Post("process")
  async processNow() {
    const result = await this.queueService.processNow();
    return {
      success: true,
      processed: result.processed,
      successCount: result.success,
      failed: result.failed,
    };
  }
}
