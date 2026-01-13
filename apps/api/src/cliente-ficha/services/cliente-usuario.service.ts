import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateClienteUsuarioDto, UpdateClienteUsuarioDto, SetClienteUsuarioModulosDto } from '../dto/cliente-usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClienteUsuarioService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    modulos: {
      include: {
        modulo: { select: { id: true, codigo: true, descripcion: true } },
      },
    },
  };

  async findAll(clienteId: string) {
    return this.prisma.clienteUsuario.findMany({
      where: { clienteId },
      include: this.includeRelations,
      orderBy: [{ principal: 'desc' }, { nombre: 'asc' }],
    });
  }

  async findOne(clienteId: string, id: string) {
    const usuario = await this.prisma.clienteUsuario.findFirst({
      where: { id, clienteId },
      include: this.includeRelations,
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async create(clienteId: string, dto: CreateClienteUsuarioDto) {
    // Check if username is unique
    const existing = await this.prisma.clienteUsuario.findUnique({
      where: { usuario: dto.usuario },
    });

    if (existing) {
      throw new ConflictException(`El usuario '${dto.usuario}' ya existe`);
    }

    // If setting as principal, remove principal from others
    if (dto.principal) {
      await this.prisma.clienteUsuario.updateMany({
        where: { clienteId, principal: true },
        data: { principal: false },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const usuario = await this.prisma.clienteUsuario.create({
      data: {
        clienteId,
        nombre: dto.nombre,
        usuario: dto.usuario,
        password: hashedPassword,
        email: dto.email,
        telefono: dto.telefono,
        tipo: dto.tipo,
        activo: dto.activo ?? true,
        principal: dto.principal ?? false,
        recibeNotificaciones: dto.recibeNotificaciones ?? true,
      },
      include: this.includeRelations,
    });

    // Add modules if provided
    if (dto.moduloIds && dto.moduloIds.length > 0) {
      await this.setModulos(clienteId, usuario.id, { moduloIds: dto.moduloIds });
      return this.findOne(clienteId, usuario.id);
    }

    return usuario;
  }

  async update(clienteId: string, id: string, dto: UpdateClienteUsuarioDto) {
    const existing = await this.findOne(clienteId, id);

    // Check if username is unique (if changing)
    if (dto.usuario && dto.usuario !== existing.usuario) {
      const userWithSameUsername = await this.prisma.clienteUsuario.findUnique({
        where: { usuario: dto.usuario },
      });

      if (userWithSameUsername) {
        throw new ConflictException(`El usuario '${dto.usuario}' ya existe`);
      }
    }

    // If setting as principal, remove principal from others
    if (dto.principal) {
      await this.prisma.clienteUsuario.updateMany({
        where: { clienteId, principal: true, id: { not: id } },
        data: { principal: false },
      });
    }

    // Prepare update data
    const updateData: any = {
      ...(dto.nombre !== undefined && { nombre: dto.nombre }),
      ...(dto.usuario !== undefined && { usuario: dto.usuario }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.telefono !== undefined && { telefono: dto.telefono }),
      ...(dto.tipo !== undefined && { tipo: dto.tipo }),
      ...(dto.activo !== undefined && { activo: dto.activo }),
      ...(dto.principal !== undefined && { principal: dto.principal }),
      ...(dto.recibeNotificaciones !== undefined && { recibeNotificaciones: dto.recibeNotificaciones }),
    };

    // Hash password if provided
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.clienteUsuario.update({
      where: { id },
      data: updateData,
      include: this.includeRelations,
    });

    // Update modules if provided
    if (dto.moduloIds !== undefined) {
      await this.setModulos(clienteId, id, { moduloIds: dto.moduloIds });
      return this.findOne(clienteId, id);
    }

    return updated;
  }

  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);

    await this.prisma.clienteUsuario.delete({
      where: { id },
    });

    return { message: 'Usuario eliminado correctamente' };
  }

  async setModulos(clienteId: string, id: string, dto: SetClienteUsuarioModulosDto) {
    await this.findOne(clienteId, id);

    // Delete existing module assignments
    await this.prisma.clienteUsuarioModulo.deleteMany({
      where: { clienteUsuarioId: id },
    });

    // Create new module assignments
    if (dto.moduloIds && dto.moduloIds.length > 0) {
      await this.prisma.clienteUsuarioModulo.createMany({
        data: dto.moduloIds.map((moduloId) => ({
          clienteUsuarioId: id,
          moduloId,
        })),
      });
    }

    return this.findOne(clienteId, id);
  }

  async getModulos(clienteId: string, id: string) {
    const usuario = await this.findOne(clienteId, id);
    return usuario.modulos.map((m) => m.modulo);
  }
}
