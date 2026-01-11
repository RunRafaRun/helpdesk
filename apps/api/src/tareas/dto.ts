import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CrearTareaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @ApiProperty({ description: "Código de cliente (ej. DEMO)" })
  @IsString()
  @IsNotEmpty()
  clienteCodigo!: string;

  @ApiProperty({ description: "Código unidad comercial (HOTEL/CENTRAL/TODOS). Ej: CENTRAL" })
  @IsString()
  @IsNotEmpty()
  unidadComercialCodigo!: string;

  @ApiProperty({ description: "Mensaje inicial del cliente (obligatorio)" })
  @IsString()
  @IsNotEmpty()
  mensajeInicial!: string;

  @ApiPropertyOptional({ description: "Código de módulo (ej. AVA-REQUESTS_INCIDENTS)" })
  @IsOptional()
  @IsString()
  moduloCodigo?: string;

  @ApiPropertyOptional({ description: "Tipo tarea. Por defecto SIN_CLASIFICAR" })
  @IsOptional()
  @IsString()
  tipoCodigo?: string;

  @ApiPropertyOptional({ description: "Prioridad. Por defecto NORMAL" })
  @IsOptional()
  @IsString()
  prioridadCodigo?: string;

  @ApiPropertyOptional({ description: "Canal (WEB/EMAIL/OTRS/API...)" })
  @IsOptional()
  @IsString()
  canal?: string;
}

export class CrearComentarioDto {
  @ApiProperty({ description: "Tipo: MENSAJE_CLIENTE | RESPUESTA_AGENTE | NOTA_INTERNA" })
  @IsString()
  @IsIn(["MENSAJE_CLIENTE", "RESPUESTA_AGENTE", "NOTA_INTERNA"])
  tipo!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cuerpo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  canal?: string;

  @ApiPropertyOptional({ description: "Visible para cliente (solo aplica a RESPUESTA_AGENTE)" })
  @IsOptional()
  @IsBoolean()
  visibleParaCliente?: boolean;
}
