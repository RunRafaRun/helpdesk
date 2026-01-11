import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { HealthModule } from "./health/health.module";
import { TareasModule } from "./tareas/tareas.module";

@Module({
  imports: [PrismaModule, AuthModule, AdminModule, HealthModule, TareasModule],
})
export class AppModule {}
