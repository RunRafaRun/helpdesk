import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, IsUUID } from "class-validator";
import { Type } from "class-transformer";

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

  @ApiPropertyOptional({ description: "Estado. Por defecto usa el estado marcado como porDefecto" })
  @IsOptional()
  @IsString()
  estadoCodigo?: string;

  @ApiPropertyOptional({ description: "ID del Release (UUID)" })
  @IsOptional()
  @IsUUID()
  releaseId?: string;

  @ApiPropertyOptional({ description: "ID del Hotfix (UUID)" })
  @IsOptional()
  @IsUUID()
  hotfixId?: string;

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

  @ApiPropertyOptional({ description: "ID del evento/comentario al que se responde (para tracking de relaciones)" })
  @IsOptional()
  @IsUUID()
  relatedToId?: string;
}

export class ListarTareasDto {
  @ApiPropertyOptional({ description: "Filtrar por ID de cliente" })
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional({ description: "Filtrar por ID de estado" })
  @IsOptional()
  @IsString()
  estadoId?: string;

  @ApiPropertyOptional({ description: "Filtrar por ID de prioridad" })
  @IsOptional()
  @IsString()
  prioridadId?: string;

  @ApiPropertyOptional({ description: "Filtrar por ID de tipo" })
  @IsOptional()
  @IsString()
  tipoId?: string;

  @ApiPropertyOptional({ description: "Filtrar por ID de agente asignado" })
  @IsOptional()
  @IsString()
  asignadoAId?: string;

  @ApiPropertyOptional({ description: "Filtrar por ID de módulo" })
  @IsOptional()
  @IsString()
  moduloId?: string;

  @ApiPropertyOptional({ description: "Buscar por título" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Número de página (desde 1)", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Cantidad de resultados por página", default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class ActualizarTareaDto {
  @ApiPropertyOptional({ description: "Nuevo título" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @ApiPropertyOptional({ description: "ID del nuevo estado" })
  @IsOptional()
  @IsString()
  estadoId?: string;

  @ApiPropertyOptional({ description: "ID de la nueva prioridad" })
  @IsOptional()
  @IsString()
  prioridadId?: string;

  @ApiPropertyOptional({ description: "ID del nuevo tipo" })
  @IsOptional()
  @IsString()
  tipoId?: string;

  @ApiPropertyOptional({ description: "ID del nuevo módulo" })
  @IsOptional()
  @IsString()
  moduloId?: string;

  @ApiPropertyOptional({ description: "ID del release" })
  @IsOptional()
  @IsString()
  releaseId?: string;

  @ApiPropertyOptional({ description: "ID del hotfix" })
  @IsOptional()
  @IsString()
  hotfixId?: string;

  @ApiPropertyOptional({ description: "ID del estado de petición (secondary status)" })
  @IsOptional()
  @IsString()
  estadoPeticionId?: string;

  @ApiPropertyOptional({ description: "Indica si se ha reproducido el problema" })
  @IsOptional()
  @IsBoolean()
  reproducido?: boolean;
}

export class AsignarTareaDto {
  @ApiProperty({ description: "ID del agente a asignar" })
  @IsString()
  @IsNotEmpty()
  agenteId!: string;
}

export class ActualizarComentarioDto {
  @ApiProperty({ description: "Nuevo contenido del comentario" })
  @IsString()
  @IsNotEmpty()
  cuerpo!: string;
}

export class BuscarTextoDto {
  @ApiProperty({ description: "Texto a buscar en comentarios y títulos de tareas" })
  @IsString()
  @IsNotEmpty()
  texto!: string;

  @ApiPropertyOptional({ description: "Cantidad de resultados a devolver", default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class BuscarPorNumeroDto {
  @ApiProperty({ description: "Número de tarea (formato yyyyNNNNN, ej: 202512345)" })
  @IsString()
  @IsNotEmpty()
  numero!: string;
}

export class BuscarPorPatronDto {
  @ApiProperty({ description: "Patrón de búsqueda con wildcard *, ej: *2492, 2025*, *123*" })
  @IsString()
  @IsNotEmpty()
  patron!: string;

  @ApiPropertyOptional({ description: "Cantidad de resultados a devolver", default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
