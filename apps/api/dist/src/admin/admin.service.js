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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const bcrypt = require("bcryptjs");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    listarClientes() {
        return this.prisma.cliente.findMany({ orderBy: { codigo: "asc" } });
    }
    crearCliente(dto) {
        return this.prisma.cliente.create({ data: { codigo: dto.codigo, descripcion: dto.descripcion ?? null } });
    }
    async crearUnidad(clienteId, dto) {
        const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
        if (!cliente)
            throw new common_1.NotFoundException("Cliente no encontrado");
        return this.prisma.unidadComercial.create({
            data: {
                clienteId,
                codigo: dto.codigo,
                descripcion: dto.descripcion ?? null,
                scope: dto.scope,
            },
        });
    }
    listarAgentes() {
        return this.prisma.agente.findMany({
            orderBy: { usuario: "asc" },
            select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true },
        });
    }
    async crearAgente(dto) {
        const hash = await bcrypt.hash(dto.password, 10);
        return this.prisma.agente.create({
            data: {
                nombre: dto.nombre,
                usuario: dto.usuario,
                password: hash,
                email: dto.email ?? null,
                role: (dto.role ?? "AGENTE"),
            },
            select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true },
        });
    }
    async crearUsuarioCliente(dto) {
        const cliente = await this.prisma.cliente.findUnique({ where: { codigo: dto.clienteCodigo } });
        if (!cliente)
            throw new common_1.NotFoundException(`Cliente no encontrado: ${dto.clienteCodigo}`);
        const hash = await bcrypt.hash(dto.password, 10);
        return this.prisma.usuarioCliente.create({
            data: {
                clienteId: cliente.id,
                nombre: dto.nombre,
                usuario: dto.usuario,
                password: hash,
                email: dto.email ?? null,
                telefono: dto.telefono ?? null,
                tipo: dto.tipo ?? null,
            },
            select: { id: true, nombre: true, usuario: true, email: true, telefono: true, tipo: true, clienteId: true, createdAt: true },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map