import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateClienteSoftwareDto, UpdateClienteSoftwareDto } from '../dto/cliente-software.dto';

@Injectable()
export class ClienteSoftwareService {
  constructor(private prisma: PrismaService) {}

  async findAll(clienteId: string) {
    return this.prisma.clienteSoftware.findMany({
      where: { clienteId },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(clienteId: string, id: string) {
    const software = await this.prisma.clienteSoftware.findFirst({
      where: { id, clienteId },
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
        ...dto,
      },
    });
  }

  async update(clienteId: string, id: string, dto: UpdateClienteSoftwareDto) {
    await this.findOne(clienteId, id);

    return this.prisma.clienteSoftware.update({
      where: { id },
      data: dto,
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
