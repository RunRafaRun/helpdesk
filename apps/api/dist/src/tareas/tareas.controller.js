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
exports.TareasController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dto_1 = require("./dto");
const tareas_service_1 = require("./tareas.service");
let TareasController = class TareasController {
    constructor(service) {
        this.service = service;
    }
    crear(dto) {
        return this.service.crear(dto);
    }
    obtener(id) {
        return this.service.obtener(id);
    }
    timeline(id, includeInternal) {
        const inc = includeInternal === "true" || includeInternal === "1";
        return this.service.timeline(id, inc);
    }
    comentar(id, dto) {
        return this.service.comentar(id, dto);
    }
};
exports.TareasController = TareasController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CrearTareaDto]),
    __metadata("design:returntype", void 0)
], TareasController.prototype, "crear", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TareasController.prototype, "obtener", null);
__decorate([
    (0, common_1.Get)(":id/timeline"),
    (0, swagger_1.ApiQuery)({ name: "includeInternal", required: false, type: Boolean }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("includeInternal")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TareasController.prototype, "timeline", null);
__decorate([
    (0, common_1.Post)(":id/comentarios"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CrearComentarioDto]),
    __metadata("design:returntype", void 0)
], TareasController.prototype, "comentar", null);
exports.TareasController = TareasController = __decorate([
    (0, swagger_1.ApiTags)("tareas"),
    (0, common_1.Controller)("tareas"),
    __metadata("design:paramtypes", [tareas_service_1.TareasService])
], TareasController);
//# sourceMappingURL=tareas.controller.js.map