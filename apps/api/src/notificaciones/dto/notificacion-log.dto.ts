import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { EstadoNotificacion, EventoTipo } from "@prisma/client";

export class ListNotificacionLogDto {
  @ApiProperty({ required: false, enum: EstadoNotificacion })
  @IsEnum(EstadoNotificacion)
  @IsOptional()
  estado?: EstadoNotificacion;

  @ApiProperty({ required: false, enum: EventoTipo })
  @IsEnum(EventoTipo)
  @IsOptional()
  eventoTipo?: EventoTipo;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  tareaId?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  fechaHasta?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  limit?: number;
}

export class UpdateNotificacionConfigDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  habilitado?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  notificarCliente?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  notificarAgente?: boolean;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  plantillaId?: string | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  asuntoDefault?: string;
}
