import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { PermisoCodigo } from "@prisma/client";
import { RequirePermissions } from "../auth/permissions";

@ApiTags("admin/rbac")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/rbac")
@RequirePermissions(PermisoCodigo.CONFIG_RBAC)
export class RbacAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("permisos")
  permisos() {
    return Object.values(PermisoCodigo).map((codigo) => ({ codigo }));
  }

  @Get("roles")
  roles() {
    return this.prisma.roleEntity.findMany({
      orderBy: { codigo: "asc" },
      include: { permisos: { include: { permission: true } } },
    });
  }

  @Post("roles")
  createRole(@Body() body: { codigo: string; nombre: string; descripcion?: string }) {
    return this.prisma.roleEntity.create({ data: { codigo: body.codigo, nombre: body.nombre, descripcion: body.descripcion } });
  }

  @Put("roles/:roleId/permisos")
  async setRolePermisos(@Param("roleId") roleId: string, @Body() body: { permisos: PermisoCodigo[] }) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    const perms = await this.prisma.permission.findMany({ where: { codigo: { in: body.permisos } } });
    await this.prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId, permissionId: p.id })),
    });

    return this.prisma.roleEntity.findUnique({
      where: { id: roleId },
      include: { permisos: { include: { permission: true } } },
    });
  }

  @Put("agentes/:agenteId/roles")
  async setAgenteRoleAssignments(@Param("agenteId") agenteId: string, @Body() body: { roleIds: string[] }) {
    await this.prisma.agenteRoleAssignment.deleteMany({ where: { agenteId } });
    await this.prisma.agenteRoleAssignment.createMany({ data: body.roleIds.map((roleId) => ({ agenteId, roleId })) });
    return { ok: true };
  }
}
