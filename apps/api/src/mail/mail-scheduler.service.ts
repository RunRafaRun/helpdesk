import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma.service";
import { MailService, Adjunto } from "./mail.service";

interface SendLog {
  email: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

@Injectable()
export class MailSchedulerService {
  private readonly logger = new Logger(MailSchedulerService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications() {
    // Prevent concurrent processing
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      this.logger.log(`Cron job running at: ${now.toISOString()}`);

      // Process scheduled notifications (PROGRAMADO -> ENVIANDO)
      const scheduled = await this.prisma.notificacionMasiva.findMany({
        where: {
          estado: "PROGRAMADO",
          programadoAt: { lte: now },
        },
      });

      this.logger.log(`Found ${scheduled.length} scheduled notifications due for processing`);
      if (scheduled.length > 0) {
        this.logger.log(`Processing ${scheduled.length} scheduled notification(s)`);
        scheduled.forEach(notif => {
          this.logger.log(`Scheduled notification ${notif.id}: programadoAt=${notif.programadoAt}, now=${now.toISOString()}`);
        });
      }

      for (const notif of scheduled) {
        await this.processNotification(notif, "scheduled");
      }

      // Process pending notifications (PENDIENTE -> ENVIANDO) with retry logic
      // For simplicity, retry all pending notifications that haven't exceeded max retries
      const pending = await this.prisma.notificacionMasiva.findMany({
        where: {
          estado: "PENDIENTE",
          retryCount: { lt: 3 }, // maxRetries default is 3
        },
        orderBy: { createdAt: 'asc' }, // Process oldest first
      });

      if (pending.length > 0) {
        this.logger.log(`Processing ${pending.length} pending notification(s)`);
      }

      for (const notif of pending) {
        await this.processNotification(notif, "pending");
      }
    } catch (error: any) {
      this.logger.error(`Error in scheduler: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processNotification(notif: any, type: "scheduled" | "pending") {
    try {
      // Mark as sending
      await this.prisma.notificacionMasiva.update({
        where: { id: notif.id },
        data: { estado: "ENVIANDO" },
      });

      const logs: SendLog[] = [];
      let enviados = 0;
      let errores = 0;

      // Parse adjuntos from JSON if present
      const adjuntos = notif.adjuntos as any;

      const result = await this.mailService.sendEmail(
        notif.emailsTo,
        notif.emailsCc,
        notif.asunto,
        notif.cuerpoHtml,
        notif.cuerpoTexto || undefined,
        adjuntos || undefined
      );

      if (result.success) {
        enviados = notif.emailsTo.length;
        notif.emailsTo.forEach((email) => {
          logs.push({
            email,
            success: true,
            timestamp: new Date().toISOString(),
          });
        });
        this.logger.log(`Notification ${notif.id} (${type}) sent successfully`);
      } else {
        errores = notif.emailsTo.length;
        notif.emailsTo.forEach((email) => {
          logs.push({
            email,
            success: false,
            error: result.error,
            timestamp: new Date().toISOString(),
          });
        });
        this.logger.error(`Notification ${notif.id} (${type}) failed: ${result.error}`);
      }

      await this.prisma.notificacionMasiva.update({
        where: { id: notif.id },
        data: {
          estado: result.success ? "ENVIADO" : (type === "pending" && notif.retryCount < notif.maxRetries ? "PENDIENTE" : "ERROR"),
          enviados,
          errores,
          enviadoAt: result.success ? new Date() : undefined,
          logEnvio: JSON.stringify(logs),
          retryCount: result.success ? notif.retryCount : notif.retryCount + 1,
          lastRetryAt: result.success ? notif.lastRetryAt : new Date(),
        },
      });

      // Log retry information if failed
      if (!result.success && type === "pending") {
        if (notif.retryCount + 1 >= notif.maxRetries) {
          this.logger.error(`Notification ${notif.id} failed permanently after ${notif.retryCount + 1} attempts`);
        } else {
          this.logger.warn(`Notification ${notif.id} failed, will retry (${notif.retryCount + 1}/${notif.maxRetries})`);
        }
      }

    } catch (error: any) {
      this.logger.error(`Error processing notification ${notif.id} (${type}): ${error.message}`);

      // Handle retry logic for errors
      const shouldRetry = type === "pending" && notif.retryCount < notif.maxRetries;

      await this.prisma.notificacionMasiva.update({
        where: { id: notif.id },
        data: {
          estado: shouldRetry ? "PENDIENTE" : "ERROR",
          logEnvio: JSON.stringify([{ error: error.message, timestamp: new Date().toISOString() }]),
          retryCount: notif.retryCount + 1,
          lastRetryAt: new Date(),
        },
      });

      if (shouldRetry) {
        this.logger.warn(`Notification ${notif.id} errored, will retry (${notif.retryCount + 1}/${notif.maxRetries})`);
      } else {
        this.logger.error(`Notification ${notif.id} errored permanently after ${notif.retryCount + 1} attempts`);
      }
    }
  }

  private getBackoffDelay(retryCount: number = 0): number {
    // Exponential backoff: 1min, 2min, 4min, 8min, etc.
    const baseDelay = 60 * 1000; // 1 minute in milliseconds
    return Math.min(baseDelay * Math.pow(2, retryCount), 30 * 60 * 1000); // Max 30 minutes
  }
}
