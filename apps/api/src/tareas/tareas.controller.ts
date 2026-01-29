import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards, Req } from "@nestjs/common";
import { ApiQuery, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CrearComentarioDto, CrearTareaDto, ListarTareasDto, ActualizarTareaDto, AsignarTareaDto, ActualizarComentarioDto, BuscarTextoDto, BuscarPorNumeroDto, BuscarPorPatronDto } from "./dto";
import { TareasService } from "./tareas.service";
import { JwtAuthGuard } from "../auth/guards";

@ApiTags("tareas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tareas")
export class TareasController {
  constructor(private readonly service: TareasService) {}

  @Get("dashboard")
  dashboard() {
    return this.service.getDashboardStats();
  }

  @Get("buscar/texto")
  buscarTexto(@Query() dto: BuscarTextoDto) {
    return this.service.buscarTextoEnComentarios(dto.texto, dto.limit);
  }

  @Get("buscar/numero/:numero")
  buscarPorNumero(@Param("numero") numero: string) {
    return this.service.buscarPorNumero(numero);
  }

  @Get("buscar/patron")
  buscarPorPatron(@Query() dto: BuscarPorPatronDto) {
    return this.service.buscarPorPatron(dto.patron, dto.limit);
  }

  @Get()
  listar(@Query() dto: ListarTareasDto) {
    return this.service.listar(dto);
  }

  @Post()
  crear(@Body() dto: CrearTareaDto, @Req() req: any) {
    return this.service.crear(dto);
  }

  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.obtener(id);
  }

  @Get(":id/timeline")
  @ApiQuery({ name: "includeInternal", required: false, type: Boolean })
  timeline(@Param("id", ParseUUIDPipe) id: string, @Query("includeInternal") includeInternal?: string) {
    const inc = includeInternal === "true" || includeInternal === "1";
    return this.service.timeline(id, inc);
  }

  @Post(":id/comentarios")
  comentar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CrearComentarioDto, @Req() req: any) {
    return this.service.comentar(id, dto, req.user?.sub);
  }

  @Put(":id/comentarios/:eventoId")
  actualizarComentario(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("eventoId", ParseUUIDPipe) eventoId: string,
    @Body() dto: ActualizarComentarioDto,
    @Req() req: any
  ) {
    return this.service.actualizarComentario(id, eventoId, dto, req.user?.sub);
  }

  @Delete(":id/comentarios/:eventoId")
  eliminarComentario(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("eventoId", ParseUUIDPipe) eventoId: string,
    @Req() req: any
  ) {
    return this.service.eliminarComentario(id, eventoId, req.user?.sub);
  }

  @Put(":id")
  actualizar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ActualizarTareaDto, @Req() req: any) {
    return this.service.actualizar(id, dto, req.user?.sub);
  }

  @Put(":id/asignar")
  asignar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: AsignarTareaDto, @Req() req: any) {
    return this.service.asignar(id, dto, req.user?.sub);
  }

  @Put(":id/cerrar")
  cerrar(@Param("id", ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.cerrar(id, req.user?.sub);
  }
}
