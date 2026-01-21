import { PrismaClient } from '@prisma/client';

const modulos = [
  'AV-ANÁLISIS & REPORTING',
  'APP-BAR',
  'APP-COM',
  'APP-GOB',
  'APP-SST',
  'AV-PRESUPUESTOS',
  'AV-RESTAURANTES & TIENDAS',
  'AV-CONTRATACIÓN & VENTAS',
  'AV-CONFIGURACIÓN GENERAL',
  'AV-GESTIÓN GOLF',
  'AV-AMA LLAVES',
  'AV-INTEGRATIONS',
  'AV-FACTURACIÓN & FINANZAS',
  'AV-CRM OPERATIVO',
  'AV-COMPRAS & ALMACENES',
  'AV-RECEPCIÓN & RESERVAS',
  'AV-PETICIONES & INCIDENCIAS',
  'AV-PERSONAL',
  'AV-CENTROS WELLNESS',
  'APP-GX',
  'AVCLOUD-RESTAURANTES & TIENDAS',
  'AVCLOUD-DASHBOARD',
  'AVCLOUD-CONFIGURACIÓN GENERAL',
  'AVCLOUD-GUEST EXPERIENCE',
  'AVCLOUD-AMA LLAVES',
  'AVCLOUD-INTEGRATIONS',
  'AVCLOUD-MÓDULO GESTIÓN',
  'AVCLOUD-MICE',
  'AVCLOUD-COMPRAS & ALMACENES',
  'AVCLOUD-RECEPCIÓN & RESERVAS',
  'AVCLOUD-PETICIONES & INCIDENCIAS',
  'AVCLOUD-STAFF',
];

async function main(prisma: PrismaClient) {
  console.log('Importing modulos...');

  for (const codigo of modulos) {
    try {
      await prisma.modulo.upsert({
        where: { codigo },
        update: { descripcion: codigo },
        create: { codigo, descripcion: codigo },
      });
      console.log(`✓ ${codigo}`);
    } catch (error) {
      console.error(`✗ ${codigo}:`, error);
    }
  }

  console.log('\nDone! Total:', modulos.length);
}

// Export the function to be called from main seed
export { main };
