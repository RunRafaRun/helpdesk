import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { RequirePermissions } from "../auth/permissions";
import { PermisoCodigo } from "@prisma/client";

@ApiTags("admin/releases")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/releases")
@RequirePermissions(PermisoCodigo.CONFIG_RELEASES)
export class ReleasesAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.release.findMany({
      orderBy: { codigo: "desc" },
      include: {
        hotfixes: {
          orderBy: { codigo: "asc" },
        },
      },
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.release.findUnique({
      where: { id },
      include: {
        hotfixes: {
          orderBy: { codigo: "asc" },
        },
      },
    });
  }

  @Post()
  create(@Body() body: { codigo: string; descripcion?: string }) {
    return this.prisma.release.create({
      data: { codigo: body.codigo, descripcion: body.descripcion },
    });
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: { codigo?: string; descripcion?: string }) {
    return this.prisma.release.update({
      where: { id },
      data: { codigo: body.codigo, descripcion: body.descripcion },
    });
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    // Check if release is being used in tasks
    const tasksUsingRelease = await this.prisma.tarea.count({
      where: { releaseId: id }
    });

    if (tasksUsingRelease > 0) {
      throw new Error(`No se puede eliminar el release porque está siendo usado en ${tasksUsingRelease} tarea(s)`);
    }

    // Check if release is being used in client release plans
    const clientPlansUsingRelease = await this.prisma.clienteReleasePlan.count({
      where: { releaseId: id }
    });

    if (clientPlansUsingRelease > 0) {
      throw new Error(`No se puede eliminar el release porque está siendo usado en ${clientPlansUsingRelease} plan(es) de cliente`);
    }

    // First delete all hotfixes for this release
    await this.prisma.hotfix.deleteMany({ where: { releaseId: id } });
    return this.prisma.release.delete({ where: { id } });
  }

  // Hotfix endpoints
  @Post(":releaseId/hotfixes")
  createHotfix(
    @Param("releaseId") releaseId: string,
    @Body() body: { codigo: string; descripcion?: string }
  ) {
    return this.prisma.hotfix.create({
      data: {
        codigo: body.codigo,
        descripcion: body.descripcion,
        releaseId,
      },
    });
  }

  @Put(":releaseId/hotfixes/:hotfixId")
  updateHotfix(
    @Param("releaseId") releaseId: string,
    @Param("hotfixId") hotfixId: string,
    @Body() body: { codigo?: string; descripcion?: string }
  ) {
    return this.prisma.hotfix.update({
      where: { id: hotfixId },
      data: { codigo: body.codigo, descripcion: body.descripcion },
    });
  }

  @Delete(":releaseId/hotfixes/:hotfixId")
  async removeHotfix(@Param("releaseId") releaseId: string, @Param("hotfixId") hotfixId: string) {
    // Check if hotfix is being used in tasks
    const tasksUsingHotfix = await this.prisma.tarea.count({
      where: { hotfixId: hotfixId }
    });

    if (tasksUsingHotfix > 0) {
      throw new Error(`No se puede eliminar el hotfix porque está siendo usado en ${tasksUsingHotfix} tarea(s)`);
    }

    return this.prisma.hotfix.delete({ where: { id: hotfixId } });
  }
}
