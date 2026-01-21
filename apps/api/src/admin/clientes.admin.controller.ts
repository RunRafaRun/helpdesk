import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, BadRequestException, Req, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard, RequirePermissions, RequireAnyPermission } from "../auth/permissions";
import { PermisoCodigo, UnidadComercialScope } from "@prisma/client";
import { CrearClienteDto, CrearUnidadDto } from "./dto";
import { encrypt, decrypt } from "../utils/crypto";


class UpdateClienteDto {
  @IsOptional() @IsString()
  codigo?: string;

  @IsOptional() @IsString()
  descripcion?: string | null;

  @IsOptional() @IsString()
  logotipo?: string | null;

  @IsOptional() @IsString()
  jefeProyecto1?: string | null;

  @IsOptional() @IsString()
  jefeProyecto2?: string | null;

  @IsOptional() @IsString()
  licenciaTipo?: "AAM" | "PPU" | null;
}


class UpdateUnidadDto {
  @IsOptional() @IsString()
  codigo?: string;

  @IsOptional() @IsString()
  descripcion?: string | null;

  @IsOptional() @IsString()
  scope?: UnidadComercialScope;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}


class CreateUsuarioClienteDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  nombre!: string;

  @IsString() @IsNotEmpty() @MaxLength(200)
  usuario!: string;

  @IsOptional() @IsString() @MaxLength(200)
  password?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(50)
  telefono?: string;

  @IsOptional() @IsString() @MaxLength(50)
  tipo?: string;

  @IsOptional() @IsBoolean()
  recibeNotificaciones?: boolean;

  @IsOptional() @IsBoolean()
  recibeTodasLasTareas?: boolean;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}

class UpdateUsuarioClienteDto {
  @IsOptional() @IsString() @MaxLength(200)
  nombre?: string;

  @IsOptional() @IsString() @MaxLength(200)
  usuario?: string;

  @IsOptional() @IsString() @MaxLength(200)
  password?: string;

  @IsOptional() @IsEmail()
  email?: string | null;

  @IsOptional() @IsString() @MaxLength(50)
  telefono?: string | null;

  @IsOptional() @IsString() @MaxLength(50)
  tipo?: string | null;

  @IsOptional() @IsBoolean()
  recibeNotificaciones?: boolean;

  @IsOptional() @IsBoolean()
  recibeTodasLasTareas?: boolean;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}



class CreateContactoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  cargo?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  movil?: string | null;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;

  @IsOptional()
  @IsString()
  notas?: string | null;


  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

class UpdateContactoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  cargo?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  movil?: string | null;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;

  @IsOptional()
  @IsString()
  notas?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

class CreateConexionDto {
  nombre!: string;
  endpoint?: string | null;
  usuario?: string | null;
  secretRef?: string | null;
  notas?: string | null;
}

class UpdateConexionDto extends CreateConexionDto {}

class CreateSoftwareDto {
  tipo!: "PMS"|"ERP"|"PERIFERIA"|"OTROS";
  nombre!: string;
  version?: string | null;
  moduloId?: string | null;
  notas?: string | null;
}

class UpdateSoftwareDto extends CreateSoftwareDto {}

class CreateCentroTrabajoDto {
  nombre!: string;
  baseDatos?: string | null;
}

class UpdateCentroTrabajoDto extends CreateCentroTrabajoDto {}

class CreateComentarioDto {
  @IsString()
  texto!: string;

  @IsOptional()
  @IsBoolean()
  destacado?: boolean;
}

class UpdateComentarioDto {
  @IsOptional()
  @IsString()
  texto?: string;

  @IsOptional()
  @IsBoolean()
  destacado?: boolean;
}

class CreateReleasePlanDto {
  releaseId!: string;
  hotfixId?: string | null;
  fechaPrevista?: string | null;
  fechaInstalada?: string | null;
  estado?: "PLANIFICADO"|"EN_CURSO"|"INSTALADO"|"CANCELADO";
  agenteId?: string | null;
  detalle?: string | null;
}

class UpdateReleasePlanDto extends CreateReleasePlanDto {}

@ApiTags("admin-clientes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/clientes")
export class ClientesAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async list() {
    const clientes = await this.prisma.cliente.findMany({
      select: {
        id: true,
        codigo: true,
        descripcion: true,
        logotipo: true,
        jefeProyecto1: true,
        jefeProyecto2: true,
        createdAt: true,
        updatedAt: true,
        releasesPlan: {
          where: { estado: "INSTALADO" },
          orderBy: [{ fechaPrevista: "desc" }],
          take: 1,
          include: {
            release: { select: { codigo: true } },
            hotfix: { select: { codigo: true } },
          },
        },
        comentarios: {
          where: { destacado: true },
          take: 1,
          select: { id: true, texto: true },
        },
      },
      orderBy: { codigo: "asc" },
    });

    // Transform to include currentRelease and comentarioDestacado fields
    return clientes.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      descripcion: c.descripcion,
      logotipo: c.logotipo,
      jefeProyecto1: c.jefeProyecto1,
      jefeProyecto2: c.jefeProyecto2,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      currentRelease: c.releasesPlan[0]
        ? `${c.releasesPlan[0].release?.codigo || ''}${c.releasesPlan[0].hotfix ? `-${c.releasesPlan[0].hotfix.codigo}` : ''}`
        : null,
      comentarioDestacado: c.comentarios[0]?.texto || null,
    }));
  }

  // GET /admin/clientes/by-codigo/:codigo
  @Get("by-codigo/:codigo")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async getOneByCodigo(@Param("codigo") codigo: string) {
    return this.prisma.cliente.findUnique({
      where: { codigo },
      select: { id: true, codigo: true, descripcion: true, logotipo: true, jefeProyecto1: true, jefeProyecto2: true, licenciaTipo: true, createdAt: true, updatedAt: true },
    });
  }

  // GET /admin/clientes/:id
  @Get(":id")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async getOne(@Param("id") id: string) {
    return this.prisma.cliente.findUnique({
      where: { id },
      select: { id: true, codigo: true, descripcion: true, logotipo: true, jefeProyecto1: true, jefeProyecto2: true, licenciaTipo: true, createdAt: true, updatedAt: true },
    });
  }

  // Usuarios cliente
  @Get(":id/usuarios")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async listUsuarios(@Param("id") clienteId: string, @Query("includeInactive") includeInactive?: string) {
    const showInactive = includeInactive === "1" || includeInactive === "true";
    return this.prisma.clienteUsuario.findMany({
      where: { clienteId, ...(showInactive ? {} : { activo: true }) },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        email: true,
        telefono: true,
        tipo: true,
        activo: true,
        recibeNotificaciones: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { usuario: "asc" },
    });
  }

  @Post(":id/usuarios")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async createUsuario(@Param("id") clienteId: string, @Body() dto: CreateUsuarioClienteDto) {
    if (!dto.password || !dto.password.trim()) {
      throw new BadRequestException("password es obligatorio al crear un usuario");
    }
    return this.prisma.clienteUsuario.create({
      data: {
        clienteId,
        nombre: dto.nombre.trim(),
        usuario: dto.usuario.trim(),
        password: dto.password,
        email: dto.email ?? null,
        telefono: dto.telefono ?? null,
        tipo: dto.tipo ?? null,
        activo: dto.activo ?? true,
        recibeNotificaciones: dto.recibeNotificaciones ?? true,
      },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        email: true,
        telefono: true,
        tipo: true,
        activo: true,
        recibeNotificaciones: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Put(":id/usuarios/:usuarioId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async updateUsuario(@Param("id") clienteId: string, @Param("usuarioId") usuarioId: string, @Body() dto: UpdateUsuarioClienteDto) {
    // clienteId se usa para contexto; where principal es usuarioId.
    const data: any = {
      ...(dto.nombre === undefined ? {} : { nombre: dto.nombre?.trim() }),
      ...(dto.usuario === undefined ? {} : { usuario: dto.usuario?.trim() }),
      ...(dto.email === undefined ? {} : { email: dto.email ?? null }),
      ...(dto.telefono === undefined ? {} : { telefono: dto.telefono ?? null }),
      ...(dto.tipo === undefined ? {} : { tipo: dto.tipo ?? null }),
      ...(dto.recibeNotificaciones === undefined ? {} : { recibeNotificaciones: dto.recibeNotificaciones }),
      ...(dto.activo === undefined ? {} : { activo: dto.activo }),
      ...(dto.password === undefined || dto.password === "" ? {} : { password: dto.password }),
    };

    return this.prisma.clienteUsuario.update({
      where: { id: usuarioId },
      data,
      select: {
        id: true,
        nombre: true,
        usuario: true,
        email: true,
        telefono: true,
        tipo: true,
        activo: true,
        recibeNotificaciones: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }


  @Post()
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async create(@Body() dto: CrearClienteDto) {
    return this.prisma.cliente.create({
      data: {
        codigo: dto.codigo,
        descripcion: dto.descripcion ?? null,
        logotipo: dto.logotipo ?? null,
        jefeProyecto1: dto.jefeProyecto1 ?? null,
        jefeProyecto2: dto.jefeProyecto2 ?? null,
        licenciaTipo: dto.licenciaTipo ?? null,
      },
    });
  }

  @Put(":id")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async update(@Param("id") id: string, @Body() dto: UpdateClienteDto) {
    return this.prisma.cliente.update({
      where: { id },
      data: {
        codigo: dto.codigo,
        descripcion: dto.descripcion,
        logotipo: dto.logotipo,
        jefeProyecto1: dto.jefeProyecto1,
        jefeProyecto2: dto.jefeProyecto2,
        licenciaTipo: dto.licenciaTipo,
      },
    });
  }

  @Delete(":id")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async remove(@Param("id") id: string) {
    await this.prisma.cliente.delete({ where: { id } });
    return { ok: true };
  }

  // Unidades comerciales
  @Get(":id/unidades")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async listUnidades(@Param("id") clienteId: string, @Query("includeInactive") includeInactive?: string) {
    const include = includeInactive === "1" || includeInactive === "true";
    return this.prisma.unidadComercial.findMany({
      where: include ? { clienteId } : { clienteId, activo: true },
      orderBy: [{ scope: "asc" }, { codigo: "asc" }],
    });
  }

  @Post(":id/unidades")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async createUnidad(@Param("id") clienteId: string, @Body() dto: CrearUnidadDto) {
    return this.prisma.unidadComercial.create({
      data: {
        clienteId,
        codigo: dto.codigo,
        descripcion: dto.descripcion ?? null,
        scope: dto.scope ?? "HOTEL",
        activo: dto.activo ?? true,
      },
    });
  }

  @Put(":id/unidades/:unidadId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async updateUnidad(@Param("id") clienteId: string, @Param("unidadId") unidadId: string, @Body() dto: UpdateUnidadDto) {
    // clienteId se usa solo para asegurar contexto; where principal es unidadId.
    return this.prisma.unidadComercial.update({
      where: { id: unidadId },
      data: {
        codigo: dto.codigo,
        descripcion: dto.descripcion,
        scope: dto.scope,
        ...(dto.activo === undefined ? {} : { activo: dto.activo }),
      },
    });
  }

  @Delete(":id/unidades/:unidadId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async deleteUnidad(@Param("id") clienteId: string, @Param("unidadId") unidadId: string) {
    await this.prisma.unidadComercial.delete({ where: { id: unidadId } });
    return { ok: true };
  }

  // --- Software ---
  @Get(":id/software")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async listSoftware(@Param("id") clienteId: string) {
    return this.prisma.clienteSoftware.findMany({ where: { clienteId }, orderBy: { nombre: "asc" } });
  }

  @Post(":id/software")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async createSoftware(@Param("id") clienteId: string, @Body() dto: CreateSoftwareDto) {
    return this.prisma.clienteSoftware.create({
      data: { clienteId, tipo: dto.tipo as any, nombre: dto.nombre, version: dto.version ?? null, moduloId: dto.moduloId ?? null, notas: dto.notas ?? null },
    });
  }

  @Put(":id/software/:softwareId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async updateSoftware(@Param("id") clienteId: string, @Param("softwareId") softwareId: string, @Body() dto: UpdateSoftwareDto) {
    return this.prisma.clienteSoftware.update({
      where: { id: softwareId },
      data: { tipo: dto.tipo as any, nombre: dto.nombre, version: dto.version ?? null, moduloId: dto.moduloId ?? null, notas: dto.notas ?? null },
    });
  }

  @Delete(":id/software/:softwareId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async deleteSoftware(@Param("id") clienteId: string, @Param("softwareId") softwareId: string) {
    await this.prisma.clienteSoftware.delete({ where: { id: softwareId } });
    return { ok: true };
  }

  // --- Contactos ---
  @Get(":id/contactos")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async listContactos(@Param("id") clienteId: string, @Query("includeInactive") includeInactive?: string) {
    const where: any = { clienteId };
    if (!includeInactive) where.activo = true;
    return this.prisma.clienteContacto.findMany({ where, orderBy: [{ principal: "desc" }, { nombre: "asc" }] });
  }

  @Post(":id/contactos")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async createContacto(@Param("id") clienteId: string, @Body() dto: CreateContactoDto) {
    return this.prisma.clienteContacto.create({
      data: { clienteId, nombre: dto.nombre, cargo: dto.cargo ?? null, email: dto.email ?? null, movil: dto.movil ?? null, principal: dto.principal ?? false, notas: dto.notas ?? null, activo: dto.activo ?? true },
    });
  }

  @Put(":id/contactos/:contactoId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async updateContacto(@Param("id") clienteId: string, @Param("contactoId") contactoId: string, @Body() dto: UpdateContactoDto) {
    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.cargo !== undefined) data.cargo = dto.cargo ?? null;
    if (dto.email !== undefined) data.email = dto.email ?? null;
    if (dto.movil !== undefined) data.movil = dto.movil ?? null;
    if (dto.principal !== undefined) data.principal = dto.principal;
    if (dto.notas !== undefined) data.notas = dto.notas ?? null;
    if (dto.activo !== undefined) data.activo = dto.activo;
    return this.prisma.clienteContacto.update({ where: { id: contactoId }, data });
  }

  @Delete(":id/contactos/:contactoId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async deleteContacto(@Param("id") clienteId: string, @Param("contactoId") contactoId: string) {
    await this.prisma.clienteContacto.update({ where: { id: contactoId }, data: { activo: false } });
    return { ok: true };
  }

  // --- Conexiones ---
  @Get(":id/conexiones")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async listConexiones(@Param("id") clienteId: string) {
    const conexiones = await this.prisma.clienteConexion.findMany({ where: { clienteId }, orderBy: { nombre: "asc" } });
    // Decrypt passwords for authenticated agents
    return conexiones.map(c => ({
      ...c,
      secretRef: c.secretRef ? decrypt(c.secretRef) : null,
    }));
  }

  @Post(":id/conexiones")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async createConexion(@Param("id") clienteId: string, @Body() dto: CreateConexionDto) {
    // Encrypt password before storing
    const encryptedPassword = dto.secretRef ? encrypt(dto.secretRef) : null;
    const created = await this.prisma.clienteConexion.create({
      data: { clienteId, nombre: dto.nombre, endpoint: dto.endpoint ?? null, usuario: dto.usuario ?? null, secretRef: encryptedPassword, notas: dto.notas ?? null },
    });
    // Return with decrypted password
    return { ...created, secretRef: dto.secretRef ?? null };
  }

  @Put(":id/conexiones/:conexionId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async updateConexion(@Param("id") clienteId: string, @Param("conexionId") conexionId: string, @Body() dto: UpdateConexionDto) {
    // Encrypt password before storing
    const encryptedPassword = dto.secretRef ? encrypt(dto.secretRef) : null;
    const updated = await this.prisma.clienteConexion.update({
      where: { id: conexionId },
      data: { nombre: dto.nombre, endpoint: dto.endpoint ?? null, usuario: dto.usuario ?? null, secretRef: encryptedPassword, notas: dto.notas ?? null },
    });
    // Return with decrypted password
    return { ...updated, secretRef: dto.secretRef ?? null };
  }

  @Delete(":id/conexiones/:conexionId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async deleteConexion(@Param("id") clienteId: string, @Param("conexionId") conexionId: string) {
    await this.prisma.clienteConexion.delete({ where: { id: conexionId } });
    return { ok: true };
  }

  // --- Comentarios ---
  @Get(":id/comentarios")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async listComentarios(@Param("id") clienteId: string) {
    return this.prisma.clienteComentario.findMany({
      where: { clienteId },
      orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
      include: { agente: { select: { id: true, nombre: true, usuario: true } } },
    });
  }

  @Post(":id/comentarios")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async createComentario(@Param("id") clienteId: string, @Body() dto: CreateComentarioDto, @Req() req: any) {
    const agenteId = req?.user?.sub as string | undefined;
    if (!agenteId) throw new BadRequestException("No autenticado");

    // If creating as destacado, unmark any other destacado
    if (dto.destacado) {
      await this.prisma.clienteComentario.updateMany({
        where: { clienteId, destacado: true },
        data: { destacado: false },
      });
    }

    return this.prisma.clienteComentario.create({
      data: { clienteId, agenteId, texto: dto.texto, destacado: dto.destacado ?? false },
      include: { agente: { select: { id: true, nombre: true, usuario: true } } },
    });
  }

  @Put(":id/comentarios/:comentarioId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async updateComentario(@Param("id") clienteId: string, @Param("comentarioId") comentarioId: string, @Body() dto: UpdateComentarioDto) {
    // If marking as destacado, unmark any other destacado for this cliente
    if (dto.destacado === true) {
      await this.prisma.clienteComentario.updateMany({
        where: { clienteId, destacado: true, id: { not: comentarioId } },
        data: { destacado: false },
      });
    }

    return this.prisma.clienteComentario.update({
      where: { id: comentarioId },
      data: {
        ...(dto.texto !== undefined && { texto: dto.texto }),
        ...(dto.destacado !== undefined && { destacado: dto.destacado }),
      },
      include: { agente: { select: { id: true, nombre: true, usuario: true } } },
    });
  }

  @Put(":id/comentarios/:comentarioId/destacar")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async toggleDestacado(@Param("id") clienteId: string, @Param("comentarioId") comentarioId: string) {
    // Get current state
    const comentario = await this.prisma.clienteComentario.findUnique({ where: { id: comentarioId } });
    if (!comentario) throw new BadRequestException("Comentario no encontrado");

    // If marking as destacado, unmark any other destacado for this cliente
    if (!comentario.destacado) {
      await this.prisma.clienteComentario.updateMany({
        where: { clienteId, destacado: true },
        data: { destacado: false },
      });
    }

    // Toggle the destacado state
    return this.prisma.clienteComentario.update({
      where: { id: comentarioId },
      data: { destacado: !comentario.destacado },
      include: { agente: { select: { id: true, nombre: true, usuario: true } } },
    });
  }

  @Delete(":id/comentarios/:comentarioId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async deleteComentario(@Param("id") clienteId: string, @Param("comentarioId") comentarioId: string) {
    await this.prisma.clienteComentario.delete({ where: { id: comentarioId } });
    return { ok: true };
  }

  // --- Centros de trabajo ---
  @Get(":id/centros-trabajo")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async listCentros(@Param("id") clienteId: string) {
    return this.prisma.clienteCentroTrabajo.findMany({ where: { clienteId }, orderBy: { nombre: "asc" } });
  }

  @Post(":id/centros-trabajo")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async createCentro(@Param("id") clienteId: string, @Body() dto: CreateCentroTrabajoDto) {
    return this.prisma.clienteCentroTrabajo.create({
      data: { clienteId, nombre: dto.nombre, baseDatos: dto.baseDatos ?? null },
    });
  }

  @Put(":id/centros-trabajo/:centroId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async updateCentro(@Param("id") clienteId: string, @Param("centroId") centroId: string, @Body() dto: UpdateCentroTrabajoDto) {
    return this.prisma.clienteCentroTrabajo.update({
      where: { id: centroId },
      data: { nombre: dto.nombre, baseDatos: dto.baseDatos ?? null },
    });
  }

  @Delete(":id/centros-trabajo/:centroId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async deleteCentro(@Param("id") clienteId: string, @Param("centroId") centroId: string) {
    await this.prisma.clienteCentroTrabajo.delete({ where: { id: centroId } });
    return { ok: true };
  }

  // --- Releases / Hotfix por cliente ---
  @Get(":id/releases")
  @RequireAnyPermission(PermisoCodigo.CONFIG_CLIENTES, PermisoCodigo.CONFIG_CLIENTES_READ)
  async listReleases(@Param("id") clienteId: string) {
    return this.prisma.clienteReleasePlan.findMany({
      where: { clienteId },
      orderBy: [{ estado: "asc" }, { fechaPrevista: "desc" }],
      include: { agente: { select: { id: true, nombre: true, usuario: true } } },
    });
  }

  @Post(":id/releases")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async createRelease(@Param("id") clienteId: string, @Body() dto: CreateReleasePlanDto) {
    return this.prisma.clienteReleasePlan.create({
      data: {
        clienteId,
        releaseId: dto.releaseId,
        hotfixId: dto.hotfixId ?? null,
        fechaPrevista: dto.fechaPrevista ? new Date(dto.fechaPrevista) : null,
        fechaInstalada: dto.fechaInstalada ? new Date(dto.fechaInstalada) : null,
        estado: (dto.estado ?? "PLANIFICADO") as any,
        agenteId: dto.agenteId ?? null,
        detalle: dto.detalle ?? null,
      },
    });
  }

  @Put(":id/releases/:releasePlanId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async updateRelease(@Param("id") clienteId: string, @Param("releasePlanId") releasePlanId: string, @Body() dto: UpdateReleasePlanDto) {
    return this.prisma.clienteReleasePlan.update({
      where: { id: releasePlanId },
      data: {
        releaseId: dto.releaseId,
        hotfixId: dto.hotfixId ?? null,
        fechaPrevista: dto.fechaPrevista ? new Date(dto.fechaPrevista) : null,
        fechaInstalada: dto.fechaInstalada ? new Date(dto.fechaInstalada) : null,
        estado: (dto.estado ?? "PLANIFICADO") as any,
        agenteId: dto.agenteId ?? null,
        detalle: dto.detalle ?? null,
      },
    });
  }

  @Delete(":id/releases/:releaseId")
  @RequirePermissions(PermisoCodigo.CONFIG_CLIENTES)
  async deleteRelease(@Param("id") clienteId: string, @Param("releaseId") releaseId: string) {
    await this.prisma.clienteReleasePlan.delete({ where: { id: releaseId } });
    return { ok: true };
  }

}