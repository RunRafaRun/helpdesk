import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateClienteContactoDto, UpdateClienteContactoDto } from '../dto/cliente-contacto.dto';
import {
  CreateClienteConexionDto,
  UpdateClienteConexionDto,
  CreateClienteComentarioDto,
  UpdateClienteComentarioDto,
  CreateClienteCentroTrabajoDto,
  UpdateClienteCentroTrabajoDto,
  CreateClienteReleasePlanDto,
  UpdateClienteReleasePlanDto,
} from '../dto';

@Injectable()
export class ClienteContactoService {
  constructor(private prisma: PrismaService) {}

  async findAll(clienteId: string) {
    return this.prisma.clienteContacto.findMany({
      where: { clienteId },
      orderBy: [{ principal: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findOne(clienteId: string, id: string) {
    const contacto = await this.prisma.clienteContacto.findFirst({
      where: { id, clienteId },
    });
    if (!contacto) throw new NotFoundException('Contacto no encontrado');
    return contacto;
  }

  async create(clienteId: string, dto: CreateClienteContactoDto) {
    if (dto.principal) {
      await this.prisma.clienteContacto.updateMany({
        where: { clienteId, principal: true },
        data: { principal: false },
      });
    }
    return this.prisma.clienteContacto.create({ data: { clienteId, ...dto } });
  }

  async update(clienteId: string, id: string, dto: UpdateClienteContactoDto) {
    await this.findOne(clienteId, id);
    if (dto.principal) {
      await this.prisma.clienteContacto.updateMany({
        where: { clienteId, principal: true, id: { not: id } },
        data: { principal: false },
      });
    }
    return this.prisma.clienteContacto.update({ where: { id }, data: dto });
  }

  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);
    await this.prisma.clienteContacto.delete({ where: { id } });
    return { message: 'Contacto eliminado correctamente' };
  }
}

@Injectable()
export class ClienteConexionService {
  constructor(private prisma: PrismaService) {}
  async findAll(clienteId: string) {
    return this.prisma.clienteConexion.findMany({ where: { clienteId }, orderBy: { nombre: 'asc' } });
  }
  async findOne(clienteId: string, id: string) {
    const conexion = await this.prisma.clienteConexion.findFirst({ where: { id, clienteId } });
    if (!conexion) throw new NotFoundException('Conexión no encontrada');
    return conexion;
  }
  async create(clienteId: string, dto: CreateClienteConexionDto) {
    return this.prisma.clienteConexion.create({ data: { clienteId, ...dto } });
  }
  async update(clienteId: string, id: string, dto: UpdateClienteConexionDto) {
    await this.findOne(clienteId, id);
    return this.prisma.clienteConexion.update({ where: { id }, data: dto });
  }
  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);
    await this.prisma.clienteConexion.delete({ where: { id } });
    return { message: 'Conexión eliminada correctamente' };
  }
}

@Injectable()
export class ClienteComentarioService {
  constructor(private prisma: PrismaService) {}
  async findAll(clienteId: string) {
    return this.prisma.clienteComentario.findMany({
      where: { clienteId },
      include: { agente: { select: { nombre: true, usuario: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findOne(clienteId: string, id: string) {
    const comentario = await this.prisma.clienteComentario.findFirst({
      where: { id, clienteId },
      include: { agente: { select: { nombre: true, usuario: true } } },
    });
    if (!comentario) throw new NotFoundException('Comentario no encontrado');
    return comentario;
  }
  async create(clienteId: string, agenteId: string, dto: CreateClienteComentarioDto) {
    return this.prisma.clienteComentario.create({
      data: { clienteId, agenteId, ...dto },
      include: { agente: { select: { nombre: true, usuario: true } } },
    });
  }
  async update(clienteId: string, id: string, dto: UpdateClienteComentarioDto) {
    await this.findOne(clienteId, id);
    return this.prisma.clienteComentario.update({
      where: { id },
      data: dto,
      include: { agente: { select: { nombre: true, usuario: true } } },
    });
  }
  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);
    await this.prisma.clienteComentario.delete({ where: { id } });
    return { message: 'Comentario eliminado correctamente' };
  }
}

@Injectable()
export class ClienteCentroTrabajoService {
  constructor(private prisma: PrismaService) {}
  async findAll(clienteId: string) {
    return this.prisma.clienteCentroTrabajo.findMany({ where: { clienteId }, orderBy: { nombre: 'asc' } });
  }
  async findOne(clienteId: string, id: string) {
    const centro = await this.prisma.clienteCentroTrabajo.findFirst({ where: { id, clienteId } });
    if (!centro) throw new NotFoundException('Centro de trabajo no encontrado');
    return centro;
  }
  async create(clienteId: string, dto: CreateClienteCentroTrabajoDto) {
    return this.prisma.clienteCentroTrabajo.create({ data: { clienteId, ...dto } });
  }
  async update(clienteId: string, id: string, dto: UpdateClienteCentroTrabajoDto) {
    await this.findOne(clienteId, id);
    return this.prisma.clienteCentroTrabajo.update({ where: { id }, data: dto });
  }
  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);
    await this.prisma.clienteCentroTrabajo.delete({ where: { id } });
    return { message: 'Centro de trabajo eliminado correctamente' };
  }
}

@Injectable()
export class ClienteReleasePlanService {
  constructor(private prisma: PrismaService) {}
  async findAll(clienteId: string) {
    return this.prisma.clienteReleasePlan.findMany({
      where: { clienteId },
      include: { agente: { select: { nombre: true, usuario: true } } },
      orderBy: [{ estado: 'asc' }, { fechaPrevista: 'desc' }],
    });
  }
  async findOne(clienteId: string, id: string) {
    const plan = await this.prisma.clienteReleasePlan.findFirst({
      where: { id, clienteId },
      include: { agente: { select: { nombre: true, usuario: true } } },
    });
    if (!plan) throw new NotFoundException('Plan de release no encontrado');
    return plan;
  }
  async create(clienteId: string, dto: CreateClienteReleasePlanDto) {
    return this.prisma.clienteReleasePlan.create({
      data: { clienteId, ...dto },
      include: { agente: { select: { nombre: true, usuario: true } } },
    });
  }
  async update(clienteId: string, id: string, dto: UpdateClienteReleasePlanDto) {
    await this.findOne(clienteId, id);
    return this.prisma.clienteReleasePlan.update({
      where: { id },
      data: dto,
      include: { agente: { select: { nombre: true, usuario: true } } },
    });
  }
  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);
    await this.prisma.clienteReleasePlan.delete({ where: { id } });
    return { message: 'Plan de release eliminado correctamente' };
  }
}

export { ClienteSoftwareService } from './cliente-software.service';
