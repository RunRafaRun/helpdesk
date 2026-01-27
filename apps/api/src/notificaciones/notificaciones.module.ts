import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { MailModule } from "../mail/mail.module";
import { AuthModule } from "../auth/auth.module";
import { NotificacionTareaService } from "./notificacion-tarea.service";
import { NotificationQueueService } from "./notification-queue.service";

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  providers: [NotificacionTareaService, NotificationQueueService],
  controllers: [], // Controllers are in AdminModule
  exports: [NotificacionTareaService, NotificationQueueService],
})
export class NotificacionesModule {}
