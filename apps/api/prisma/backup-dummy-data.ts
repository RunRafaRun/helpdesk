import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backupDummyData() {
  console.log("Backing up dummy data...");

  try {
    // Export modules (skip basic ones created by seed.ts)
    const modules = await prisma.modulo.findMany({
      where: {
        NOT: {
          codigo: {
            in: ["AVA-GENERAL", "AVC-GENERAL"]
          }
        }
      }
    });

    // Export dummy clients (skip DEMO)
    const clients = await prisma.cliente.findMany({
      where: {
        NOT: { codigo: "DEMO" }
      },
      include: {
        unidades: true,
        softwares: true,
        contactos: true,
        centrosTrabajo: true,
        conexiones: true,
      }
    });

    const backup = {
      modules,
      clients,
      timestamp: new Date().toISOString()
    };

    // Write to file
    const fs = require('fs');
    fs.writeFileSync('./prisma/dummy-data-backup.json', JSON.stringify(backup, null, 2));

    console.log(`✓ Backup created with ${modules.length} modules and ${clients.length} clients`);
    console.log("File: prisma/dummy-data-backup.json");

  } catch (error) {
    console.error("Backup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDummyData();