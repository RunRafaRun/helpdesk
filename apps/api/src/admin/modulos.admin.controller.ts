import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { RequirePermissions } from "../auth/permissions";
import { PermisoCodigo } from "@prisma/client";

@ApiTags("admin/modulos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/modulos")
@RequirePermissions(PermisoCodigo.CONFIG_MODULOS)
export class ModulosAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.modulo.findMany({ orderBy: { codigo: "asc" } });
  }

  @Post()
  create(@Body() body: { codigo: string; descripcion?: string }) {
    return this.prisma.modulo.create({ data: { codigo: body.codigo, descripcion: body.descripcion } });
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: { codigo?: string; descripcion?: string }) {
    return this.prisma.modulo.update({ where: { id }, data: { codigo: body.codigo, descripcion: body.descripcion } });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.prisma.modulo.delete({ where: { id } });
  }
}
