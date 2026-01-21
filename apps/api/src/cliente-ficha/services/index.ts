import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
  CreateUnidadComercialDto,
  UpdateUnidadComercialDto,
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
      orderBy: [{ destacado: 'desc' }, { createdAt: 'desc' }],
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
    // If creating as destacado, unmark any other destacado
    if (dto.destacado) {
      await this.prisma.clienteComentario.updateMany({
        where: { clienteId, destacado: true },
        data: { destacado: false },
      });
    }
    return this.prisma.clienteComentario.create({
      data: { clienteId, agenteId, ...dto },
      include: { agente: { select: { nombre: true, usuario: true } } },
    });
  }
  async update(clienteId: string, id: string, dto: UpdateClienteComentarioDto) {
    await this.findOne(clienteId, id);
    // If marking as destacado, unmark any other destacado
    if (dto.destacado === true) {
      await this.prisma.clienteComentario.updateMany({
        where: { clienteId, destacado: true, id: { not: id } },
        data: { destacado: false },
      });
    }
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

  private readonly includeRelations = {
    agente: { select: { nombre: true, usuario: true } },
    release: { select: { id: true, codigo: true, descripcion: true } },
    hotfix: { select: { id: true, codigo: true, descripcion: true } },
  };

  // Helper to extract numeric part from release/hotfix codes (R35 -> 35, HF01 -> 1)
  private extractNumber(code: string): number {
    const match = code.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  // Compare two release/hotfix combinations. Returns: -1 if a < b, 0 if equal, 1 if a > b
  private compareReleaseHotfix(
    releaseA: string, hotfixA: string | null,
    releaseB: string, hotfixB: string | null
  ): number {
    const releaseNumA = this.extractNumber(releaseA);
    const releaseNumB = this.extractNumber(releaseB);

    if (releaseNumA !== releaseNumB) {
      return releaseNumA < releaseNumB ? -1 : 1;
    }

    // Same release, compare hotfixes
    // No hotfix < any hotfix (R35 < R35-HF01)
    if (!hotfixA && hotfixB) return -1;
    if (hotfixA && !hotfixB) return 1;
    if (!hotfixA && !hotfixB) return 0;

    const hotfixNumA = this.extractNumber(hotfixA!);
    const hotfixNumB = this.extractNumber(hotfixB!);

    if (hotfixNumA === hotfixNumB) return 0;
    return hotfixNumA < hotfixNumB ? -1 : 1;
  }

  // Get the latest installed release for a client
  private async getLatestInstalado(clienteId: string) {
    const instalados = await this.prisma.clienteReleasePlan.findMany({
      where: { clienteId, estado: 'INSTALADO' },
      include: {
        release: { select: { codigo: true } },
        hotfix: { select: { codigo: true } },
      },
    });

    if (instalados.length === 0) return null;

    // Find the highest release/hotfix combination
    return instalados.reduce((latest, current) => {
      const comparison = this.compareReleaseHotfix(
        current.release.codigo, current.hotfix?.codigo || null,
        latest.release.codigo, latest.hotfix?.codigo || null
      );
      return comparison > 0 ? current : latest;
    });
  }

  // Validate that the new release/hotfix is not lower than the latest installed
  private async validateReleaseNotLower(clienteId: string, releaseId: string, hotfixId: string | null) {
    const latestInstalado = await this.getLatestInstalado(clienteId);
    if (!latestInstalado) return; // No installed releases, any is valid

    // Get the new release/hotfix codes
    const newRelease = await this.prisma.release.findUnique({
      where: { id: releaseId },
      select: { codigo: true },
    });
    if (!newRelease) throw new NotFoundException('Release no encontrado');

    let newHotfixCodigo: string | null = null;
    if (hotfixId) {
      const newHotfix = await this.prisma.hotfix.findUnique({
        where: { id: hotfixId },
        select: { codigo: true },
      });
      newHotfixCodigo = newHotfix?.codigo || null;
    }

    const comparison = this.compareReleaseHotfix(
      newRelease.codigo, newHotfixCodigo,
      latestInstalado.release.codigo, latestInstalado.hotfix?.codigo || null
    );

    if (comparison < 0) {
      const latestLabel = `${latestInstalado.release.codigo}${latestInstalado.hotfix ? `-${latestInstalado.hotfix.codigo}` : ''}`;
      throw new ConflictException(`El release/hotfix seleccionado es anterior al último instalado (${latestLabel}). Debe seleccionar uno igual o superior.`);
    }
  }

  // Validate fechaPrevista for PLANIFICADO
  private validateFechaPrevista(fechaPrevista: string | undefined, estado: string | undefined) {
    const effectiveEstado = estado || 'PLANIFICADO';
    if (effectiveEstado !== 'PLANIFICADO') return;

    if (!fechaPrevista) {
      throw new ConflictException('La fecha prevista es obligatoria para releases planificados.');
    }

    const fecha = new Date(fechaPrevista);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fecha < today) {
      throw new ConflictException('La fecha prevista no puede ser anterior a hoy.');
    }
  }

  async findAll(clienteId: string) {
    const items = await this.prisma.clienteReleasePlan.findMany({
      where: { clienteId },
      include: this.includeRelations,
    });

    // Sort by release/hotfix (highest first)
    return items.sort((a, b) => {
      const comparison = this.compareReleaseHotfix(
        b.release.codigo, b.hotfix?.codigo || null,
        a.release.codigo, a.hotfix?.codigo || null
      );
      return comparison;
    });
  }

  // Get the latest installed release/hotfix for a client (public API)
  async findLatest(clienteId: string) {
    const latest = await this.prisma.clienteReleasePlan.findMany({
      where: { clienteId, estado: 'INSTALADO' },
      include: this.includeRelations,
    });

    if (latest.length === 0) return null;

    // Find the highest release/hotfix combination
    return latest.reduce((best, current) => {
      const comparison = this.compareReleaseHotfix(
        current.release.codigo, current.hotfix?.codigo || null,
        best.release.codigo, best.hotfix?.codigo || null
      );
      return comparison > 0 ? current : best;
    });
  }

  async findOne(clienteId: string, id: string) {
    const plan = await this.prisma.clienteReleasePlan.findFirst({
      where: { id, clienteId },
      include: this.includeRelations,
    });
    if (!plan) throw new NotFoundException('Plan de release no encontrado');
    return plan;
  }

  async create(clienteId: string, dto: CreateClienteReleasePlanDto) {
    // Validate: only one PLANIFICADO per client
    if (dto.estado === 'PLANIFICADO' || !dto.estado) {
      const existingPlanificado = await this.prisma.clienteReleasePlan.findFirst({
        where: { clienteId, estado: 'PLANIFICADO' },
      });
      if (existingPlanificado) {
        throw new ConflictException('Ya existe un release planificado para este cliente. Debe instalarlo antes de crear otro.');
      }
    }

    // Validate fechaPrevista for PLANIFICADO
    this.validateFechaPrevista(dto.fechaPrevista, dto.estado);

    // Validate release/hotfix is not lower than latest installed
    await this.validateReleaseNotLower(clienteId, dto.releaseId, dto.hotfixId || null);

    return this.prisma.clienteReleasePlan.create({
      data: {
        clienteId,
        releaseId: dto.releaseId,
        hotfixId: dto.hotfixId || null,
        fechaPrevista: dto.fechaPrevista ? new Date(dto.fechaPrevista) : null,
        estado: dto.estado || 'PLANIFICADO',
        agenteId: dto.agenteId || null,
        detalle: dto.detalle,
      },
      include: this.includeRelations,
    });
  }

  async update(clienteId: string, id: string, dto: UpdateClienteReleasePlanDto) {
    const existing = await this.findOne(clienteId, id);

    // Don't allow modifications to INSTALADO records
    if (existing.estado === 'INSTALADO') {
      throw new ConflictException('No se puede modificar un release que ya está instalado.');
    }

    // Validate: only one PLANIFICADO per client (if changing to PLANIFICADO)
    if (dto.estado === 'PLANIFICADO') {
      const existingPlanificado = await this.prisma.clienteReleasePlan.findFirst({
        where: { clienteId, estado: 'PLANIFICADO', id: { not: id } },
      });
      if (existingPlanificado) {
        throw new ConflictException('Ya existe un release planificado para este cliente.');
      }
    }

    // Validate fechaPrevista if updating to or staying as PLANIFICADO
    const effectiveEstado = dto.estado ?? existing.estado;
    const effectiveFechaPrevista = dto.fechaPrevista !== undefined ? dto.fechaPrevista : (existing.fechaPrevista?.toISOString().split('T')[0] || undefined);
    if (effectiveEstado === 'PLANIFICADO') {
      this.validateFechaPrevista(effectiveFechaPrevista, effectiveEstado);
    }

    // Validate release/hotfix is not lower than latest installed (if changing release or hotfix)
    if (dto.releaseId !== undefined || dto.hotfixId !== undefined) {
      const effectiveReleaseId = dto.releaseId ?? existing.releaseId;
      const effectiveHotfixId = dto.hotfixId !== undefined ? (dto.hotfixId || null) : existing.hotfixId;
      await this.validateReleaseNotLower(clienteId, effectiveReleaseId, effectiveHotfixId);
    }

    return this.prisma.clienteReleasePlan.update({
      where: { id },
      data: {
        ...(dto.releaseId !== undefined && { releaseId: dto.releaseId }),
        ...(dto.hotfixId !== undefined && { hotfixId: dto.hotfixId || null }),
        ...(dto.fechaPrevista !== undefined && { fechaPrevista: dto.fechaPrevista ? new Date(dto.fechaPrevista) : null }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.agenteId !== undefined && { agenteId: dto.agenteId || null }),
        ...(dto.detalle !== undefined && { detalle: dto.detalle }),
      },
      include: this.includeRelations,
    });
  }
  async remove(clienteId: string, id: string) {
    const toDelete = await this.findOne(clienteId, id);

    // If INSTALADO, check if there's a newer installed release
    if (toDelete.estado === 'INSTALADO') {
      const latestInstalado = await this.getLatestInstalado(clienteId);

      if (latestInstalado && latestInstalado.id !== id) {
        // Check if the one to delete is older than the latest
        const comparison = this.compareReleaseHotfix(
          toDelete.release.codigo, toDelete.hotfix?.codigo || null,
          latestInstalado.release.codigo, latestInstalado.hotfix?.codigo || null
        );

        if (comparison < 0) {
          const latestLabel = `${latestInstalado.release.codigo}${latestInstalado.hotfix ? `-${latestInstalado.hotfix.codigo}` : ''}`;
          throw new ConflictException(`No se puede eliminar este release instalado porque existe uno más reciente (${latestLabel}). Solo se puede eliminar el último instalado.`);
        }
      }
    }

    await this.prisma.clienteReleasePlan.delete({ where: { id } });
    return { message: 'Plan de release eliminado correctamente' };
  }
}

@Injectable()
export class UnidadComercialService {
  constructor(private prisma: PrismaService) {}
  async findAll(clienteId: string) {
    return this.prisma.unidadComercial.findMany({
      where: { clienteId },
      orderBy: [{ scope: 'asc' }, { codigo: 'asc' }],
    });
  }
  async findOne(clienteId: string, id: string) {
    const unidad = await this.prisma.unidadComercial.findFirst({ where: { id, clienteId } });
    if (!unidad) throw new NotFoundException('Unidad comercial no encontrada');
    return unidad;
  }
  async create(clienteId: string, dto: CreateUnidadComercialDto) {
    const existing = await this.prisma.unidadComercial.findFirst({
      where: { clienteId, codigo: dto.codigo },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una unidad comercial con el código '${dto.codigo}' para este cliente`);
    }
    return this.prisma.unidadComercial.create({
      data: {
        clienteId,
        codigo: dto.codigo,
        descripcion: dto.descripcion ?? null,
        scope: dto.scope ?? 'HOTEL',
        activo: dto.activo ?? true,
      },
    });
  }
  async update(clienteId: string, id: string, dto: UpdateUnidadComercialDto) {
    await this.findOne(clienteId, id);
    if (dto.codigo !== undefined) {
      const existing = await this.prisma.unidadComercial.findFirst({
        where: { clienteId, codigo: dto.codigo, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Ya existe una unidad comercial con el código '${dto.codigo}' para este cliente`);
      }
    }
    return this.prisma.unidadComercial.update({
      where: { id },
      data: {
        ...(dto.codigo !== undefined && { codigo: dto.codigo }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.scope !== undefined && { scope: dto.scope }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }
  async remove(clienteId: string, id: string) {
    await this.findOne(clienteId, id);
    await this.prisma.unidadComercial.delete({ where: { id } });
    return { message: 'Unidad comercial eliminada correctamente' };
  }
}

export { ClienteSoftwareService } from './cliente-software.service';
export { ClienteUsuarioService } from './cliente-usuario.service';
