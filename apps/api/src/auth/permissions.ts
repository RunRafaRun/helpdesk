import { SetMetadata, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma.service";
import { PermisoCodigo } from "@prisma/client";

export const PERMISSIONS_KEY = "required_permissions";
export const RequirePermissions = (...perms: PermisoCodigo[]) => SetMetadata(PERMISSIONS_KEY, perms);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermisoCodigo[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

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

    return required.every((p) => permisos.has(p));
  }
}
