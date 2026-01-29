-- CreateTable
CREATE TABLE "TipoTareaEstadoPeticionFlow" (
    "id" UUID NOT NULL,
    "tipoTareaId" UUID NOT NULL,
    "estadoInicialId" UUID,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoTareaEstadoPeticionFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTareaEstadoPeticion" (
    "id" UUID NOT NULL,
    "flowId" UUID NOT NULL,
    "estadoId" UUID NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "visibleCliente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TipoTareaEstadoPeticion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoTareaTransicionPeticion" (
    "id" UUID NOT NULL,
    "flowId" UUID NOT NULL,
    "estadoOrigenId" UUID NOT NULL,
    "estadoDestinoId" UUID NOT NULL,
    "permiteAgente" BOOLEAN NOT NULL DEFAULT true,
    "permiteCliente" BOOLEAN NOT NULL DEFAULT false,
    "notificar" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TipoTareaTransicionPeticion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoTareaEstadoPeticionFlow_tipoTareaId_key" ON "TipoTareaEstadoPeticionFlow"("tipoTareaId");

-- CreateIndex
CREATE INDEX "TipoTareaEstadoPeticion_flowId_idx" ON "TipoTareaEstadoPeticion"("flowId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTareaEstadoPeticion_flowId_estadoId_key" ON "TipoTareaEstadoPeticion"("flowId", "estadoId");

-- CreateIndex
CREATE INDEX "TipoTareaTransicionPeticion_flowId_estadoOrigenId_idx" ON "TipoTareaTransicionPeticion"("flowId", "estadoOrigenId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoTareaTransicionPeticion_flowId_estadoOrigenId_estadoDestinoId_key" ON "TipoTareaTransicionPeticion"("flowId", "estadoOrigenId", "estadoDestinoId");

-- AddForeignKey
ALTER TABLE "TipoTareaEstadoPeticionFlow" ADD CONSTRAINT "TipoTareaEstadoPeticionFlow_tipoTareaId_fkey" FOREIGN KEY ("tipoTareaId") REFERENCES "TipoTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaEstadoPeticionFlow" ADD CONSTRAINT "TipoTareaEstadoPeticionFlow_estadoInicialId_fkey" FOREIGN KEY ("estadoInicialId") REFERENCES "EstadoPeticion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaEstadoPeticion" ADD CONSTRAINT "TipoTareaEstadoPeticion_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "TipoTareaEstadoPeticionFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaEstadoPeticion" ADD CONSTRAINT "TipoTareaEstadoPeticion_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "EstadoPeticion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaTransicionPeticion" ADD CONSTRAINT "TipoTareaTransicionPeticion_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "TipoTareaEstadoPeticionFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaTransicionPeticion" ADD CONSTRAINT "TipoTareaTransicionPeticion_estadoOrigenId_fkey" FOREIGN KEY ("estadoOrigenId") REFERENCES "EstadoPeticion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoTareaTransicionPeticion" ADD CONSTRAINT "TipoTareaTransicionPeticion_estadoDestinoId_fkey" FOREIGN KEY ("estadoDestinoId") REFERENCES "EstadoPeticion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
