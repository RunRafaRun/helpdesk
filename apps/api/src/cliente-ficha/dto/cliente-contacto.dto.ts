import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClienteContactoDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({ required: false, maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  cargo?: string;

  @ApiProperty({ required: false, maxLength: 200 })
  @IsEmail()
  @IsOptional()
  @MaxLength(200)
  email?: string;

  @ApiProperty({ required: false, maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  movil?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  principal?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notas?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdateClienteContactoDto extends PartialType(CreateClienteContactoDto) {}
