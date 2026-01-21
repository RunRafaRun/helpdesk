import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateClienteSoftwareDto, UpdateClienteSoftwareDto } from '../dto/cliente-software.dto';

@Injectable()
export class ClienteSoftwareService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    modulo: { select: { id: true, codigo: true, descripcion: true } },
  };

  async findAll(clienteId: string) {
    return this.prisma.clienteSoftware.findMany({
      where: { clienteId },
      include: this.includeRelations,
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(clienteId: string, id: string) {
    const software = await this.prisma.clienteSoftware.findFirst({
      where: { id, clienteId },
      include: this.includeRelations,
    });

    if (!software) {
      throw new NotFoundException('Software no encontrado');
    }

    return software;
  }

  async create(clienteId: string, dto: CreateClienteSoftwareDto) {
    return this.prisma.clienteSoftware.create({
      data: {
        clienteId,
        tipo: dto.tipo,
        nombre: dto.nombre,
        version: dto.version,
        moduloId: dto.moduloId || null,
        notas: dto.notas,
      },
      include: this.includeRelations,
    });
  }

  async update(clienteId: string, id: string, dto: UpdateClienteSoftwareDto) {
    await this.findOne(clienteId, id);

    return this.prisma.clienteSoftware.update({
      where: { id },
      data: {
        ...(dto.tipo !== undefined && { tipo: dto.tipo }),
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.version !== undefined && { version: dto.version }),
        ...(dto.moduloId !== undefined && { moduloId: dto.moduloId || null }),
        ...(dto.notas !== undefined && { notas: dto.notas }),
      },
      include: this.includeRelations,
    });
  }

  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);

    await this.prisma.clienteSoftware.delete({
      where: { id },
    });

    return { message: 'Software eliminado correctamente' };
  }
}
