import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CrearClienteDto {
  @ApiProperty() @IsString() @IsNotEmpty() codigo!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;

  // Opcionales (para alinearse con el controlador y el modelo)
  @ApiPropertyOptional() @IsOptional() @IsString() logotipo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jefeProyecto1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jefeProyecto2?: string;
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
