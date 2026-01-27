import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { RequirePermissions } from "../auth/permissions";
import { PermisoCodigo, RamaTipo } from "@prisma/client";

@ApiTags("admin/releases")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/releases")
export class ReleasesAdminController {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to extract numeric version from code (R35 -> 35, HF01 -> 1)
  private extractVersion(codigo: string): number {
    const match = codigo.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // Compare two release/hotfix codes - returns true if code1 > code2
  private isNewerVersion(code1: string, code2: string): boolean {
    return this.extractVersion(code1) > this.extractVersion(code2);
  }

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

  // Check if there's a release with DESARROLLO that would need to be moved to PRODUCCION
  @Get("check-desarrollo")
  async checkDesarrollo() {
    const desarrolloRelease = await this.prisma.release.findFirst({
      where: { rama: RamaTipo.DESARROLLO },
      orderBy: { codigo: "desc" },
    });
    return { desarrolloRelease };
  }

  // POST, PUT, DELETE require CONFIG_RELEASES permission
  @Post()
  @RequirePermissions(PermisoCodigo.CONFIG_RELEASES)
  async create(@Body() body: { codigo: string; descripcion?: string; rama?: RamaTipo; confirmMoveToProduccion?: boolean }) {
    const rama = body.rama ?? RamaTipo.DESARROLLO;

    // If creating with DESARROLLO, check if there's another DESARROLLO release
    if (rama === RamaTipo.DESARROLLO) {
      const existingDesarrollo = await this.prisma.release.findFirst({
        where: { rama: RamaTipo.DESARROLLO },
      });

      if (existingDesarrollo && !body.confirmMoveToProduccion) {
        // Return info about the existing DESARROLLO release so frontend can confirm
        return {
          requiresConfirmation: true,
          existingDesarrolloRelease: existingDesarrollo,
          message: `El release ${existingDesarrollo.codigo} tiene Rama = Desarrollo. ¿Desea moverlo a Producción y crear el nuevo release como Desarrollo?`,
        };
      }

      // Move the existing DESARROLLO to PRODUCCION
      if (existingDesarrollo && body.confirmMoveToProduccion) {
        await this.prisma.release.update({
          where: { id: existingDesarrollo.id },
          data: { rama: RamaTipo.PRODUCCION },
        });
      }
    }

    return this.prisma.release.create({
      data: {
        codigo: body.codigo,
        descripcion: body.descripcion,
        rama,
      },
      include: {
        hotfixes: {
          orderBy: { codigo: "asc" },
        },
      },
    });
  }

  @Put(":id")
  @RequirePermissions(PermisoCodigo.CONFIG_RELEASES)
  async update(@Param("id") id: string, @Body() body: { codigo?: string; descripcion?: string; rama?: RamaTipo; confirmMoveToProduccion?: boolean }) {
    // If updating to DESARROLLO, validate this is the newest release
    if (body.rama === RamaTipo.DESARROLLO) {
      const currentRelease = await this.prisma.release.findUnique({
        where: { id },
      });

      if (!currentRelease) {
        throw new BadRequestException("Release no encontrado");
      }

      // Check if there's any newer release - if so, block the change
      const allReleases = await this.prisma.release.findMany({
        where: { id: { not: id } },
      });

      const newerReleases = allReleases.filter(r => this.isNewerVersion(r.codigo, currentRelease.codigo));

      if (newerReleases.length > 0) {
        const newestRelease = newerReleases.sort((a, b) => this.extractVersion(b.codigo) - this.extractVersion(a.codigo))[0];
        throw new BadRequestException(
          `No se puede establecer ${currentRelease.codigo} como Desarrollo porque existe un release más reciente (${newestRelease.codigo}). Solo el release más reciente puede estar en Desarrollo.`
        );
      }

      // Check if there's another DESARROLLO release (older) that needs to be moved to PRODUCCION
      const existingDesarrollo = await this.prisma.release.findFirst({
        where: { rama: RamaTipo.DESARROLLO, id: { not: id } },
      });

      if (existingDesarrollo && !body.confirmMoveToProduccion) {
        return {
          requiresConfirmation: true,
          existingDesarrolloRelease: existingDesarrollo,
          message: `El release ${existingDesarrollo.codigo} tiene Rama = Desarrollo. ¿Desea moverlo a Producción?`,
        };
      }

      if (existingDesarrollo && body.confirmMoveToProduccion) {
        await this.prisma.release.update({
          where: { id: existingDesarrollo.id },
          data: { rama: RamaTipo.PRODUCCION },
        });
      }
    }

    return this.prisma.release.update({
      where: { id },
      data: {
        codigo: body.codigo,
        descripcion: body.descripcion,
        rama: body.rama,
      },
      include: {
        hotfixes: {
          orderBy: { codigo: "asc" },
        },
      },
    });
  }

  @Delete(":id")
  @RequirePermissions(PermisoCodigo.CONFIG_RELEASES)
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
  @RequirePermissions(PermisoCodigo.CONFIG_RELEASES)
  async createHotfix(
    @Param("releaseId") releaseId: string,
    @Body() body: { codigo: string; descripcion?: string; rama?: RamaTipo; confirmMoveToProduccion?: boolean }
  ) {
    // Check if release is in DESARROLLO - can't add hotfixes to DESARROLLO releases
    const release = await this.prisma.release.findUnique({
      where: { id: releaseId },
    });

    if (!release) {
      throw new BadRequestException("Release no encontrado");
    }

    if (release.rama === RamaTipo.DESARROLLO) {
      throw new BadRequestException("No se pueden agregar hotfixes a un release en Desarrollo. El release debe estar en Producción.");
    }

    const rama = body.rama ?? RamaTipo.DESARROLLO;

    // If creating with DESARROLLO, check if there's another DESARROLLO hotfix in this release
    if (rama === RamaTipo.DESARROLLO) {
      const existingDesarrollo = await this.prisma.hotfix.findFirst({
        where: { releaseId, rama: RamaTipo.DESARROLLO },
      });

      if (existingDesarrollo && !body.confirmMoveToProduccion) {
        return {
          requiresConfirmation: true,
          existingDesarrolloHotfix: existingDesarrollo,
          message: `El hotfix ${existingDesarrollo.codigo} tiene Rama = Desarrollo. ¿Desea moverlo a Producción y crear el nuevo hotfix como Desarrollo?`,
        };
      }

      if (existingDesarrollo && body.confirmMoveToProduccion) {
        await this.prisma.hotfix.update({
          where: { id: existingDesarrollo.id },
          data: { rama: RamaTipo.PRODUCCION },
        });
      }
    }

    return this.prisma.hotfix.create({
      data: {
        codigo: body.codigo,
        descripcion: body.descripcion,
        rama,
        releaseId,
      },
    });
  }

  @Put(":releaseId/hotfixes/:hotfixId")
  @RequirePermissions(PermisoCodigo.CONFIG_RELEASES)
  async updateHotfix(
    @Param("releaseId") releaseId: string,
    @Param("hotfixId") hotfixId: string,
    @Body() body: { codigo?: string; descripcion?: string; rama?: RamaTipo; confirmMoveToProduccion?: boolean }
  ) {
    // If updating to DESARROLLO, validate this is the newest hotfix in the release
    if (body.rama === RamaTipo.DESARROLLO) {
      const currentHotfix = await this.prisma.hotfix.findUnique({
        where: { id: hotfixId },
      });

      if (!currentHotfix) {
        throw new BadRequestException("Hotfix no encontrado");
      }

      // Check if there's any newer hotfix in this release - if so, block the change
      const allHotfixes = await this.prisma.hotfix.findMany({
        where: { releaseId, id: { not: hotfixId } },
      });

      const newerHotfixes = allHotfixes.filter(h => this.isNewerVersion(h.codigo, currentHotfix.codigo));

      if (newerHotfixes.length > 0) {
        const newestHotfix = newerHotfixes.sort((a, b) => this.extractVersion(b.codigo) - this.extractVersion(a.codigo))[0];
        throw new BadRequestException(
          `No se puede establecer ${currentHotfix.codigo} como Desarrollo porque existe un hotfix más reciente (${newestHotfix.codigo}). Solo el hotfix más reciente puede estar en Desarrollo.`
        );
      }

      // Check if there's another DESARROLLO hotfix (older) that needs to be moved to PRODUCCION
      const existingDesarrollo = await this.prisma.hotfix.findFirst({
        where: { releaseId, rama: RamaTipo.DESARROLLO, id: { not: hotfixId } },
      });

      if (existingDesarrollo && !body.confirmMoveToProduccion) {
        return {
          requiresConfirmation: true,
          existingDesarrolloHotfix: existingDesarrollo,
          message: `El hotfix ${existingDesarrollo.codigo} tiene Rama = Desarrollo. ¿Desea moverlo a Producción?`,
        };
      }

      if (existingDesarrollo && body.confirmMoveToProduccion) {
        await this.prisma.hotfix.update({
          where: { id: existingDesarrollo.id },
          data: { rama: RamaTipo.PRODUCCION },
        });
      }
    }

    return this.prisma.hotfix.update({
      where: { id: hotfixId },
      data: {
        codigo: body.codigo,
        descripcion: body.descripcion,
        rama: body.rama,
      },
    });
  }

  @Delete(":releaseId/hotfixes/:hotfixId")
  @RequirePermissions(PermisoCodigo.CONFIG_RELEASES)
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
