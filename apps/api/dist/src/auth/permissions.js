"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = exports.RequirePermissions = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../prisma.service");
exports.PERMISSIONS_KEY = "required_permissions";
const RequirePermissions = (...perms) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, perms);
exports.RequirePermissions = RequirePermissions;
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const required = this.reflector.getAllAndOverride(exports.PERMISSIONS_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!required || required.length === 0)
            return true;
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        const agenteId = user?.sub;
        if (!agenteId)
            return false;
        const roles = await this.prisma.agenteRoleAssignment.findMany({
            where: { agenteId },
            include: { role: { include: { permisos: { include: { permission: true } } } } },
        });
        const permisos = new Set();
        for (const ar of roles) {
            for (const rp of ar.role.permisos) {
                permisos.add(rp.permission.codigo);
            }
        }
        return required.every((p) => permisos.has(p));
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, prisma_service_1.PrismaService])
], PermissionsGuard);
//# sourceMappingURL=permissions.js.map