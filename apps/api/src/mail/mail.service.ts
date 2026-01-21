import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { TipoSeguridad } from "@prisma/client";
import * as nodemailer from "nodemailer";
import { ConfidentialClientApplication } from "@azure/msal-node";

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface Adjunto {
  nombre: string;
  tipo: string;
  datos: string; // Base64
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    return this.prisma.configuracionMail.findFirst({
      where: { activo: true },
    });
  }

  async sendEmail(
    to: string[],
    cc: string[],
    subject: string,
    html: string,
    text?: string,
    adjuntos?: Adjunto[]
  ): Promise<SendResult> {
    const config = await this.getConfig();
    if (!config) {
      return { success: false, error: "No hay configuración de correo activa" };
    }

    if (config.tipoSeguridad === TipoSeguridad.AZURE) {
      return this.sendViaAzure(config, to, cc, subject, html, text, adjuntos);
    } else {
      return this.sendViaSMTP(config, to, cc, subject, html, text, adjuntos);
    }
  }

  private async sendViaSMTP(
    config: any,
    to: string[],
    cc: string[],
    subject: string,
    html: string,
    text?: string,
    adjuntos?: Adjunto[]
  ): Promise<SendResult> {
    try {
      const transportConfig: nodemailer.TransportOptions = {
        host: config.urlServidor,
        port: config.puerto || 587,
        secure: config.tipoSeguridad === TipoSeguridad.SSL,
        auth: config.usuarioMail
          ? {
              user: config.usuarioMail,
              pass: config.passwordMail,
            }
          : undefined,
      } as any;

      if (config.tipoSeguridad === TipoSeguridad.TLS) {
        (transportConfig as any).requireTLS = true;
      }

      const transporter = nodemailer.createTransport(transportConfig);

      // Prepare attachments for nodemailer
      const attachments = adjuntos?.map((adj) => ({
        filename: adj.nombre,
        content: adj.datos,
        encoding: "base64",
        contentType: adj.tipo,
      }));

      const info = await transporter.sendMail({
        from: config.cuentaMail,
        to: to.join(", "),
        cc: cc.length > 0 ? cc.join(", ") : undefined,
        subject,
        html,
        text: text || this.htmlToText(html),
        attachments,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Error sending email via SMTP: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendViaAzure(
    config: any,
    to: string[],
    cc: string[],
    subject: string,
    html: string,
    text?: string,
    adjuntos?: Adjunto[]
  ): Promise<SendResult> {
    try {
      const accessToken = await this.getAzureAccessToken(config);
      if (!accessToken) {
        return { success: false, error: "No se pudo obtener token de Azure" };
      }

      const { Client } = await import("@microsoft/microsoft-graph-client");

      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      const message: any = {
        subject,
        body: {
          contentType: "HTML",
          content: html,
        },
        toRecipients: to.map((email) => ({
          emailAddress: { address: email },
        })),
        ccRecipients: cc.map((email) => ({
          emailAddress: { address: email },
        })),
      };

      // Add attachments for Microsoft Graph API
      if (adjuntos && adjuntos.length > 0) {
        message.attachments = adjuntos.map((adj) => ({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: adj.nombre,
          contentType: adj.tipo,
          contentBytes: adj.datos,
        }));
      }

      await client.api("/me/sendMail").post({ message, saveToSentItems: true });

      this.logger.log(`Email sent via Azure Graph API`);
      return { success: true, messageId: "azure-" + Date.now() };
    } catch (error: any) {
      this.logger.error(`Error sending email via Azure: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getAzureAccessToken(config?: any): Promise<string | null> {
    try {
      const cfg = config || (await this.getConfig());
      if (!cfg || cfg.tipoSeguridad !== TipoSeguridad.AZURE) {
        return null;
      }

      // Check if we have a valid cached token
      if (cfg.azureAccessToken && cfg.azureTokenExpiry) {
        const expiry = new Date(cfg.azureTokenExpiry);
        if (expiry > new Date()) {
          return cfg.azureAccessToken;
        }
      }

      // Get new token using client credentials
      // Debug logging (remove in production)
      this.logger.log(`Azure config - ClientId: ${cfg.azureClientId?.substring(0, 8)}...`);
      this.logger.log(`Azure config - TenantId: ${cfg.azureTenantId?.substring(0, 8)}...`);
      this.logger.log(`Azure config - Secret length: ${cfg.azureClientSecret?.length}, starts with: ${cfg.azureClientSecret?.substring(0, 4)}...`);

      const msalConfig = {
        auth: {
          clientId: cfg.azureClientId,
          authority: `https://login.microsoftonline.com/${cfg.azureTenantId}`,
          clientSecret: cfg.azureClientSecret,
        },
      };

      const cca = new ConfidentialClientApplication(msalConfig);
      const result = await cca.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"],
      });

      if (result && result.accessToken) {
        // Save token to database
        await this.prisma.configuracionMail.update({
          where: { id: cfg.id },
          data: {
            azureAccessToken: result.accessToken,
            azureTokenExpiry: result.expiresOn,
          },
        });

        return result.accessToken;
      }

      return null;
    } catch (error: any) {
      this.logger.error(`Error getting Azure token: ${error.message}`);
      return null;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig();
    if (!config) {
      return { success: false, error: "No hay configuración de correo activa" };
    }

    if (config.tipoSeguridad === TipoSeguridad.AZURE) {
      const token = await this.getAzureAccessToken(config);
      if (token) {
        return { success: true };
      }
      return { success: false, error: "No se pudo obtener token de Azure" };
    }

    try {
      const transportConfig: any = {
        host: config.urlServidor,
        port: config.puerto || 587,
        secure: config.tipoSeguridad === TipoSeguridad.SSL,
        auth: config.usuarioMail
          ? {
              user: config.usuarioMail,
              pass: config.passwordMail,
            }
          : undefined,
      };

      if (config.tipoSeguridad === TipoSeguridad.TLS) {
        transportConfig.requireTLS = true;
      }

      const transporter = nodemailer.createTransport(transportConfig);
      await transporter.verify();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }
}
