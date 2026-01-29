import { PrismaClient, EventoTipo, RamaTipo, WorkflowTrigger, WorkflowConditionField, WorkflowConditionOperator, WorkflowRecipientType, WorkflowActionType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as bcrypt from "bcryptjs";

type MasterData = {
  tipoTarea?: Array<{ codigo: string; descripcion?: string | null; orden?: number; porDefecto?: boolean; activo?: boolean }>;
  estadoTarea?: Array<{ codigo: string; descripcion?: string | null; orden?: number; porDefecto?: boolean; activo?: boolean }>;
  prioridadTarea?: Array<{ codigo: string; descripcion?: string | null; orden?: number; porDefecto?: boolean; color?: string | null; activo?: boolean }>;
  modulo?: Array<{ codigo: string; descripcion?: string | null; activo?: boolean }>;
  estadoPeticion?: Array<{ codigo: string; descripcion?: string | null }>;
  agentes?: Array<{
    usuario: string;
    nombre: string;
    email?: string | null;
    role: "ADMIN" | "AGENTE";
    activo?: boolean;
    password?: string;
  }>;
  clientes?: Array<{
    codigo: string;
    descripcion?: string | null;
    jefeProyecto1?: string | null;
    jefeProyecto2?: string | null;
    licenciaTipo?: "AAM" | "PPU" | null;
    activo?: boolean;
    unidades?: Array<{ codigo: string; descripcion?: string | null; scope: "HOTEL" | "CENTRAL" | "TODOS" }>;
    contactos?: Array<{
      nombre: string;
      email?: string | null;
      movil?: string | null;
      cargo?: string | null;
      principal?: boolean;
      activo?: boolean;
    }>;
  }>;
  releases?: Array<{
    codigo: string;
    descripcion?: string | null;
    rama: "DESARROLLO" | "PRODUCCION";
    hotfixes?: Array<{
      codigo: string;
      descripcion?: string | null;
      rama: "DESARROLLO" | "PRODUCCION";
    }>;
  }>;
  plantillas?: Array<{
    codigo: string;
    descripcion?: string | null;
    texto: string;
    categoria?: string | null;
    orden?: number;
    activo?: boolean;
  }>;
  workflows?: Array<{
    nombre: string;
    descripcion?: string | null;
    trigger: string;
    activo?: boolean;
    orden?: number;
    stopOnMatch?: boolean;
    plantillaCodigo?: string | null;
    asuntoCustom?: string | null;
    ccJefeProyecto1?: boolean;
    ccJefeProyecto2?: boolean;
    conditions?: Array<{
      field: string;
      operator: string;
      value: string;
      orGroup?: number;
    }>;
    recipients?: Array<{
      recipientType: string;
      value?: string;
      isCc?: boolean;
    }>;
    actions?: Array<{
      actionType: string;
      value: string;
      orden?: number;
    }>;
  }>;
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
  const agentes = data.agentes ?? [];
  const clientes = data.clientes ?? [];
  const releases = data.releases ?? [];
  const plantillas = data.plantillas ?? [];
  const workflows = data.workflows ?? [];

  // Seed TipoTarea
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
  if (tipoTarea.length > 0) console.log(`[seed] Loaded ${tipoTarea.length} TipoTarea`);

  // Seed EstadoTarea
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
  if (estadoTarea.length > 0) console.log(`[seed] Loaded ${estadoTarea.length} EstadoTarea`);

  // Seed PrioridadTarea
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
  if (prioridadTarea.length > 0) console.log(`[seed] Loaded ${prioridadTarea.length} PrioridadTarea`);

  // Seed Modulo
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
  if (modulo.length > 0) console.log(`[seed] Loaded ${modulo.length} Modulo`);

  // Seed EstadoPeticion
  for (const item of estadoPeticion) {
    await prisma.estadoPeticion.upsert({
      where: { codigo: item.codigo },
      update: { descripcion: item.descripcion ?? null },
      create: { codigo: item.codigo, descripcion: item.descripcion ?? null },
    });
  }
  if (estadoPeticion.length > 0) console.log(`[seed] Loaded ${estadoPeticion.length} EstadoPeticion`);

  // Seed Agentes (skip admin as it's created in main seed)
  for (const item of agentes) {
    if (item.usuario === "admin") continue; // Skip admin, already created
    
    const existing = await prisma.agente.findUnique({ where: { usuario: item.usuario } });
    if (existing) continue;

    const passHash = await bcrypt.hash(item.password ?? "changeme123!", 10);
    const agente = await prisma.agente.create({
      data: {
        usuario: item.usuario,
        nombre: item.nombre,
        email: item.email ?? null,
        password: passHash,
        role: item.role,
        activo: item.activo ?? true,
      },
    });

    // Assign role
    const roleCodigo = item.role === "ADMIN" ? "ADMIN" : "AGENTE";
    const role = await prisma.roleEntity.findUnique({ where: { codigo: roleCodigo } });
    if (role) {
      await prisma.agenteRoleAssignment.create({
        data: { agenteId: agente.id, roleId: role.id },
      });
    }
  }
  if (agentes.filter(a => a.usuario !== "admin").length > 0) {
    console.log(`[seed] Loaded ${agentes.filter(a => a.usuario !== "admin").length} Agentes`);
  }

  // Seed Clientes (with unidades and contactos)
  for (const item of clientes) {
    const cliente = await prisma.cliente.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion ?? null,
        jefeProyecto1: item.jefeProyecto1 ?? null,
        jefeProyecto2: item.jefeProyecto2 ?? null,
        licenciaTipo: item.licenciaTipo ?? null,
        activo: item.activo ?? true,
      },
      create: {
        codigo: item.codigo,
        descripcion: item.descripcion ?? null,
        jefeProyecto1: item.jefeProyecto1 ?? null,
        jefeProyecto2: item.jefeProyecto2 ?? null,
        licenciaTipo: item.licenciaTipo ?? null,
        activo: item.activo ?? true,
      },
    });

    // Seed Unidades Comerciales
    if (item.unidades) {
      for (const unidad of item.unidades) {
        await prisma.unidadComercial.upsert({
          where: { clienteId_codigo: { clienteId: cliente.id, codigo: unidad.codigo } },
          update: {
            descripcion: unidad.descripcion ?? null,
            scope: unidad.scope,
          },
          create: {
            clienteId: cliente.id,
            codigo: unidad.codigo,
            descripcion: unidad.descripcion ?? null,
            scope: unidad.scope,
          },
        });
      }
    }

    // Seed Contactos
    if (item.contactos) {
      for (const contacto of item.contactos) {
        const existingContacto = await prisma.clienteContacto.findFirst({
          where: { clienteId: cliente.id, email: contacto.email },
        });
        if (!existingContacto && contacto.email) {
          await prisma.clienteContacto.create({
            data: {
              clienteId: cliente.id,
              nombre: contacto.nombre,
              email: contacto.email,
              movil: contacto.movil ?? null,
              cargo: contacto.cargo ?? null,
              principal: contacto.principal ?? false,
              activo: contacto.activo ?? true,
            },
          });
        }
      }
    }
  }
  if (clientes.length > 0) console.log(`[seed] Loaded ${clientes.length} Clientes`);

  // Seed Releases
  for (const item of releases) {
    const release = await prisma.release.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion ?? null,
        rama: item.rama as RamaTipo,
      },
      create: {
        codigo: item.codigo,
        descripcion: item.descripcion ?? null,
        rama: item.rama as RamaTipo,
      },
    });

    // Seed Hotfixes
    if (item.hotfixes) {
      for (const hf of item.hotfixes) {
        await prisma.hotfix.upsert({
          where: { releaseId_codigo: { releaseId: release.id, codigo: hf.codigo } },
          update: {
            descripcion: hf.descripcion ?? null,
            rama: hf.rama as RamaTipo,
          },
          create: {
            releaseId: release.id,
            codigo: hf.codigo,
            descripcion: hf.descripcion ?? null,
            rama: hf.rama as RamaTipo,
          },
        });
      }
    }
  }
  if (releases.length > 0) console.log(`[seed] Loaded ${releases.length} Releases`);

  // Seed Plantillas
  for (const item of plantillas) {
    await prisma.plantilla.upsert({
      where: { codigo: item.codigo },
      update: {
        descripcion: item.descripcion ?? null,
        texto: item.texto,
        categoria: item.categoria ?? null,
        orden: item.orden ?? 0,
        activo: item.activo ?? true,
      },
      create: {
        codigo: item.codigo,
        descripcion: item.descripcion ?? null,
        texto: item.texto,
        categoria: item.categoria ?? null,
        orden: item.orden ?? 0,
        activo: item.activo ?? true,
      },
    });
  }
  if (plantillas.length > 0) console.log(`[seed] Loaded ${plantillas.length} Plantillas`);

  // Seed Workflows
  for (const item of workflows) {
    // Find plantilla if specified
    let plantillaId: string | null = null;
    if (item.plantillaCodigo) {
      const plantilla = await prisma.plantilla.findUnique({ where: { codigo: item.plantillaCodigo } });
      plantillaId = plantilla?.id ?? null;
    }

    // Check if workflow already exists by name
    const existingWorkflow = await prisma.notificationWorkflow.findFirst({
      where: { nombre: item.nombre },
    });

    let workflow;
    if (existingWorkflow) {
      workflow = await prisma.notificationWorkflow.update({
        where: { id: existingWorkflow.id },
        data: {
          descripcion: item.descripcion ?? null,
          trigger: item.trigger as WorkflowTrigger,
          activo: item.activo ?? true,
          orden: item.orden ?? 0,
          stopOnMatch: item.stopOnMatch ?? false,
          plantillaId,
          asuntoCustom: item.asuntoCustom ?? null,
          ccJefeProyecto1: item.ccJefeProyecto1 ?? false,
          ccJefeProyecto2: item.ccJefeProyecto2 ?? false,
        },
      });

      // Delete existing conditions, recipients, and actions to recreate
      await prisma.notificationWorkflowCondition.deleteMany({ where: { workflowId: workflow.id } });
      await prisma.notificationWorkflowRecipient.deleteMany({ where: { workflowId: workflow.id } });
      await prisma.notificationWorkflowAction.deleteMany({ where: { workflowId: workflow.id } });
    } else {
      workflow = await prisma.notificationWorkflow.create({
        data: {
          nombre: item.nombre,
          descripcion: item.descripcion ?? null,
          trigger: item.trigger as WorkflowTrigger,
          activo: item.activo ?? true,
          orden: item.orden ?? 0,
          stopOnMatch: item.stopOnMatch ?? false,
          plantillaId,
          asuntoCustom: item.asuntoCustom ?? null,
          ccJefeProyecto1: item.ccJefeProyecto1 ?? false,
          ccJefeProyecto2: item.ccJefeProyecto2 ?? false,
        },
      });
    }

    // Seed Conditions
    if (item.conditions) {
      for (const cond of item.conditions) {
        await prisma.notificationWorkflowCondition.create({
          data: {
            workflowId: workflow.id,
            field: cond.field as WorkflowConditionField,
            operator: cond.operator as WorkflowConditionOperator,
            value: cond.value,
            orGroup: cond.orGroup ?? 0,
          },
        });
      }
    }

    // Seed Recipients
    if (item.recipients) {
      for (const rec of item.recipients) {
        await prisma.notificationWorkflowRecipient.create({
          data: {
            workflowId: workflow.id,
            recipientType: rec.recipientType as WorkflowRecipientType,
            value: rec.value ?? "",
            isCc: rec.isCc ?? false,
          },
        });
      }
    }

    // Seed Actions
    if (item.actions) {
      for (const action of item.actions) {
        await prisma.notificationWorkflowAction.create({
          data: {
            workflowId: workflow.id,
            actionType: action.actionType as WorkflowActionType,
            value: action.value,
            orden: action.orden ?? 0,
          },
        });
      }
    }
  }
  if (workflows.length > 0) console.log(`[seed] Loaded ${workflows.length} Workflows`);

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
