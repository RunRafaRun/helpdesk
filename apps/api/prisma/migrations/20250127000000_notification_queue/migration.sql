-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('EMAIL', 'APP');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('PENDIENTE', 'PROCESANDO', 'ENVIADO', 'ERROR', 'CANCELADO');

-- CreateTable
CREATE TABLE "NotificacionConfigEvento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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

-- CreateIndex
CREATE UNIQUE INDEX "NotificacionConfigEvento_eventoTipo_key" ON "NotificacionConfigEvento"("eventoTipo");

-- CreateIndex
CREATE INDEX "NotificacionTarea_estado_nextRetryAt_idx" ON "NotificacionTarea"("estado", "nextRetryAt");

-- CreateIndex
CREATE INDEX "NotificacionTarea_tareaId_idx" ON "NotificacionTarea"("tareaId");

-- CreateIndex
CREATE INDEX "NotificacionTarea_createdAt_idx" ON "NotificacionTarea"("createdAt");

-- AddForeignKey
ALTER TABLE "NotificacionConfigEvento" ADD CONSTRAINT "NotificacionConfigEvento_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "Plantilla"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionTarea" ADD CONSTRAINT "NotificacionTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionTarea" ADD CONSTRAINT "NotificacionTarea_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "TareaEvento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
