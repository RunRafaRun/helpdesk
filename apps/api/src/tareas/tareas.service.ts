import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CrearComentarioDto, CrearTareaDto } from "./dto";
import { ActorTipo, EventoTipo } from "@prisma/client";

@Injectable()
export class TareasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearTareaDto) {
    const tipoCodigo = dto.tipoCodigo ?? "SIN_CLASIFICAR";
    const prioridadCodigo = dto.prioridadCodigo ?? "NORMAL";

    const cliente = await this.prisma.cliente.findUnique({ where: { codigo: dto.clienteCodigo } });
    if (!cliente) throw new NotFoundException(`Cliente no encontrado: ${dto.clienteCodigo}`);

    const unidad = await this.prisma.unidadComercial.findFirst({
      where: { clienteId: cliente.id, codigo: dto.unidadComercialCodigo },
    });
    if (!unidad) throw new NotFoundException(`Unidad comercial no encontrada: ${dto.unidadComercialCodigo} (cliente ${dto.clienteCodigo})`);

    const tipo = await this.prisma.tipoTarea.findUnique({ where: { codigo: tipoCodigo } });
    if (!tipo) throw new NotFoundException(`TipoTarea no encontrado: ${tipoCodigo}`);

    const prioridad = await this.prisma.prioridadTarea.findUnique({ where: { codigo: prioridadCodigo } });
    if (!prioridad) throw new NotFoundException(`Prioridad no encontrada: ${prioridadCodigo}`);

    const modulo = dto.moduloCodigo
      ? await this.prisma.modulo.findUnique({ where: { codigo: dto.moduloCodigo } })
      : null;
    if (dto.moduloCodigo && !modulo) throw new NotFoundException(`Módulo no encontrado: ${dto.moduloCodigo}`);

    const estadoId =
      tipoCodigo === "SIN_CLASIFICAR"
        ? null
        : (await this.prisma.estadoTarea.findUnique({ where: { codigo: "ACEPTADA" } }))?.id ?? null;

    const tarea = await this.prisma.tarea.create({
      data: {
        titulo: dto.titulo,
        clienteId: cliente.id,
        unidadComercialId: unidad.id,
        tipoId: tipo.id,
        estadoId,
        prioridadId: prioridad.id,
        moduloId: modulo?.id ?? null,
      },
      include: { cliente: true, unidadComercial: true, tipo: true, estado: true, prioridad: true, modulo: true },
    });

    await this.prisma.tareaEvento.create({
      data: {
        tareaId: tarea.id,
        tipo: EventoTipo.MENSAJE_CLIENTE,
        canal: dto.canal ?? "WEB",
        cuerpo: dto.mensajeInicial,
        actorTipo: ActorTipo.CLIENTE,
        visibleEnTimeline: true,
        visibleParaCliente: true,
      },
    });

    return this.obtener(tarea.id);
  }

  async obtener(id: string) {
    const tarea = await this.prisma.tarea.findUnique({
      where: { id },
      include: {
        cliente: true,
        unidadComercial: true,
        tipo: true,
        estado: true,
        prioridad: true,
        modulo: true,
        release: true,
        hotfix: { include: { release: true } },
      },
    });
    if (!tarea) throw new NotFoundException("Tarea no encontrada");
    return tarea;
  }

  async timeline(id: string, includeInternal: boolean) {
    await this.obtener(id);
    return this.prisma.tareaEvento.findMany({
      where: { tareaId: id, ...(includeInternal ? {} : { visibleEnTimeline: true }) },
      orderBy: { createdAt: "desc" },
    });
  }

  async comentar(id: string, dto: CrearComentarioDto) {
    await this.obtener(id);

    const tipo = dto.tipo as EventoTipo;
    const visibleParaCliente =
      tipo === EventoTipo.MENSAJE_CLIENTE ? true :
      tipo === EventoTipo.RESPUESTA_AGENTE ? (dto.visibleParaCliente ?? true) :
      false;

    await this.prisma.tareaEvento.create({
      data: {
        tareaId: id,
        tipo,
        canal: dto.canal ?? "WEB",
        cuerpo: dto.cuerpo,
        actorTipo: tipo === EventoTipo.MENSAJE_CLIENTE ? ActorTipo.CLIENTE : ActorTipo.AGENTE,
        visibleParaCliente,
        visibleEnTimeline: true,
      },
    });

    return this.timeline(id, true);
  }
}
