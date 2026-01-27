import { PrismaClient, PermisoCodigo } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

// Import additional seed functions
import { main as seedDummyClientes } from "./seed-dummy-clientes";
import { main as seedModulos } from "./seed-modulos";
import { seedMasterData } from "./seed-master-data";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminUser = "admin";
  const adminPass = "admin123!";

  // Permisos catálogo
  for (const codigo of Object.values(PermisoCodigo)) {
    await prisma.permission.upsert({
      where: { codigo },
      update: {},
      create: { codigo },
    });
  }

  // Roles base
  const roleAdmin = await prisma.roleEntity.upsert({
    where: { codigo: "ADMIN" },
    update: { nombre: "Administrador" },
    create: { codigo: "ADMIN", nombre: "Administrador" },
  });

  const roleAgente = await prisma.roleEntity.upsert({
    where: { codigo: "AGENTE" },
    update: { nombre: "Agente" },
    create: { codigo: "AGENTE", nombre: "Agente" },
  });

  const allPerms = await prisma.permission.findMany();
  // ADMIN => todos los permisos
  await prisma.rolePermission.deleteMany({ where: { roleId: roleAdmin.id } });
  await prisma.rolePermission.createMany({
    data: allPerms.map((p) => ({ roleId: roleAdmin.id, permissionId: p.id })),
  });

  // AGENTE => no admin permissions needed (lookup endpoints are public to authenticated users)
  await prisma.rolePermission.deleteMany({ where: { roleId: roleAgente.id } });

  // Admin principal (Agente)
  const passHash = await bcrypt.hash(adminPass, 10);
  const admin = await prisma.agente.upsert({
    where: { usuario: adminUser },
    update: {
      nombre: "Administrador",
      password: passHash,
      email: "admin@example.local",
      role: "ADMIN",
    },
    create: {
      nombre: "Administrador",
      usuario: adminUser,
      password: passHash,
      email: "admin@example.local",
      role: "ADMIN",
    },
  });

  // Asignación roles al admin
  await prisma.agenteRoleAssignment.deleteMany({ where: { agenteId: admin.id } });
  await prisma.agenteRoleAssignment.create({ data: { agenteId: admin.id, roleId: roleAdmin.id } });

  // Cliente DEMO
  const cliente = await prisma.cliente.upsert({
    where: { codigo: "DEMO" },
    update: { descripcion: "Cliente de demostración" },
    create: { codigo: "DEMO", descripcion: "Cliente de demostración" },
  });

  // Unidades fijas: CENTRAL y TODOS
  await prisma.unidadComercial.upsert({
    where: { clienteId_codigo: { clienteId: cliente.id, codigo: "CENTRAL" } },
    update: { descripcion: "Central", scope: "CENTRAL" },
    create: { clienteId: cliente.id, codigo: "CENTRAL", descripcion: "Central", scope: "CENTRAL" },
  });

  await prisma.unidadComercial.upsert({
    where: { clienteId_codigo: { clienteId: cliente.id, codigo: "TODOS" } },
    update: { descripcion: "Todos", scope: "TODOS" },
    create: { clienteId: cliente.id, codigo: "TODOS", descripcion: "Todos", scope: "TODOS" },
  });

  // Seed master data from backup when available
  const master = await seedMasterData(prisma);

  // Seed modules (only if no backup provided)
  if (!master.hasModulos) {
    await seedModulos(prisma);
  }

  // Seed dummy clients
  await seedDummyClientes(prisma);

  console.log("[seed] OK: RBAC + admin + cliente DEMO + unidades + módulos + dummy clients");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
