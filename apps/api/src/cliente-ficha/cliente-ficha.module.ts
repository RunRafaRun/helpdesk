import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ClienteSoftwareController, ClienteContactoController, ClienteConexionController, ClienteComentarioController, ClienteCentroTrabajoController, ClienteReleasePlanController } from './controllers';
import { ClienteSoftwareService, ClienteContactoService, ClienteConexionService, ClienteComentarioService, ClienteCentroTrabajoService, ClienteReleasePlanService } from './services';

@Module({
  imports: [PrismaModule],
  controllers: [ClienteSoftwareController, ClienteContactoController, ClienteConexionController, ClienteComentarioController, ClienteCentroTrabajoController, ClienteReleasePlanController],
  providers: [ClienteSoftwareService, ClienteContactoService, ClienteConexionService, ClienteComentarioService, ClienteCentroTrabajoService, ClienteReleasePlanService],
  exports: [ClienteSoftwareService, ClienteContactoService, ClienteConexionService, ClienteComentarioService, ClienteCentroTrabajoService, ClienteReleasePlanService],
})
export class ClienteFichaModule {}
