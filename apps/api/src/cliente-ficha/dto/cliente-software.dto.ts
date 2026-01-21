import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ClienteSoftwareTipo } from '@prisma/client';

export class CreateClienteSoftwareDto {
  @ApiProperty({ enum: ClienteSoftwareTipo })
  @IsEnum(ClienteSoftwareTipo)
  tipo: ClienteSoftwareTipo;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ required: false, maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  version?: string;

  @ApiProperty({ required: false, description: 'ID del Módulo' })
  @IsUUID()
  @IsOptional()
  moduloId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdateClienteSoftwareDto extends PartialType(CreateClienteSoftwareDto) {}
