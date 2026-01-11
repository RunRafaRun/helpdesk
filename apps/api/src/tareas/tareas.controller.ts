import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";
import { CrearComentarioDto, CrearTareaDto } from "./dto";
import { TareasService } from "./tareas.service";

@ApiTags("tareas")
@Controller("tareas")
export class TareasController {
  constructor(private readonly service: TareasService) {}

  @Post()
  crear(@Body() dto: CrearTareaDto) {
    return this.service.crear(dto);
  }

  @Get(":id")
  obtener(@Param("id") id: string) {
    return this.service.obtener(id);
  }

  @Get(":id/timeline")
  @ApiQuery({ name: "includeInternal", required: false, type: Boolean })
  timeline(@Param("id") id: string, @Query("includeInternal") includeInternal?: string) {
    const inc = includeInternal === "true" || includeInternal === "1";
    return this.service.timeline(id, inc);
  }

  @Post(":id/comentarios")
  comentar(@Param("id") id: string, @Body() dto: CrearComentarioDto) {
    return this.service.comentar(id, dto);
  }
}
