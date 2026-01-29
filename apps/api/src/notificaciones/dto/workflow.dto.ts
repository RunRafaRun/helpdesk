import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  WorkflowTrigger,
  WorkflowConditionField,
  WorkflowConditionOperator,
  WorkflowRecipientType,
  WorkflowActionType,
} from "@prisma/client";

// ============================================================================
// Condition DTO
// ============================================================================
export class WorkflowConditionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: WorkflowConditionField })
  @IsEnum(WorkflowConditionField)
  field!: WorkflowConditionField;

  @ApiProperty({ enum: WorkflowConditionOperator })
  @IsEnum(WorkflowConditionOperator)
  operator!: WorkflowConditionOperator;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orGroup?: number;
}

// ============================================================================
// Recipient DTO
// ============================================================================
export class WorkflowRecipientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: WorkflowRecipientType })
  @IsEnum(WorkflowRecipientType)
  recipientType!: WorkflowRecipientType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCc?: boolean;
}

// ============================================================================
// Action DTO
// ============================================================================
export class WorkflowActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: WorkflowActionType })
  @IsEnum(WorkflowActionType)
  actionType!: WorkflowActionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orden?: number;
}

// ============================================================================
// Create Workflow DTO
// ============================================================================
export class CreateWorkflowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ enum: WorkflowTrigger })
  @IsEnum(WorkflowTrigger)
  trigger!: WorkflowTrigger;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orden?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stopOnMatch?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  plantillaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  asuntoCustom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ccJefeProyecto1?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ccJefeProyecto2?: boolean;

  @ApiPropertyOptional({ type: [WorkflowConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowConditionDto)
  conditions?: WorkflowConditionDto[];

  @ApiPropertyOptional({ type: [WorkflowRecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowRecipientDto)
  recipients?: WorkflowRecipientDto[];

  @ApiPropertyOptional({ type: [WorkflowActionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionDto)
  actions?: WorkflowActionDto[];
}

// ============================================================================
// Update Workflow DTO
// ============================================================================
export class UpdateWorkflowDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ enum: WorkflowTrigger })
  @IsOptional()
  @IsEnum(WorkflowTrigger)
  trigger?: WorkflowTrigger;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  orden?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stopOnMatch?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  plantillaId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  asuntoCustom?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ccJefeProyecto1?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ccJefeProyecto2?: boolean;

  @ApiPropertyOptional({ type: [WorkflowConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowConditionDto)
  conditions?: WorkflowConditionDto[];

  @ApiPropertyOptional({ type: [WorkflowRecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowRecipientDto)
  recipients?: WorkflowRecipientDto[];

  @ApiPropertyOptional({ type: [WorkflowActionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowActionDto)
  actions?: WorkflowActionDto[];
}

// ============================================================================
// Response Types
// ============================================================================
export interface WorkflowListItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  trigger: WorkflowTrigger;
  activo: boolean;
  orden: number;
  stopOnMatch: boolean;
  conditionsCount: number;
  recipientsCount: number;
  actionsCount: number;
  plantilla?: { id: string; codigo: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowDetail {
  id: string;
  nombre: string;
  descripcion?: string | null;
  trigger: WorkflowTrigger;
  activo: boolean;
  orden: number;
  stopOnMatch: boolean;
  plantillaId?: string | null;
  asuntoCustom?: string | null;
  ccJefeProyecto1: boolean;
  ccJefeProyecto2: boolean;
  plantilla?: { id: string; codigo: string; descripcion?: string | null } | null;
  conditions: {
    id: string;
    field: WorkflowConditionField;
    operator: WorkflowConditionOperator;
    value?: string | null;
    orGroup: number;
  }[];
  recipients: {
    id: string;
    recipientType: WorkflowRecipientType;
    value?: string | null;
    isCc: boolean;
  }[];
  actions: {
    id: string;
    actionType: WorkflowActionType;
    value?: string | null;
    orden: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Trigger and condition labels for UI
// ============================================================================
export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
  TAREA_CREADA: "Tarea creada",
  TAREA_MODIFICADA: "Tarea modificada",
  TAREA_CERRADA: "Tarea cerrada",
  MENSAJE_CLIENTE: "Mensaje del cliente",
  RESPUESTA_AGENTE: "Respuesta del agente",
  NOTA_INTERNA: "Nota interna",
  CAMBIO_ESTADO: "Cambio de estado",
  CAMBIO_ASIGNACION: "Cambio de asignacion",
  CAMBIO_PRIORIDAD: "Cambio de prioridad",
  CAMBIO_TIPO: "Cambio de tipo",
  CAMBIO_MODULO: "Cambio de modulo",
  CAMBIO_RELEASE: "Cambio de release/hotfix",
  CAMBIO_ESTADO_PETICION: "Cambio de estado peticion",
};

export const CONDITION_FIELD_LABELS: Record<WorkflowConditionField, string> = {
  CLIENTE_ID: "Cliente",
  CLIENTE_CODIGO: "Codigo de cliente",
  ESTADO_ID: "Estado",
  ESTADO_CODIGO: "Codigo de estado",
  TIPO_ID: "Tipo de tarea",
  TIPO_CODIGO: "Codigo de tipo",
  PRIORIDAD_ID: "Prioridad",
  PRIORIDAD_CODIGO: "Codigo de prioridad",
  MODULO_ID: "Modulo",
  MODULO_CODIGO: "Codigo de modulo",
  RELEASE_ID: "Release",
  RELEASE_CODIGO: "Codigo de release",
  RELEASE_RAMA: "Rama de release",
  HOTFIX_ID: "Hotfix",
  ASIGNADO_A_ID: "Agente asignado",
  CREADO_POR_AGENTE_ID: "Creado por agente",
  CREADO_POR_CLIENTE_ID: "Creado por usuario cliente",
  UNIDAD_COMERCIAL_ID: "Unidad comercial",
  UNIDAD_COMERCIAL_SCOPE: "Ambito unidad comercial",
  REPRODUCIDO: "Bug reproducido",
  ESTADO_ANTERIOR_ID: "Estado anterior",
  ESTADO_NUEVO_ID: "Estado nuevo",
  PRIORIDAD_ANTERIOR_ID: "Prioridad anterior",
  PRIORIDAD_NUEVA_ID: "Prioridad nueva",
  TIPO_ANTERIOR_ID: "Tipo anterior",
  TIPO_NUEVO_ID: "Tipo nuevo",
  MODULO_ANTERIOR_ID: "Modulo anterior",
  MODULO_NUEVO_ID: "Modulo nuevo",
  RELEASE_ANTERIOR_ID: "Release anterior",
  RELEASE_NUEVO_ID: "Release nuevo",
  ESTADO_PETICION_ID: "Estado peticion",
  ESTADO_PETICION_CODIGO: "Codigo estado peticion",
  ESTADO_PETICION_ANTERIOR_ID: "Estado peticion anterior",
  ESTADO_PETICION_NUEVO_ID: "Estado peticion nuevo",
  ESTADO_PETICION_ANTERIOR_CODIGO: "Codigo estado peticion anterior",
  ESTADO_PETICION_NUEVO_CODIGO: "Codigo estado peticion nuevo",
};

export const CONDITION_OPERATOR_LABELS: Record<WorkflowConditionOperator, string> = {
  EQUALS: "es igual a",
  NOT_EQUALS: "no es igual a",
  IN: "esta en",
  NOT_IN: "no esta en",
  IS_NULL: "esta vacio",
  IS_NOT_NULL: "tiene valor",
  CONTAINS: "contiene",
  STARTS_WITH: "empieza con",
};

export const RECIPIENT_TYPE_LABELS: Record<WorkflowRecipientType, string> = {
  USUARIOS_CLIENTE: "Usuarios del cliente",
  USUARIO_CLIENTE_CREADOR: "Usuario cliente creador",
  JEFE_PROYECTO_1: "Jefe de Proyecto 1",
  JEFE_PROYECTO_2: "Jefe de Proyecto 2",
  AGENTE_ASIGNADO: "Agente asignado",
  AGENTE_CREADOR: "Agente creador",
  AGENTE_REVISOR: "Agente revisor",
  AGENTES_ESPECIFICOS: "Agentes especificos",
  ROLES_ESPECIFICOS: "Roles especificos",
  EMAILS_MANUALES: "Emails manuales",
};

export const ACTION_TYPE_LABELS: Record<WorkflowActionType, string> = {
  CAMBIAR_ESTADO: "Cambiar estado",
  CAMBIAR_PRIORIDAD: "Cambiar prioridad",
  CAMBIAR_TIPO: "Cambiar tipo",
  ASIGNAR_AGENTE: "Asignar agente",
  CAMBIAR_MODULO: "Cambiar modulo",
  CAMBIAR_RELEASE: "Cambiar release",
};
