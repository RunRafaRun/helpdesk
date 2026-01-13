import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import * as bcrypt from "bcryptjs";
import { AgenteRole, UnidadComercialScope } from "@prisma/client";
import { CrearAgenteDto, CrearClienteDto, CrearUnidadDto, CrearUsuarioClienteDto } from "./dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listarClientes() {
    return this.prisma.cliente.findMany({ orderBy: { codigo: "asc" } });
  }

  crearCliente(dto: CrearClienteDto) {
    return this.prisma.cliente.create({ data: { codigo: dto.codigo, descripcion: dto.descripcion ?? null } });
  }

  async crearUnidad(clienteId: string, dto: CrearUnidadDto) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } });
    if (!cliente) throw new NotFoundException("Cliente no encontrado");

    return this.prisma.unidadComercial.create({
      data: {
        clienteId,
        codigo: dto.codigo,
        descripcion: dto.descripcion ?? null,
        scope: dto.scope as UnidadComercialScope,
      },
    });
  }

  listarAgentes() {
    return this.prisma.agente.findMany({
      orderBy: { usuario: "asc" },
      select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true },
    });
  }

  async crearAgente(dto: CrearAgenteDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.agente.create({
      data: {
        nombre: dto.nombre,
        usuario: dto.usuario,
        password: hash,
        email: dto.email ?? null,
        role: (dto.role ?? "AGENTE") as AgenteRole,
      },
      select: { id: true, nombre: true, usuario: true, email: true, role: true, createdAt: true },
    });
  }

  async crearUsuarioCliente(dto: CrearUsuarioClienteDto) {
    const cliente = await this.prisma.cliente.findUnique({ where: { codigo: dto.clienteCodigo } });
    if (!cliente) throw new NotFoundException(`Cliente no encontrado: ${dto.clienteCodigo}`);

    const hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.clienteUsuario.create({
      data: {
        clienteId: cliente.id,
        nombre: dto.nombre,
        usuario: dto.usuario,
        password: hash,
        email: dto.email ?? null,
        telefono: dto.telefono ?? null,
        tipo: dto.tipo ?? null,
      },
      select: { id: true, nombre: true, usuario: true, email: true, telefono: true, tipo: true, clienteId: true, createdAt: true },
    });
  }
}
