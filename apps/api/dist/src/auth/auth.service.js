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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async getMe(agenteId) {
        const roles = await this.prisma.agenteRoleAssignment.findMany({
            where: { agenteId },
            include: { role: { include: { permisos: { include: { permission: true } } } } },
        });
        const roleCodigos = roles.map((r) => r.role.codigo);
        const permisos = Array.from(new Set(roles.flatMap((r) => r.role.permisos.map((rp) => rp.permission.codigo))));
        return { id: agenteId, roles: roleCodigos, permisos };
    }
    async login(usuario, password) {
        const agente = await this.prisma.agente.findUnique({ where: { usuario } });
        if (!agente)
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        const ok = await bcrypt.compare(password, agente.password);
        if (!ok)
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        const payload = { sub: agente.id, usuario: agente.usuario, role: agente.role };
        const accessToken = await this.jwt.signAsync(payload);
        return { accessToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map