import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ClienteReleaseTipo, ClienteReleaseEstado } from '@prisma/client';

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
}

export class UpdateClienteComentarioDto extends PartialType(CreateClienteComentarioDto) {}

// CLIENTE CENTRO TRABAJO DTOs
export class CreateClienteCentroTrabajoDto {
  @ApiProperty({ maxLength: 250 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  nombre: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  direccion?: string;

  @ApiProperty({ required: false, maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  ciudad?: string;

  @ApiProperty({ required: false, maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  provincia?: string;

  @ApiProperty({ required: false, maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigoPostal?: string;

  @ApiProperty({ required: false, maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  pais?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateClienteCentroTrabajoDto extends PartialType(CreateClienteCentroTrabajoDto) {}

// CLIENTE RELEASE PLAN DTOs
export class CreateClienteReleasePlanDto {
  @ApiProperty({ enum: ClienteReleaseTipo })
  @IsEnum(ClienteReleaseTipo)
  tipo: ClienteReleaseTipo;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

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

// Re-exportar los DTOs principales
export { CreateClienteSoftwareDto, UpdateClienteSoftwareDto } from './cliente-software.dto';
export { CreateClienteContactoDto, UpdateClienteContactoDto } from './cliente-contacto.dto';
