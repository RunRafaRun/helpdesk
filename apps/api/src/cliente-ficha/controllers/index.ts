import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards';
import { ClienteContactoService, ClienteConexionService, ClienteComentarioService, ClienteCentroTrabajoService, ClienteReleasePlanService } from '../services';
import { CreateClienteContactoDto, UpdateClienteContactoDto, CreateClienteConexionDto, UpdateClienteConexionDto, CreateClienteComentarioDto, UpdateClienteComentarioDto, CreateClienteCentroTrabajoDto, UpdateClienteCentroTrabajoDto, CreateClienteReleasePlanDto, UpdateClienteReleasePlanDto } from '../dto';

@ApiTags('Cliente - Contactos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes/:clienteId/contactos')
export class ClienteContactoController {
  constructor(private readonly service: ClienteContactoService) {}
  @Get() @ApiOperation({ summary: 'Listar contactos' }) async findAll(@Param('clienteId', ParseUUIDPipe) cId: string) { return this.service.findAll(cId); }
  @Get(':id') @ApiOperation({ summary: 'Obtener contacto' }) async findOne(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(cId, id); }
  @Post() @ApiOperation({ summary: 'Crear contacto' }) async create(@Param('clienteId', ParseUUIDPipe) cId: string, @Body() dto: CreateClienteContactoDto) { return this.service.create(cId, dto); }
  @Put(':id') @ApiOperation({ summary: 'Actualizar contacto' }) async update(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClienteContactoDto) { return this.service.update(cId, id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Eliminar contacto' }) async remove(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.remove(cId, id); }
}

@ApiTags('Cliente - Conexiones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes/:clienteId/conexiones')
export class ClienteConexionController {
  constructor(private readonly service: ClienteConexionService) {}
  @Get() @ApiOperation({ summary: 'Listar conexiones' }) async findAll(@Param('clienteId', ParseUUIDPipe) cId: string) { return this.service.findAll(cId); }
  @Get(':id') @ApiOperation({ summary: 'Obtener conexión' }) async findOne(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(cId, id); }
  @Post() @ApiOperation({ summary: 'Crear conexión' }) async create(@Param('clienteId', ParseUUIDPipe) cId: string, @Body() dto: CreateClienteConexionDto) { return this.service.create(cId, dto); }
  @Put(':id') @ApiOperation({ summary: 'Actualizar conexión' }) async update(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClienteConexionDto) { return this.service.update(cId, id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Eliminar conexión' }) async remove(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.remove(cId, id); }
}

@ApiTags('Cliente - Comentarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes/:clienteId/comentarios')
export class ClienteComentarioController {
  constructor(private readonly service: ClienteComentarioService) {}
  @Get() @ApiOperation({ summary: 'Listar comentarios' }) async findAll(@Param('clienteId', ParseUUIDPipe) cId: string) { return this.service.findAll(cId); }
  @Get(':id') @ApiOperation({ summary: 'Obtener comentario' }) async findOne(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(cId, id); }
  @Post() @ApiOperation({ summary: 'Crear comentario' }) async create(@Param('clienteId', ParseUUIDPipe) cId: string, @Body() dto: CreateClienteComentarioDto, @Request() req: any) { return this.service.create(cId, req.user.id, dto); }
  @Put(':id') @ApiOperation({ summary: 'Actualizar comentario' }) async update(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClienteComentarioDto) { return this.service.update(cId, id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Eliminar comentario' }) async remove(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.remove(cId, id); }
}

@ApiTags('Cliente - Centros de Trabajo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes/:clienteId/centros-trabajo')
export class ClienteCentroTrabajoController {
  constructor(private readonly service: ClienteCentroTrabajoService) {}
  @Get() @ApiOperation({ summary: 'Listar centros' }) async findAll(@Param('clienteId', ParseUUIDPipe) cId: string) { return this.service.findAll(cId); }
  @Get(':id') @ApiOperation({ summary: 'Obtener centro' }) async findOne(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(cId, id); }
  @Post() @ApiOperation({ summary: 'Crear centro' }) async create(@Param('clienteId', ParseUUIDPipe) cId: string, @Body() dto: CreateClienteCentroTrabajoDto) { return this.service.create(cId, dto); }
  @Put(':id') @ApiOperation({ summary: 'Actualizar centro' }) async update(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClienteCentroTrabajoDto) { return this.service.update(cId, id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Eliminar centro' }) async remove(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.remove(cId, id); }
}

@ApiTags('Cliente - Plan de Releases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes/:clienteId/releases-plan')
export class ClienteReleasePlanController {
  constructor(private readonly service: ClienteReleasePlanService) {}
  @Get() @ApiOperation({ summary: 'Listar releases' }) async findAll(@Param('clienteId', ParseUUIDPipe) cId: string) { return this.service.findAll(cId); }
  @Get(':id') @ApiOperation({ summary: 'Obtener release' }) async findOne(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(cId, id); }
  @Post() @ApiOperation({ summary: 'Crear release' }) async create(@Param('clienteId', ParseUUIDPipe) cId: string, @Body() dto: CreateClienteReleasePlanDto) { return this.service.create(cId, dto); }
  @Put(':id') @ApiOperation({ summary: 'Actualizar release' }) async update(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClienteReleasePlanDto) { return this.service.update(cId, id, dto); }
  @Delete(':id') @ApiOperation({ summary: 'Eliminar release' }) async remove(@Param('clienteId', ParseUUIDPipe) cId: string, @Param('id', ParseUUIDPipe) id: string) { return this.service.remove(cId, id); }
}

export { ClienteSoftwareController } from './cliente-software.controller';
