import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma.service";
import { MailService } from "../mail/mail.service";
import { EstadoNotificacion } from "@prisma/client";

interface SendLog {
  email: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  /**
   * Process the notification queue every 30 seconds
   */
  @Cron("*/30 * * * * *")
  async processQueue() {
    // Prevent concurrent processing
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.processNotifications();
    } catch (error: any) {
      this.logger.error(`Error in queue processor: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Manually trigger queue processing
   */
  async processNow(): Promise<{ processed: number; success: number; failed: number }> {
    return this.processNotifications();
  }

  private async processNotifications(): Promise<{ processed: number; success: number; failed: number }> {
    const now = new Date();
    let processed = 0;
    let success = 0;
    let failed = 0;

    // Find pending notifications ready to be sent
    const pendingNotifications = await this.prisma.notificacionTarea.findMany({
      where: {
        estado: EstadoNotificacion.PENDIENTE,
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: now } },
        ],
      },
      orderBy: [
        { prioridad: "asc" },
        { createdAt: "asc" },
      ],
      take: 10, // Process up to 10 at a time
    });

    if (pendingNotifications.length === 0) {
      return { processed: 0, success: 0, failed: 0 };
    }

    this.logger.log(`Processing ${pendingNotifications.length} pending notification(s)`);

    for (const notif of pendingNotifications) {
      processed++;

      // Mark as processing
      await this.prisma.notificacionTarea.update({
        where: { id: notif.id },
        data: { estado: EstadoNotificacion.PROCESANDO },
      });

      try {
        const logs: SendLog[] = [];

        // Send the email
        const result = await this.mailService.sendEmail(
          notif.emailsTo,
          notif.emailsCc,
          notif.asunto,
          notif.cuerpoHtml,
          notif.cuerpoTexto || undefined
        );

        if (result.success) {
          // Success
          notif.emailsTo.forEach((email) => {
            logs.push({
              email,
              success: true,
              timestamp: new Date().toISOString(),
            });
          });

          await this.prisma.notificacionTarea.update({
            where: { id: notif.id },
            data: {
              estado: EstadoNotificacion.ENVIADO,
              enviadoAt: new Date(),
              logEnvio: JSON.stringify(logs),
            },
          });

          success++;
          this.logger.log(`Notification ${notif.id} sent successfully to ${notif.emailsTo.length} recipient(s)`);
        } else {
          // Failed
          notif.emailsTo.forEach((email) => {
            logs.push({
              email,
              success: false,
              error: result.error,
              timestamp: new Date().toISOString(),
            });
          });

          await this.handleFailure(notif, result.error || "Unknown error", logs);
          failed++;
        }
      } catch (error: any) {
        this.logger.error(`Error sending notification ${notif.id}: ${error.message}`);
        await this.handleFailure(notif, error.message, [
          { email: "system", success: false, error: error.message, timestamp: new Date().toISOString() },
        ]);
        failed++;
      }
    }

    return { processed, success, failed };
  }

  /**
   * Handle notification failure with retry logic
   */
  private async handleFailure(notif: any, errorMessage: string, logs: SendLog[]) {
    const newRetryCount = notif.retryCount + 1;
    const shouldRetry = newRetryCount < notif.maxRetries;

    if (shouldRetry) {
      // Calculate exponential backoff: 1min, 2min, 4min, 8min
      const backoffMs = Math.min(
        60 * 1000 * Math.pow(2, notif.retryCount),
        30 * 60 * 1000 // Max 30 minutes
      );
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await this.prisma.notificacionTarea.update({
        where: { id: notif.id },
        data: {
          estado: EstadoNotificacion.PENDIENTE,
          retryCount: newRetryCount,
          nextRetryAt,
          errorMessage,
          logEnvio: JSON.stringify(logs),
        },
      });

      this.logger.warn(
        `Notification ${notif.id} failed, will retry (${newRetryCount}/${notif.maxRetries}) at ${nextRetryAt.toISOString()}`
      );
    } else {
      // Mark as permanently failed
      await this.prisma.notificacionTarea.update({
        where: { id: notif.id },
        data: {
          estado: EstadoNotificacion.ERROR,
          retryCount: newRetryCount,
          errorMessage,
          logEnvio: JSON.stringify(logs),
        },
      });

      this.logger.error(
        `Notification ${notif.id} failed permanently after ${newRetryCount} attempts`
      );
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pendiente: number;
    procesando: number;
    enviadoHoy: number;
    errorHoy: number;
    total: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendiente, procesando, enviadoHoy, errorHoy, total] = await Promise.all([
      this.prisma.notificacionTarea.count({
        where: { estado: EstadoNotificacion.PENDIENTE },
      }),
      this.prisma.notificacionTarea.count({
        where: { estado: EstadoNotificacion.PROCESANDO },
      }),
      this.prisma.notificacionTarea.count({
        where: {
          estado: EstadoNotificacion.ENVIADO,
          enviadoAt: { gte: today },
        },
      }),
      this.prisma.notificacionTarea.count({
        where: {
          estado: EstadoNotificacion.ERROR,
          createdAt: { gte: today },
        },
      }),
      this.prisma.notificacionTarea.count(),
    ]);

    return { pendiente, procesando, enviadoHoy, errorHoy, total };
  }
}
