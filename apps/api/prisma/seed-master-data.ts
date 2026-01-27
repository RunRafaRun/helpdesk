import { PrismaClient, EventoTipo } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

type MasterData = {
  tipoTarea?: Array<{ codigo: string; descripcion?: string | null; orden?: number; porDefecto?: boolean; activo?: boolean }>;
  estadoTarea?: Array<{ codigo: string; descripcion?: string | null; orden?: number; porDefecto?: boolean; activo?: boolean }>;
  prioridadTarea?: Array<{ codigo: string; descripcion?: string | null; orden?: number; porDefecto?: boolean; color?: string | null; activo?: boolean }>;
  modulo?: Array<{ codigo: string; descripcion?: string | null; activo?: boolean }>;
  estadoPeticion?: Array<{ codigo: string; descripcion?: string | null }>;
};

const backupPath = path.join(__dirname, "seed-data", "local-master.json");

export async function seedMasterData(prisma: PrismaClient) {
  // Always seed notification config
  await seedNotificacionConfig(prisma);

  if (!fs.existsSync(backupPath)) {
    console.warn("[seed] Master data backup not found, skipping.");
    return { seeded: false, hasModulos: false };
  }

  const raw = fs.readFileSync(backupPath, "utf8");
  const data = JSON.parse(raw) as MasterData;

  const tipoTarea = data.tipoTarea ?? [];
  const estadoTarea = data.estadoTarea ?? [];
  const prioridadTarea = data.prioridadTarea ?? [];
  const modulo = data.modulo ?? [];
  const estadoPeticion = data.estadoPeticion ?? [];

  for (const item of tipoTarea) {
    await prisma.tipoTarea.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion ?? null,
        orden: item.orden ?? 0,
        porDefecto: item.porDefecto ?? false,
        activo: item.activo ?? true,
      },
      create: {
        codigo: item.codigo,
        descripcion: item.descripcion ?? null,
        orden: item.orden ?? 0,
        porDefecto: item.porDefecto ?? false,
        activo: item.activo ?? true,
      },
    });
  }

  for (const item of estadoTarea) {
    await prisma.estadoTarea.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion ?? null,
        orden: item.orden ?? 0,
        porDefecto: item.porDefecto ?? false,
        activo: item.activo ?? true,
      },
      create: {
        codigo: item.codigo,
        descripcion: item.descripcion ?? null,
        orden: item.orden ?? 0,
        porDefecto: item.porDefecto ?? false,
        activo: item.activo ?? true,
      },
    });
  }

  for (const item of prioridadTarea) {
    await prisma.prioridadTarea.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion ?? null,
        orden: item.orden ?? 0,
        porDefecto: item.porDefecto ?? false,
        color: item.color ?? null,
        activo: item.activo ?? true,
      },
      create: {
        codigo: item.codigo,
        descripcion: item.descripcion ?? null,
        orden: item.orden ?? 0,
        porDefecto: item.porDefecto ?? false,
        color: item.color ?? null,
        activo: item.activo ?? true,
      },
    });
  }

  for (const item of modulo) {
    await prisma.modulo.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion ?? null,
        activo: item.activo ?? true,
      },
      create: {
        codigo: item.codigo,
        descripcion: item.descripcion ?? null,
        activo: item.activo ?? true,
      },
    });
  }

  for (const item of estadoPeticion) {
    await prisma.estadoPeticion.upsert({
      where: { codigo: item.codigo },
      update: { descripcion: item.descripcion ?? null },
      create: { codigo: item.codigo, descripcion: item.descripcion ?? null },
    });
  }

  console.log("[seed] Master data loaded from backup.");

  return { seeded: true, hasModulos: modulo.length > 0 };
}

/**
 * Seed default notification configuration for event types
 */
async function seedNotificacionConfig(prisma: PrismaClient) {
  const defaultConfigs: Array<{
    eventoTipo: EventoTipo;
    habilitado: boolean;
    notificarCliente: boolean;
    notificarAgente: boolean;
    asuntoDefault: string;
  }> = [
    {
      eventoTipo: EventoTipo.RESPUESTA_AGENTE,
      habilitado: true,
      notificarCliente: true,
      notificarAgente: false,
      asuntoDefault: "[Ticket #{{tarea.numero}}] Respuesta de soporte",
    },
    {
      eventoTipo: EventoTipo.MENSAJE_CLIENTE,
      habilitado: true,
      notificarCliente: false,
      notificarAgente: true,
      asuntoDefault: "[Ticket #{{tarea.numero}}] Nuevo mensaje del cliente",
    },
    {
      eventoTipo: EventoTipo.ASIGNACION,
      habilitado: true,
      notificarCliente: false,
      notificarAgente: true,
      asuntoDefault: "[Ticket #{{tarea.numero}}] Tarea asignada",
    },
    {
      eventoTipo: EventoTipo.CAMBIO_ESTADO,
      habilitado: false,
      notificarCliente: true,
      notificarAgente: false,
      asuntoDefault: "[Ticket #{{tarea.numero}}] Cambio de estado",
    },
  ];

  for (const config of defaultConfigs) {
    await prisma.notificacionConfigEvento.upsert({
      where: { eventoTipo: config.eventoTipo },
      update: {},
      create: {
        eventoTipo: config.eventoTipo,
        habilitado: config.habilitado,
        notificarCliente: config.notificarCliente,
        notificarAgente: config.notificarAgente,
        asuntoDefault: config.asuntoDefault,
      },
    });
  }

  console.log("[seed] Notification config seeded.");
}
