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
exports.AgentesAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma.service");
const guards_1 = require("../auth/guards");
const permissions_1 = require("../auth/permissions");
const permissions_2 = require("../auth/permissions");
const client_1 = require("@prisma/client");
const dto_1 = require("./dto");
class UpdateAgenteDto {
}
let AgentesAdminController = class AgentesAdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list() {
        return this.prisma.agente.findMany({
            select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true, updatedAt: true },
            orderBy: { usuario: "asc" },
        });
    }
    async create(dto) {
        const hash = await bcrypt.hash(dto.password, 10);
        return this.prisma.agente.create({
            data: {
                nombre: dto.nombre,
                usuario: dto.usuario,
                password: hash,
                email: dto.email ?? null,
                role: dto.role ?? "AGENTE",
            },
            select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true, updatedAt: true },
        });
    }
    async update(id, dto) {
        const data = {};
        if (dto.nombre !== undefined)
            data.nombre = dto.nombre;
        if (dto.usuario !== undefined)
            data.usuario = dto.usuario;
        if (dto.email !== undefined)
            data.email = dto.email;
        if (dto.role !== undefined)
            data.role = dto.role;
        if (dto.password)
            data.password = await bcrypt.hash(dto.password, 10);
        return this.prisma.agente.update({
            where: { id },
            data,
            select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true, updatedAt: true },
        });
    }
    async remove(id) {
        await this.prisma.agente.delete({ where: { id } });
        return { ok: true };
    }
};
exports.AgentesAdminController = AgentesAdminController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_AGENTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentesAdminController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_AGENTES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CrearAgenteDto]),
    __metadata("design:returntype", Promise)
], AgentesAdminController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_AGENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateAgenteDto]),
    __metadata("design:returntype", Promise)
], AgentesAdminController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_AGENTES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentesAdminController.prototype, "remove", null);
exports.AgentesAdminController = AgentesAdminController = __decorate([
    (0, swagger_1.ApiTags)("admin-agentes"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, permissions_1.PermissionsGuard),
    (0, common_1.Controller)("admin/agentes"),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentesAdminController);
//# sourceMappingURL=agentes.admin.controller.js.map