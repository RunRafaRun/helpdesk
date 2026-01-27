import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { RequirePermissions } from "../auth/permissions";
import { PermisoCodigo } from "@prisma/client";

@ApiTags("admin/modulos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/modulos")
export class ModulosAdminController {
  constructor(private readonly prisma: PrismaService) {}

  // GET is available to any authenticated user (no permission required)
  @Get()
  list(@Query("includeInactive") includeInactive?: string) {
    const include = includeInactive === "1" || includeInactive === "true";
    return this.prisma.modulo.findMany({
      where: include ? {} : { activo: true },
      orderBy: { codigo: "asc" },
    });
  }

  @Post()
  @RequirePermissions(PermisoCodigo.CONFIG_MODULOS)
  create(@Body() body: { codigo: string; descripcion?: string; activo?: boolean }) {
    return this.prisma.modulo.create({
      data: { codigo: body.codigo, descripcion: body.descripcion, activo: body.activo ?? true },
    });
  }

  @Put(":id")
  @RequirePermissions(PermisoCodigo.CONFIG_MODULOS)
  async update(@Param("id") id: string, @Body() body: { codigo?: string; descripcion?: string; activo?: boolean }, @Query("replacementId") replacementId?: string) {
    if (body.activo === false) {
      const inUse = await this.prisma.tarea.count({ where: { moduloId: id } });
      if (inUse > 0 && !replacementId) {
        throw new BadRequestException("Este módulo tiene tareas asociadas. Debe reasignarlas antes de desactivar.");
      }
      if (replacementId) {
        if (replacementId === id) {
          throw new BadRequestException("El reemplazo debe ser distinto al registro a desactivar.");
        }
        const replacementExists = await this.prisma.modulo.findFirst({ where: { id: replacementId, activo: true } });
        if (!replacementExists) {
          throw new BadRequestException("El reemplazo debe ser un módulo activo.");
        }
        await this.prisma.tarea.updateMany({ where: { moduloId: id }, data: { moduloId: replacementId } });
      }
    }
    return this.prisma.modulo.update({
      where: { id },
      data: { codigo: body.codigo, descripcion: body.descripcion, ...(body.activo === undefined ? {} : { activo: body.activo }) },
    });
  }

  @Delete(":id")
  @RequirePermissions(PermisoCodigo.CONFIG_MODULOS)
  async remove(@Param("id") id: string, @Query("replacementId") replacementId?: string) {
    const inUse = await this.prisma.tarea.count({ where: { moduloId: id } });
    if (inUse > 0 && !replacementId) {
      throw new BadRequestException("Este módulo tiene tareas asociadas. Debe reasignarlas antes de eliminar.");
    }
    if (replacementId) {
      if (replacementId === id) {
        throw new BadRequestException("El reemplazo debe ser distinto al registro a eliminar.");
      }
      const replacementExists = await this.prisma.modulo.findFirst({ where: { id: replacementId, activo: true } });
      if (!replacementExists) {
        throw new BadRequestException("El reemplazo debe ser un módulo activo.");
      }
      await this.prisma.tarea.updateMany({ where: { moduloId: id }, data: { moduloId: replacementId } });
    }
    return this.prisma.modulo.delete({ where: { id } });
  }
}
