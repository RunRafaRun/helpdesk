import { Module, forwardRef } from '@nestjs/common';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [forwardRef(() => NotificacionesModule)],
  controllers: [TareasController],
  providers: [TareasService],
})
export class TareasModule {}
