-- Add missing fields to EstadoPeticion table
ALTER TABLE "EstadoPeticion" ADD COLUMN IF NOT EXISTS "orden" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EstadoPeticion" ADD COLUMN IF NOT EXISTS "porDefecto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EstadoPeticion" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT true;

-- Add tablaRelacionada field to TipoTarea
ALTER TABLE "TipoTarea" ADD COLUMN IF NOT EXISTS "tablaRelacionada" VARCHAR(50);
