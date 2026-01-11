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
exports.ModulosAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const guards_1 = require("../auth/guards");
const permissions_1 = require("../auth/permissions");
const prisma_service_1 = require("../prisma.service");
const permissions_2 = require("../auth/permissions");
const client_1 = require("@prisma/client");
let ModulosAdminController = class ModulosAdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.modulo.findMany({ orderBy: { codigo: "asc" } });
    }
    create(body) {
        return this.prisma.modulo.create({ data: { codigo: body.codigo, descripcion: body.descripcion } });
    }
    update(id, body) {
        return this.prisma.modulo.update({ where: { id }, data: { codigo: body.codigo, descripcion: body.descripcion } });
    }
    remove(id) {
        return this.prisma.modulo.delete({ where: { id } });
    }
};
exports.ModulosAdminController = ModulosAdminController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ModulosAdminController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ModulosAdminController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ModulosAdminController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ModulosAdminController.prototype, "remove", null);
exports.ModulosAdminController = ModulosAdminController = __decorate([
    (0, swagger_1.ApiTags)("admin/modulos"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, permissions_1.PermissionsGuard),
    (0, common_1.Controller)("admin/modulos"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_MODULOS),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ModulosAdminController);
//# sourceMappingURL=modulos.admin.controller.js.map