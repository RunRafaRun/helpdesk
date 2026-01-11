"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminUser = "admin";
    const adminPass = "admin123!";
    for (const codigo of Object.values(client_1.PermisoCodigo)) {
        await prisma.permission.upsert({
            where: { codigo },
            update: {},
            create: { codigo },
        });
    }
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
    await prisma.rolePermission.deleteMany({ where: { roleId: roleAdmin.id } });
    await prisma.rolePermission.createMany({
        data: allPerms.map((p) => ({ roleId: roleAdmin.id, permissionId: p.id })),
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: roleAgente.id } });
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
    await prisma.agenteRoleAssignment.deleteMany({ where: { agenteId: admin.id } });
    await prisma.agenteRoleAssignment.create({ data: { agenteId: admin.id, roleId: roleAdmin.id } });
    const cliente = await prisma.cliente.upsert({
        where: { codigo: "DEMO" },
        update: { descripcion: "Cliente de demostración" },
        create: { codigo: "DEMO", descripcion: "Cliente de demostración" },
    });
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
//# sourceMappingURL=seed.js.map