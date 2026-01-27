import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { MailModule } from "../mail/mail.module";
import { AuthModule } from "../auth/auth.module";
import { NotificacionTareaService } from "./notificacion-tarea.service";
import { NotificationQueueService } from "./notification-queue.service";
import { WorkflowEvaluationService } from "./workflow-evaluation.service";

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  providers: [
    WorkflowEvaluationService,
    NotificacionTareaService,
    NotificationQueueService,
  ],
  controllers: [], // Controllers are in AdminModule
  exports: [NotificacionTareaService, NotificationQueueService, WorkflowEvaluationService],
})
export class NotificacionesModule {}
