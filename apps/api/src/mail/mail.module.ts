import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { MailService } from "./mail.service";
import { MailSchedulerService } from "./mail-scheduler.service";

@Module({
  imports: [PrismaModule],
  providers: [MailService, MailSchedulerService],
  exports: [MailService],
})
export class MailModule {}
