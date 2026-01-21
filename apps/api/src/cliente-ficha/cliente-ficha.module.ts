import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ClienteSoftwareController, ClienteContactoController, ClienteConexionController, ClienteComentarioController, ClienteCentroTrabajoController, ClienteReleasePlanController, UnidadComercialController, ClienteUsuarioController } from './controllers';
import { ClienteSoftwareService, ClienteContactoService, ClienteConexionService, ClienteComentarioService, ClienteCentroTrabajoService, ClienteReleasePlanService, UnidadComercialService, ClienteUsuarioService } from './services';

@Module({
  imports: [PrismaModule],
  controllers: [ClienteSoftwareController, ClienteContactoController, ClienteConexionController, ClienteComentarioController, ClienteCentroTrabajoController, ClienteReleasePlanController, UnidadComercialController, ClienteUsuarioController],
  providers: [ClienteSoftwareService, ClienteContactoService, ClienteConexionService, ClienteComentarioService, ClienteCentroTrabajoService, ClienteReleasePlanService, UnidadComercialService, ClienteUsuarioService],
  exports: [ClienteSoftwareService, ClienteContactoService, ClienteConexionService, ClienteComentarioService, ClienteCentroTrabajoService, ClienteReleasePlanService, UnidadComercialService, ClienteUsuarioService],
})
export class ClienteFichaModule {}
