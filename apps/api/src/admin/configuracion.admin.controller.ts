import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards";
import { PermissionsGuard, RequirePermissions, RequireAnyPermission } from "../auth/permissions";
import { PrismaService } from "../prisma.service";
import { MailService } from "../mail/mail.service";
import { PermisoCodigo, TipoSeguridad } from "@prisma/client";
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// Site configuration DTOs
class SiteConfigDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  siteName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  siteUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  siteLogo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sslCertificate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sslKey?: string;
}

class UpdateMailConfigDto {
  @ApiProperty({ enum: TipoSeguridad })
  @IsEnum(TipoSeguridad)
  tipoSeguridad: TipoSeguridad;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  urlServidor?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(65535)
  puerto?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cuentaMail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  usuarioMail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  passwordMail?: string;

  // Azure fields
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  azureClientId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  azureTenantId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  azureClientSecret?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firmaHtml?: string;
}

@ApiTags("admin/configuracion")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/configuracion")
@RequirePermissions(PermisoCodigo.CONFIG_NOTIFICACIONES)
export class ConfiguracionAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  @Get("mail")
  async getMailConfig() {
    const config = await this.prisma.configuracionMail.findFirst({
      where: { activo: true },
    });

    if (!config) {
      return {
        id: null,
        tipoSeguridad: TipoSeguridad.NINGUNO,
        urlServidor: null,
        puerto: null,
        cuentaMail: null,
        usuarioMail: null,
        passwordMail: null,
        azureClientId: null,
        azureTenantId: null,
        azureClientSecret: null,
        azureConnected: false,
        firmaHtml: null,
      };
    }

    return {
      id: config.id,
      tipoSeguridad: config.tipoSeguridad,
      urlServidor: config.urlServidor,
      puerto: config.puerto,
      cuentaMail: config.cuentaMail,
      usuarioMail: config.usuarioMail,
      // Mask password
      passwordMail: config.passwordMail ? "********" : null,
      azureClientId: config.azureClientId,
      azureTenantId: config.azureTenantId,
      // Mask secret
      azureClientSecret: config.azureClientSecret ? "********" : null,
      azureConnected:
        config.azureAccessToken &&
        config.azureTokenExpiry &&
        new Date(config.azureTokenExpiry) > new Date(),
      firmaHtml: config.firmaHtml,
    };
  }

  @Put("mail")
  async updateMailConfig(@Body() dto: UpdateMailConfigDto) {
    const existing = await this.prisma.configuracionMail.findFirst({
      where: { activo: true },
    });

    // Prepare data
    const data: any = {
      tipoSeguridad: dto.tipoSeguridad,
      urlServidor: dto.urlServidor || null,
      puerto: dto.puerto || null,
      cuentaMail: dto.cuentaMail || null,
      usuarioMail: dto.usuarioMail || null,
      azureClientId: dto.azureClientId || null,
      azureTenantId: dto.azureTenantId || null,
      firmaHtml: dto.firmaHtml || null,
    };

    // Only update password if provided and not masked
    // Note: For MVP, storing as plain text. In production, use a secrets manager
    // or reversible encryption (not bcrypt which is one-way).
    if (dto.passwordMail && dto.passwordMail !== "********") {
      data.passwordMail = dto.passwordMail;
    } else if (existing) {
      data.passwordMail = existing.passwordMail;
    }

    // Only update Azure secret if provided and not masked
    if (dto.azureClientSecret && dto.azureClientSecret !== "********") {
      data.azureClientSecret = dto.azureClientSecret;
    } else if (existing) {
      data.azureClientSecret = existing.azureClientSecret;
    }

    // If changing security type or Azure credentials, clear token
    if (
      existing &&
      (existing.tipoSeguridad !== dto.tipoSeguridad ||
        (dto.azureClientId && dto.azureClientId !== existing.azureClientId) ||
        (dto.azureTenantId && dto.azureTenantId !== existing.azureTenantId) ||
        (dto.azureClientSecret && dto.azureClientSecret !== "********"))
    ) {
      data.azureAccessToken = null;
      data.azureTokenExpiry = null;
    }

    if (existing) {
      return this.prisma.configuracionMail.update({
        where: { id: existing.id },
        data,
      });
    } else {
      return this.prisma.configuracionMail.create({
        data: { ...data, activo: true },
      });
    }
  }

  @Post("mail/test")
  async testMailConnection() {
    return this.mailService.testConnection();
  }

  @Post("mail/azure-connect")
  async connectAzure() {
    const config = await this.prisma.configuracionMail.findFirst({
      where: { activo: true, tipoSeguridad: TipoSeguridad.AZURE },
    });

    if (!config) {
      return {
        success: false,
        error: "No hay configuración Azure activa",
      };
    }

    const token = await this.mailService.getAzureAccessToken(config);

    if (token) {
      return { success: true, message: "Conexión Azure establecida" };
    }

    return {
      success: false,
      error: "No se pudo establecer conexión con Azure",
    };
  }
}

// Site/General configuration controller
@ApiTags("admin/configuracion")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/configuracion")
@RequireAnyPermission(PermisoCodigo.CONFIG_GENERAL, PermisoCodigo.CONFIG_NOTIFICACIONES)
export class SiteConfigController {
  constructor(private readonly prisma: PrismaService) {}

  private async getConfigValue(key: string): Promise<string | null> {
    const config = await this.prisma.siteConfig.findUnique({ where: { key } });
    return config?.value ?? null;
  }

  private async setConfigValue(key: string, value: string | null, description?: string): Promise<void> {
    await this.prisma.siteConfig.upsert({
      where: { key },
      create: { key, value, description },
      update: { value },
    });
  }

  @Get("site")
  @RequireAnyPermission(PermisoCodigo.CONFIG_GENERAL)
  async getSiteConfig() {
    const configs = await this.prisma.siteConfig.findMany();
    const configMap: Record<string, string | null> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    return {
      siteName: configMap["site.name"] ?? "Helpdesk",
      siteUrl: configMap["site.url"] ?? "",
      siteLogo: configMap["site.logo"] ?? "",
      sslCertificate: configMap["site.ssl.certificate"] ? "********" : "",
      sslKey: configMap["site.ssl.key"] ? "********" : "",
    };
  }

  @Put("site")
  @RequireAnyPermission(PermisoCodigo.CONFIG_GENERAL)
  async updateSiteConfig(@Body() dto: SiteConfigDto) {
    if (dto.siteName !== undefined) {
      await this.setConfigValue("site.name", dto.siteName, "Nombre del sitio");
    }
    if (dto.siteUrl !== undefined) {
      await this.setConfigValue("site.url", dto.siteUrl, "URL base del sitio");
    }
    if (dto.siteLogo !== undefined) {
      await this.setConfigValue("site.logo", dto.siteLogo, "Logo del sitio (URL o base64)");
    }
    if (dto.sslCertificate && dto.sslCertificate !== "********") {
      await this.setConfigValue("site.ssl.certificate", dto.sslCertificate, "Certificado SSL");
    }
    if (dto.sslKey && dto.sslKey !== "********") {
      await this.setConfigValue("site.ssl.key", dto.sslKey, "Clave privada SSL");
    }

    return this.getSiteConfig();
  }
}
