import { Body, Controller, Get, Put, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { PrismaService } from "../prisma.service";
import { JwtAuthGuard } from "../auth/guards";
import { IsString, IsObject, IsOptional } from "class-validator";

// Widget types available in the dashboard
export type WidgetType = 
  | "releaseStatus"
  | "sinAsignar" 
  | "prioridadPendientes"
  | "ticketsNuevosPendientes"
  | "resumenClienteEstado"
  | "ultimosComentarios";

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  visible: boolean;
  filters?: Record<string, unknown>;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

class UpdateDashboardConfigDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsObject()
  layout!: DashboardLayout;
}

// Default dashboard layout
const DEFAULT_LAYOUT: DashboardLayout = {
  widgets: [
    { id: "releaseStatus", type: "releaseStatus", position: { x: 0, y: 0, w: 4, h: 2 }, visible: true },
    { id: "sinAsignar", type: "sinAsignar", position: { x: 4, y: 0, w: 2, h: 2 }, visible: true },
    { id: "prioridadPendientes", type: "prioridadPendientes", position: { x: 6, y: 0, w: 3, h: 2 }, visible: true },
    { id: "ticketsNuevosPendientes", type: "ticketsNuevosPendientes", position: { x: 0, y: 2, w: 9, h: 3 }, visible: true },
    { id: "resumenClienteEstado", type: "resumenClienteEstado", position: { x: 0, y: 5, w: 9, h: 5 }, visible: true },
    { id: "ultimosComentarios", type: "ultimosComentarios", position: { x: 9, y: 0, w: 3, h: 10 }, visible: true },
  ],
};

@ApiTags("admin/dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("admin/dashboard")
export class DashboardAdminController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the current dashboard configuration
   * Returns the default config, or creates one if it doesn't exist
   */
  @Get("config")
  async getConfig() {
    let config = await this.prisma.dashboardConfig.findFirst({
      where: { isDefault: true },
    });

    if (!config) {
      // Create default config
      config = await this.prisma.dashboardConfig.create({
        data: {
          nombre: "Default Dashboard",
          isDefault: true,
          layout: DEFAULT_LAYOUT as any,
        },
      });
    }

    return {
      id: config.id,
      nombre: config.nombre,
      layout: config.layout as unknown as DashboardLayout,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update the dashboard configuration (admin only)
   * This updates the shared default config that all agents see
   */
  @Put("config")
  async updateConfig(@Body() dto: UpdateDashboardConfigDto, @Req() req: any) {
    // Find existing default config
    let config = await this.prisma.dashboardConfig.findFirst({
      where: { isDefault: true },
    });

    if (config) {
      // Update existing
      config = await this.prisma.dashboardConfig.update({
        where: { id: config.id },
        data: {
          nombre: dto.nombre ?? config.nombre,
          layout: dto.layout as any,
        },
      });
    } else {
      // Create new
      config = await this.prisma.dashboardConfig.create({
        data: {
          nombre: dto.nombre ?? "Default Dashboard",
          isDefault: true,
          layout: dto.layout as any,
          createdById: req.user?.sub,
        },
      });
    }

    return {
      id: config.id,
      nombre: config.nombre,
      layout: config.layout as unknown as DashboardLayout,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Reset dashboard to default layout
   */
  @Put("config/reset")
  async resetConfig() {
    const config = await this.prisma.dashboardConfig.findFirst({
      where: { isDefault: true },
    });

    if (config) {
      const updated = await this.prisma.dashboardConfig.update({
        where: { id: config.id },
        data: {
          layout: DEFAULT_LAYOUT as any,
        },
      });
      return {
        id: updated.id,
        nombre: updated.nombre,
        layout: updated.layout as unknown as DashboardLayout,
        updatedAt: updated.updatedAt,
      };
    }

    // Create new default
    const created = await this.prisma.dashboardConfig.create({
      data: {
        nombre: "Default Dashboard",
        isDefault: true,
        layout: DEFAULT_LAYOUT as any,
      },
    });

    return {
      id: created.id,
      nombre: created.nombre,
      layout: created.layout as unknown as DashboardLayout,
      updatedAt: created.updatedAt,
    };
  }
}
