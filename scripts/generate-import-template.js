const path = require('path');
const ExcelJS = require(path.join(__dirname, '..', 'apps', 'api', 'node_modules', 'exceljs'));

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Helpdesk Import Tool';
  workbook.created = new Date();

  // ============================================
  // SHEET 1: Clientes (main)
  // ============================================
  const clientesSheet = workbook.addWorksheet('Clientes');
  clientesSheet.columns = [
    { header: 'codigo', key: 'codigo', width: 15 },
    { header: 'descripcion', key: 'descripcion', width: 40 },
    { header: 'jefeProyecto1', key: 'jefeProyecto1', width: 20 },
    { header: 'jefeProyecto2', key: 'jefeProyecto2', width: 20 },
    { header: 'licenciaTipo', key: 'licenciaTipo', width: 15 },
  ];
  styleHeader(clientesSheet);
  addDataValidation(clientesSheet, 'E', ['AAM', 'PPU']);
  addExampleRow(clientesSheet, ['CLI001', 'Hotel Example S.L.', 'Juan Pérez', 'María García', 'AAM']);

  // ============================================
  // SHEET 2: UnidadesComerciales
  // ============================================
  const unidadesSheet = workbook.addWorksheet('UnidadesComerciales');
  unidadesSheet.columns = [
    { header: 'clienteCodigo', key: 'clienteCodigo', width: 15 },
    { header: 'codigo', key: 'codigo', width: 15 },
    { header: 'descripcion', key: 'descripcion', width: 40 },
    { header: 'activo', key: 'activo', width: 10 },
    { header: 'scope', key: 'scope', width: 15 },
  ];
  styleHeader(unidadesSheet);
  addDataValidation(unidadesSheet, 'D', ['SI', 'NO']);
  addDataValidation(unidadesSheet, 'E', ['HOTEL', 'CENTRAL', 'TODOS']);
  addExampleRow(unidadesSheet, ['CLI001', 'HTLMAD', 'Hotel Madrid', 'SI', 'HOTEL']);

  // ============================================
  // SHEET 3: ClienteUsuarios
  // ============================================
  const usuariosSheet = workbook.addWorksheet('ClienteUsuarios');
  usuariosSheet.columns = [
    { header: 'clienteCodigo', key: 'clienteCodigo', width: 15 },
    { header: 'nombre', key: 'nombre', width: 30 },
    { header: 'usuario', key: 'usuario', width: 20 },
    { header: 'password', key: 'password', width: 20 },
    { header: 'email', key: 'email', width: 30 },
    { header: 'telefono', key: 'telefono', width: 15 },
    { header: 'tipo', key: 'tipo', width: 15 },
    { header: 'activo', key: 'activo', width: 10 },
    { header: 'principal', key: 'principal', width: 10 },
    { header: 'recibeNotificaciones', key: 'recibeNotificaciones', width: 20 },
  ];
  styleHeader(usuariosSheet);
  addDataValidation(usuariosSheet, 'H', ['SI', 'NO']);
  addDataValidation(usuariosSheet, 'I', ['SI', 'NO']);
  addDataValidation(usuariosSheet, 'J', ['SI', 'NO']);
  addExampleRow(usuariosSheet, ['CLI001', 'Carlos López', 'clopez', 'Pass123!', 'clopez@hotel.com', '+34612345678', 'ADMIN', 'SI', 'SI', 'SI']);

  // ============================================
  // SHEET 4: ClienteContactos
  // ============================================
  const contactosSheet = workbook.addWorksheet('ClienteContactos');
  contactosSheet.columns = [
    { header: 'clienteCodigo', key: 'clienteCodigo', width: 15 },
    { header: 'nombre', key: 'nombre', width: 30 },
    { header: 'cargo', key: 'cargo', width: 25 },
    { header: 'email', key: 'email', width: 30 },
    { header: 'movil', key: 'movil', width: 15 },
    { header: 'principal', key: 'principal', width: 10 },
    { header: 'notas', key: 'notas', width: 40 },
    { header: 'activo', key: 'activo', width: 10 },
  ];
  styleHeader(contactosSheet);
  addDataValidation(contactosSheet, 'F', ['SI', 'NO']);
  addDataValidation(contactosSheet, 'H', ['SI', 'NO']);
  addExampleRow(contactosSheet, ['CLI001', 'Ana Martínez', 'Directora IT', 'ana@hotel.com', '+34698765432', 'SI', 'Contacto principal para soporte', 'SI']);

  // ============================================
  // SHEET 5: ClienteSoftware
  // ============================================
  const softwareSheet = workbook.addWorksheet('ClienteSoftware');
  softwareSheet.columns = [
    { header: 'clienteCodigo', key: 'clienteCodigo', width: 15 },
    { header: 'tipo', key: 'tipo', width: 15 },
    { header: 'nombre', key: 'nombre', width: 30 },
    { header: 'version', key: 'version', width: 15 },
    { header: 'moduloCodigo', key: 'moduloCodigo', width: 20 },
    { header: 'notas', key: 'notas', width: 40 },
  ];
  styleHeader(softwareSheet);
  addDataValidation(softwareSheet, 'B', ['GP', 'PM', 'PLATAFORMA', 'OTRO']);
  addExampleRow(softwareSheet, ['CLI001', 'GP', 'Guest Platform', '3.5.2', 'MOD_RESERVAS', 'Instalado en producción']);

  // ============================================
  // SHEET 6: ClienteConexiones
  // ============================================
  const conexionesSheet = workbook.addWorksheet('ClienteConexiones');
  conexionesSheet.columns = [
    { header: 'clienteCodigo', key: 'clienteCodigo', width: 15 },
    { header: 'nombre', key: 'nombre', width: 25 },
    { header: 'endpoint', key: 'endpoint', width: 50 },
    { header: 'usuario', key: 'usuario', width: 20 },
    { header: 'secretRef', key: 'secretRef', width: 30 },
    { header: 'notas', key: 'notas', width: 40 },
  ];
  styleHeader(conexionesSheet);
  addExampleRow(conexionesSheet, ['CLI001', 'VPN Producción', 'vpn.hotel.com:1194', 'soporte', 'vault://secrets/cli001/vpn', 'Acceso remoto principal']);

  // ============================================
  // SHEET 7: ClienteCentrosTrabajo
  // ============================================
  const centrosSheet = workbook.addWorksheet('ClienteCentrosTrabajo');
  centrosSheet.columns = [
    { header: 'clienteCodigo', key: 'clienteCodigo', width: 15 },
    { header: 'nombre', key: 'nombre', width: 30 },
    { header: 'direccion', key: 'direccion', width: 40 },
    { header: 'ciudad', key: 'ciudad', width: 20 },
    { header: 'provincia', key: 'provincia', width: 20 },
    { header: 'codigoPostal', key: 'codigoPostal', width: 15 },
    { header: 'pais', key: 'pais', width: 15 },
    { header: 'notas', key: 'notas', width: 40 },
  ];
  styleHeader(centrosSheet);
  addExampleRow(centrosSheet, ['CLI001', 'Oficina Central', 'Calle Gran Vía 123', 'Madrid', 'Madrid', '28013', 'España', 'Sede principal']);

  // ============================================
  // SHEET 8: Instrucciones
  // ============================================
  const instruccionesSheet = workbook.addWorksheet('Instrucciones');
  instruccionesSheet.columns = [
    { header: 'Campo', key: 'campo', width: 25 },
    { header: 'Descripción', key: 'descripcion', width: 80 },
  ];
  styleHeader(instruccionesSheet);

  const instrucciones = [
    ['--- HOJA: Clientes ---', ''],
    ['codigo', 'Código único del cliente (obligatorio, máx 50 caracteres)'],
    ['descripcion', 'Nombre o descripción del cliente'],
    ['jefeProyecto1', 'Usuario del primer jefe de proyecto asignado'],
    ['jefeProyecto2', 'Usuario del segundo jefe de proyecto asignado'],
    ['licenciaTipo', 'Tipo de licencia: AAM o PPU'],
    ['', ''],
    ['--- HOJA: UnidadesComerciales ---', ''],
    ['clienteCodigo', 'Código del cliente al que pertenece (debe existir en hoja Clientes)'],
    ['codigo', 'Código único de la unidad dentro del cliente'],
    ['descripcion', 'Nombre o descripción de la unidad comercial'],
    ['activo', 'SI o NO'],
    ['scope', 'HOTEL, CENTRAL o TODOS'],
    ['', ''],
    ['--- HOJA: ClienteUsuarios ---', ''],
    ['clienteCodigo', 'Código del cliente (debe existir en hoja Clientes)'],
    ['nombre', 'Nombre completo del usuario'],
    ['usuario', 'Nombre de usuario para login (único en todo el sistema)'],
    ['password', 'Contraseña inicial del usuario'],
    ['email', 'Correo electrónico'],
    ['telefono', 'Teléfono de contacto'],
    ['tipo', 'Tipo de usuario (ej: ADMIN, USUARIO)'],
    ['activo', 'SI o NO'],
    ['principal', 'SI si es el usuario principal del cliente'],
    ['recibeNotificaciones', 'SI o NO'],
    ['', ''],
    ['--- HOJA: ClienteContactos ---', ''],
    ['clienteCodigo', 'Código del cliente (debe existir en hoja Clientes)'],
    ['nombre', 'Nombre del contacto'],
    ['cargo', 'Cargo o puesto'],
    ['email', 'Correo electrónico'],
    ['movil', 'Teléfono móvil'],
    ['principal', 'SI si es el contacto principal'],
    ['notas', 'Notas adicionales'],
    ['activo', 'SI o NO'],
    ['', ''],
    ['--- HOJA: ClienteSoftware ---', ''],
    ['clienteCodigo', 'Código del cliente (debe existir en hoja Clientes)'],
    ['tipo', 'GP, PM, PLATAFORMA u OTRO'],
    ['nombre', 'Nombre del software'],
    ['version', 'Versión instalada'],
    ['moduloCodigo', 'Código del módulo asociado (opcional, debe existir en sistema)'],
    ['notas', 'Notas adicionales'],
    ['', ''],
    ['--- HOJA: ClienteConexiones ---', ''],
    ['clienteCodigo', 'Código del cliente (debe existir en hoja Clientes)'],
    ['nombre', 'Nombre descriptivo de la conexión'],
    ['endpoint', 'URL o endpoint de conexión'],
    ['usuario', 'Usuario de acceso'],
    ['secretRef', 'Referencia al secreto (no guardar contraseñas en texto plano)'],
    ['notas', 'Notas adicionales'],
    ['', ''],
    ['--- HOJA: ClienteCentrosTrabajo ---', ''],
    ['clienteCodigo', 'Código del cliente (debe existir en hoja Clientes)'],
    ['nombre', 'Nombre del centro de trabajo'],
    ['direccion', 'Dirección completa'],
    ['ciudad', 'Ciudad'],
    ['provincia', 'Provincia o estado'],
    ['codigoPostal', 'Código postal'],
    ['pais', 'País'],
    ['notas', 'Notas adicionales'],
    ['', ''],
    ['--- NOTAS GENERALES ---', ''],
    ['', 'La fila 2 de cada hoja contiene un ejemplo que debe eliminarse antes de importar'],
    ['', 'Los campos con SI/NO deben usar exactamente esos valores'],
    ['', 'El clienteCodigo debe coincidir exactamente con el codigo de la hoja Clientes'],
    ['', 'Todos los códigos son case-sensitive'],
  ];

  instrucciones.forEach(row => {
    instruccionesSheet.addRow({ campo: row[0], descripcion: row[1] });
  });

  // Save file
  const outputPath = path.join(__dirname, '..', 'plantilla_importacion_clientes.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Template created: ${outputPath}`);
}

function styleHeader(sheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center' };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length }
  };
}

function addDataValidation(sheet, column, values) {
  sheet.getColumn(column).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${values.join(',')}"`]
      };
    }
  });
  // Apply to rows 2-1000 for future data
  for (let i = 2; i <= 1000; i++) {
    sheet.getCell(`${column}${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${values.join(',')}"`]
    };
  }
}

function addExampleRow(sheet, values) {
  const row = sheet.addRow(values);
  row.font = { italic: true, color: { argb: 'FF808080' } };
}

generateTemplate().catch(console.error);
