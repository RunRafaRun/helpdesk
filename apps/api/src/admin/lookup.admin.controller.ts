import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiProperty } from "@nestjs/swagger";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { IsString, IsOptional, IsInt, IsBoolean } from "class-validator";
import { BadRequestException, Query } from "@nestjs/common";

export class CreateLookupDto {
   @ApiProperty()
   @IsString()
   codigo!: string;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsString()
   descripcion?: string;

   @ApiProperty({ required: false, default: 0 })
   @IsOptional()
   @IsInt()
   orden?: number;

   @ApiProperty({ required: false, default: false })
   @IsOptional()
   @IsBoolean()
   porDefecto?: boolean;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsString()
   icono?: string;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsString()
   color?: string;

   @ApiProperty({ required: false, default: true })
   @IsOptional()
   @IsBoolean()
   activo?: boolean;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsString()
   tablaRelacionada?: string;
}

export class UpdateLookupDto {
   @ApiProperty({ required: false })
   @IsOptional()
   @IsString()
   codigo?: string;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsString()
   descripcion?: string;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsInt()
   orden?: number;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsBoolean()
   porDefecto?: boolean;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsString()
   color?: string;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsBoolean()
   activo?: boolean;

   @ApiProperty({ required: false })
   @IsOptional()
   @IsString()
   tablaRelacionada?: string;
}

@ApiTags("admin/lookup")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("admin/lookup")
export class LookupAdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== TIPOS TAREA ====================
  @Get("tipos-tarea")
  listTiposTarea(@Query("includeInactive") includeInactive?: string) {
    const include = includeInactive === "1" || includeInactive === "true";
    return this.prisma.tipoTarea.findMany({
      where: include ? {} : { activo: true },
      orderBy: { orden: "asc" },
    });
  }

  @Post("tipos-tarea")
  async createTipoTarea(@Body() dto: CreateLookupDto) {
    // If porDefecto is true, unset other defaults
    if (dto.porDefecto) {
      await this.prisma.tipoTarea.updateMany({ where: { porDefecto: true }, data: { porDefecto: false } });
    }
    return this.prisma.tipoTarea.create({
      data: {
        codigo: dto.codigo,
        descripcion: dto.descripcion,
        orden: dto.orden ?? 0,
        porDefecto: dto.porDefecto ?? false,
        activo: dto.activo ?? true,
        tablaRelacionada: dto.tablaRelacionada || null,
      },
    });
  }

  @Put("tipos-tarea/:id")
  async updateTipoTarea(@Param("id") id: string, @Body() dto: UpdateLookupDto, @Query("replacementId") replacementId?: string) {
    // If setting porDefecto to true, unset other defaults
    if (dto.porDefecto === true) {
      await this.prisma.tipoTarea.updateMany({ where: { porDefecto: true, NOT: { id } }, data: { porDefecto: false } });
    }
    if (dto.activo === false) {
      const inUse = await this.prisma.tarea.count({ where: { tipoId: id } });
      if (inUse > 0 && !replacementId) {
        throw new BadRequestException("Este tipo tiene tareas asociadas. Debe reasignarlas antes de desactivar.");
      }
      if (replacementId) {
        if (replacementId === id) {
          throw new BadRequestException("El reemplazo debe ser distinto al registro a desactivar.");
        }
        const replacementExists = await this.prisma.tipoTarea.findFirst({ where: { id: replacementId, activo: true } });
        if (!replacementExists) {
          throw new BadRequestException("El reemplazo debe ser un tipo activo.");
        }
        await this.prisma.tarea.updateMany({ where: { tipoId: id }, data: { tipoId: replacementId } });
      }
    }
    const data: any = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.porDefecto !== undefined) data.porDefecto = dto.porDefecto;
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.tablaRelacionada !== undefined) data.tablaRelacionada = dto.tablaRelacionada || null;
    return this.prisma.tipoTarea.update({ where: { id }, data });
  }

  @Delete("tipos-tarea/:id")
  async deleteTipoTarea(@Param("id") id: string, @Query("replacementId") replacementId?: string) {
    const inUse = await this.prisma.tarea.count({ where: { tipoId: id } });
    if (inUse > 0 && !replacementId) {
      throw new BadRequestException("Este tipo tiene tareas asociadas. Debe reasignarlas antes de eliminar.");
    }
    if (replacementId) {
      if (replacementId === id) {
        throw new BadRequestException("El reemplazo debe ser distinto al registro a eliminar.");
      }
      const replacementExists = await this.prisma.tipoTarea.findFirst({ where: { id: replacementId, activo: true } });
      if (!replacementExists) {
        throw new BadRequestException("El reemplazo debe ser un tipo activo.");
      }
      await this.prisma.tarea.updateMany({ where: { tipoId: id }, data: { tipoId: replacementId } });
    }
    return this.prisma.tipoTarea.delete({ where: { id } });
  }

  // ==================== ESTADOS TAREA ====================
  @Get("estados-tarea")
  listEstadosTarea(@Query("includeInactive") includeInactive?: string) {
    const include = includeInactive === "1" || includeInactive === "true";
    return this.prisma.estadoTarea.findMany({
      where: include ? {} : { activo: true },
      orderBy: { orden: "asc" },
    });
  }

  @Post("estados-tarea")
  async createEstadoTarea(@Body() dto: CreateLookupDto) {
    // If porDefecto is true, unset other defaults
    if (dto.porDefecto) {
      await this.prisma.estadoTarea.updateMany({ where: { porDefecto: true }, data: { porDefecto: false } });
    }
    return this.prisma.estadoTarea.create({
      data: {
        codigo: dto.codigo,
        descripcion: dto.descripcion,
        orden: dto.orden ?? 0,
        porDefecto: dto.porDefecto ?? false,
        activo: dto.activo ?? true,
      },
    });
  }

  @Put("estados-tarea/:id")
  async updateEstadoTarea(@Param("id") id: string, @Body() dto: UpdateLookupDto, @Query("replacementId") replacementId?: string) {
    // If setting porDefecto to true, unset other defaults
    if (dto.porDefecto === true) {
      await this.prisma.estadoTarea.updateMany({ where: { porDefecto: true, NOT: { id } }, data: { porDefecto: false } });
    }
    if (dto.activo === false) {
      const inUse = await this.prisma.tarea.count({ where: { estadoId: id } });
      if (inUse > 0 && !replacementId) {
        throw new BadRequestException("Este estado tiene tareas asociadas. Debe reasignarlas antes de desactivar.");
      }
      if (replacementId) {
        if (replacementId === id) {
          throw new BadRequestException("El reemplazo debe ser distinto al registro a desactivar.");
        }
        const replacementExists = await this.prisma.estadoTarea.findFirst({ where: { id: replacementId, activo: true } });
        if (!replacementExists) {
          throw new BadRequestException("El reemplazo debe ser un estado activo.");
        }
        await this.prisma.tarea.updateMany({ where: { estadoId: id }, data: { estadoId: replacementId } });
      }
    }
    const data: any = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.porDefecto !== undefined) data.porDefecto = dto.porDefecto;
    if (dto.activo !== undefined) data.activo = dto.activo;
    return this.prisma.estadoTarea.update({ where: { id }, data });
  }

  @Delete("estados-tarea/:id")
  async deleteEstadoTarea(@Param("id") id: string, @Query("replacementId") replacementId?: string) {
    const inUse = await this.prisma.tarea.count({ where: { estadoId: id } });
    if (inUse > 0 && !replacementId) {
      throw new BadRequestException("Este estado tiene tareas asociadas. Debe reasignarlas antes de eliminar.");
    }
    if (replacementId) {
      if (replacementId === id) {
        throw new BadRequestException("El reemplazo debe ser distinto al registro a eliminar.");
      }
      const replacementExists = await this.prisma.estadoTarea.findFirst({ where: { id: replacementId, activo: true } });
      if (!replacementExists) {
        throw new BadRequestException("El reemplazo debe ser un estado activo.");
      }
      await this.prisma.tarea.updateMany({ where: { estadoId: id }, data: { estadoId: replacementId } });
    }
    return this.prisma.estadoTarea.delete({ where: { id } });
  }

  // ==================== PRIORIDADES TAREA ====================
  @Get("prioridades-tarea")
  listPrioridadesTarea(@Query("includeInactive") includeInactive?: string) {
    const include = includeInactive === "1" || includeInactive === "true";
    return this.prisma.prioridadTarea.findMany({
      where: include ? {} : { activo: true },
      orderBy: { orden: "asc" },
    });
  }

  @Post("prioridades-tarea")
  async createPrioridadTarea(@Body() dto: CreateLookupDto) {
    // If porDefecto is true, unset other defaults
    if (dto.porDefecto) {
      await this.prisma.prioridadTarea.updateMany({ where: { porDefecto: true }, data: { porDefecto: false } });
    }
    return this.prisma.prioridadTarea.create({
      data: {
        codigo: dto.codigo,
        descripcion: dto.descripcion,
        orden: dto.orden ?? 0,
        porDefecto: dto.porDefecto ?? false,
        color: dto.color,
        activo: dto.activo ?? true,
      },
    });
  }

  @Put("prioridades-tarea/:id")
  async updatePrioridadTarea(@Param("id") id: string, @Body() dto: UpdateLookupDto, @Query("replacementId") replacementId?: string) {
    // If setting porDefecto to true, unset other defaults
    if (dto.porDefecto === true) {
      await this.prisma.prioridadTarea.updateMany({ where: { porDefecto: true, NOT: { id } }, data: { porDefecto: false } });
    }
    if (dto.activo === false) {
      const inUse = await this.prisma.tarea.count({ where: { prioridadId: id } });
      if (inUse > 0 && !replacementId) {
        throw new BadRequestException("Esta prioridad tiene tareas asociadas. Debe reasignarlas antes de desactivar.");
      }
      if (replacementId) {
        if (replacementId === id) {
          throw new BadRequestException("El reemplazo debe ser distinto al registro a desactivar.");
        }
        const replacementExists = await this.prisma.prioridadTarea.findFirst({ where: { id: replacementId, activo: true } });
        if (!replacementExists) {
          throw new BadRequestException("El reemplazo debe ser una prioridad activa.");
        }
        await this.prisma.tarea.updateMany({ where: { prioridadId: id }, data: { prioridadId: replacementId } });
      }
    }
    const data: any = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.porDefecto !== undefined) data.porDefecto = dto.porDefecto;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.activo !== undefined) data.activo = dto.activo;
    return this.prisma.prioridadTarea.update({ where: { id }, data });
  }

  @Delete("prioridades-tarea/:id")
  async deletePrioridadTarea(@Param("id") id: string, @Query("replacementId") replacementId?: string) {
    const inUse = await this.prisma.tarea.count({ where: { prioridadId: id } });
    if (inUse > 0 && !replacementId) {
      throw new BadRequestException("Esta prioridad tiene tareas asociadas. Debe reasignarlas antes de eliminar.");
    }
    if (replacementId) {
      if (replacementId === id) {
        throw new BadRequestException("El reemplazo debe ser distinto al registro a eliminar.");
      }
      const replacementExists = await this.prisma.prioridadTarea.findFirst({ where: { id: replacementId, activo: true } });
      if (!replacementExists) {
        throw new BadRequestException("El reemplazo debe ser una prioridad activa.");
      }
      await this.prisma.tarea.updateMany({ where: { prioridadId: id }, data: { prioridadId: replacementId } });
    }
    return this.prisma.prioridadTarea.delete({ where: { id } });
  }

  // ==================== ESTADOS PETICION ====================
  @Get("estados-peticion")
  listEstadosPeticion(@Query("includeInactive") includeInactive?: string) {
    const include = includeInactive === "1" || includeInactive === "true";
    return this.prisma.estadoPeticion.findMany({
      where: include ? {} : { activo: true },
      orderBy: { orden: "asc" },
    });
  }

  @Post("estados-peticion")
  async createEstadoPeticion(@Body() dto: CreateLookupDto) {
    // If porDefecto is true, unset other defaults
    if (dto.porDefecto) {
      await this.prisma.estadoPeticion.updateMany({ where: { porDefecto: true }, data: { porDefecto: false } });
    }
    return this.prisma.estadoPeticion.create({
      data: {
        codigo: dto.codigo,
        descripcion: dto.descripcion,
        orden: dto.orden ?? 0,
        porDefecto: dto.porDefecto ?? false,
        activo: dto.activo ?? true,
      },
    });
  }

  @Put("estados-peticion/:id")
  async updateEstadoPeticion(@Param("id") id: string, @Body() dto: UpdateLookupDto, @Query("replacementId") replacementId?: string) {
    // If setting porDefecto to true, unset other defaults
    if (dto.porDefecto === true) {
      await this.prisma.estadoPeticion.updateMany({ where: { porDefecto: true, NOT: { id } }, data: { porDefecto: false } });
    }
    if (dto.activo === false) {
      const inUse = await this.prisma.tarea.count({ where: { estadoPeticionId: id } });
      if (inUse > 0 && !replacementId) {
        throw new BadRequestException("Este estado de petición tiene tareas asociadas. Debe reasignarlas antes de desactivar.");
      }
      if (replacementId) {
        if (replacementId === id) {
          throw new BadRequestException("El reemplazo debe ser distinto al registro a desactivar.");
        }
        const replacementExists = await this.prisma.estadoPeticion.findFirst({ where: { id: replacementId, activo: true } });
        if (!replacementExists) {
          throw new BadRequestException("El reemplazo debe ser un estado de petición activo.");
        }
        await this.prisma.tarea.updateMany({ where: { estadoPeticionId: id }, data: { estadoPeticionId: replacementId } });
      }
    }
    const data: any = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.porDefecto !== undefined) data.porDefecto = dto.porDefecto;
    if (dto.activo !== undefined) data.activo = dto.activo;
    return this.prisma.estadoPeticion.update({ where: { id }, data });
  }

  @Delete("estados-peticion/:id")
  async deleteEstadoPeticion(@Param("id") id: string, @Query("replacementId") replacementId?: string) {
    const inUse = await this.prisma.tarea.count({ where: { estadoPeticionId: id } });
    if (inUse > 0 && !replacementId) {
      throw new BadRequestException("Este estado de petición tiene tareas asociadas. Debe reasignarlas antes de eliminar.");
    }
    if (replacementId) {
      if (replacementId === id) {
        throw new BadRequestException("El reemplazo debe ser distinto al registro a eliminar.");
      }
      const replacementExists = await this.prisma.estadoPeticion.findFirst({ where: { id: replacementId, activo: true } });
      if (!replacementExists) {
        throw new BadRequestException("El reemplazo debe ser un estado de petición activo.");
      }
      await this.prisma.tarea.updateMany({ where: { estadoPeticionId: id }, data: { estadoPeticionId: replacementId } });
    }
    return this.prisma.estadoPeticion.delete({ where: { id } });
  }

  // ==================== RELEASES (read-only lookup) ====================
  @Get("releases")
  listReleases() {
    return this.prisma.release.findMany({
      orderBy: { codigo: "desc" },
      include: {
        hotfixes: {
          orderBy: { codigo: "asc" },
          select: { id: true, codigo: true, descripcion: true, rama: true },
        },
      },
    });
  }

  // ==================== HOTFIXES (read-only lookup) ====================
  @Get("hotfixes")
  listHotfixes() {
    return this.prisma.hotfix.findMany({
      orderBy: [{ releaseId: "desc" }, { codigo: "asc" }],
      include: {
        release: { select: { id: true, codigo: true } },
      },
    });
  }

  @Get("hotfixes/by-release/:releaseId")
  listHotfixesByRelease(@Param("releaseId") releaseId: string) {
    return this.prisma.hotfix.findMany({
      where: { releaseId },
      orderBy: { codigo: "asc" },
    });
  }

  // ==================== CLIENTES (read-only lookup for dropdowns) ====================
  @Get("clientes")
  listClientes() {
    return this.prisma.cliente.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        descripcion: true,
        jefeProyecto1: true,
        jefeProyecto2: true,
      },
      orderBy: { codigo: "asc" },
    });
  }

  // ==================== MODULOS (read-only lookup for dropdowns) ====================
  @Get("modulos")
  listModulos() {
    return this.prisma.modulo.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        descripcion: true,
      },
      orderBy: { codigo: "asc" },
    });
  }

  // ==================== UNIDADES COMERCIALES (read-only lookup for dropdowns) ====================
  @Get("clientes/:clienteId/unidades")
  listUnidadesByCliente(@Param("clienteId") clienteId: string) {
    return this.prisma.unidadComercial.findMany({
      where: { clienteId, activo: true },
      select: {
        id: true,
        codigo: true,
        descripcion: true,
        scope: true,
      },
      orderBy: [{ scope: "asc" }, { codigo: "asc" }],
    });
  }

  // ==================== ESTADOS PERMITIDOS (for task state machine) ====================
  /**
   * Get allowed next statuses based on task type, current status, and actor type.
   * If no flow is configured for the task type, returns all active statuses.
   *
   * @param tipoTareaId - Task type ID
   * @param estadoActualId - Current status ID (optional, for new tasks)
   * @param actorTipo - Actor type: AGENTE or CLIENTE
   */
  @Get("estados-permitidos")
  async listEstadosPermitidos(
    @Query("tipoTareaId") tipoTareaId: string,
    @Query("estadoActualId") estadoActualId?: string,
    @Query("actorTipo") actorTipo?: string
  ) {
    if (!tipoTareaId) {
      throw new BadRequestException("tipoTareaId es requerido");
    }

    const isCliente = actorTipo === "CLIENTE";

    // Get the flow for this task type
    const flow = await this.prisma.tipoTareaEstadoFlow.findUnique({
      where: { tipoTareaId },
      include: {
        estadosPermitidos: {
          include: {
            estado: true,
          },
          orderBy: { orden: "asc" },
        },
        transiciones: {
          include: {
            estadoDestino: true,
          },
          orderBy: { orden: "asc" },
        },
        estadoInicial: true,
      },
    });

    // If no flow configured, return all active statuses
    if (!flow || !flow.activo) {
      return this.prisma.estadoTarea.findMany({
        where: { activo: true },
        orderBy: { orden: "asc" },
      });
    }

    // If no current status (new task), return the initial status or allowed statuses
    if (!estadoActualId) {
      if (flow.estadoInicial) {
        return [flow.estadoInicial];
      }
      // Return first allowed status or all allowed statuses for new tasks
      const allowedEstados = flow.estadosPermitidos
        .filter((ep) => !isCliente || ep.visibleCliente)
        .map((ep) => ep.estado);
      return allowedEstados;
    }

    // Get allowed transitions from current status
    const allowedTransitions = flow.transiciones.filter((t) => {
      if (t.estadoOrigenId !== estadoActualId) return false;
      if (isCliente && !t.permiteCliente) return false;
      if (!isCliente && !t.permiteAgente) return false;
      return true;
    });

    // Get the allowed statuses
    const allowedStatusIds = new Set(allowedTransitions.map((t) => t.estadoDestinoId));

    // Also include current status if it's in the allowed statuses list
    const currentStatusInFlow = flow.estadosPermitidos.find((ep) => ep.estadoId === estadoActualId);
    if (currentStatusInFlow) {
      allowedStatusIds.add(estadoActualId);
    }

    // Filter by visibility for clients
    const visibleEstadoIds = new Set(
      flow.estadosPermitidos
        .filter((ep) => !isCliente || ep.visibleCliente)
        .map((ep) => ep.estadoId)
    );

    // Return estados that are both allowed AND visible
    const finalStatusIds = [...allowedStatusIds].filter((id) => visibleEstadoIds.has(id)) as string[];

    const estados = await this.prisma.estadoTarea.findMany({
      where: { id: { in: finalStatusIds } },
      orderBy: { orden: "asc" },
    });

    return estados;
  }

  /**
   * Get allowed Estado Petición transitions based on flow configuration.
   * Similar to listEstadosPermitidos but for Estado Petición.
   * @param tipoTareaId - Task type ID (required)
   * @param estadoActualId - Current Estado Petición ID (optional, for new tasks returns initial or all allowed)
   * @param actorTipo - Actor type: AGENTE or CLIENTE
   */
  @Get("estados-peticion-permitidos")
  async listEstadosPeticionPermitidos(
    @Query("tipoTareaId") tipoTareaId: string,
    @Query("estadoActualId") estadoActualId?: string,
    @Query("actorTipo") actorTipo?: string
  ) {
    if (!tipoTareaId) {
      throw new BadRequestException("tipoTareaId es requerido");
    }

    const isCliente = actorTipo === "CLIENTE";

    // Get the Estado Petición flow for this task type
    const flow = await this.prisma.tipoTareaEstadoPeticionFlow.findUnique({
      where: { tipoTareaId },
      include: {
        estadosPermitidos: {
          include: {
            estado: true,
          },
          orderBy: { orden: "asc" },
        },
        transiciones: {
          include: {
            estadoDestino: true,
          },
          orderBy: { orden: "asc" },
        },
        estadoInicial: true,
      },
    });

    // If no flow configured, return all active estados petición
    if (!flow || !flow.activo) {
      return this.prisma.estadoPeticion.findMany({
        where: { activo: true },
        orderBy: { orden: "asc" },
      });
    }

    // If no current status (new task), return the initial status or allowed statuses
    if (!estadoActualId) {
      if (flow.estadoInicial) {
        return [flow.estadoInicial];
      }
      // Return allowed statuses for new tasks
      const allowedEstados = flow.estadosPermitidos
        .filter((ep) => !isCliente || ep.visibleCliente)
        .map((ep) => ep.estado);
      return allowedEstados;
    }

    // Get allowed transitions from current status
    const allowedTransitions = flow.transiciones.filter((t) => {
      if (t.estadoOrigenId !== estadoActualId) return false;
      if (isCliente && !t.permiteCliente) return false;
      if (!isCliente && !t.permiteAgente) return false;
      return true;
    });

    // Get the allowed status IDs from transitions
    const allowedStatusIds = new Set(allowedTransitions.map((t) => t.estadoDestinoId));

    // Also include current status if it's in the allowed statuses list
    const currentStatusInFlow = flow.estadosPermitidos.find((ep) => ep.estadoId === estadoActualId);
    if (currentStatusInFlow) {
      allowedStatusIds.add(estadoActualId);
    }

    // Filter by visibility for clients
    const visibleEstadoIds = new Set(
      flow.estadosPermitidos
        .filter((ep) => !isCliente || ep.visibleCliente)
        .map((ep) => ep.estadoId)
    );

    // Return estados that are both allowed AND visible
    const finalStatusIds = [...allowedStatusIds].filter((id) => visibleEstadoIds.has(id)) as string[];

    const estados = await this.prisma.estadoPeticion.findMany({
      where: { id: { in: finalStatusIds } },
      orderBy: { orden: "asc" },
    });

    return estados;
  }

  /**
   * Get the initial status for a task type based on flow configuration.
   * Falls back to default status or first status if no flow is configured.
   */
  @Get("estado-inicial/:tipoTareaId")
  async getEstadoInicial(@Param("tipoTareaId") tipoTareaId: string) {
    // Get the flow for this task type
    const flow = await this.prisma.tipoTareaEstadoFlow.findUnique({
      where: { tipoTareaId },
      include: {
        estadoInicial: true,
      },
    });

    // If flow has an initial status, return it
    if (flow?.activo && flow.estadoInicial) {
      return flow.estadoInicial;
    }

    // Fallback: get default status
    const defaultEstado = await this.prisma.estadoTarea.findFirst({
      where: { porDefecto: true, activo: true },
    });
    if (defaultEstado) {
      return defaultEstado;
    }

    // Fallback: get first status by orden
    return this.prisma.estadoTarea.findFirst({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
  }
}
