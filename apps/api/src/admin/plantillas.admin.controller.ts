import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { RequirePermissions } from "../auth/permissions";
import { PermisoCodigo } from "@prisma/client";

@ApiTags("admin/plantillas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/plantillas")
@RequirePermissions(PermisoCodigo.CONFIG_MAESTROS)
export class PlantillasAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("includeInactive") includeInactive?: string, @Query("categoria") categoria?: string) {
    const include = includeInactive === "1" || includeInactive === "true";
    return this.prisma.plantilla.findMany({
      where: {
        ...(include ? {} : { activo: true }),
        ...(categoria ? { categoria } : {}),
      },
      orderBy: [{ categoria: "asc" }, { orden: "asc" }, { codigo: "asc" }],
    });
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const plantilla = await this.prisma.plantilla.findUnique({ where: { id } });
    if (!plantilla) {
      throw new BadRequestException("Plantilla no encontrada");
    }
    return plantilla;
  }

  @Post()
  create(@Body() body: { codigo: string; descripcion?: string; texto: string; categoria?: string; orden?: number; activo?: boolean }) {
    return this.prisma.plantilla.create({
      data: {
        codigo: body.codigo,
        descripcion: body.descripcion,
        texto: body.texto,
        categoria: body.categoria,
        orden: body.orden ?? 0,
        activo: body.activo ?? true,
      },
    });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: { codigo?: string; descripcion?: string; texto?: string; categoria?: string; orden?: number; activo?: boolean }) {
    const existing = await this.prisma.plantilla.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException("Plantilla no encontrada");
    }
    return this.prisma.plantilla.update({
      where: { id },
      data: {
        ...(body.codigo !== undefined ? { codigo: body.codigo } : {}),
        ...(body.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
        ...(body.texto !== undefined ? { texto: body.texto } : {}),
        ...(body.categoria !== undefined ? { categoria: body.categoria } : {}),
        ...(body.orden !== undefined ? { orden: body.orden } : {}),
        ...(body.activo !== undefined ? { activo: body.activo } : {}),
      },
    });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const existing = await this.prisma.plantilla.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException("Plantilla no encontrada");
    }
    return this.prisma.plantilla.delete({ where: { id } });
  }
}
