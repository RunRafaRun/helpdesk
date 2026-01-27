import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { NotificationQueueService } from "../notificaciones/notification-queue.service";

import { AdminController } from "./admin.controller";
import { ModulosAdminController } from "./modulos.admin.controller";
import { RbacAdminController } from "./rbac.admin.controller";
import { AgentesAdminController } from "./agentes.admin.controller";
import { ClientesAdminController } from "./clientes.admin.controller";
import { ReleasesAdminController } from "./releases.admin.controller";
import { ConfiguracionAdminController, SiteConfigController } from "./configuracion.admin.controller";
import { NotificacionesAdminController } from "./notificaciones.admin.controller";
import { LookupAdminController } from "./lookup.admin.controller";
import { PlantillasAdminController } from "./plantillas.admin.controller";
import { DashboardAdminController } from "./dashboard.admin.controller";
import { LogNotificacionesAdminController } from "./log-notificaciones.admin.controller";
import { NotificacionConfigAdminController } from "./notificacion-config.admin.controller";
import { WorkflowsAdminController } from "./workflows.admin.controller";

@Module({
  imports: [PrismaModule, AuthModule, MailModule],
  controllers: [
    AdminController,
    AgentesAdminController,
    ClientesAdminController,
    ModulosAdminController,
    ReleasesAdminController,
    RbacAdminController,
    ConfiguracionAdminController,
    SiteConfigController,
    NotificacionesAdminController,
    LookupAdminController,
    PlantillasAdminController,
    DashboardAdminController,
    LogNotificacionesAdminController,
    NotificacionConfigAdminController,
    WorkflowsAdminController,
  ],
  providers: [NotificationQueueService],
})
export class AdminModule {}
