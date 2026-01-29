-- CreateEnum
CREATE TYPE "WorkflowActionType" AS ENUM ('CAMBIAR_ESTADO', 'CAMBIAR_PRIORIDAD', 'CAMBIAR_TIPO', 'ASIGNAR_AGENTE', 'CAMBIAR_MODULO', 'CAMBIAR_RELEASE');

-- CreateTable
CREATE TABLE "NotificationWorkflowAction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflowId" UUID NOT NULL,
    "actionType" "WorkflowActionType" NOT NULL,
    "value" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NotificationWorkflowAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationWorkflowAction_workflowId_idx" ON "NotificationWorkflowAction"("workflowId");

-- AddForeignKey
ALTER TABLE "NotificationWorkflowAction" ADD CONSTRAINT "NotificationWorkflowAction_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "NotificationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new condition fields to enum
ALTER TYPE "WorkflowConditionField" ADD VALUE 'TIPO_ANTERIOR_ID';
ALTER TYPE "WorkflowConditionField" ADD VALUE 'TIPO_NUEVO_ID';
ALTER TYPE "WorkflowConditionField" ADD VALUE 'MODULO_ANTERIOR_ID';
ALTER TYPE "WorkflowConditionField" ADD VALUE 'MODULO_NUEVO_ID';
ALTER TYPE "WorkflowConditionField" ADD VALUE 'RELEASE_ANTERIOR_ID';
ALTER TYPE "WorkflowConditionField" ADD VALUE 'RELEASE_NUEVO_ID';
