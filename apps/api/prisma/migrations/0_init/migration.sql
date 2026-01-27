-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgenteRole" AS ENUM ('ADMIN', 'AGENTE');

-- CreateEnum
CREATE TYPE "ActorTipo" AS ENUM ('AGENTE', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EventoTipo" AS ENUM ('MENSAJE_CLIENTE', 'RESPUESTA_AGENTE', 'NOTA_INTERNA', 'CAMBIO_ESTADO', 'ASIGNACION', 'CAMBIO_PRIORIDAD', 'CAMBIO_TIPO', 'CAMBIO_MODULO', 'CAMBIO_RELEASE_HOTFIX', 'SISTEMA');

-- CreateEnum
CREATE TYPE "LicenciaTipo" AS ENUM ('AAM', 'PPU');

-- CreateEnum
CREATE TYPE "UnidadComercialScope" AS ENUM ('HOTEL', 'CENTRAL', 'TODOS');

-- CreateEnum
CREATE TYPE "PermisoCodigo" AS ENUM ('CONFIG_GENERAL', 'CONFIG_MAESTROS', 'CONFIG_AGENTES', 'CONFIG_CLIENTES', 'CONFIG_CLIENTES_READ', 'CONFIG_UNIDADES', 'CONFIG_MODULOS', 'CONFIG_RELEASES', 'CONFIG_RBAC', 'CONFIG_NOTIFICACIONES');

-- CreateEnum
CREATE TYPE "ClienteSoftwareTipo" AS ENUM ('PMS', 'ERP', 'PERIFERIA', 'OTROS', 'GP', 'PM', 'PLATAFORMA', 'OTRO');

-- CreateEnum
CREATE TYPE "ClienteReleaseEstado" AS ENUM ('PLANIFICADO', 'EN_CURSO', 'INSTALADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoSeguridad" AS ENUM ('NINGUNO', 'TLS', 'SSL', 'AZURE');

-- CreateEnum
CREATE TYPE "RamaTipo" AS ENUM ('DESARROLLO', 'PRODUCCION');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('EMAIL', 'APP');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('PENDIENTE', 'PROCESANDO', 'ENVIADO', 'ERROR', 'CANCELADO');

-- CreateEnum
CREATE TYPE "WorkflowTrigger" AS ENUM ('TAREA_CREADA', 'TAREA_MODIFICADA', 'TAREA_CERRADA', 'MENSAJE_CLIENTE', 'RESPUESTA_AGENTE', 'NOTA_INTERNA', 'CAMBIO_ESTADO', 'CAMBIO_ASIGNACION', 'CAMBIO_PRIORIDAD', 'CAMBIO_TIPO', 'CAMBIO_MODULO', 'CAMBIO_RELEASE');

-- CreateEnum
CREATE TYPE "WorkflowConditionField" AS ENUM ('CLIENTE_ID', 'CLIENTE_CODIGO', 'ESTADO_ID', 'ESTADO_CODIGO', 'TIPO_ID', 'TIPO_CODIGO', 'PRIORIDAD_ID', 'PRIORIDAD_CODIGO', 'MODULO_ID', 'MODULO_CODIGO', 'RELEASE_ID', 'RELEASE_CODIGO', 'RELEASE_RAMA', 'HOTFIX_ID', 'ASIGNADO_A_ID', 'CREADO_POR_AGENTE_ID', 'CREADO_POR_CLIENTE_ID', 'UNIDAD_COMERCIAL_ID', 'UNIDAD_COMERCIAL_SCOPE', 'REPRODUCIDO', 'ESTADO_ANTERIOR_ID', 'ESTADO_NUEVO_ID', 'PRIORIDAD_ANTERIOR_ID', 'PRIORIDAD_NUEVA_ID');

-- CreateEnum
CREATE TYPE "WorkflowConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL', 'CONTAINS', 'STARTS_WITH');

-- CreateEnum
CREATE TYPE "WorkflowRecipientType" AS ENUM ('USUARIOS_CLIENTE', 'USUARIO_CLIENTE_CREADOR', 'JEFE_PROYECTO_1', 'JEFE_PROYECTO_2', 'AGENTE_ASIGNADO', 'AGENTE_CREADOR', 'AGENTE_REVISOR', 'AGENTES_ESPECIFICOS', 'ROLES_ESPECIFICOS', 'EMAILS_MANUALES');

-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agente" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" VARCHAR(50) NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "role" "AgenteRole" NOT NULL DEFAULT 'AGENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "logotipo" TEXT,
    "jefeProyecto1" VARCHAR(50),
    "jefeProyecto2" VARCHAR(50),
    "licenciaTipo" "LicenciaTipo",
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadComercial" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "scope" "UnidadComercialScope" NOT NULL DEFAULT 'HOTEL',
    "clienteId" UUID NOT NULL,

    CONSTRAINT "UnidadComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_cliente" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "tipo" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" UUID NOT NULL,
    "recibeNotificaciones" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTarea" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "porDefecto" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstadoTarea" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "porDefecto" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EstadoTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrioridadTarea" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "porDefecto" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PrioridadTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstadoPeticion" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "EstadoPeticion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "rama" "RamaTipo" NOT NULL DEFAULT 'DESARROLLO',

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotfix" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "rama" "RamaTipo" NOT NULL DEFAULT 'DESARROLLO',
    "releaseId" UUID NOT NULL,

    CONSTRAINT "Hotfix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" UUID NOT NULL,
    "numero" VARCHAR(15) NOT NULL,
    "titulo" TEXT NOT NULL,
    "clienteId" UUID NOT NULL,
    "unidadComercialId" UUID NOT NULL,
    "tipoId" UUID NOT NULL,
    "estadoId" UUID,
    "prioridadId" UUID NOT NULL,
    "moduloId" UUID,
    "releaseId" UUID,
    "hotfixId" UUID,
    "reproducido" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorAgenteId" UUID,
    "creadoPorClienteId" UUID,
    "asignadoAId" UUID,
    "revisadoPorId" UUID,
    "estadoPeticionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TareaEvento" (
    "id" UUID NOT NULL,
    "tareaId" UUID NOT NULL,
    "tipo" "EventoTipo" NOT NULL,
    "canal" VARCHAR(50),
    "asunto" TEXT,
    "cuerpo" TEXT,
    "payload" JSONB,
    "actorTipo" "ActorTipo" NOT NULL,
    "creadoPorAgenteId" UUID,
    "creadoPorClienteId" UUID,
    "visibleEnTimeline" BOOLEAN NOT NULL DEFAULT true,
    "visibleParaCliente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TareaEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_cliente_modulo" (
    "id" UUID NOT NULL,
    "clienteUsuarioId" UUID NOT NULL,
    "moduloId" UUID NOT NULL,

    CONSTRAINT "usuario_cliente_modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleEntity" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "codigo" "PermisoCodigo" NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "AgenteRoleAssignment" (
    "agenteId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "AgenteRoleAssignment_pkey" PRIMARY KEY ("agenteId","roleId")
);

-- CreateTable
CREATE TABLE "ClienteSoftware" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "tipo" "ClienteSoftwareTipo" NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "version" VARCHAR(100),
    "moduloId" UUID,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteSoftware_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteContacto" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "cargo" VARCHAR(150),
    "email" VARCHAR(200),
    "movil" VARCHAR(50),
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteContacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteConexion" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "endpoint" VARCHAR(500),
    "usuario" VARCHAR(150),
    "secretRef" VARCHAR(500),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteConexion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteComentario" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "agenteId" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClienteComentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteCentroTrabajo" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "nombre" VARCHAR(250) NOT NULL,
    "baseDatos" VARCHAR(250),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteCentroTrabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteReleasePlan" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "releaseId" UUID NOT NULL,
    "hotfixId" UUID,
    "fechaPrevista" TIMESTAMP(3),
    "fechaInstalada" TIMESTAMP(3),
    "estado" "ClienteReleaseEstado" NOT NULL DEFAULT 'PLANIFICADO',
    "agenteId" UUID,
    "detalle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteReleasePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionMail" (
    "id" UUID NOT NULL,
    "tipoSeguridad" "TipoSeguridad" NOT NULL DEFAULT 'NINGUNO',
    "urlServidor" VARCHAR(500),
    "puerto" INTEGER,
    "cuentaMail" VARCHAR(200),
    "usuarioMail" VARCHAR(200),
    "passwordMail" TEXT,
    "azureClientId" VARCHAR(200),
    "azureTenantId" VARCHAR(200),
    "azureClientSecret" TEXT,
    "azureAccessToken" TEXT,
    "azureTokenExpiry" TIMESTAMP(3),
    "firmaHtml" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionMail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacionMasiva" (
    "id" UUID NOT NULL,
    "asunto" VARCHAR(500) NOT NULL,
    "cuerpoHtml" TEXT NOT NULL,
    "cuerpoTexto" TEXT,
    "clienteIds" UUID[],
    "emailsManuales" TEXT[],
    "emailsTo" TEXT[],
    "emailsCc" TEXT[],
    "roleCcId" UUID,
    "adjuntos" JSONB,
    "programadoAt" TIMESTAMP(3),
    "enviadoPor" UUID NOT NULL,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    "enviados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "logEnvio" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoAt" TIMESTAMP(3),

    CONSTRAINT "NotificacionMasiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plantilla" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "texto" TEXT NOT NULL,
    "categoria" VARCHAR(50),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacionConfigEvento" (
    "id" UUID NOT NULL,
    "eventoTipo" "EventoTipo" NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "notificarCliente" BOOLEAN NOT NULL DEFAULT true,
    "notificarAgente" BOOLEAN NOT NULL DEFAULT true,
    "plantillaId" UUID,
    "asuntoDefault" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificacionConfigEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacionTarea" (
    "id" UUID NOT NULL,
    "tareaId" UUID NOT NULL,
    "eventoId" UUID,
    "eventoTipo" "EventoTipo" NOT NULL,
    "tipoNotificacion" "TipoNotificacion" NOT NULL DEFAULT 'EMAIL',
    "emailsTo" TEXT[],
    "emailsCc" TEXT[],
    "asunto" VARCHAR(500) NOT NULL,
    "cuerpoHtml" TEXT NOT NULL,
    "cuerpoTexto" TEXT,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "logEnvio" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoAt" TIMESTAMP(3),

    CONSTRAINT "NotificacionTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardConfig" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationWorkflow" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "trigger" "WorkflowTrigger" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "stopOnMatch" BOOLEAN NOT NULL DEFAULT false,
    "plantillaId" UUID,
    "asuntoCustom" VARCHAR(500),
    "ccJefeProyecto1" BOOLEAN NOT NULL DEFAULT false,
    "ccJefeProyecto2" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationWorkflowCondition" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "field" "WorkflowConditionField" NOT NULL,
    "operator" "WorkflowConditionOperator" NOT NULL,
    "value" TEXT,
    "orGroup" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NotificationWorkflowCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationWorkflowRecipient" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "recipientType" "WorkflowRecipientType" NOT NULL,
    "value" TEXT,
    "isCc" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationWorkflowRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteConfig_key_key" ON "SiteConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Agente_usuario_key" ON "Agente"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_codigo_key" ON "Cliente"("codigo");

-- CreateIndex
CREATE INDEX "UnidadComercial_clienteId_scope_idx" ON "UnidadComercial"("clienteId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "uq_unidadcomercial_cliente_codigo" ON "UnidadComercial"("clienteId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cliente_usuario_key" ON "usuario_cliente"("usuario");

-- CreateIndex
CREATE INDEX "usuario_cliente_clienteId_idx" ON "usuario_cliente"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTarea_codigo_key" ON "TipoTarea"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "EstadoTarea_codigo_key" ON "EstadoTarea"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "PrioridadTarea_codigo_key" ON "PrioridadTarea"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "EstadoPeticion_codigo_key" ON "EstadoPeticion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_codigo_key" ON "Modulo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Release_codigo_key" ON "Release"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Hotfix_releaseId_codigo_key" ON "Hotfix"("releaseId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Tarea_numero_key" ON "Tarea"("numero");

-- CreateIndex
CREATE INDEX "Tarea_clienteId_createdAt_idx" ON "Tarea"("clienteId", "createdAt");

-- CreateIndex
CREATE INDEX "Tarea_tipoId_estadoId_idx" ON "Tarea"("tipoId", "estadoId");

-- CreateIndex
CREATE INDEX "Tarea_prioridadId_idx" ON "Tarea"("prioridadId");

-- CreateIndex
CREATE INDEX "Tarea_moduloId_idx" ON "Tarea"("moduloId");

-- CreateIndex
CREATE INDEX "TareaEvento_tareaId_createdAt_idx" ON "TareaEvento"("tareaId", "createdAt");

-- CreateIndex
CREATE INDEX "TareaEvento_visibleEnTimeline_idx" ON "TareaEvento"("visibleEnTimeline");

-- CreateIndex
CREATE INDEX "TareaEvento_visibleParaCliente_idx" ON "TareaEvento"("visibleParaCliente");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_cliente_modulo_clienteUsuarioId_moduloId_key" ON "usuario_cliente_modulo"("clienteUsuarioId", "moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleEntity_codigo_key" ON "RoleEntity"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_codigo_key" ON "Permission"("codigo");

-- CreateIndex
CREATE INDEX "ClienteSoftware_clienteId_idx" ON "ClienteSoftware"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteSoftware_clienteId_tipo_nombre_key" ON "ClienteSoftware"("clienteId", "tipo", "nombre");

-- CreateIndex
CREATE INDEX "ClienteContacto_clienteId_idx" ON "ClienteContacto"("clienteId");

-- CreateIndex
CREATE INDEX "ClienteConexion_clienteId_idx" ON "ClienteConexion"("clienteId");

-- CreateIndex
CREATE INDEX "ClienteComentario_clienteId_idx" ON "ClienteComentario"("clienteId");

-- CreateIndex
CREATE INDEX "ClienteCentroTrabajo_clienteId_idx" ON "ClienteCentroTrabajo"("clienteId");

-- CreateIndex
CREATE INDEX "ClienteReleasePlan_clienteId_idx" ON "ClienteReleasePlan"("clienteId");

-- CreateIndex
CREATE INDEX "NotificacionMasiva_enviadoPor_idx" ON "NotificacionMasiva"("enviadoPor");

-- CreateIndex
CREATE INDEX "NotificacionMasiva_createdAt_idx" ON "NotificacionMasiva"("createdAt");

-- CreateIndex
CREATE INDEX "NotificacionMasiva_estado_programadoAt_idx" ON "NotificacionMasiva"("estado", "programadoAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plantilla_codigo_key" ON "Plantilla"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacionConfigEvento_eventoTipo_key" ON "NotificacionConfigEvento"("eventoTipo");

-- CreateIndex
CREATE INDEX "NotificacionTarea_estado_nextRetryAt_idx" ON "NotificacionTarea"("estado", "nextRetryAt");

-- CreateIndex
CREATE INDEX "NotificacionTarea_tareaId_idx" ON "NotificacionTarea"("tareaId");

-- CreateIndex
CREATE INDEX "NotificacionTarea_createdAt_idx" ON "NotificacionTarea"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_default_dashboard" ON "DashboardConfig"("isDefault");

-- CreateIndex
CREATE INDEX "NotificationWorkflow_trigger_activo_idx" ON "NotificationWorkflow"("trigger", "activo");

-- CreateIndex
CREATE INDEX "NotificationWorkflow_orden_idx" ON "NotificationWorkflow"("orden");

-- CreateIndex
CREATE INDEX "NotificationWorkflowCondition_workflowId_idx" ON "NotificationWorkflowCondition"("workflowId");

-- CreateIndex
CREATE INDEX "NotificationWorkflowRecipient_workflowId_idx" ON "NotificationWorkflowRecipient"("workflowId");

-- AddForeignKey
ALTER TABLE "UnidadComercial" ADD CONSTRAINT "UnidadComercial_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_cliente" ADD CONSTRAINT "usuario_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotfix" ADD CONSTRAINT "Hotfix_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_creadoPorAgenteId_fkey" FOREIGN KEY ("creadoPorAgenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_creadoPorClienteId_fkey" FOREIGN KEY ("creadoPorClienteId") REFERENCES "usuario_cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "EstadoTarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_estadoPeticionId_fkey" FOREIGN KEY ("estadoPeticionId") REFERENCES "EstadoPeticion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_hotfixId_fkey" FOREIGN KEY ("hotfixId") REFERENCES "Hotfix"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_prioridadId_fkey" FOREIGN KEY ("prioridadId") REFERENCES "PrioridadTarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoTarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_unidadComercialId_fkey" FOREIGN KEY ("unidadComercialId") REFERENCES "UnidadComercial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaEvento" ADD CONSTRAINT "TareaEvento_creadoPorAgenteId_fkey" FOREIGN KEY ("creadoPorAgenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaEvento" ADD CONSTRAINT "TareaEvento_creadoPorClienteId_fkey" FOREIGN KEY ("creadoPorClienteId") REFERENCES "usuario_cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaEvento" ADD CONSTRAINT "TareaEvento_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_cliente_modulo" ADD CONSTRAINT "usuario_cliente_modulo_clienteUsuarioId_fkey" FOREIGN KEY ("clienteUsuarioId") REFERENCES "usuario_cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_cliente_modulo" ADD CONSTRAINT "usuario_cliente_modulo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgenteRoleAssignment" ADD CONSTRAINT "AgenteRoleAssignment_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgenteRoleAssignment" ADD CONSTRAINT "AgenteRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteSoftware" ADD CONSTRAINT "ClienteSoftware_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteSoftware" ADD CONSTRAINT "ClienteSoftware_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteContacto" ADD CONSTRAINT "ClienteContacto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteConexion" ADD CONSTRAINT "ClienteConexion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteComentario" ADD CONSTRAINT "ClienteComentario_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteComentario" ADD CONSTRAINT "ClienteComentario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteCentroTrabajo" ADD CONSTRAINT "ClienteCentroTrabajo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteReleasePlan" ADD CONSTRAINT "ClienteReleasePlan_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "Agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteReleasePlan" ADD CONSTRAINT "ClienteReleasePlan_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteReleasePlan" ADD CONSTRAINT "ClienteReleasePlan_hotfixId_fkey" FOREIGN KEY ("hotfixId") REFERENCES "Hotfix"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteReleasePlan" ADD CONSTRAINT "ClienteReleasePlan_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionMasiva" ADD CONSTRAINT "NotificacionMasiva_enviadoPor_fkey" FOREIGN KEY ("enviadoPor") REFERENCES "Agente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionConfigEvento" ADD CONSTRAINT "NotificacionConfigEvento_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "Plantilla"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionTarea" ADD CONSTRAINT "NotificacionTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionTarea" ADD CONSTRAINT "NotificacionTarea_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "TareaEvento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationWorkflow" ADD CONSTRAINT "NotificationWorkflow_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "Plantilla"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationWorkflowCondition" ADD CONSTRAINT "NotificationWorkflowCondition_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "NotificationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationWorkflowRecipient" ADD CONSTRAINT "NotificationWorkflowRecipient_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "NotificationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

