import { PrismaClient, PermisoCodigo } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  // AGENTE => de momento ninguno de configuración (cuando hagamos panel agente, añadimos permisos funcionales)
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

  // Módulos: precargar algunos si está vacío (mínimo)
  const modCount = await prisma.modulo.count();
  if (modCount === 0) {
    await prisma.modulo.createMany({
      data: [
        { codigo: "AVA-GENERAL", descripcion: "Avalon Escritorio - General" },
        { codigo: "AVC-GENERAL", descripcion: "Avalon Cloud - General" },
      ],
    });
  }

  console.log("[seed] OK: RBAC + admin + cliente DEMO + unidades + módulos básicos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
