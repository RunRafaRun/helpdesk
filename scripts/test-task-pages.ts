import { chromium } from 'playwright';

async function testTaskPages() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Testing Task Pages ===\n');

  // 1. Login
  console.log('1. Logging in...');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');
  console.log('   ✓ Login successful\n');

  // 2. Navigate to Nueva Tarea
  console.log('2. Testing NuevaTarea page (/tareas/nueva)...');
  await page.goto('http://localhost:5173/tareas/nueva');
  await page.waitForLoadState('networkidle');

  // Check for required form elements
  const nuevaTareaFields = {
    'Título input': await page.locator('input[name="titulo"], input[placeholder*="título"], input[placeholder*="Título"]').count() > 0
      || await page.locator('input').filter({ hasText: /título/i }).count() > 0
      || await page.locator('input').first().isVisible(),
    'Cliente dropdown': await page.locator('select[name="clienteId"], [data-field="cliente"]').count() > 0
      || await page.getByText('Cliente').count() > 0,
    'UC dropdown': await page.locator('select[name="unidadComercialId"], [data-field="uc"]').count() > 0
      || await page.getByText(/U\.?C\.?|Unidad/i).count() > 0,
    'Módulo dropdown': await page.locator('select[name="moduloId"]').count() > 0
      || await page.getByText('Módulo').count() > 0,
    'Tipo dropdown': await page.locator('select[name="tipoId"]').count() > 0
      || await page.getByText('Tipo').count() > 0,
    'Prioridad dropdown': await page.locator('select[name="prioridadId"]').count() > 0
      || await page.getByText('Prioridad').count() > 0,
    'Mensaje textarea': await page.locator('textarea[name="mensajeInicial"], textarea').count() > 0,
    'Submit button': await page.locator('button[type="submit"], button:has-text("Aceptar"), button:has-text("Crear")').count() > 0,
  };

  console.log('   NuevaTarea Form Fields:');
  for (const [field, found] of Object.entries(nuevaTareaFields)) {
    console.log(`   ${found ? '✓' : '✗'} ${field}`);
  }

  // Take screenshot
  await page.screenshot({ path: 'scripts/screenshot-nueva-tarea.png', fullPage: true });
  console.log('   📸 Screenshot saved: scripts/screenshot-nueva-tarea.png\n');

  // Get page HTML structure for analysis
  const nuevaTareaHTML = await page.content();
  console.log('   Page title:', await page.title());

  // List all visible form elements
  console.log('\n   Visible form elements:');
  const labels = await page.locator('label').allTextContents();
  labels.forEach(l => console.log(`   - Label: ${l.trim()}`));

  const selects = await page.locator('select').count();
  console.log(`   - Select dropdowns: ${selects}`);

  const inputs = await page.locator('input').count();
  console.log(`   - Input fields: ${inputs}`);

  const textareas = await page.locator('textarea').count();
  console.log(`   - Textareas: ${textareas}`);

  // 3. Try to create a task if form is valid
  console.log('\n3. Attempting to fill and submit the form...');

  try {
    // Fill title
    const titleInput = page.locator('input').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Task from Playwright');
      console.log('   ✓ Title filled');
    }

    // Select first options in dropdowns
    const selectElements = page.locator('select');
    const selectCount = await selectElements.count();
    for (let i = 0; i < selectCount; i++) {
      const select = selectElements.nth(i);
      const options = await select.locator('option').count();
      if (options > 1) {
        await select.selectOption({ index: 1 });
      }
    }
    console.log(`   ✓ Selected options in ${selectCount} dropdowns`);

    // Fill message if textarea exists
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('This is a test task created by Playwright automation.');
      console.log('   ✓ Message filled');
    }

    // Take screenshot before submit
    await page.screenshot({ path: 'scripts/screenshot-nueva-tarea-filled.png', fullPage: true });
    console.log('   📸 Screenshot saved: scripts/screenshot-nueva-tarea-filled.png');

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Aceptar"), button:has-text("Crear")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✓ Form submitted');
    }
  } catch (e) {
    console.log(`   ⚠ Form interaction error: ${e}`);
  }

  // 4. Navigate to task list and then to a task detail
  console.log('\n4. Testing Tareas list page (/)...');
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'scripts/screenshot-tareas-list.png', fullPage: true });
  console.log('   📸 Screenshot saved: scripts/screenshot-tareas-list.png');

  // Check if there are tasks in the list
  const taskRows = await page.locator('table tbody tr, .task-row, [data-task-id]').count();
  console.log(`   Found ${taskRows} task rows`);

  // 5. Navigate to a task detail page
  console.log('\n5. Testing TareaFicha page (task detail)...');

  // Try to click on first task row or navigate directly
  try {
    const firstTaskLink = page.locator('table tbody tr a, a[href*="/tareas/"]').first();
    if (await firstTaskLink.isVisible()) {
      await firstTaskLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Try to get task ID from the page
      await page.goto('http://localhost:5173/tareas/1');
      await page.waitForLoadState('networkidle');
    }

    // Take screenshot
    await page.screenshot({ path: 'scripts/screenshot-tarea-ficha.png', fullPage: true });
    console.log('   📸 Screenshot saved: scripts/screenshot-tarea-ficha.png');

    // Check for required fields in task detail
    console.log('\n   TareaFicha Page Fields:');

    const fichaFields = [
      { name: 'Número', selector: 'text=/Número|#\\d+/' },
      { name: 'Cliente', selector: 'text=Cliente' },
      { name: 'UC', selector: 'text=/U\\.?C\\.?|Unidad/' },
      { name: 'Estado', selector: 'text=Estado' },
      { name: 'Tipo', selector: 'text=Tipo' },
      { name: 'Prioridad', selector: 'text=Prioridad' },
      { name: 'Módulo', selector: 'text=Módulo' },
      { name: 'Release', selector: 'text=Release' },
      { name: 'Hotfix', selector: 'text=Hotfix' },
      { name: 'Jefe Proyecto', selector: 'text=/Jefe.*Proy|JP/' },
      { name: 'Asignado', selector: 'text=Asignado' },
      { name: 'Reproducido', selector: 'text=Reproducido' },
      { name: 'Comments section', selector: 'text=/Comentario|Historial|Timeline/' },
    ];

    for (const field of fichaFields) {
      const found = await page.locator(field.selector).count() > 0;
      console.log(`   ${found ? '✓' : '✗'} ${field.name}`);
    }

    // Check for action buttons
    console.log('\n   Action Buttons:');
    const buttons = await page.locator('button').allTextContents();
    buttons.forEach(b => {
      if (b.trim()) console.log(`   - ${b.trim()}`);
    });

    // Check for ClientePopup trigger
    const popupButton = await page.locator('button:has-text("Ver Cliente"), button[title*="Cliente"], .cliente-popup-trigger').count();
    console.log(`\n   ClientePopup trigger: ${popupButton > 0 ? '✓ Found' : '✗ Not found'}`);

    // Check for comment editor
    const commentEditor = await page.locator('textarea, .tiptap, .ProseMirror, [contenteditable="true"]').count();
    console.log(`   Comment editor: ${commentEditor > 0 ? '✓ Found' : '✗ Not found'}`);

  } catch (e) {
    console.log(`   ⚠ Task detail error: ${e}`);
  }

  console.log('\n=== Test Complete ===');

  // Keep browser open for manual inspection
  console.log('\nBrowser will close in 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
}

testTaskPages().catch(console.error);
