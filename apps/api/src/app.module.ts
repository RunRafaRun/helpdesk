import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { HealthModule } from "./health/health.module";
import { TareasModule } from "./tareas/tareas.module";
import { ClienteFichaModule } from './cliente-ficha/cliente-ficha.module';
import { MailModule } from "./mail/mail.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    AdminModule,
    HealthModule,
    TareasModule,
    ClienteFichaModule,
    MailModule,
  ],
})
export class AppModule {}
