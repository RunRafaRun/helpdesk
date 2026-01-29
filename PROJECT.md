# PROJECT.md - Helpdesk Application

This is the main project documentation file. All AI assistants should use this file as the primary reference for this codebase.

## Project Overview

Helpdesk application with JWT authentication, RBAC (Role-Based Access Control), and CRUD operations for managing clients, agents, tasks, and modules. Spanish language codebase.

**Current Status**: Database schema synchronized, environment properly configured, development environment working, task management fully implemented.

## Tech Stack

- **Backend (apps/api)**: NestJS with Fastify, Prisma 7.3.0 ORM, PostgreSQL, JWT auth
- **Frontend (apps/web)**: React 18, Vite, React Router, Tailwind CSS
- **Infrastructure**: Docker Compose (PostgreSQL, API, Web containers)
- **Language**: TypeScript for both backend and frontend
- **Database**: PostgreSQL

## Quick Start

### Start Development Environment
```powershell
docker compose -f infra/docker/compose.yml up --build
```

### Reset Database (clean start)
```powershell
docker compose -f infra/docker/compose.yml down -v
docker compose -f infra/docker/compose.yml up --build
```

### Docker Configuration
- **Database**: PostgreSQL 16 with UTF-8 charset support
- **API**: Prisma 7.3.0 with PostgreSQL adapter, environment variables configured
- **Web**: Vite dev server with hot reload
- **Bootstrap**: Automatic Prisma client generation, database sync, and seeding

### Development URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/docs |
| PostgreSQL | localhost:5433 |

### Default Credentials
- **Admin**: admin / admin123!

## Monorepo Structure

```
apps/
  api/           # NestJS backend API
  web/           # React frontend SPA
infra/
  docker/        # Docker Compose configuration
```

## Architecture

### Backend Modules (apps/api/src/)

- **AuthModule**: JWT authentication with Passport, login endpoint at `/auth/login`
- **AdminModule**: Admin CRUD controllers:
  - `agentes.admin.controller.ts` - Agent management
  - `clientes.admin.controller.ts` - Client management with nested resources
  - `modulos.admin.controller.ts` - Module management
  - `releases.admin.controller.ts` - Release/hotfix management
  - `rbac.admin.controller.ts` - Role and permission management
  - `configuracion.admin.controller.ts` - Mail configuration
  - `lookup.admin.controller.ts` - Permission-free lookups for dropdowns (clientes, modulos, releases, tipos/estados/prioridades)
  - `plantillas.admin.controller.ts` - Reusable text templates with wildcards
  - `dashboard.admin.controller.ts` - Dashboard layout configuration (admin customizable)
- **TareasModule**: Full task management with:
  - Auto-generated task number (yyyyNNNNN format, unique per year)
  - Timeline events (comments, status changes, assignments)
  - WYSIWYG editor (TipTap) for comments
  - Task filtering by client, status, priority, assigned agent
- **ClienteFichaModule**: Client profile data (software, contacts, users, connections, comments, work centers, release plans)
- **MailModule**: Email services with SMTP/Azure OAuth support and scheduled sending
- **NotificacionesModule**: Notification system with:
  - `NotificacionTareaService`: Queues notifications for task events
  - `WorkflowEvaluationService`: Evaluates workflow rules and resolves recipients
  - Support for both legacy config-based and workflow-based notifications
- **HealthModule**: Health check endpoint
- **PrismaModule**: Database access layer (singleton PrismaService)

### Frontend Routes (apps/web/src/routes/)

| Route | Description |
|-------|-------------|
| `/login` | Authentication |
| `/` | Task list with status icons (main landing page, protected) |
| `/tareas/nueva` | Create new task form |
| `/tareas/:id` | Task detail view with timeline and comments |
| `/notificaciones` | Mass notifications management |
| `/config/agentes` | Agent management with validation |
| `/config/clientes` | Client list |
| `/config/clientes/:id` | Client edit form |
| `/config/modulos` | Module management |
| `/config/releases` | Release/hotfix management with data integrity checks |
| `/config/roles` | Role and permissions management |
| `/config/tipos-tarea` | Task types management with icons and tablaRelacionada |
| `/config/estados-tarea` | Task states management with icons and suggestions |
| `/config/prioridades-tarea` | Task priorities management with colors |
| `/config/estados-peticion` | Secondary status (Estado Peticion) management |
| `/config/estado-flows` | Estado flow configuration per task type |
| `/config/estado-peticion-flows` | Estado Peticion flow configuration per task type |
| `/config/plantillas` | Reusable text templates with wildcards |
| `/config/notificaciones` | Email configuration |
| `/config/workflows` | Notification workflows (if-then rules engine) |
| `/config/log-notificaciones` | Notification log and queue management |
| `/clientes/:clienteCodigo/ficha` | Client profile view with tabs |
| `/` (Dashboard) | Statistics dashboard with dynamic priority colors (admin customizable layout) |

### Global Search

The header navigation includes two global search fields available on all authenticated pages:

**Text Search** (`Busqueda de texto...`):
- Searches in task titles and comment bodies
- Shows live dropdown with matching results as you type
- Groups results by task, showing matching comments under each task
- Highlights matching text in results
- Click on task to navigate to task detail
- Click on comment to navigate directly to that comment
- Debounced search (300ms delay) to avoid excessive API calls
- Minimum 2 characters to trigger search

**Task Number Search** (`Numero de Tarea...`):
- Enter task number (e.g., `202512345`) and press Enter
- Directly navigates to the task if found
- Shows error tooltip if task not found

**Backend Endpoints**:
- `GET /tareas/buscar/texto?texto=...&limit=...` - Full-text search in comments and titles
- `GET /tareas/buscar/numero/:numero` - Find task by numero field

**Frontend Components**:
- `apps/web/src/components/GlobalSearch.tsx` - Search component with both fields
- Integrated in `apps/web/src/routes/Shell.tsx` (header navigation)

### Dashboard Customization

Admins can customize the dashboard layout for all users:
- **Edit Mode**: Click "Editar" to enter edit mode (admin only)
- **Widget Visibility**: Toggle widgets on/off with eye icons
- **Widget Order**: Reorder widgets with up/down arrows
- **Persist**: Changes saved to database via `DashboardConfig` model
- **Reset**: Restore default layout with reset button

Widgets available:
1. Task Status Overview (Resumen Estado)
2. Tasks by Priority (Por Prioridad)
3. Tasks by Module (Por Modulo)
4. Recent Tasks (Tareas Recientes)
5. Tasks by Client (Por Cliente)

### Key Data Models

| Model | Description |
|-------|-------------|
| **Agente** | Internal users (ADMIN or AGENTE role) |
| **Cliente** | Customer organizations with UnidadComercial units |
| **ClienteUsuario** | Customer portal users (mapped to `usuario_cliente` table) |
| **Tarea** | Support tickets with auto-generated numero, estado, tipo, prioridad |
| **TareaEvento** | Timeline events (COMENTARIO, CAMBIO_ESTADO, ASIGNACION, etc.) |
| **TipoTarea** | Task types with `orden`, `porDefecto`, and `tablaRelacionada` fields |
| **EstadoTarea** | Task states with `orden` and `porDefecto` fields |
| **PrioridadTarea** | Task priorities with `orden` and `porDefecto` fields |
| **EstadoPeticion** | Secondary status for development workflow (e.g., Cliente-Aceptada, Dev-Desarrollo) |
| **TipoTareaEstadoFlow** | Estado flow configuration per task type |
| **TipoTareaEstado** | Allowed estados per flow |
| **TipoTareaTransicion** | Allowed transitions between estados |
| **TipoTareaEstadoPeticionFlow** | Estado Peticion flow configuration per task type |
| **TipoTareaEstadoPeticion** | Allowed estados peticion per flow |
| **TipoTareaTransicionPeticion** | Allowed transitions between estados peticion |
| **RoleEntity/Permission** | RBAC system with PermisoCodigo enum |
| **ClienteSoftware** | Client software inventory (PMS, ERP, etc.) |
| **ClienteContacto** | Client contacts with principal flag |
| **ClienteConexion** | Client connection credentials |
| **ClienteComentario** | Internal comments about clients |
| **ClienteCentroTrabajo** | Client work centers/databases |
| **ClienteReleasePlan** | Planned releases/hotfixes per client |
| **Release/Hotfix** | Software versions (hotfixes belong to releases) |
| **NotificacionMasiva** | Mass email notifications with scheduling |
| **ConfiguracionMail** | Email server configuration (SMTP or Azure OAuth) |
| **Plantilla** | Reusable text templates with wildcard support |
| **DashboardConfig** | Dashboard layout configuration (widget order and visibility) |
| **NotificationWorkflow** | If-then notification rules with triggers, conditions, recipients |
| **NotificationWorkflowCondition** | Filter conditions for workflows (field/operator/value) |
| **NotificationWorkflowRecipient** | Recipient configuration (type + value + To/Cc) |
| **NotificacionTarea** | Notification queue for task-related emails |
| **NotificacionConfigEvento** | Legacy event-based notification configuration |

### Lookup Tables (TipoTarea, EstadoTarea, PrioridadTarea, EstadoPeticion)

These lookup tables have the following fields:
- `codigo` (String, unique) - Code identifier
- `descripcion` (String, optional) - Description
- `orden` (Int, default 0) - Sort order for dropdowns
- `porDefecto` (Boolean, default false) - Default value for new tasks (only one can be true)
- `activo` (Boolean, default true) - Active/inactive status
- `color` (String, optional) - Hex color code for priority levels - PrioridadTarea only

**TipoTarea** has an additional field:
- `tablaRelacionada` (String, optional) - Links to a secondary status table (e.g., "EstadoPeticion")

**EstadoPeticion** is a secondary status system for tracking development workflow states:
- Client states: Cliente-Pendiente, Cliente-Aceptada, Cliente-Autorizada, Cliente-Rechazada, Cliente-Retenida
- Development states: Dev-Valorada, Dev-Desarrollo, Dev-Documentacion, Dev-Rechazada
- Support states: Sop-Pendiente, Sop-NoAutorizada, Sop-Terminada

#### State Flow Management

The application supports configurable state machine workflows for both EstadoTarea and EstadoPeticion:

**Estado Flows** (`/config/estado-flows`):
- Configure which EstadoTarea values are allowed for each TipoTarea
- Define allowed transitions between estados
- Set permissions per transition (agent/client can make this transition)
- Set initial estado override per TipoTarea
- Toggle notification on transition
- Active/inactive flow toggle

**Estado Peticion Flows** (`/config/estado-peticion-flows`):
- Same functionality as Estado Flows, but for EstadoPeticion
- Only shows TipoTarea that have `tablaRelacionada = "EstadoPeticion"`
- Configure which EstadoPeticion values are allowed
- Define allowed transitions with permissions

**Flow Models**:
| Model | Description |
|-------|-------------|
| TipoTareaEstadoFlow | Main flow definition linking TipoTarea to allowed estados |
| TipoTareaEstado | Junction table: which EstadoTarea values are allowed in a flow |
| TipoTareaTransicion | Allowed transitions with permissions (permiteAgente, permiteCliente, notificar) |
| TipoTareaEstadoPeticionFlow | Same as above but for EstadoPeticion |
| TipoTareaEstadoPeticion | Allowed EstadoPeticion values per flow |
| TipoTareaTransicionPeticion | Allowed transitions between EstadoPeticion values |

**Backend Endpoints**:
- `GET/POST/PUT/DELETE /admin/estado-flows` - Estado flow CRUD
- `GET /admin/estado-flows/by-tipo/:tipoTareaId` - Get flow by TipoTarea
- `POST /admin/estado-flows/:id/toggle` - Toggle flow active status
- `GET/POST/PUT/DELETE /admin/estado-peticion-flows` - Estado Peticion flow CRUD
- `GET /admin/estado-peticion-flows/by-tipo/:tipoTareaId` - Get flow by TipoTarea
- `POST /admin/estado-peticion-flows/:id/toggle` - Toggle flow active status

#### Data Integrity Checks

- **Releases/Hotfixes**: Cannot be deleted if they are referenced by tasks or client release plans
- **Validation**: All DTOs include proper validation decorators (@IsString, @IsEmail, @IsIn, etc.)
- **API Updates**: Full CRUD support for all lookup tables with proper error handling

#### Estado Display

Status indicators (EstadoTarea) now display as text-only badges without icons for a cleaner, more professional appearance.

When creating new tasks, the system uses the item with `porDefecto=true` as the default value. If none is set, it uses the first item by `orden`.

#### Icon System

The application uses a multi-collection icon system supporting:
- **Material Design Icons** (prefix: `mdi:`) - Primary collection for professional appearance
- **Lucide Icons** (prefix: `lucide:`) - Alternative collection, backward compatible

Icons are displayed throughout the UI using the `Icon` component (`apps/web/src/components/Icon.tsx`). The system provides:
- Graceful fallbacks (shows icon name if icon not found)
- Proper TypeScript support
- Consistent sizing and styling
- Support for both estado and priority icons

**Estado Display**:
- Status badges show code first, then icon (e.g., "PENDIENTE 🔄")
- Estado dropdowns show code + emoji icon (e.g., "PENDIENTE ⏰")
**Priority Display**: Priority badges show color-coded text only (no icons)

#### Plantillas (Templates) System

The application includes a reusable text template system for comments and notifications:

**Plantilla Model Fields**:
- `codigo` (String, unique) - Template identifier
- `descripcion` (String, optional) - Description
- `texto` (Text) - HTML template content (TipTap editor)
- `categoria` (String, optional) - Category for grouping
- `orden` (Int) - Sort order within category
- `activo` (Boolean) - Active/inactive status

**Wildcards (Dynamic Placeholders)**:
Templates and workflow subjects support wildcards that are replaced with actual values at runtime:

| Category | Wildcard | Description |
|----------|----------|-------------|
| **Tarea** | `{{tarea.numero}}` | Task number (e.g., 202512345) |
| | `{{tarea.titulo}}` | Task title |
| | `{{tarea.link}}` | Direct URL to the task |
| | `{{tarea.fechaCreacion}}` | Creation date/time |
| | `{{tarea.fechaCierre}}` | Closure date/time |
| | `{{tarea.reproducido}}` | Bug reproduced (Si/No) |
| **Estado** | `{{estado.codigo}}` | Status code |
| | `{{estado.descripcion}}` | Status description |
| **Tipo** | `{{tipo.codigo}}` | Task type code |
| | `{{tipo.descripcion}}` | Task type description |
| **Prioridad** | `{{prioridad.codigo}}` | Priority code |
| | `{{prioridad.descripcion}}` | Priority description |
| | `{{prioridad.color}}` | Priority color |
| **Modulo** | `{{modulo.codigo}}` | Module code |
| | `{{modulo.descripcion}}` | Module description |
| **Release** | `{{release.codigo}}` | Release code (e.g., R35) |
| | `{{release.descripcion}}` | Release description |
| | `{{release.rama}}` | Branch (DESARROLLO/PRODUCCION) |
| **Hotfix** | `{{hotfix.codigo}}` | Hotfix code |
| | `{{hotfix.descripcion}}` | Hotfix description |
| **Cliente** | `{{cliente.codigo}}` | Client code |
| | `{{cliente.nombre}}` | Client name |
| | `{{cliente.descripcion}}` | Client description |
| | `{{cliente.jefeProyecto1}}` | Project manager 1 |
| | `{{cliente.jefeProyecto2}}` | Project manager 2 |
| | `{{cliente.licencia}}` | License type |
| **Unidad** | `{{unidad.codigo}}` | Commercial unit code |
| | `{{unidad.nombre}}` | Commercial unit name |
| | `{{unidad.scope}}` | Scope (HOTEL/CENTRAL/TODOS) |
| **Agente** | `{{agente.nombre}}` | Event agent name |
| | `{{agente.email}}` | Event agent email |
| **Asignado** | `{{agenteAsignado.nombre}}` | Assigned agent name |
| | `{{agenteAsignado.email}}` | Assigned agent email |
| **Creador** | `{{agenteCreador.nombre}}` | Creator agent name |
| | `{{agenteCreador.email}}` | Creator agent email |
| **Revisor** | `{{agenteRevisor.nombre}}` | Reviewer agent name |
| | `{{agenteRevisor.email}}` | Reviewer agent email |
| **Usuario** | `{{usuarioCreador.nombre}}` | Client user creator name |
| | `{{usuarioCreador.email}}` | Client user creator email |
| **Evento** | `{{evento.fecha}}` | Event date/time |
| | `{{evento.contenido}}` | Comment/message content |
| | `{{evento.tipo}}` | Event type |
| **Cambio** | `{{cambio.campo}}` | Changed field name |
| | `{{cambio.anterior}}` | Previous value |
| | `{{cambio.nuevo}}` | New value |
| **Destinatario** | `{{destinatario.nombre}}` | Recipient name |
| | `{{destinatario.email}}` | Recipient email |
| **Fecha** | `{{fecha.actual}}` | Current date (DD/MM/YYYY) |
| | `{{fecha.hora}}` | Current time (HH:MM) |
| | `{{fecha.completa}}` | Current date and time |

**Frontend Components**:
- `apps/web/src/lib/wildcards.ts` - Wildcard definitions and resolution utilities
- `apps/web/src/components/WildcardPicker.tsx` - Reusable searchable wildcard dropdown
- `apps/web/src/components/TemplateSelector.tsx` - Reusable dropdown for template selection
- `apps/web/src/routes/config/Plantillas.tsx` - Template management config page

**Wildcard Insertion**:
- Wildcards insert at cursor position (not at end)
- TipTapEditor exposes `insertText()` method via ref
- Standard inputs track cursor position for insertion

**Integration Points**:
- Task comment editor (TareaFicha.tsx) - Insert templates in comments
- Mass notifications (NotificacionesMasivas.tsx) - Use templates in notification body
- Workflow custom subject (Workflows.tsx) - Use wildcards in email subject

#### Notification Workflows System

The application includes a powerful if-then rules engine for automated notifications:

**Workflow Model Fields**:
- `nombre` (String) - Workflow name
- `descripcion` (String, optional) - Description
- `trigger` (WorkflowTrigger enum) - Event that triggers the workflow
- `activo` (Boolean) - Active/inactive status
- `orden` (Int) - Evaluation order (lower = evaluated first)
- `stopOnMatch` (Boolean) - Stop evaluating subsequent workflows if this one matches
- `plantillaId` (UUID, optional) - Template to use for email body
- `asuntoCustom` (String, optional) - Custom email subject
- `ccJefeProyecto1/2` (Boolean) - Auto-CC project managers

**Workflow Triggers (WorkflowTrigger enum)**:
| Trigger | Description |
|---------|-------------|
| TAREA_CREADA | New task created |
| TAREA_MODIFICADA | Task modified |
| TAREA_CERRADA | Task closed |
| MENSAJE_CLIENTE | Client message added |
| RESPUESTA_AGENTE | Agent response added |
| NOTA_INTERNA | Internal note added |
| CAMBIO_ESTADO | Status changed |
| CAMBIO_ASIGNACION | Assignment changed |
| CAMBIO_PRIORIDAD | Priority changed |
| CAMBIO_TIPO | Type changed |
| CAMBIO_MODULO | Module changed |
| CAMBIO_RELEASE | Release/hotfix changed |

**Condition Fields (WorkflowConditionField enum)**:
- Task attributes: CLIENTE_ID, ESTADO_ID, TIPO_ID, PRIORIDAD_ID, MODULO_ID, RELEASE_ID, HOTFIX_ID
- Code-based: CLIENTE_CODIGO, ESTADO_CODIGO, TIPO_CODIGO, PRIORIDAD_CODIGO, etc.
- Assignments: ASIGNADO_A_ID, CREADO_POR_AGENTE_ID, CREADO_POR_CLIENTE_ID
- Change tracking: ESTADO_ANTERIOR_ID, ESTADO_NUEVO_ID, PRIORIDAD_ANTERIOR_ID, PRIORIDAD_NUEVA_ID

**Condition Operators (WorkflowConditionOperator enum)**:
EQUALS, NOT_EQUALS, IN, NOT_IN, IS_NULL, IS_NOT_NULL, CONTAINS, STARTS_WITH

**Recipient Types (WorkflowRecipientType enum)**:
| Type | Description |
|------|-------------|
| USUARIOS_CLIENTE | All users of the task's client |
| USUARIO_CLIENTE_CREADOR | The client user who created the task |
| JEFE_PROYECTO_1/2 | Client's project managers |
| AGENTE_ASIGNADO | Currently assigned agent |
| AGENTE_CREADOR | Agent who created the task |
| AGENTE_REVISOR | Task reviewer agent |
| AGENTES_ESPECIFICOS | Specific agents by ID |
| ROLES_ESPECIFICOS | All agents with specific roles |
| EMAILS_MANUALES | Manual email addresses |

**OR Group Logic**:
Conditions within the same `orGroup` are evaluated with OR logic. Different groups are evaluated with AND logic. This allows complex conditions like: "(cliente=A OR cliente=B) AND (prioridad=ALTA)".

**Workflow Actions (WorkflowActionType enum)**:
Workflows can automatically perform actions on the task when triggered:
| Action | Description |
|--------|-------------|
| CAMBIAR_ESTADO | Change task status |
| CAMBIAR_PRIORIDAD | Change task priority |
| CAMBIAR_TIPO | Change task type |
| ASIGNAR_AGENTE | Assign task to agent |
| CAMBIAR_MODULO | Change task module |
| CAMBIAR_RELEASE | Change task release |

Actions are executed in order after the notification is queued. Each action creates a timeline event marked as automatic. Loop prevention is built-in via `fromWorkflow` flag.

**Backend Components**:
- `apps/api/src/admin/workflows.admin.controller.ts` - CRUD endpoints for workflows
- `apps/api/src/notificaciones/workflow-evaluation.service.ts` - Workflow evaluation engine
- `apps/api/src/notificaciones/notificacion-tarea.service.ts` - Integration with notification queue

**Frontend Components**:
- `apps/web/src/routes/config/Workflows.tsx` - Workflow management page

## Authentication & Permissions

- JWT tokens via `/auth/login`
- Guards in `apps/api/src/auth/guards.ts`
- Permissions defined in `apps/api/src/auth/permissions.ts`

### Available Permissions (PermisoCodigo enum)
| Permission | Description |
|------------|-------------|
| CONFIG_MAESTROS | Task types, states, priorities, plantillas management |
| CONFIG_AGENTES | Agent management |
| CONFIG_CLIENTES | Full client management |
| CONFIG_CLIENTES_READ | Read-only client access |
| CONFIG_UNIDADES | Commercial unit management |
| CONFIG_MODULOS | Module management |
| CONFIG_RELEASES | Release/hotfix management |
| CONFIG_RBAC | Role and permission management |
| CONFIG_NOTIFICACIONES | Mass notifications, mail config, and notification workflows |

### Permission-Free Lookup Endpoints

For dropdowns in task forms, the following endpoints require only JWT authentication (no specific permissions):
- `GET /admin/lookup/clientes` - Returns active clients with id, codigo, descripcion, jefeProyecto1, jefeProyecto2
- `GET /admin/lookup/modulos` - Returns active modules with id, codigo, descripcion
- `GET /admin/lookup/releases` - Returns all releases with hotfixes
- `GET /admin/lookup/tipos-tarea` - Returns task types
- `GET /admin/lookup/estados-tarea` - Returns task states
- `GET /admin/lookup/prioridades-tarea` - Returns task priorities

This allows agents (AGENTE role) to create/edit tasks without requiring CONFIG_CLIENTES or CONFIG_MODULOS permissions.

## Common Commands

### Database Operations (inside API container)
```bash
docker exec -it helpdesk-api sh
npx prisma migrate dev --name <migration_name>
npx ts-node prisma/seed.ts
```

### API Development (local)
```bash
cd apps/api
npm run start:dev          # Dev server with watch mode
npm run build              # Build for production
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate:dev # Run migrations
```

### Web Development (local)
```bash
cd apps/web
npm run dev     # Dev server on port 5173
npm run build   # TypeScript check + Vite build
```

### Data Backup/Restore (for preserving dummy data)
```bash
# Before resetting database
docker exec helpdesk-api sh -c "cd /app && npm run prisma:backup-dummy"

# After running migrations and seed
docker exec helpdesk-api sh -c "cd /app && npm run prisma:restore-dummy"
```

## Auto-bootstrap (Docker)

When running `docker compose up`, the API container automatically executes:
1. `prisma generate`
2. `prisma db push`
3. `prisma/seed.ts` (idempotent)

This creates:
- RBAC permissions and default roles
- Admin user (admin/admin123!)
- DEMO client with units CENTRAL/TODOS
- 32 software modules (AV-*, AVCLOUD-*, APP-*)
- 10 dummy hotel chain clients with full data
- Default task types, states, and priorities

## Prisma Configuration (v7.3.0)

Prisma 7.x uses a new configuration approach:
- **Schema file**: No longer contains `url` property
- **Config file**: `apps/api/prisma/prisma.config.ts` contains database URL
- **Client**: Uses PostgreSQL adapter for direct database connections

## Environment Setup

For local development (outside Docker), create `.env` in `apps/api/`:
```
DATABASE_URL="postgresql://app:apppass@localhost:5433/helpdesk?schema=public"
JWT_SECRET="your-secret-key"
```

## Coding Conventions

- Follow existing code style in each file
- Use TypeScript strictly
- No comments unless necessary
- Mimic existing patterns for components, modules, etc.
- Security best practices: no secrets in code
- Use bcryptjs for password hashing (not bcrypt)
- Model names in Prisma use PascalCase (ClienteUsuario, not UsuarioCliente)
- Spanish for UI text and user-facing content
- English for code (variable names, functions)

## Troubleshooting

### Prisma Schema Not Found
- Ensure you're in the correct directory: `cd apps/api`
- Schema location: `apps/api/prisma/schema.prisma`

### Database Connection Issues
- Ensure Docker containers are running: `docker ps`
- Check `.env` file exists in `apps/api/` with correct `DATABASE_URL`
- Reset: `docker compose -f infra/docker/compose.yml down -v && docker compose -f infra/docker/compose.yml up --build`

### TypeScript Compilation Errors
- Check that model names match Prisma schema (e.g., `prisma.clienteUsuario` not `prisma.usuarioCliente`)
- Use bcryptjs instead of bcrypt for password hashing

## Version Control

- Git repository
- Commit messages in Spanish or English, descriptive
- Never commit secrets or keys
- Co-author commits with AI assistance

## AI Coordination Notes

- Always read this file (PROJECT.md) before making changes
- Update this file if project structure or conventions change
- Use tools to verify changes (lint, typecheck)
- Commit only when explicitly asked
- Check existing code patterns before implementing new features
