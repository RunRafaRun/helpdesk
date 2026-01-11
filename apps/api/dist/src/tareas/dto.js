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
exports.CrearComentarioDto = exports.CrearTareaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CrearTareaDto {
}
exports.CrearTareaDto = CrearTareaDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CrearTareaDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Código de cliente (ej. DEMO)" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CrearTareaDto.prototype, "clienteCodigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Código unidad comercial (HOTEL/CENTRAL/TODOS). Ej: CENTRAL" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CrearTareaDto.prototype, "unidadComercialCodigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Mensaje inicial del cliente (obligatorio)" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CrearTareaDto.prototype, "mensajeInicial", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Código de módulo (ej. AVA-REQUESTS_INCIDENTS)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearTareaDto.prototype, "moduloCodigo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Tipo tarea. Por defecto SIN_CLASIFICAR" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearTareaDto.prototype, "tipoCodigo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Prioridad. Por defecto NORMAL" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearTareaDto.prototype, "prioridadCodigo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Canal (WEB/EMAIL/OTRS/API...)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearTareaDto.prototype, "canal", void 0);
class CrearComentarioDto {
}
exports.CrearComentarioDto = CrearComentarioDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Tipo: MENSAJE_CLIENTE | RESPUESTA_AGENTE | NOTA_INTERNA" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["MENSAJE_CLIENTE", "RESPUESTA_AGENTE", "NOTA_INTERNA"]),
    __metadata("design:type", String)
], CrearComentarioDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CrearComentarioDto.prototype, "cuerpo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearComentarioDto.prototype, "canal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Visible para cliente (solo aplica a RESPUESTA_AGENTE)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CrearComentarioDto.prototype, "visibleParaCliente", void 0);
//# sourceMappingURL=dto.js.map