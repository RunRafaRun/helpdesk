import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard } from "../auth/permissions";
import { RequirePermissions } from "../auth/permissions";
import { PermisoCodigo } from "@prisma/client";

/**
 * Controlador administrativo "raíz".
 * Los CRUD de maestros viven en controladores dedicados:
 * - /admin/agentes
 * - /admin/clientes (y /unidades)
 * - /admin/modulos
 * - /admin/rbac
 */
@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin")
export class AdminController {
  @Get("ping")
  @RequirePermissions(PermisoCodigo.CONFIG_RBAC)
  ping() {
    return { ok: true };
  }
}
