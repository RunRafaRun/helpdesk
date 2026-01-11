import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { AuthModule } from "../auth/auth.module";

import { AdminController } from "./admin.controller";
import { ModulosAdminController } from "./modulos.admin.controller";
import { RbacAdminController } from "./rbac.admin.controller";
import { AgentesAdminController } from "./agentes.admin.controller";
import { ClientesAdminController } from "./clientes.admin.controller";

@Module({  imports: [PrismaModule, AuthModule],
  controllers: [
    AdminController,
    AgentesAdminController,
    ClientesAdminController,
    ModulosAdminController,
    RbacAdminController,
  ],
})
export class AdminModule {}
