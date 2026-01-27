import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CrearComentarioDto, CrearTareaDto, ListarTareasDto, ActualizarTareaDto, AsignarTareaDto, ActualizarComentarioDto } from "./dto";
import { ActorTipo, EventoTipo, Prisma, RamaTipo } from "@prisma/client";

@Injectable()
export class TareasService {
  constructor(private readonly prisma: PrismaService) {}

  private async generarNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const yearPrefix = year.toString();

    // Get all existing numbers for this year
    const existingTareas = await this.prisma.tarea.findMany({
      where: {
        numero: {
          startsWith: yearPrefix,
        },
      },
      select: {
        numero: true,
      },
    });

    // Create a Set of used numbers for fast lookup
    const usedNumbers = new Set<number>();
    for (const t of existingTareas) {
      const num = parseInt(t.numero.substring(4), 10);
      usedNumbers.add(num);
    }

    // Generate a unique random number between 1 and 99999
    let randomNum: number;
    let attempts = 0;
    const maxAttempts = 1000;

    do {
      randomNum = Math.floor(Math.random() * 99999) + 1; // 1 to 99999
      attempts++;
      if (attempts > maxAttempts) {
        // Fallback: find the first available number sequentially
        for (let i = 1; i <= 99999; i++) {
          if (!usedNumbers.has(i)) {
            randomNum = i;
            break;
          }
        }
        break;
      }
    } while (usedNumbers.has(randomNum));

    // Format: yyyy + 5-digit number (00001-99999)
    const paddedNumber = randomNum.toString().padStart(5, "0");
    return `${yearPrefix}${paddedNumber}`;
  }

  async crear(dto: CrearTareaDto) {
    const cliente = await this.prisma.cliente.findUnique({ where: { codigo: dto.clienteCodigo } });
    if (!cliente) throw new NotFoundException(`Cliente no encontrado: ${dto.clienteCodigo}`);

    const unidad = await this.prisma.unidadComercial.findFirst({
      where: { clienteId: cliente.id, codigo: dto.unidadComercialCodigo },
    });
    if (!unidad) throw new NotFoundException(`Unidad comercial no encontrada: ${dto.unidadComercialCodigo} (cliente ${dto.clienteCodigo})`);

    // Get tipo: use provided code, or find default (porDefecto=true), or first by orden
    let tipo = dto.tipoCodigo
      ? await this.prisma.tipoTarea.findUnique({ where: { codigo: dto.tipoCodigo } })
      : await this.prisma.tipoTarea.findFirst({ where: { porDefecto: true } });
    if (!tipo) {
      tipo = await this.prisma.tipoTarea.findFirst({ orderBy: { orden: "asc" } });
    }
    if (!tipo) throw new NotFoundException(`No hay tipos de tarea configurados`);

    // Get prioridad: use provided code, or find default (porDefecto=true), or first by orden
    let prioridad = dto.prioridadCodigo
      ? await this.prisma.prioridadTarea.findUnique({ where: { codigo: dto.prioridadCodigo } })
      : await this.prisma.prioridadTarea.findFirst({ where: { porDefecto: true } });
    if (!prioridad) {
      prioridad = await this.prisma.prioridadTarea.findFirst({ orderBy: { orden: "asc" } });
    }
    if (!prioridad) throw new NotFoundException(`No hay prioridades de tarea configuradas`);

    const modulo = dto.moduloCodigo
      ? await this.prisma.modulo.findUnique({ where: { codigo: dto.moduloCodigo } })
      : null;
    if (dto.moduloCodigo && !modulo) throw new NotFoundException(`Módulo no encontrado: ${dto.moduloCodigo}`);

    // Get estado: use provided code, or find default (porDefecto=true), or first by orden
    let estado = dto.estadoCodigo
      ? await this.prisma.estadoTarea.findUnique({ where: { codigo: dto.estadoCodigo } })
      : await this.prisma.estadoTarea.findFirst({ where: { porDefecto: true } });
    if (!estado) {
      estado = await this.prisma.estadoTarea.findFirst({ orderBy: { orden: "asc" } });
    }
    const estadoId = estado?.id ?? null;

    // Generate unique numero for the tarea
    const numero = await this.generarNumero();

    const tarea = await this.prisma.tarea.create({
      data: {
        numero,
        titulo: dto.titulo,
        clienteId: cliente.id,
        unidadComercialId: unidad.id,
        tipoId: tipo.id,
        estadoId,
        prioridadId: prioridad.id,
        moduloId: modulo?.id ?? null,
        releaseId: dto.releaseId ?? null,
        hotfixId: dto.hotfixId ?? null,
      },
      include: { cliente: true, unidadComercial: true, tipo: true, estado: true, prioridad: true, modulo: true, release: true, hotfix: true },
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

  async comentar(id: string, dto: CrearComentarioDto, agenteId?: string) {
    await this.obtener(id);

    const tipo = dto.tipo as EventoTipo;
    const visibleParaCliente =
      tipo === EventoTipo.MENSAJE_CLIENTE ? true :
      tipo === EventoTipo.RESPUESTA_AGENTE ? (dto.visibleParaCliente ?? true) :
      false;

    // Build payload with relatedToId if provided
    const payload: Record<string, unknown> = {};
    if (dto.relatedToId) {
      payload.relatedToId = dto.relatedToId;
    }
    // Include agent info in payload for display purposes
    if (agenteId) {
      const agente = await this.prisma.agente.findUnique({ where: { id: agenteId } });
      if (agente) {
        payload.creadoPorAgente = { id: agente.id, nombre: agente.nombre, usuario: agente.usuario };
      }
    }

    await this.prisma.tareaEvento.create({
      data: {
        tareaId: id,
        tipo,
        canal: dto.canal ?? "WEB",
        cuerpo: dto.cuerpo,
        actorTipo: tipo === EventoTipo.MENSAJE_CLIENTE ? ActorTipo.CLIENTE : ActorTipo.AGENTE,
        visibleParaCliente,
        visibleEnTimeline: true,
        creadoPorAgenteId: agenteId,
        payload: Object.keys(payload).length > 0 ? (payload as Prisma.InputJsonValue) : undefined,
      },
    });

    return this.timeline(id, true);
  }

  async actualizarComentario(tareaId: string, eventoId: string, dto: ActualizarComentarioDto, agenteId?: string) {
    // Get the event
    const evento = await this.prisma.tareaEvento.findFirst({
      where: { id: eventoId, tareaId },
    });
    if (!evento) throw new NotFoundException("Comentario no encontrado");

    // Only allow editing comments (not system events)
    const editableTipos: EventoTipo[] = [EventoTipo.RESPUESTA_AGENTE, EventoTipo.NOTA_INTERNA];
    if (!editableTipos.includes(evento.tipo)) {
      throw new ForbiddenException("Solo se pueden editar respuestas de agente o notas internas");
    }

    // Check if there are any newer comments after this one
    const newerComments = await this.prisma.tareaEvento.findFirst({
      where: {
        tareaId,
        createdAt: { gt: evento.createdAt },
        tipo: { in: [EventoTipo.MENSAJE_CLIENTE, EventoTipo.RESPUESTA_AGENTE, EventoTipo.NOTA_INTERNA] },
      },
    });
    if (newerComments) {
      throw new ForbiddenException("No se puede editar un comentario si hay comentarios posteriores");
    }

    // Update the comment
    await this.prisma.tareaEvento.update({
      where: { id: eventoId },
      data: {
        cuerpo: dto.cuerpo,
        updatedAt: new Date(),
      },
    });

    return this.timeline(tareaId, true);
  }

  async eliminarComentario(tareaId: string, eventoId: string, agenteId?: string) {
    // Get the event
    const evento = await this.prisma.tareaEvento.findFirst({
      where: { id: eventoId, tareaId },
    });
    if (!evento) throw new NotFoundException("Comentario no encontrado");

    // Only allow deleting comments (not system events)
    const deletableTipos: EventoTipo[] = [EventoTipo.RESPUESTA_AGENTE, EventoTipo.NOTA_INTERNA];
    if (!deletableTipos.includes(evento.tipo)) {
      throw new ForbiddenException("Solo se pueden eliminar respuestas de agente o notas internas");
    }

    // Check if there are any newer comments after this one
    const newerComments = await this.prisma.tareaEvento.findFirst({
      where: {
        tareaId,
        createdAt: { gt: evento.createdAt },
        tipo: { in: [EventoTipo.MENSAJE_CLIENTE, EventoTipo.RESPUESTA_AGENTE, EventoTipo.NOTA_INTERNA] },
      },
    });
    if (newerComments) {
      throw new ForbiddenException("No se puede eliminar un comentario si hay comentarios posteriores");
    }

    // Delete the comment
    await this.prisma.tareaEvento.delete({
      where: { id: eventoId },
    });

    return this.timeline(tareaId, true);
  }

  async listar(dto: ListarTareasDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TareaWhereInput = {};

    if (dto.clienteId) where.clienteId = dto.clienteId;
    if (dto.estadoId) where.estadoId = dto.estadoId;
    if (dto.prioridadId) where.prioridadId = dto.prioridadId;
    if (dto.tipoId) where.tipoId = dto.tipoId;
    if (dto.asignadoAId) where.asignadoAId = dto.asignadoAId;
    if (dto.moduloId) where.moduloId = dto.moduloId;
    if (dto.search) {
      where.titulo = { contains: dto.search, mode: "insensitive" };
    }

    const [items, total] = await Promise.all([
      this.prisma.tarea.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          cliente: true,
          unidadComercial: true,
          tipo: true,
          estado: true,
          prioridad: true,
          modulo: true,
          asignadoA: true,
        },
      }),
      this.prisma.tarea.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async actualizar(id: string, dto: ActualizarTareaDto, agenteId: string) {
    const tarea = await this.obtener(id);

    if (tarea.closedAt) {
      throw new BadRequestException("No se puede modificar una tarea cerrada");
    }

    const changes: { field: string; oldValue: string | null; newValue: string | null; eventoTipo: EventoTipo }[] = [];

    if (dto.estadoId && dto.estadoId !== tarea.estadoId) {
      const nuevoEstado = await this.prisma.estadoTarea.findUnique({ where: { id: dto.estadoId } });
      if (!nuevoEstado) throw new NotFoundException(`Estado no encontrado: ${dto.estadoId}`);
      changes.push({
        field: "estado",
        oldValue: tarea.estado?.codigo ?? null,
        newValue: nuevoEstado.codigo,
        eventoTipo: EventoTipo.CAMBIO_ESTADO,
      });
    }

    if (dto.prioridadId && dto.prioridadId !== tarea.prioridadId) {
      const nuevaPrioridad = await this.prisma.prioridadTarea.findUnique({ where: { id: dto.prioridadId } });
      if (!nuevaPrioridad) throw new NotFoundException(`Prioridad no encontrada: ${dto.prioridadId}`);
      changes.push({
        field: "prioridad",
        oldValue: tarea.prioridad?.codigo ?? null,
        newValue: nuevaPrioridad.codigo,
        eventoTipo: EventoTipo.CAMBIO_PRIORIDAD,
      });
    }

    if (dto.tipoId && dto.tipoId !== tarea.tipoId) {
      const nuevoTipo = await this.prisma.tipoTarea.findUnique({ where: { id: dto.tipoId } });
      if (!nuevoTipo) throw new NotFoundException(`Tipo no encontrado: ${dto.tipoId}`);
      changes.push({
        field: "tipo",
        oldValue: tarea.tipo?.codigo ?? null,
        newValue: nuevoTipo.codigo,
        eventoTipo: EventoTipo.CAMBIO_TIPO,
      });
    }

    if (dto.moduloId !== undefined && dto.moduloId !== tarea.moduloId) {
      const nuevoModulo = dto.moduloId
        ? await this.prisma.modulo.findUnique({ where: { id: dto.moduloId } })
        : null;
      if (dto.moduloId && !nuevoModulo) throw new NotFoundException(`Módulo no encontrado: ${dto.moduloId}`);
      changes.push({
        field: "modulo",
        oldValue: tarea.modulo?.codigo ?? null,
        newValue: nuevoModulo?.codigo ?? null,
        eventoTipo: EventoTipo.CAMBIO_MODULO,
      });
    }

    if ((dto.releaseId !== undefined && dto.releaseId !== tarea.releaseId) ||
        (dto.hotfixId !== undefined && dto.hotfixId !== tarea.hotfixId)) {
      const nuevoRelease = dto.releaseId
        ? await this.prisma.release.findUnique({ where: { id: dto.releaseId } })
        : null;
      const nuevoHotfix = dto.hotfixId
        ? await this.prisma.hotfix.findUnique({ where: { id: dto.hotfixId }, include: { release: true } })
        : null;

      if (dto.releaseId && !nuevoRelease) throw new NotFoundException(`Release no encontrado: ${dto.releaseId}`);
      if (dto.hotfixId && !nuevoHotfix) throw new NotFoundException(`Hotfix no encontrado: ${dto.hotfixId}`);

      const oldValue = tarea.hotfix
        ? `${tarea.release?.codigo ?? ""} / ${tarea.hotfix.codigo}`
        : tarea.release?.codigo ?? null;
      const newValue = nuevoHotfix
        ? `${nuevoHotfix.release?.codigo ?? ""} / ${nuevoHotfix.codigo}`
        : nuevoRelease?.codigo ?? null;

      changes.push({
        field: "release/hotfix",
        oldValue,
        newValue,
        eventoTipo: EventoTipo.CAMBIO_RELEASE_HOTFIX,
      });
    }

    const updateData: Prisma.TareaUpdateInput = {};
    if (dto.titulo) updateData.titulo = dto.titulo;
    if (dto.estadoId) updateData.estado = { connect: { id: dto.estadoId } };
    if (dto.prioridadId) updateData.prioridad = { connect: { id: dto.prioridadId } };
    if (dto.tipoId) updateData.tipo = { connect: { id: dto.tipoId } };
    if (dto.moduloId !== undefined) {
      updateData.modulo = dto.moduloId ? { connect: { id: dto.moduloId } } : { disconnect: true };
    }
    if (dto.releaseId !== undefined) {
      updateData.release = dto.releaseId ? { connect: { id: dto.releaseId } } : { disconnect: true };
    }
    if (dto.hotfixId !== undefined) {
      updateData.hotfix = dto.hotfixId ? { connect: { id: dto.hotfixId } } : { disconnect: true };
    }
    if (dto.reproducido !== undefined) updateData.reproducido = dto.reproducido;

    await this.prisma.tarea.update({
      where: { id },
      data: updateData,
    });

    for (const change of changes) {
      await this.prisma.tareaEvento.create({
        data: {
          tareaId: id,
          tipo: change.eventoTipo,
          cuerpo: `${change.field}: ${change.oldValue ?? "(vacío)"} → ${change.newValue ?? "(vacío)"}`,
          actorTipo: ActorTipo.AGENTE,
          creadoPorAgenteId: agenteId,
          visibleEnTimeline: true,
          visibleParaCliente: false,
          payload: { field: change.field, oldValue: change.oldValue, newValue: change.newValue },
        },
      });
    }

    return this.obtener(id);
  }

  async asignar(id: string, dto: AsignarTareaDto, currentAgenteId: string) {
    const tarea = await this.obtener(id);

    if (tarea.closedAt) {
      throw new BadRequestException("No se puede asignar una tarea cerrada");
    }

    const nuevoAgente = await this.prisma.agente.findUnique({ where: { id: dto.agenteId } });
    if (!nuevoAgente) throw new NotFoundException(`Agente no encontrado: ${dto.agenteId}`);

    const agenteAnterior = tarea.asignadoAId
      ? await this.prisma.agente.findUnique({ where: { id: tarea.asignadoAId } })
      : null;

    await this.prisma.tarea.update({
      where: { id },
      data: { asignadoAId: dto.agenteId },
    });

    await this.prisma.tareaEvento.create({
      data: {
        tareaId: id,
        tipo: EventoTipo.ASIGNACION,
        cuerpo: agenteAnterior
          ? `Reasignado de ${agenteAnterior.nombre} a ${nuevoAgente.nombre}`
          : `Asignado a ${nuevoAgente.nombre}`,
        actorTipo: ActorTipo.AGENTE,
        creadoPorAgenteId: currentAgenteId,
        visibleEnTimeline: true,
        visibleParaCliente: false,
        payload: {
          agenteAnteriorId: agenteAnterior?.id ?? null,
          agenteAnteriorNombre: agenteAnterior?.nombre ?? null,
          nuevoAgenteId: nuevoAgente.id,
          nuevoAgenteNombre: nuevoAgente.nombre,
        },
      },
    });

    return this.obtener(id);
  }

  async cerrar(id: string, agenteId: string) {
    const tarea = await this.obtener(id);

    if (tarea.closedAt) {
      throw new BadRequestException("La tarea ya está cerrada");
    }

    const estadoCerrada = await this.prisma.estadoTarea.findUnique({ where: { codigo: "CERRADA" } });

    await this.prisma.tarea.update({
      where: { id },
      data: {
        closedAt: new Date(),
        estadoId: estadoCerrada?.id ?? tarea.estadoId,
      },
    });

    await this.prisma.tareaEvento.create({
      data: {
        tareaId: id,
        tipo: EventoTipo.CAMBIO_ESTADO,
        cuerpo: `Tarea cerrada`,
        actorTipo: ActorTipo.AGENTE,
        creadoPorAgenteId: agenteId,
        visibleEnTimeline: true,
        visibleParaCliente: true,
        payload: { action: "cerrar" },
      },
    });

    return this.obtener(id);
  }

  async getDashboardStats() {
    // Get task counts by estado
    const tareasPorEstado = await this.prisma.tarea.groupBy({
      by: ["estadoId"],
      _count: { id: true },
      where: { closedAt: null },
    });

    const estados = await this.prisma.estadoTarea.findMany();
    const estadosMap = new Map(estados.map((e) => [e.id, e]));
    const byEstado = tareasPorEstado
      .filter((item) => item.estadoId !== null)
      .map((item) => ({
        estado: estadosMap.get(item.estadoId!) || { codigo: "Sin estado", id: null },
        count: item._count.id,
      }));

    // Get task counts by tipo
    const tareasPorTipo = await this.prisma.tarea.groupBy({
      by: ["tipoId"],
      _count: { id: true },
      where: { closedAt: null },
    });

    const tipos = await this.prisma.tipoTarea.findMany();
    const tiposMap = new Map(tipos.map((t) => [t.id, t]));
    const byTipo = tareasPorTipo.map((item) => ({
      tipo: tiposMap.get(item.tipoId) || { codigo: "Sin tipo", id: null },
      count: item._count.id,
    }));

    // Get task counts by cliente (top 10)
    const tareasPorCliente = await this.prisma.tarea.groupBy({
      by: ["clienteId"],
      _count: { id: true },
      where: { closedAt: null },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const clienteIds = tareasPorCliente.map((t) => t.clienteId);
    const clientes = await this.prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
      select: { id: true, codigo: true, descripcion: true },
    });
    const clientesMap = new Map(clientes.map((c) => [c.id, c]));
    const byCliente = tareasPorCliente.map((item) => ({
      cliente: clientesMap.get(item.clienteId) || { codigo: "Desconocido", id: null },
      count: item._count.id,
    }));

    // Get task counts by prioridad
    const tareasPorPrioridad = await this.prisma.tarea.groupBy({
      by: ["prioridadId"],
      _count: { id: true },
      where: { closedAt: null },
    });

    const prioridades = await this.prisma.prioridadTarea.findMany();
    const prioridadesMap = new Map(prioridades.map((p) => [p.id, p]));
    const byPrioridad = tareasPorPrioridad.map((item) => ({
      prioridad: prioridadesMap.get(item.prioridadId) || { codigo: "Sin prioridad", id: null },
      count: item._count.id,
    }));

    // Total counts
    const totalAbiertas = await this.prisma.tarea.count({ where: { closedAt: null } });
    const totalCerradas = await this.prisma.tarea.count({ where: { closedAt: { not: null } } });
    const sinAsignar = await this.prisma.tarea.count({ where: { closedAt: null, asignadoAId: null } });

    // Latest comments (last 10)
    const latestComments = await this.prisma.tareaEvento.findMany({
      where: {
        tipo: { in: [EventoTipo.MENSAJE_CLIENTE, EventoTipo.RESPUESTA_AGENTE, EventoTipo.NOTA_INTERNA] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        tarea: {
          select: { id: true, numero: true, titulo: true, cliente: { select: { codigo: true } } },
        },
        creadoPorAgente: { select: { nombre: true } },
      },
    });

    // Next releases (planned)
    const nextReleases = await this.prisma.clienteReleasePlan.findMany({
      where: { estado: "PLANIFICADO" },
      orderBy: { fechaPrevista: "asc" },
      take: 5,
      include: {
        cliente: { select: { codigo: true, descripcion: true } },
        release: { select: { codigo: true } },
        hotfix: { select: { codigo: true } },
        agente: { select: { nombre: true } },
      },
    });

    // Latest release/hotfix (most recent by codigo, assuming R35 > R34)
    const latestRelease = await this.prisma.release.findFirst({
      orderBy: { codigo: "desc" },
      include: { hotfixes: { orderBy: { codigo: "desc" }, take: 1 } },
    });

    // Release status info - Desarrollo release (the one devs are working on)
    const desarrolloRelease = await this.prisma.release.findFirst({
      where: { rama: RamaTipo.DESARROLLO },
      orderBy: { codigo: "desc" },
      include: { hotfixes: { orderBy: { codigo: "desc" } } },
    });

    // Producción release (the latest one clients are using)
    const produccionRelease = await this.prisma.release.findFirst({
      where: { rama: RamaTipo.PRODUCCION },
      orderBy: { codigo: "desc" },
      include: {
        hotfixes: {
          orderBy: { codigo: "desc" },
        }
      },
    });

    // Get desarrollo and produccion hotfixes for the produccion release
    let desarrolloHotfix: { id: string; codigo: string; descripcion: string | null; releaseId: string; rama: RamaTipo } | null = null;
    let produccionHotfix: { id: string; codigo: string; descripcion: string | null; releaseId: string; rama: RamaTipo } | null = null;
    if (produccionRelease) {
      desarrolloHotfix = produccionRelease.hotfixes.find(h => h.rama === RamaTipo.DESARROLLO) ?? null;
      produccionHotfix = produccionRelease.hotfixes.find(h => h.rama === RamaTipo.PRODUCCION) ?? null;
    }

    // NEW: Tareas por Prioridad Pendientes (tasks with default estado grouped by prioridad)
    const defaultEstado = await this.prisma.estadoTarea.findFirst({ where: { porDefecto: true } });
    const pendientesByPrioridad = defaultEstado ? await this.prisma.tarea.groupBy({
      by: ["prioridadId"],
      _count: { id: true },
      where: { closedAt: null, estadoId: defaultEstado.id },
    }) : [];
    const byPrioridadPendientes = pendientesByPrioridad.map((item) => ({
      prioridad: prioridadesMap.get(item.prioridadId) || { codigo: "Sin prioridad", id: null },
      count: item._count.id,
    }));
    const totalPendientesPorEstado = pendientesByPrioridad.reduce((sum, p) => sum + p._count.id, 0);

    // NEW: Tickets Nuevos Pendientes (tasks with default estado, not yet processed)
    const ticketsNuevosPendientes = defaultEstado ? await this.prisma.tarea.findMany({
      where: { closedAt: null, estadoId: defaultEstado.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        cliente: { select: { codigo: true } },
        estado: { select: { codigo: true } },
        prioridad: { select: { codigo: true, color: true } },
      },
    }) : [];

    // NEW: Resumen Tareas x Cliente/Estado (pivot table)
    const allClientes = await this.prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, codigo: true },
      orderBy: { codigo: "asc" },
    });
    const allEstados = await this.prisma.estadoTarea.findMany({
      where: { activo: true },
      select: { id: true, codigo: true, orden: true },
      orderBy: { orden: "asc" },
    });
    
    // Get counts grouped by clienteId AND estadoId
    const tareasByClienteEstado = await this.prisma.tarea.groupBy({
      by: ["clienteId", "estadoId"],
      _count: { id: true },
      where: { closedAt: null },
    });
    
    // Build pivot data structure
    const clienteEstadoMap = new Map<string, Map<string, number>>();
    for (const item of tareasByClienteEstado) {
      if (!clienteEstadoMap.has(item.clienteId)) {
        clienteEstadoMap.set(item.clienteId, new Map());
      }
      const estadoKey = item.estadoId ?? "SIN_ESTADO";
      clienteEstadoMap.get(item.clienteId)!.set(estadoKey, item._count.id);
    }
    
    const resumenClienteEstado = allClientes
      .filter(c => clienteEstadoMap.has(c.id)) // Only include clients with tasks
      .map(cliente => {
        const estadoCounts = clienteEstadoMap.get(cliente.id) || new Map();
        const byEstado: Record<string, number> = {};
        let total = 0;
        for (const estado of allEstados) {
          const count = estadoCounts.get(estado.id) || 0;
          byEstado[estado.codigo] = count;
          total += count;
        }
        return {
          cliente: { id: cliente.id, codigo: cliente.codigo },
          byEstado,
          total,
        };
      })
      .sort((a, b) => b.total - a.total); // Sort by total descending

    return {
      totals: {
        abiertas: totalAbiertas,
        cerradas: totalCerradas,
        sinAsignar,
        pendientes: totalPendientesPorEstado,
      },
      byEstado,
      byTipo,
      byCliente,
      byPrioridad,
      byPrioridadPendientes,
      ticketsNuevosPendientes: ticketsNuevosPendientes.map(t => ({
        id: t.id,
        numero: t.numero,
        titulo: t.titulo,
        createdAt: t.createdAt,
        cliente: t.cliente,
        estado: t.estado,
        prioridad: t.prioridad,
      })),
      resumenClienteEstado,
      estados: allEstados.map(e => ({ id: e.id, codigo: e.codigo, orden: e.orden })),
      latestComments,
      nextReleases,
      latestRelease,
      releaseStatus: {
        desarrolloRelease: desarrolloRelease ? {
          id: desarrolloRelease.id,
          codigo: desarrolloRelease.codigo,
          descripcion: desarrolloRelease.descripcion,
          rama: desarrolloRelease.rama,
        } : null,
        produccionRelease: produccionRelease ? {
          id: produccionRelease.id,
          codigo: produccionRelease.codigo,
          descripcion: produccionRelease.descripcion,
          rama: produccionRelease.rama,
          desarrolloHotfix: desarrolloHotfix ? {
            id: desarrolloHotfix.id,
            codigo: desarrolloHotfix.codigo,
            descripcion: desarrolloHotfix.descripcion,
            rama: desarrolloHotfix.rama,
          } : null,
          produccionHotfix: produccionHotfix ? {
            id: produccionHotfix.id,
            codigo: produccionHotfix.codigo,
            descripcion: produccionHotfix.descripcion,
            rama: produccionHotfix.rama,
          } : null,
        } : null,
      },
    };
  }
}
