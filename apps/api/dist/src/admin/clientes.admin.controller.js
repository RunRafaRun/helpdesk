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
exports.ClientesAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma.service");
const guards_1 = require("../auth/guards");
const permissions_1 = require("../auth/permissions");
const permissions_2 = require("../auth/permissions");
const client_1 = require("@prisma/client");
const dto_1 = require("./dto");
class UpdateClienteDto {
}
class UpdateUnidadDto {
}
class CreateUsuarioClienteDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateUsuarioClienteDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateUsuarioClienteDto.prototype, "usuario", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateUsuarioClienteDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateUsuarioClienteDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateUsuarioClienteDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateUsuarioClienteDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUsuarioClienteDto.prototype, "recibeNotificaciones", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUsuarioClienteDto.prototype, "recibeTodasLasTareas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUsuarioClienteDto.prototype, "activo", void 0);
class UpdateUsuarioClienteDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateUsuarioClienteDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateUsuarioClienteDto.prototype, "usuario", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateUsuarioClienteDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", Object)
], UpdateUsuarioClienteDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], UpdateUsuarioClienteDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], UpdateUsuarioClienteDto.prototype, "tipo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUsuarioClienteDto.prototype, "recibeNotificaciones", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUsuarioClienteDto.prototype, "recibeTodasLasTareas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateUsuarioClienteDto.prototype, "activo", void 0);
class CreateContactoDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateContactoDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", Object)
], CreateContactoDto.prototype, "cargo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", Object)
], CreateContactoDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], CreateContactoDto.prototype, "movil", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateContactoDto.prototype, "principal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreateContactoDto.prototype, "notas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateContactoDto.prototype, "activo", void 0);
class UpdateContactoDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateContactoDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", Object)
], UpdateContactoDto.prototype, "cargo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", Object)
], UpdateContactoDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], UpdateContactoDto.prototype, "movil", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateContactoDto.prototype, "principal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateContactoDto.prototype, "notas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateContactoDto.prototype, "activo", void 0);
class CreateConexionDto {
}
class UpdateConexionDto extends CreateConexionDto {
}
class CreateSoftwareDto {
}
class UpdateSoftwareDto extends CreateSoftwareDto {
}
class CreateCentroTrabajoDto {
}
class UpdateCentroTrabajoDto extends CreateCentroTrabajoDto {
}
class CreateComentarioDto {
}
class CreateReleasePlanDto {
}
class UpdateReleasePlanDto extends CreateReleasePlanDto {
}
let ClientesAdminController = class ClientesAdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list() {
        return this.prisma.cliente.findMany({
            select: { id: true, codigo: true, descripcion: true, logotipo: true, jefeProyecto1: true, jefeProyecto2: true, createdAt: true, updatedAt: true },
            orderBy: { codigo: "asc" },
        });
    }
    async getOne(id) {
        return this.prisma.cliente.findUnique({
            where: { id },
            select: { id: true, codigo: true, descripcion: true, logotipo: true, jefeProyecto1: true, jefeProyecto2: true, licenciaTipo: true, createdAt: true, updatedAt: true },
        });
    }
    async listUsuarios(clienteId, includeInactive) {
        const showInactive = includeInactive === "1" || includeInactive === "true";
        return this.prisma.usuarioCliente.findMany({
            where: { clienteId, ...(showInactive ? {} : { activo: true }) },
            select: {
                id: true,
                nombre: true,
                usuario: true,
                email: true,
                telefono: true,
                tipo: true,
                activo: true,
                recibeNotificaciones: true,
                recibeTodasLasTareas: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { usuario: "asc" },
        });
    }
    async createUsuario(clienteId, dto) {
        if (!dto.password || !dto.password.trim()) {
            throw new common_1.BadRequestException("password es obligatorio al crear un usuario");
        }
        return this.prisma.usuarioCliente.create({
            data: {
                clienteId,
                nombre: dto.nombre.trim(),
                usuario: dto.usuario.trim(),
                password: dto.password,
                email: dto.email ?? null,
                telefono: dto.telefono ?? null,
                tipo: dto.tipo ?? null,
                activo: dto.activo ?? true,
                recibeNotificaciones: dto.recibeNotificaciones ?? true,
                recibeTodasLasTareas: dto.recibeTodasLasTareas ?? true,
            },
            select: {
                id: true,
                nombre: true,
                usuario: true,
                email: true,
                telefono: true,
                tipo: true,
                activo: true,
                recibeNotificaciones: true,
                recibeTodasLasTareas: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async updateUsuario(clienteId, usuarioId, dto) {
        const data = {
            ...(dto.nombre === undefined ? {} : { nombre: dto.nombre?.trim() }),
            ...(dto.usuario === undefined ? {} : { usuario: dto.usuario?.trim() }),
            ...(dto.email === undefined ? {} : { email: dto.email ?? null }),
            ...(dto.telefono === undefined ? {} : { telefono: dto.telefono ?? null }),
            ...(dto.tipo === undefined ? {} : { tipo: dto.tipo ?? null }),
            ...(dto.recibeNotificaciones === undefined ? {} : { recibeNotificaciones: dto.recibeNotificaciones }),
            ...(dto.recibeTodasLasTareas === undefined ? {} : { recibeTodasLasTareas: dto.recibeTodasLasTareas }),
            ...(dto.activo === undefined ? {} : { activo: dto.activo }),
            ...(dto.password === undefined || dto.password === "" ? {} : { password: dto.password }),
        };
        return this.prisma.usuarioCliente.update({
            where: { id: usuarioId },
            data,
            select: {
                id: true,
                nombre: true,
                usuario: true,
                email: true,
                telefono: true,
                tipo: true,
                activo: true,
                recibeNotificaciones: true,
                recibeTodasLasTareas: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async create(dto) {
        return this.prisma.cliente.create({
            data: {
                codigo: dto.codigo,
                descripcion: dto.descripcion ?? null,
                logotipo: dto.logotipo ?? null,
                jefeProyecto1: dto.jefeProyecto1 ?? null,
                jefeProyecto2: dto.jefeProyecto2 ?? null,
            },
        });
    }
    async update(id, dto) {
        return this.prisma.cliente.update({
            where: { id },
            data: {
                codigo: dto.codigo,
                descripcion: dto.descripcion,
                logotipo: dto.logotipo,
                jefeProyecto1: dto.jefeProyecto1,
                jefeProyecto2: dto.jefeProyecto2,
            },
        });
    }
    async remove(id) {
        await this.prisma.cliente.delete({ where: { id } });
        return { ok: true };
    }
    async listUnidades(clienteId, includeInactive) {
        const include = includeInactive === "1" || includeInactive === "true";
        return this.prisma.unidadComercial.findMany({
            where: include ? { clienteId } : { clienteId, activo: true },
            orderBy: [{ scope: "asc" }, { codigo: "asc" }],
        });
    }
    async createUnidad(clienteId, dto) {
        return this.prisma.unidadComercial.create({
            data: {
                clienteId,
                codigo: dto.codigo,
                descripcion: dto.descripcion ?? null,
                scope: dto.scope ?? "HOTEL",
                activo: dto.activo ?? true,
            },
        });
    }
    async updateUnidad(clienteId, unidadId, dto) {
        return this.prisma.unidadComercial.update({
            where: { id: unidadId },
            data: {
                codigo: dto.codigo,
                descripcion: dto.descripcion,
                scope: dto.scope,
                ...(dto.activo === undefined ? {} : { activo: dto.activo }),
            },
        });
    }
    async deleteUnidad(clienteId, unidadId) {
        await this.prisma.unidadComercial.delete({ where: { id: unidadId } });
        return { ok: true };
    }
    async listSoftware(clienteId) {
        return this.prisma.clienteSoftware.findMany({ where: { clienteId }, orderBy: { nombre: "asc" } });
    }
    async createSoftware(clienteId, dto) {
        return this.prisma.clienteSoftware.create({
            data: { clienteId, tipo: dto.tipo, nombre: dto.nombre, version: dto.version ?? null, modulo: dto.modulo ?? null, notas: dto.notas ?? null },
        });
    }
    async updateSoftware(clienteId, softwareId, dto) {
        return this.prisma.clienteSoftware.update({
            where: { id: softwareId },
            data: { tipo: dto.tipo, nombre: dto.nombre, version: dto.version ?? null, modulo: dto.modulo ?? null, notas: dto.notas ?? null },
        });
    }
    async deleteSoftware(clienteId, softwareId) {
        await this.prisma.clienteSoftware.delete({ where: { id: softwareId } });
        return { ok: true };
    }
    async listContactos(clienteId, includeInactive) {
        const where = { clienteId };
        if (!includeInactive)
            where.activo = true;
        return this.prisma.clienteContacto.findMany({ where, orderBy: [{ principal: "desc" }, { nombre: "asc" }] });
    }
    async createContacto(clienteId, dto) {
        return this.prisma.clienteContacto.create({
            data: { clienteId, nombre: dto.nombre, cargo: dto.cargo ?? null, email: dto.email ?? null, movil: dto.movil ?? null, principal: dto.principal ?? false, notas: dto.notas ?? null, activo: dto.activo ?? true },
        });
    }
    async updateContacto(clienteId, contactoId, dto) {
        const data = {};
        if (dto.nombre !== undefined)
            data.nombre = dto.nombre;
        if (dto.cargo !== undefined)
            data.cargo = dto.cargo ?? null;
        if (dto.email !== undefined)
            data.email = dto.email ?? null;
        if (dto.movil !== undefined)
            data.movil = dto.movil ?? null;
        if (dto.principal !== undefined)
            data.principal = dto.principal;
        if (dto.notas !== undefined)
            data.notas = dto.notas ?? null;
        if (dto.activo !== undefined)
            data.activo = dto.activo;
        return this.prisma.clienteContacto.update({ where: { id: contactoId }, data });
    }
    async deleteContacto(clienteId, contactoId) {
        await this.prisma.clienteContacto.update({ where: { id: contactoId }, data: { activo: false } });
        return { ok: true };
    }
    async listConexiones(clienteId) {
        return this.prisma.clienteConexion.findMany({ where: { clienteId }, orderBy: { nombre: "asc" } });
    }
    async createConexion(clienteId, dto) {
        return this.prisma.clienteConexion.create({
            data: { clienteId, nombre: dto.nombre, endpoint: dto.endpoint ?? null, usuario: dto.usuario ?? null, secretRef: dto.secretRef ?? null, notas: dto.notas ?? null },
        });
    }
    async updateConexion(clienteId, conexionId, dto) {
        return this.prisma.clienteConexion.update({
            where: { id: conexionId },
            data: { nombre: dto.nombre, endpoint: dto.endpoint ?? null, usuario: dto.usuario ?? null, secretRef: dto.secretRef ?? null, notas: dto.notas ?? null },
        });
    }
    async deleteConexion(clienteId, conexionId) {
        await this.prisma.clienteConexion.delete({ where: { id: conexionId } });
        return { ok: true };
    }
    async listComentarios(clienteId) {
        return this.prisma.clienteComentario.findMany({
            where: { clienteId },
            orderBy: { createdAt: "desc" },
            include: { agente: { select: { id: true, nombre: true, usuario: true } } },
        });
    }
    async createComentario(clienteId, dto, req) {
        const agenteId = req?.user?.sub;
        if (!agenteId)
            throw new common_1.BadRequestException("No autenticado");
        return this.prisma.clienteComentario.create({
            data: { clienteId, agenteId, texto: dto.texto },
            include: { agente: { select: { id: true, nombre: true, usuario: true } } },
        });
    }
    async listCentros(clienteId) {
        return this.prisma.clienteCentroTrabajo.findMany({ where: { clienteId }, orderBy: { nombre: "asc" } });
    }
    async createCentro(clienteId, dto) {
        return this.prisma.clienteCentroTrabajo.create({
            data: { clienteId, nombre: dto.nombre, direccion: dto.direccion ?? null, ciudad: dto.ciudad ?? null, provincia: dto.provincia ?? null, codigoPostal: dto.codigoPostal ?? null, pais: dto.pais ?? null, notas: dto.notas ?? null },
        });
    }
    async updateCentro(clienteId, centroId, dto) {
        return this.prisma.clienteCentroTrabajo.update({
            where: { id: centroId },
            data: { nombre: dto.nombre, direccion: dto.direccion ?? null, ciudad: dto.ciudad ?? null, provincia: dto.provincia ?? null, codigoPostal: dto.codigoPostal ?? null, pais: dto.pais ?? null, notas: dto.notas ?? null },
        });
    }
    async deleteCentro(clienteId, centroId) {
        await this.prisma.clienteCentroTrabajo.delete({ where: { id: centroId } });
        return { ok: true };
    }
    async listReleases(clienteId) {
        return this.prisma.clienteReleasePlan.findMany({
            where: { clienteId },
            orderBy: [{ estado: "asc" }, { fechaPrevista: "desc" }],
            include: { agente: { select: { id: true, nombre: true, usuario: true } } },
        });
    }
    async createRelease(clienteId, dto) {
        return this.prisma.clienteReleasePlan.create({
            data: {
                clienteId,
                tipo: dto.tipo,
                titulo: dto.titulo,
                fechaPrevista: dto.fechaPrevista ? new Date(dto.fechaPrevista) : null,
                fechaInstalada: dto.fechaInstalada ? new Date(dto.fechaInstalada) : null,
                estado: (dto.estado ?? "PLANIFICADO"),
                agenteId: dto.agenteId ?? null,
                detalle: dto.detalle ?? null,
            },
        });
    }
    async updateRelease(clienteId, releaseId, dto) {
        return this.prisma.clienteReleasePlan.update({
            where: { id: releaseId },
            data: {
                tipo: dto.tipo,
                titulo: dto.titulo,
                fechaPrevista: dto.fechaPrevista ? new Date(dto.fechaPrevista) : null,
                fechaInstalada: dto.fechaInstalada ? new Date(dto.fechaInstalada) : null,
                estado: (dto.estado ?? "PLANIFICADO"),
                agenteId: dto.agenteId ?? null,
                detalle: dto.detalle ?? null,
            },
        });
    }
    async deleteRelease(clienteId, releaseId) {
        await this.prisma.clienteReleasePlan.delete({ where: { id: releaseId } });
        return { ok: true };
    }
};
exports.ClientesAdminController = ClientesAdminController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "getOne", null);
__decorate([
    (0, common_1.Get)(":id/usuarios"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("includeInactive")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "listUsuarios", null);
__decorate([
    (0, common_1.Post)(":id/usuarios"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateUsuarioClienteDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "createUsuario", null);
__decorate([
    (0, common_1.Put)(":id/usuarios/:usuarioId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("usuarioId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateUsuarioClienteDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "updateUsuario", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CrearClienteDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateClienteDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(":id/unidades"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("includeInactive")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "listUnidades", null);
__decorate([
    (0, common_1.Post)(":id/unidades"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CrearUnidadDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "createUnidad", null);
__decorate([
    (0, common_1.Put)(":id/unidades/:unidadId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("unidadId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateUnidadDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "updateUnidad", null);
__decorate([
    (0, common_1.Delete)(":id/unidades/:unidadId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("unidadId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "deleteUnidad", null);
__decorate([
    (0, common_1.Get)(":id/software"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "listSoftware", null);
__decorate([
    (0, common_1.Post)(":id/software"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateSoftwareDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "createSoftware", null);
__decorate([
    (0, common_1.Put)(":id/software/:softwareId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("softwareId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateSoftwareDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "updateSoftware", null);
__decorate([
    (0, common_1.Delete)(":id/software/:softwareId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("softwareId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "deleteSoftware", null);
__decorate([
    (0, common_1.Get)(":id/contactos"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("includeInactive")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "listContactos", null);
__decorate([
    (0, common_1.Post)(":id/contactos"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateContactoDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "createContacto", null);
__decorate([
    (0, common_1.Put)(":id/contactos/:contactoId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("contactoId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateContactoDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "updateContacto", null);
__decorate([
    (0, common_1.Delete)(":id/contactos/:contactoId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("contactoId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "deleteContacto", null);
__decorate([
    (0, common_1.Get)(":id/conexiones"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "listConexiones", null);
__decorate([
    (0, common_1.Post)(":id/conexiones"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateConexionDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "createConexion", null);
__decorate([
    (0, common_1.Put)(":id/conexiones/:conexionId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("conexionId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateConexionDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "updateConexion", null);
__decorate([
    (0, common_1.Delete)(":id/conexiones/:conexionId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("conexionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "deleteConexion", null);
__decorate([
    (0, common_1.Get)(":id/comentarios"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "listComentarios", null);
__decorate([
    (0, common_1.Post)(":id/comentarios"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateComentarioDto, Object]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "createComentario", null);
__decorate([
    (0, common_1.Get)(":id/centros-trabajo"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "listCentros", null);
__decorate([
    (0, common_1.Post)(":id/centros-trabajo"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateCentroTrabajoDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "createCentro", null);
__decorate([
    (0, common_1.Put)(":id/centros-trabajo/:centroId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("centroId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateCentroTrabajoDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "updateCentro", null);
__decorate([
    (0, common_1.Delete)(":id/centros-trabajo/:centroId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("centroId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "deleteCentro", null);
__decorate([
    (0, common_1.Get)(":id/releases"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "listReleases", null);
__decorate([
    (0, common_1.Post)(":id/releases"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateReleasePlanDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "createRelease", null);
__decorate([
    (0, common_1.Put)(":id/releases/:releaseId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("releaseId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateReleasePlanDto]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "updateRelease", null);
__decorate([
    (0, common_1.Delete)(":id/releases/:releaseId"),
    (0, permissions_2.RequirePermissions)(client_1.PermisoCodigo.CONFIG_CLIENTES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("releaseId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ClientesAdminController.prototype, "deleteRelease", null);
exports.ClientesAdminController = ClientesAdminController = __decorate([
    (0, swagger_1.ApiTags)("admin-clientes"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, permissions_1.PermissionsGuard),
    (0, common_1.Controller)("admin/clientes"),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientesAdminController);
//# sourceMappingURL=clientes.admin.controller.js.map