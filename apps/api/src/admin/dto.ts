import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CrearClienteDto {
  @ApiProperty() @IsString() @IsNotEmpty() codigo!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;

  // Opcionales (para alinearse con el controlador y el modelo)
  @ApiPropertyOptional() @IsOptional() @IsString() logotipo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jefeProyecto1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jefeProyecto2?: string;
  @ApiPropertyOptional({ enum: ["AAM", "PPU"] })
  @IsOptional() @IsString() @IsIn(["AAM", "PPU"]) licenciaTipo?: "AAM" | "PPU";

  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}

export class CrearUnidadDto {
  @ApiProperty() @IsString() @IsNotEmpty() codigo!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiProperty({ enum: ["HOTEL","CENTRAL","TODOS"] })
  @IsString() @IsIn(["HOTEL","CENTRAL","TODOS"]) scope!: "HOTEL"|"CENTRAL"|"TODOS";
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}

export class CrearAgenteDto {
  @ApiProperty() @IsString() @IsNotEmpty() nombre!: string;
  @ApiProperty() @IsString() @IsNotEmpty() usuario!: string;
  @ApiProperty() @IsString() @IsNotEmpty() password!: string;
  @ApiPropertyOptional({ enum: ["ADMIN","AGENTE"] })
  @IsOptional() @IsString() @IsIn(["ADMIN","AGENTE"]) role?: "ADMIN"|"AGENTE";
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}

export class CrearUsuarioClienteDto {
  @ApiProperty() @IsString() @IsNotEmpty() clienteCodigo!: string;
  @ApiProperty() @IsString() @IsNotEmpty() nombre!: string;
  @ApiProperty() @IsString() @IsNotEmpty() usuario!: string;
  @ApiProperty() @IsString() @IsNotEmpty() password!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tipo?: string;
}

export class CrearPlantillaDto {
  @ApiProperty() @IsString() @IsNotEmpty() codigo!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiProperty() @IsString() @IsNotEmpty() texto!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoria?: string;
  @ApiPropertyOptional() @IsOptional() orden?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}

export class ActualizarPlantillaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() codigo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() texto?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoria?: string;
  @ApiPropertyOptional() @IsOptional() orden?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}

// Estado Flow DTOs - State machine configuration for task types
import { IsArray, IsInt, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class EstadoPermitidoDto {
  @ApiProperty() @IsUUID() estadoId!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() orden?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() visibleCliente?: boolean;
}

export class TransicionDto {
  @ApiProperty() @IsUUID() estadoOrigenId!: string;
  @ApiProperty() @IsUUID() estadoDestinoId!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() permiteAgente?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() permiteCliente?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notificar?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() orden?: number;
}

export class CreateEstadoFlowDto {
  @ApiProperty() @IsUUID() tipoTareaId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() estadoInicialId?: string;
  @ApiProperty({ type: [EstadoPermitidoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EstadoPermitidoDto)
  estadosPermitidos!: EstadoPermitidoDto[];
  @ApiProperty({ type: [TransicionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransicionDto)
  transiciones!: TransicionDto[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}

export class UpdateEstadoFlowDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() estadoInicialId?: string;
  @ApiPropertyOptional({ type: [EstadoPermitidoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EstadoPermitidoDto)
  estadosPermitidos?: EstadoPermitidoDto[];
  @ApiPropertyOptional({ type: [TransicionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransicionDto)
  transiciones?: TransicionDto[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() activo?: boolean;
}
