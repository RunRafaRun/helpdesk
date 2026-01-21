import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function restoreDummyData() {
  console.log("Restoring dummy data...");

  try {
    const fs = require('fs');

    if (!fs.existsSync('./prisma/dummy-data-backup.json')) {
      console.log("No backup file found. Run backup-dummy-data.ts first.");
      return;
    }

    const backup = JSON.parse(fs.readFileSync('./prisma/dummy-data-backup.json', 'utf8'));
    console.log(`Restoring from backup created at ${backup.timestamp}`);

    // Restore modules
    for (const module of backup.modules) {
      await prisma.modulo.upsert({
        where: { codigo: module.codigo },
        update: { descripcion: module.descripcion },
        create: module
      });
    }
    console.log(`✓ Restored ${backup.modules.length} modules`);

    // Restore clients with related data
    for (const client of backup.clients) {
      const { unidades, softwares, contactos, centrosTrabajo, conexiones, ...clientData } = client;

      // Create client
      const createdClient = await prisma.cliente.upsert({
        where: { codigo: clientData.codigo },
        update: clientData,
        create: clientData
      });

      // Restore unidades
      for (const unidad of unidades) {
        await prisma.unidadComercial.upsert({
          where: {
            clienteId_codigo: {
              clienteId: createdClient.id,
              codigo: unidad.codigo
            }
          },
          update: { ...unidad, clienteId: createdClient.id },
          create: { ...unidad, clienteId: createdClient.id }
        });
      }

      // Restore softwares
      for (const software of softwares) {
        await prisma.clienteSoftware.upsert({
          where: {
            clienteId_tipo_nombre: {
              clienteId: createdClient.id,
              tipo: software.tipo,
              nombre: software.nombre
            }
          },
          update: { ...software, clienteId: createdClient.id },
          create: { ...software, clienteId: createdClient.id }
        });
      }

      // Restore contactos
      for (const contacto of contactos) {
        await prisma.clienteContacto.create({
          data: { ...contacto, clienteId: createdClient.id }
        });
      }

      // Restore centros de trabajo
      for (const centro of centrosTrabajo) {
        await prisma.clienteCentroTrabajo.create({
          data: { ...centro, clienteId: createdClient.id }
        });
      }

      // Restore conexiones
      for (const conexion of conexiones) {
        await prisma.clienteConexion.create({
          data: { ...conexion, clienteId: createdClient.id }
        });
      }

      console.log(`✓ Restored client: ${clientData.codigo}`);
    }

    console.log(`✓ Restore completed: ${backup.clients.length} clients restored`);

  } catch (error) {
    console.error("Restore failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDummyData();