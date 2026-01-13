import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards';
import { ClienteSoftwareService } from '../services/cliente-software.service';
import { CreateClienteSoftwareDto, UpdateClienteSoftwareDto } from '../dto/cliente-software.dto';

@ApiTags('Cliente - Software')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clientes/:clienteId/software')
export class ClienteSoftwareController {
  constructor(private readonly service: ClienteSoftwareService) {}

  @Get()
  @ApiOperation({ summary: 'Listar software del cliente' })
  async findAll(@Param('clienteId', ParseUUIDPipe) clienteId: string) {
    return this.service.findAll(clienteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener software por ID' })
  async findOne(@Param('clienteId', ParseUUIDPipe) clienteId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(clienteId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear software' })
  async create(@Param('clienteId', ParseUUIDPipe) clienteId: string, @Body() dto: CreateClienteSoftwareDto) {
    return this.service.create(clienteId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar software' })
  async update(@Param('clienteId', ParseUUIDPipe) clienteId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClienteSoftwareDto) {
    return this.service.update(clienteId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar software' })
  async remove(@Param('clienteId', ParseUUIDPipe) clienteId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(clienteId, id);
  }
}
