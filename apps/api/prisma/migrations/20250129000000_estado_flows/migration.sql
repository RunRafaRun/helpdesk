-- CreateTable
CREATE TABLE "TipoTareaEstadoFlow" (
    "id" UUID NOT NULL,
    "tipoTareaId" UUID NOT NULL,
    "estadoInicialId" UUID,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoTareaEstadoFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTareaEstado" (
    "id" UUID NOT NULL,
    "flowId" UUID NOT NULL,
    "estadoId" UUID NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "visibleCliente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoTareaEstado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTareaTransicion" (
    "id" UUID NOT NULL,
    "flowId" UUID NOT NULL,
    "estadoOrigenId" UUID NOT NULL,
    "estadoDestinoId" UUID NOT NULL,
    "permiteAgente" BOOLEAN NOT NULL DEFAULT true,
    "permiteCliente" BOOLEAN NOT NULL DEFAULT false,
    "notificar" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TipoTareaTransicion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoTareaEstadoFlow_tipoTareaId_key" ON "TipoTareaEstadoFlow"("tipoTareaId");

-- CreateIndex
CREATE INDEX "TipoTareaEstado_flowId_idx" ON "TipoTareaEstado"("flowId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTareaEstado_flowId_estadoId_key" ON "TipoTareaEstado"("flowId", "estadoId");

-- CreateIndex
CREATE INDEX "TipoTareaTransicion_flowId_estadoOrigenId_idx" ON "TipoTareaTransicion"("flowId", "estadoOrigenId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTareaTransicion_flowId_estadoOrigenId_estadoDestinoId_key" ON "TipoTareaTransicion"("flowId", "estadoOrigenId", "estadoDestinoId");

-- AddForeignKey
ALTER TABLE "TipoTareaEstadoFlow" ADD CONSTRAINT "TipoTareaEstadoFlow_tipoTareaId_fkey" FOREIGN KEY ("tipoTareaId") REFERENCES "TipoTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaEstadoFlow" ADD CONSTRAINT "TipoTareaEstadoFlow_estadoInicialId_fkey" FOREIGN KEY ("estadoInicialId") REFERENCES "EstadoTarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaEstado" ADD CONSTRAINT "TipoTareaEstado_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "TipoTareaEstadoFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaEstado" ADD CONSTRAINT "TipoTareaEstado_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "EstadoTarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaTransicion" ADD CONSTRAINT "TipoTareaTransicion_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "TipoTareaEstadoFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaTransicion" ADD CONSTRAINT "TipoTareaTransicion_estadoOrigenId_fkey" FOREIGN KEY ("estadoOrigenId") REFERENCES "EstadoTarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaTransicion" ADD CONSTRAINT "TipoTareaTransicion_estadoDestinoId_fkey" FOREIGN KEY ("estadoDestinoId") REFERENCES "EstadoTarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
