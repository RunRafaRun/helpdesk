import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiProperty } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard, RequirePermissions } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { MailService } from "../mail/mail.service";
import { PermisoCodigo } from "@prisma/client";
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class AdjuntoDto {
  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiProperty()
  @IsString()
  tipo: string; // MIME type

  @ApiProperty()
  @IsString()
  datos: string; // Base64 encoded content
}

class SendNotificacionDto {
  @ApiProperty({ type: [String], description: "IDs de clientes destinatarios" })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  clienteIds?: string[];

  @ApiProperty({ type: [String], description: "Emails manuales adicionales" })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  emailsManuales?: string[];

  @ApiProperty({ description: "ID del rol para CC", required: false })
  @IsUUID()
  @IsOptional()
  roleCcId?: string;

  @ApiProperty({ description: "Asunto del correo" })
  @IsString()
  @IsNotEmpty()
  asunto: string;

  @ApiProperty({ description: "Cuerpo HTML del correo" })
  @IsString()
  @IsNotEmpty()
  cuerpoHtml: string;

  @ApiProperty({ description: "Cuerpo texto plano (opcional)", required: false })
  @IsString()
  @IsOptional()
  cuerpoTexto?: string;

  @ApiProperty({ description: "Adjuntos", required: false, type: [AdjuntoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjuntoDto)
  @IsOptional()
  adjuntos?: AdjuntoDto[];

  @ApiProperty({ description: "Fecha/hora programada para envío", required: false })
  @IsDateString()
  @IsOptional()
  programadoAt?: string;
}

interface SendLog {
  email: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

@ApiTags("admin/notificaciones")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/notificaciones")
@RequirePermissions(PermisoCodigo.CONFIG_NOTIFICACIONES)
export class NotificacionesAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  @Get()
  async list() {
    return this.prisma.notificacionMasiva.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        agente: {
          select: { id: true, nombre: true, usuario: true },
        },
      },
      take: 100,
    });
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const notificacion = await this.prisma.notificacionMasiva.findUniqueOrThrow({
      where: { id },
      include: {
        agente: {
          select: { id: true, nombre: true, usuario: true },
        },
      },
    });

    // Get cliente names for the IDs
    let clienteNames: string[] = [];
    if (notificacion.clienteIds && notificacion.clienteIds.length > 0) {
      const clientes = await this.prisma.cliente.findMany({
        where: { id: { in: notificacion.clienteIds } },
        select: { codigo: true, descripcion: true },
      });
      clienteNames = clientes.map(c => c.descripcion ? `${c.codigo} - ${c.descripcion}` : c.codigo);
    }

    // Get role name if CC role was used
    let roleCcNombre: string | null = null;
    if (notificacion.roleCcId) {
      const role = await this.prisma.roleEntity.findUnique({
        where: { id: notificacion.roleCcId },
        select: { codigo: true, nombre: true },
      });
      if (role) {
        roleCcNombre = `${role.codigo} - ${role.nombre}`;
      }
    }

    return {
      ...notificacion,
      clienteNames,
      roleCcNombre,
    };
  }

  @Post("send")
  async send(@Body() dto: SendNotificacionDto, @Request() req: any) {
    const agenteId = req.user.sub;

    // Collect all recipient emails
    const toEmails: string[] = [];
    const ccEmails: string[] = [];

    // Get emails from selected clientes (only active client users)
    if (dto.clienteIds && dto.clienteIds.length > 0) {
      // Get emails from active client users only
      const usuarios = await this.prisma.clienteUsuario.findMany({
        where: {
          clienteId: { in: dto.clienteIds },
          activo: true,
          email: { not: null },
        },
        select: { email: true },
      });

      usuarios.forEach((u) => {
        if (u.email) toEmails.push(u.email);
      });
    }

    // Add manual emails
    if (dto.emailsManuales && dto.emailsManuales.length > 0) {
      toEmails.push(...dto.emailsManuales);
    }

    // Get CC emails from role (agentes with that role)
    if (dto.roleCcId) {
      const roleAssignments = await this.prisma.agenteRoleAssignment.findMany({
        where: { roleId: dto.roleCcId },
        include: {
          agente: {
            select: { email: true },
          },
        },
      });

      roleAssignments.forEach((ra) => {
        if (ra.agente.email) ccEmails.push(ra.agente.email);
      });
    }

    // Remove duplicates
    const uniqueToEmails = [...new Set(toEmails)];
    const uniqueCcEmails = [...new Set(ccEmails.filter((e) => !uniqueToEmails.includes(e)))];

    if (uniqueToEmails.length === 0) {
      return {
        success: false,
        error: "No hay destinatarios con email válido",
      };
    }

    // Check if this is a scheduled send
    const isScheduled = dto.programadoAt && new Date(dto.programadoAt) > new Date();

    // Create notification record as PENDIENTE - always async
    const notificacion = await this.prisma.notificacionMasiva.create({
      data: {
        asunto: dto.asunto,
        cuerpoHtml: dto.cuerpoHtml,
        cuerpoTexto: dto.cuerpoTexto,
        clienteIds: dto.clienteIds || [],
        emailsManuales: dto.emailsManuales || [],
        emailsTo: uniqueToEmails,
        emailsCc: uniqueCcEmails,
        roleCcId: dto.roleCcId,
        adjuntos: dto.adjuntos ? dto.adjuntos as any : undefined,
         programadoAt: dto.programadoAt ? new Date(dto.programadoAt) : null,
        enviadoPor: agenteId,
        estado: isScheduled ? "PROGRAMADO" : "PENDIENTE",
      },
    });

    // Always return success immediately - the cron job will handle sending
    const result = await this.prisma.notificacionMasiva.findUnique({
      where: { id: notificacion.id },
      include: {
        agente: {
          select: { id: true, nombre: true, usuario: true },
        },
      },
    });

    return {
      success: true,
      scheduled: isScheduled,
      notificacion: result,
      destinatarios: uniqueToEmails.length,
      cc: uniqueCcEmails.length,
      programadoAt: dto.programadoAt,
    };
  }

  @Post("process-scheduled")
  async processScheduled() {
    const now = new Date();
    const pending = await this.prisma.notificacionMasiva.findMany({
      where: {
        estado: "PROGRAMADO",
        programadoAt: { lte: now },
      },
    });

    return { found: pending.length, now: now.toISOString(), scheduled: pending.map(p => ({ id: p.id, programadoAt: p.programadoAt })) };
  }

  @Put(":id/reschedule")
  async reschedule(@Param("id") id: string, @Body() dto: { programadoAt: string }) {
    const notificacion = await this.prisma.notificacionMasiva.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new Error("Notificación no encontrada");
    }

    if (notificacion.estado !== "PROGRAMADO") {
      throw new Error("Solo se pueden reprogramar notificaciones en estado PROGRAMADO");
    }

    const updated = await this.prisma.notificacionMasiva.update({
      where: { id },
      data: {
        programadoAt: new Date(dto.programadoAt),
      },
      include: {
        agente: {
          select: { id: true, nombre: true, usuario: true },
        },
      },
    });

    return {
      success: true,
      notificacion: updated,
    };
  }
}
