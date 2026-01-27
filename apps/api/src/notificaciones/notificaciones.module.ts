import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { MailModule } from "../mail/mail.module";
import { NotificacionTareaService } from "./notificacion-tarea.service";
import { NotificationQueueService } from "./notification-queue.service";
import { LogNotificacionesAdminController } from "./log-notificaciones.admin.controller";
import { NotificacionConfigAdminController } from "./notificacion-config.admin.controller";

@Module({
  imports: [PrismaModule, MailModule],
  providers: [NotificacionTareaService, NotificationQueueService],
  controllers: [LogNotificacionesAdminController, NotificacionConfigAdminController],
  exports: [NotificacionTareaService],
})
export class NotificacionesModule {}
