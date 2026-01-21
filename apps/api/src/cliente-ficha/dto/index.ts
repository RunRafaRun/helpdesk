import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty, IsEnum, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { ClienteReleaseEstado, UnidadComercialScope } from '@prisma/client';

// CLIENTE CONEXION DTOs
export class CreateClienteConexionDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  endpoint?: string;

  @ApiProperty({ required: false, maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  usuario?: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  secretRef?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateClienteConexionDto extends PartialType(CreateClienteConexionDto) {}

// CLIENTE COMENTARIO DTOs
export class CreateClienteComentarioDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  texto: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  destacado?: boolean;
}

export class UpdateClienteComentarioDto extends PartialType(CreateClienteComentarioDto) {}

// CLIENTE CENTRO TRABAJO DTOs
export class CreateClienteCentroTrabajoDto {
  @ApiProperty({ maxLength: 250 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nombre: string;

  @ApiProperty({ required: false, maxLength: 250, description: 'Base de datos asociada' })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  baseDatos?: string;
}

export class UpdateClienteCentroTrabajoDto extends PartialType(CreateClienteCentroTrabajoDto) {}

// CLIENTE RELEASE PLAN DTOs
export class CreateClienteReleasePlanDto {
  @ApiProperty({ description: 'ID del Release' })
  @IsUUID()
  @IsNotEmpty()
  releaseId: string;

  @ApiProperty({ required: false, description: 'ID del Hotfix (opcional)' })
  @IsUUID()
  @IsOptional()
  hotfixId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaPrevista?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaInstalada?: string;

  @ApiProperty({ enum: ClienteReleaseEstado, default: 'PLANIFICADO' })
  @IsEnum(ClienteReleaseEstado)
  @IsOptional()
  estado?: ClienteReleaseEstado;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  agenteId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  detalle?: string;
}

export class UpdateClienteReleasePlanDto extends PartialType(CreateClienteReleasePlanDto) {}

// UNIDAD COMERCIAL DTOs
export class CreateUnidadComercialDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: UnidadComercialScope, default: 'HOTEL' })
  @IsEnum(UnidadComercialScope)
  @IsOptional()
  scope?: UnidadComercialScope;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateUnidadComercialDto extends PartialType(CreateUnidadComercialDto) {}

// Re-exportar los DTOs principales
export { CreateClienteSoftwareDto, UpdateClienteSoftwareDto } from './cliente-software.dto';
export { CreateClienteContactoDto, UpdateClienteContactoDto } from './cliente-contacto.dto';
export { CreateClienteUsuarioDto, UpdateClienteUsuarioDto, SetClienteUsuarioModulosDto } from './cliente-usuario.dto';
