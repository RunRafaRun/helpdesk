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
exports.TareasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let TareasService = class TareasService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async crear(dto) {
        const tipoCodigo = dto.tipoCodigo ?? "SIN_CLASIFICAR";
        const prioridadCodigo = dto.prioridadCodigo ?? "NORMAL";
        const cliente = await this.prisma.cliente.findUnique({ where: { codigo: dto.clienteCodigo } });
        if (!cliente)
            throw new common_1.NotFoundException(`Cliente no encontrado: ${dto.clienteCodigo}`);
        const unidad = await this.prisma.unidadComercial.findFirst({
            where: { clienteId: cliente.id, codigo: dto.unidadComercialCodigo },
        });
        if (!unidad)
            throw new common_1.NotFoundException(`Unidad comercial no encontrada: ${dto.unidadComercialCodigo} (cliente ${dto.clienteCodigo})`);
        const tipo = await this.prisma.tipoTarea.findUnique({ where: { codigo: tipoCodigo } });
        if (!tipo)
            throw new common_1.NotFoundException(`TipoTarea no encontrado: ${tipoCodigo}`);
        const prioridad = await this.prisma.prioridadTarea.findUnique({ where: { codigo: prioridadCodigo } });
        if (!prioridad)
            throw new common_1.NotFoundException(`Prioridad no encontrada: ${prioridadCodigo}`);
        const modulo = dto.moduloCodigo
            ? await this.prisma.modulo.findUnique({ where: { codigo: dto.moduloCodigo } })
            : null;
        if (dto.moduloCodigo && !modulo)
            throw new common_1.NotFoundException(`Módulo no encontrado: ${dto.moduloCodigo}`);
        const estadoId = tipoCodigo === "SIN_CLASIFICAR"
            ? null
            : (await this.prisma.estadoTarea.findUnique({ where: { codigo: "ACEPTADA" } }))?.id ?? null;
        const tarea = await this.prisma.tarea.create({
            data: {
                titulo: dto.titulo,
                clienteId: cliente.id,
                unidadComercialId: unidad.id,
                tipoId: tipo.id,
                estadoId,
                prioridadId: prioridad.id,
                moduloId: modulo?.id ?? null,
            },
            include: { cliente: true, unidadComercial: true, tipo: true, estado: true, prioridad: true, modulo: true },
        });
        await this.prisma.tareaEvento.create({
            data: {
                tareaId: tarea.id,
                tipo: client_1.EventoTipo.MENSAJE_CLIENTE,
                canal: dto.canal ?? "WEB",
                cuerpo: dto.mensajeInicial,
                actorTipo: client_1.ActorTipo.CLIENTE,
                visibleEnTimeline: true,
                visibleParaCliente: true,
            },
        });
        return this.obtener(tarea.id);
    }
    async obtener(id) {
        const tarea = await this.prisma.tarea.findUnique({
            where: { id },
            include: {
                cliente: true,
                unidadComercial: true,
                tipo: true,
                estado: true,
                prioridad: true,
                modulo: true,
                release: true,
                hotfix: { include: { release: true } },
            },
        });
        if (!tarea)
            throw new common_1.NotFoundException("Tarea no encontrada");
        return tarea;
    }
    async timeline(id, includeInternal) {
        await this.obtener(id);
        return this.prisma.tareaEvento.findMany({
            where: { tareaId: id, ...(includeInternal ? {} : { visibleEnTimeline: true }) },
            orderBy: { createdAt: "desc" },
        });
    }
    async comentar(id, dto) {
        await this.obtener(id);
        const tipo = dto.tipo;
        const visibleParaCliente = tipo === client_1.EventoTipo.MENSAJE_CLIENTE ? true :
            tipo === client_1.EventoTipo.RESPUESTA_AGENTE ? (dto.visibleParaCliente ?? true) :
                false;
        await this.prisma.tareaEvento.create({
            data: {
                tareaId: id,
                tipo,
                canal: dto.canal ?? "WEB",
                cuerpo: dto.cuerpo,
                actorTipo: tipo === client_1.EventoTipo.MENSAJE_CLIENTE ? client_1.ActorTipo.CLIENTE : client_1.ActorTipo.AGENTE,
                visibleParaCliente,
                visibleEnTimeline: true,
            },
        });
        return this.timeline(id, true);
    }
};
exports.TareasService = TareasService;
exports.TareasService = TareasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TareasService);
//# sourceMappingURL=tareas.service.js.map