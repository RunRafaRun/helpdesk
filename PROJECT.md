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
  - `lookup.admin.controller.ts` - Lookup tables (tipos/estados/prioridades)
- **TareasModule**: Full task management with:
  - Auto-generated task number (yyyyNNNNN format, unique per year)
  - Timeline events (comments, status changes, assignments)
  - WYSIWYG editor (TipTap) for comments
  - Task filtering by client, status, priority, assigned agent
- **ClienteFichaModule**: Client profile data (software, contacts, users, connections, comments, work centers, release plans)
- **MailModule**: Email services with SMTP/Azure OAuth support and scheduled sending
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
| `/config/agentes` | Agent management |
| `/config/clientes` | Client list |
| `/config/clientes/:id` | Client edit form |
| `/config/modulos` | Module management |
| `/config/releases` | Release and hotfix management |
| `/config/roles` | Role and permissions management |
| `/config/tipos-tarea` | Task types management with icons |
| `/config/estados-tarea` | Task states management with icons and suggestions |
| `/config/prioridades-tarea` | Task priorities management with colors |
| `/config/notificaciones` | Email configuration |
| `/clientes/:clienteCodigo/ficha` | Client profile view with tabs |

### Key Data Models

| Model | Description |
|-------|-------------|
| **Agente** | Internal users (ADMIN or AGENTE role) |
| **Cliente** | Customer organizations with UnidadComercial units |
| **ClienteUsuario** | Customer portal users (mapped to `usuario_cliente` table) |
| **Tarea** | Support tickets with auto-generated numero, estado, tipo, prioridad |
| **TareaEvento** | Timeline events (COMENTARIO, CAMBIO_ESTADO, ASIGNACION, etc.) |
| **TipoTarea** | Task types with `orden` and `porDefecto` fields |
| **EstadoTarea** | Task states with `orden` and `porDefecto` fields |
| **PrioridadTarea** | Task priorities with `orden` and `porDefecto` fields |
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

### Lookup Tables (TipoTarea, EstadoTarea, PrioridadTarea)

These lookup tables have the following fields:
- `codigo` (String, unique) - Code identifier
- `descripcion` (String, optional) - Description
- `orden` (Int, default 0) - Sort order for dropdowns
- `porDefecto` (Boolean, default false) - Default value for new tasks (only one can be true)
- `icono` (String, optional) - Icon identifier in format "prefix:name" (e.g., "mdi:schedule", "lucide:clock")
- `color` (String, optional) - Hex color code for priority levels

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

## Authentication & Permissions

- JWT tokens via `/auth/login`
- Guards in `apps/api/src/auth/guards.ts`
- Permissions defined in `apps/api/src/auth/permissions.ts`

### Available Permissions (PermisoCodigo enum)
| Permission | Description |
|------------|-------------|
| CONFIG_MAESTROS | Task types, states, priorities management |
| CONFIG_AGENTES | Agent management |
| CONFIG_CLIENTES | Full client management |
| CONFIG_CLIENTES_READ | Read-only client access |
| CONFIG_UNIDADES | Commercial unit management |
| CONFIG_MODULOS | Module management |
| CONFIG_RELEASES | Release/hotfix management |
| CONFIG_RBAC | Role and permission management |
| CONFIG_NOTIFICACIONES | Mass notifications and mail config |

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
