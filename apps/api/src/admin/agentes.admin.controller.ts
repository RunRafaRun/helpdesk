import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString } from "class-validator";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard } from "../auth/permissions";
import { RequirePermissions } from "../auth/permissions";
import { PermisoCodigo } from "@prisma/client";
import { CrearAgenteDto } from "./dto";


class UpdateAgenteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() usuario?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() password?: string;
  @ApiPropertyOptional({ type: 'string', nullable: true }) @IsOptional() @IsEmail() email?: string | null;
  @ApiPropertyOptional({ enum: ["ADMIN","AGENTE"] }) @IsOptional() @IsString() @IsIn(["ADMIN","AGENTE"]) role?: "ADMIN" | "AGENTE";
}

@ApiTags("admin-agentes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/agentes")
export class AgentesAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(PermisoCodigo.CONFIG_AGENTES)
  async list() {
    return this.prisma.agente.findMany({
      select: {
        id: true,
        nombre: true,
        usuario: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: { id: true, codigo: true, nombre: true }
            }
          }
        }
      },
      orderBy: { usuario: "asc" },
    });
  }

  @Post()
  @RequirePermissions(PermisoCodigo.CONFIG_AGENTES)
  async create(@Body() dto: CrearAgenteDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.agente.create({
      data: {
        nombre: dto.nombre,
        usuario: dto.usuario,
        password: hash,
        email: dto.email ?? null,
        role: (dto.role as any) ?? "AGENTE",
      },
      select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  @Put(":id")
  @RequirePermissions(PermisoCodigo.CONFIG_AGENTES)
  async update(@Param("id") id: string, @Body() dto: UpdateAgenteDto) {
    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.usuario !== undefined) data.usuario = dto.usuario;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.agente.update({
      where: { id },
      data,
      select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
  }

  @Delete(":id")
  @RequirePermissions(PermisoCodigo.CONFIG_AGENTES)
  async remove(@Param("id") id: string) {
    await this.prisma.agente.delete({ where: { id } });
    return { ok: true };
  }
}
