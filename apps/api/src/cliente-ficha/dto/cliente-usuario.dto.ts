import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty, IsBoolean, IsArray, IsUUID, IsEmail } from 'class-validator';

export class CreateClienteUsuarioDto {
  @ApiProperty({ description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Usuario para login (único)' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Contraseña' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ required: false, description: 'Email del usuario' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, description: 'Teléfono del usuario' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono?: string;

  @ApiProperty({ required: false, description: 'Tipo de usuario (ej: Administrador, Técnico, etc.)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  tipo?: string;

  @ApiProperty({ default: true, description: 'Si el usuario está activo' })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiProperty({ default: false, description: 'Si es el usuario principal (recibe todas las notificaciones)' })
  @IsBoolean()
  @IsOptional()
  principal?: boolean;

  @ApiProperty({ default: true, description: 'Si recibe notificaciones' })
  @IsBoolean()
  @IsOptional()
  recibeNotificaciones?: boolean;

  @ApiProperty({ required: false, type: [String], description: 'IDs de los módulos para los que recibe notificaciones' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  moduloIds?: string[];
}

export class UpdateClienteUsuarioDto extends PartialType(CreateClienteUsuarioDto) {
  @ApiProperty({ required: false, description: 'Nueva contraseña (dejar vacío para no cambiar)' })
  @IsString()
  @IsOptional()
  password?: string;
}

export class SetClienteUsuarioModulosDto {
  @ApiProperty({ type: [String], description: 'IDs de los módulos para los que recibe notificaciones' })
  @IsArray()
  @IsUUID('4', { each: true })
  moduloIds: string[];
}
