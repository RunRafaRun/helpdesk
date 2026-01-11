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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const guards_1 = require("../auth/guards");
const permissions_1 = require("../auth/permissions");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const permissions_2 = require("../auth/permissions");
let RbacAdminController = class RbacAdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    permisos() {
        return Object.values(client_1.PermisoCodigo).map((codigo) => ({ codigo }));
    }
    roles() {
        return this.prisma.roleEntity.findMany({
            orderBy: { codigo: "asc" },
            include: { permisos: { include: { permission: true } } },
        });
    }
    createRole(body) {
        return this.prisma.roleEntity.create({ data: { codigo: body.codigo, nombre: body.nombre, descripcion: body.descripcion } });
    }
    async setRolePermisos(roleId, body) {
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
    async setAgenteRoleAssignments(agenteId, body) {
        await this.prisma.agenteRoleAssignment.deleteMany({ where: { agenteId } });
        await this.prisma.agenteRoleAssignment.createMany({ data: body.roleIds.map((roleId) => ({ agenteId, roleId })) });
        return { ok: true };
    }
};
exports.RbacAdminController = RbacAdminController;
__decorate([
    (0, common_1.Get)("permisos"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RbacAdminController.prototype, "permisos", null);
__decorate([
    (0, common_1.Get)("roles"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RbacAdminController.prototype, "roles", null);
__decorate([
    (0, common_1.Post)("roles"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RbacAdminController.prototype, "createRole", null);
__decorate([
    (0, common_1.Put)("roles/:roleId/permisos"),
    __param(0, (0, common_1.Param)("roleId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RbacAdminController.prototype, "setRolePermisos", null);
__decorate([
    (0, common_1.Put)("agentes/:agenteId/roles"),
    __param(0, (0, common_1.Param)("agenteId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RbacAdminController.prototype, "setAgenteRoleAssignments", null);
exports.RbacAdminController = RbacAdminController = __decorate([
    (0, swagger_1.ApiTags)("admin/rbac"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, permissions_1.PermissionsGuard),
    (0, common_1.Controller)("admin/rbac"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_RBAC),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RbacAdminController);
//# sourceMappingURL=rbac.admin.controller.js.map