import { PrismaClient } from '@prisma/client';

const dummyClientes = [
  { codigo: 'MARRIOTT', descripcion: 'Marriott International Hotels', jefeProyecto1: 'admin', licenciaTipo: 'AAM' as const },
  { codigo: 'HILTON', descripcion: 'Hilton Hotels & Resorts', jefeProyecto1: 'admin', licenciaTipo: 'PPU' as const },
  { codigo: 'MELIA', descripcion: 'Meliá Hotels International', jefeProyecto1: 'admin', licenciaTipo: 'AAM' as const },
  { codigo: 'IBEROSTAR', descripcion: 'Iberostar Hotels & Resorts', jefeProyecto1: 'admin', licenciaTipo: 'AAM' as const },
  { codigo: 'NH', descripcion: 'NH Hotel Group', jefeProyecto1: 'admin', licenciaTipo: 'PPU' as const },
  { codigo: 'RIU', descripcion: 'RIU Hotels & Resorts', jefeProyecto1: 'admin', licenciaTipo: 'AAM' as const },
  { codigo: 'BARCELO', descripcion: 'Barceló Hotel Group', jefeProyecto1: 'admin', licenciaTipo: 'AAM' as const },
  { codigo: 'ACCOR', descripcion: 'Accor Hotels España', jefeProyecto1: 'admin', licenciaTipo: 'PPU' as const },
  { codigo: 'PARADORES', descripcion: 'Paradores de Turismo de España', jefeProyecto1: 'admin', licenciaTipo: 'AAM' as const },
  { codigo: 'EUROSTARS', descripcion: 'Eurostars Hotel Company', jefeProyecto1: 'admin', licenciaTipo: 'PPU' as const },
];

const unidadesTemplate = [
  { codigo: 'CENTRAL', descripcion: 'Oficina Central', scope: 'CENTRAL' as const },
  { codigo: 'HTL-MAD', descripcion: 'Hotel Madrid', scope: 'HOTEL' as const },
  { codigo: 'HTL-BCN', descripcion: 'Hotel Barcelona', scope: 'HOTEL' as const },
];

const softwareTemplate = [
  { tipo: 'PMS' as const, nombre: 'Avalon', version: '5.0' },
  { tipo: 'ERP' as const, nombre: 'SAP Business One', version: '10.0' },
];

const contactosTemplate = [
  { nombre: 'Director IT', cargo: 'Director de Tecnología', email: 'it@hotel.com', movil: '+34600000001', principal: true },
  { nombre: 'Responsable Soporte', cargo: 'Responsable de Soporte', email: 'soporte@hotel.com', movil: '+34600000002', principal: false },
];

const centrosTemplate = [
  { nombre: 'Sede Central', baseDatos: 'AntforHotel-Central' },
  { nombre: 'Hotel Principal', baseDatos: 'AntforHotel-Principal' },
];

const conexionesTemplate = [
  { nombre: 'VPN Producción', endpoint: 'Producción', usuario: 'soporte' },
  { nombre: 'VPN Desarrollo', endpoint: 'Desarrollo', usuario: 'dev' },
];

async function main(prisma: PrismaClient) {
  console.log('Creating dummy clientes...\n');

  for (const clienteData of dummyClientes) {
    try {
      // Check if cliente already exists
      const existing = await prisma.cliente.findUnique({ where: { codigo: clienteData.codigo } });
      if (existing) {
        console.log(`⏭ ${clienteData.codigo} already exists, skipping...`);
        continue;
      }

      // Create cliente
      const cliente = await prisma.cliente.create({
        data: {
          codigo: clienteData.codigo,
          descripcion: clienteData.descripcion,
          jefeProyecto1: clienteData.jefeProyecto1,
          licenciaTipo: clienteData.licenciaTipo,
        },
      });
      console.log(`✓ Created cliente: ${cliente.codigo}`);

      // Create unidades comerciales
      for (const unidad of unidadesTemplate) {
        await prisma.unidadComercial.create({
          data: {
            clienteId: cliente.id,
            codigo: `${cliente.codigo}-${unidad.codigo}`,
            descripcion: unidad.descripcion,
            scope: unidad.scope,
          },
        });
      }
      console.log(`  ✓ Created ${unidadesTemplate.length} unidades comerciales`);

      // Create software
      for (const sw of softwareTemplate) {
        await prisma.clienteSoftware.create({
          data: {
            clienteId: cliente.id,
            tipo: sw.tipo,
            nombre: sw.nombre,
            version: sw.version,
          },
        });
      }
      console.log(`  ✓ Created ${softwareTemplate.length} software entries`);

      // Create contactos
      for (const contacto of contactosTemplate) {
        await prisma.clienteContacto.create({
          data: {
            clienteId: cliente.id,
            nombre: `${contacto.nombre} - ${cliente.codigo}`,
            cargo: contacto.cargo,
            email: contacto.email.replace('@hotel.com', `@${cliente.codigo.toLowerCase()}.com`),
            movil: contacto.movil,
            principal: contacto.principal,
          },
        });
      }
      console.log(`  ✓ Created ${contactosTemplate.length} contactos`);

      // Create centros de trabajo
      for (const centro of centrosTemplate) {
        await prisma.clienteCentroTrabajo.create({
          data: {
            clienteId: cliente.id,
            nombre: centro.nombre,
            baseDatos: centro.baseDatos.replace('AntforHotel-', `AntforHotel-${cliente.codigo}-`),
          },
        });
      }
      console.log(`  ✓ Created ${centrosTemplate.length} centros de trabajo`);

      // Create conexiones
      for (const conexion of conexionesTemplate) {
        await prisma.clienteConexion.create({
          data: {
            clienteId: cliente.id,
            nombre: conexion.nombre,
            endpoint: conexion.endpoint,
            usuario: conexion.usuario,
          },
        });
      }
      console.log(`  ✓ Created ${conexionesTemplate.length} conexiones`);

      console.log('');
    } catch (error) {
      console.error(`✗ Error creating ${clienteData.codigo}:`, error);
    }
  }

  console.log('\nDone! Created dummy clientes with related data.');
}

// Export the function to be called from main seed
export { main };
