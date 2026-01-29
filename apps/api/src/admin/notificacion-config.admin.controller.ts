import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard, RequirePermissions } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { PermisoCodigo, EventoTipo } from "@prisma/client";
import { UpdateNotificacionConfigDto } from "../notificaciones/dto/notificacion-log.dto";

@ApiTags("admin/notificacion-config")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/notificacion-config")
@RequirePermissions(PermisoCodigo.CONFIG_NOTIFICACIONES)
export class NotificacionConfigAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    // Get all event types
    const allEventTypes = Object.values(EventoTipo);

    // Get existing configs
    const configs = await this.prisma.notificacionConfigEvento.findMany({
      include: {
        plantilla: {
          select: { id: true, codigo: true, descripcion: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Create a map of existing configs
    const configMap = new Map(configs.map((c) => [c.eventoTipo, c]));

    // Return all event types with their config (or defaults if not configured)
    return allEventTypes.map((eventoTipo) => {
      const existing = configMap.get(eventoTipo);
      if (existing) {
        return {
          ...existing,
          descripcionEvento: this.getEventTypeDescription(eventoTipo),
        };
      }

      // Return default config for unconfigured event types
      return {
        id: null,
        eventoTipo,
        habilitado: false,
        notificarCliente: true,
        notificarAgente: true,
        plantillaId: null,
        plantilla: null,
        asuntoDefault: null,
        descripcionEvento: this.getEventTypeDescription(eventoTipo),
      };
    });
  }

  @Get(":eventoTipo")
  async getOne(@Param("eventoTipo") eventoTipo: EventoTipo) {
    const config = await this.prisma.notificacionConfigEvento.findUnique({
      where: { eventoTipo },
      include: {
        plantilla: {
          select: { id: true, codigo: true, descripcion: true, texto: true },
        },
      },
    });

    if (!config) {
      // Return default config
      return {
        id: null,
        eventoTipo,
        habilitado: false,
        notificarCliente: true,
        notificarAgente: true,
        plantillaId: null,
        plantilla: null,
        asuntoDefault: null,
        descripcionEvento: this.getEventTypeDescription(eventoTipo),
      };
    }

    return {
      ...config,
      descripcionEvento: this.getEventTypeDescription(eventoTipo),
    };
  }

  @Put(":eventoTipo")
  async update(
    @Param("eventoTipo") eventoTipo: EventoTipo,
    @Body() dto: UpdateNotificacionConfigDto
  ) {
    // Check if config exists
    const existing = await this.prisma.notificacionConfigEvento.findUnique({
      where: { eventoTipo },
    });

    if (existing) {
      // Update existing
      const updated = await this.prisma.notificacionConfigEvento.update({
        where: { eventoTipo },
        data: {
          habilitado: dto.habilitado,
          notificarCliente: dto.notificarCliente,
          notificarAgente: dto.notificarAgente,
          plantillaId: dto.plantillaId === null ? null : dto.plantillaId,
          asuntoDefault: dto.asuntoDefault,
        },
        include: {
          plantilla: {
            select: { id: true, codigo: true, descripcion: true },
          },
        },
      });

      return {
        ...updated,
        descripcionEvento: this.getEventTypeDescription(eventoTipo),
      };
    } else {
      // Create new
      const created = await this.prisma.notificacionConfigEvento.create({
        data: {
          eventoTipo,
          habilitado: dto.habilitado ?? false,
          notificarCliente: dto.notificarCliente ?? true,
          notificarAgente: dto.notificarAgente ?? true,
          plantillaId: dto.plantillaId,
          asuntoDefault: dto.asuntoDefault,
        },
        include: {
          plantilla: {
            select: { id: true, codigo: true, descripcion: true },
          },
        },
      });

      return {
        ...created,
        descripcionEvento: this.getEventTypeDescription(eventoTipo),
      };
    }
  }

  private getEventTypeDescription(eventoTipo: EventoTipo): string {
    const descriptions: Record<EventoTipo, string> = {
      [EventoTipo.MENSAJE_CLIENTE]: "Mensaje del cliente",
      [EventoTipo.RESPUESTA_AGENTE]: "Respuesta del agente",
      [EventoTipo.NOTA_INTERNA]: "Nota interna",
      [EventoTipo.CAMBIO_ESTADO]: "Cambio de estado",
      [EventoTipo.ASIGNACION]: "Asignacion de tarea",
      [EventoTipo.CAMBIO_PRIORIDAD]: "Cambio de prioridad",
      [EventoTipo.CAMBIO_TIPO]: "Cambio de tipo",
      [EventoTipo.CAMBIO_MODULO]: "Cambio de modulo",
      [EventoTipo.CAMBIO_RELEASE_HOTFIX]: "Cambio de release/hotfix",
      [EventoTipo.CAMBIO_ESTADO_PETICION]: "Cambio de estado peticion",
      [EventoTipo.SISTEMA]: "Evento del sistema",
    };
    return descriptions[eventoTipo] || eventoTipo;
  }
}
