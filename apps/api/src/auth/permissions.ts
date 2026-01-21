import { SetMetadata, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma.service";
import { PermisoCodigo } from "@prisma/client";

export const PERMISSIONS_KEY = "required_permissions";
export const PERMISSIONS_ANY_KEY = "required_permissions_any";

// Requires ALL of the specified permissions
export const RequirePermissions = (...perms: PermisoCodigo[]) => SetMetadata(PERMISSIONS_KEY, perms);

// Requires ANY ONE of the specified permissions (OR logic)
export const RequireAnyPermission = (...perms: PermisoCodigo[]) => SetMetadata(PERMISSIONS_ANY_KEY, perms);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredAll = this.reflector.getAllAndOverride<PermisoCodigo[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const requiredAny = this.reflector.getAllAndOverride<PermisoCodigo[]>(PERMISSIONS_ANY_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // If no permissions required, allow
    if ((!requiredAll || requiredAll.length === 0) && (!requiredAny || requiredAny.length === 0)) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<any>();
    const user = req.user;
    const agenteId = user?.sub as string | undefined;
    if (!agenteId) return false;

    const roles = await this.prisma.agenteRoleAssignment.findMany({
      where: { agenteId },
      include: { role: { include: { permisos: { include: { permission: true } } } } },
    });

    const permisos = new Set<string>();
    for (const ar of roles) {
      for (const rp of ar.role.permisos) {
        permisos.add(rp.permission.codigo);
      }
    }

    // Attach permissions to request for use in controllers
    req.userPermissions = permisos;

    // Check requiredAll (AND logic)
    if (requiredAll && requiredAll.length > 0) {
      if (!requiredAll.every((p) => permisos.has(p))) {
        return false;
      }
    }

    // Check requiredAny (OR logic)
    if (requiredAny && requiredAny.length > 0) {
      if (!requiredAny.some((p) => permisos.has(p))) {
        return false;
      }
    }

    return true;
  }
}
