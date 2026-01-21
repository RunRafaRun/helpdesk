import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiProperty } from "@nestjs/swagger";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { IsString, IsOptional, IsInt, IsBoolean } from "class-validator";

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
}

@ApiTags("admin/lookup")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("admin/lookup")
export class LookupAdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== TIPOS TAREA ====================
  @Get("tipos-tarea")
  listTiposTarea() {
    return this.prisma.tipoTarea.findMany({ orderBy: { orden: "asc" } });
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
      },
    });
  }

  @Put("tipos-tarea/:id")
  async updateTipoTarea(@Param("id") id: string, @Body() dto: UpdateLookupDto) {
    // If setting porDefecto to true, unset other defaults
    if (dto.porDefecto === true) {
      await this.prisma.tipoTarea.updateMany({ where: { porDefecto: true, NOT: { id } }, data: { porDefecto: false } });
    }
    const data: any = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.porDefecto !== undefined) data.porDefecto = dto.porDefecto;
    return this.prisma.tipoTarea.update({ where: { id }, data });
  }

  @Delete("tipos-tarea/:id")
  deleteTipoTarea(@Param("id") id: string) {
    return this.prisma.tipoTarea.delete({ where: { id } });
  }

  // ==================== ESTADOS TAREA ====================
  @Get("estados-tarea")
  listEstadosTarea() {
    return this.prisma.estadoTarea.findMany({ orderBy: { orden: "asc" } });
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
      },
    });
  }

  @Put("estados-tarea/:id")
  async updateEstadoTarea(@Param("id") id: string, @Body() dto: UpdateLookupDto) {
    // If setting porDefecto to true, unset other defaults
    if (dto.porDefecto === true) {
      await this.prisma.estadoTarea.updateMany({ where: { porDefecto: true, NOT: { id } }, data: { porDefecto: false } });
    }
    const data: any = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.porDefecto !== undefined) data.porDefecto = dto.porDefecto;
    return this.prisma.estadoTarea.update({ where: { id }, data });
  }

  @Delete("estados-tarea/:id")
  deleteEstadoTarea(@Param("id") id: string) {
    return this.prisma.estadoTarea.delete({ where: { id } });
  }

  // ==================== PRIORIDADES TAREA ====================
  @Get("prioridades-tarea")
  listPrioridadesTarea() {
    return this.prisma.prioridadTarea.findMany({ orderBy: { orden: "asc" } });
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
      },
    });
  }

  @Put("prioridades-tarea/:id")
  async updatePrioridadTarea(@Param("id") id: string, @Body() dto: UpdateLookupDto) {
    // If setting porDefecto to true, unset other defaults
    if (dto.porDefecto === true) {
      await this.prisma.prioridadTarea.updateMany({ where: { porDefecto: true, NOT: { id } }, data: { porDefecto: false } });
    }
    const data: any = {};
    if (dto.codigo !== undefined) data.codigo = dto.codigo;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.porDefecto !== undefined) data.porDefecto = dto.porDefecto;
    return this.prisma.prioridadTarea.update({ where: { id }, data });
  }

  @Delete("prioridades-tarea/:id")
  deletePrioridadTarea(@Param("id") id: string) {
    return this.prisma.prioridadTarea.delete({ where: { id } });
  }

  // ==================== RELEASES (read-only lookup) ====================
  @Get("releases")
  listReleases() {
    return this.prisma.release.findMany({
      orderBy: { codigo: "desc" },
      include: {
        hotfixes: {
          orderBy: { codigo: "asc" },
          select: { id: true, codigo: true, descripcion: true },
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
}
