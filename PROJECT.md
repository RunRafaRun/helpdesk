# PROJECT DEFINITION: Helpdesk Application

This file provides comprehensive guidance for all AIs working on this helpdesk project. It consolidates all project information to coordinate efforts and prevent loss of changes. Update this file whenever significant changes are made to the project structure, dependencies, or conventions.

## Project Overview

Helpdesk application with JWT authentication, RBAC (Role-Based Access Control), and CRUD operations for managing clients, agents, tasks, and modules. Spanish language codebase.

**Current Status**: Database schema synchronized, environment properly configured, development environment working.

Includes:
- Auth JWT (login admin)
- Basic CRUD for masters (Clientes, Unidades Comerciales, Agentes, ClienteUsuarios)
- Client profile management (software, contacts, users, connections, comments, work centers, releases)
- Mass notifications with scheduling
- Release/hotfix management
- Email configuration (SMTP/Azure OAuth)
- Seed creates an initial ADMIN agent (user: admin, password: admin123!)
- Seed creates a DEMO client with units CENTRAL/TODOS
- Seed creates 32 software modules and 10 dummy hotel clients

## Tech Stack

- **Backend (apps/api)**: NestJS with Fastify, Prisma ORM, PostgreSQL, JWT auth
- **Frontend (apps/web)**: React 18, Vite, React Router, Tailwind CSS
- **Infrastructure**: Docker Compose (PostgreSQL, API, Web containers)
- **Language**: TypeScript for both backend and frontend
- **Database**: PostgreSQL

## Monorepo Structure

- `apps/api/`: NestJS backend API
- `apps/web/`: React frontend SPA
- `infra/docker/`: Docker Compose configuration

## Architecture

### Backend Modules (apps/api/src/)
- **AuthModule**: JWT authentication with Passport, login endpoint at `/auth/login`
- **AdminModule**: Admin CRUD controllers:
  - `agentes.admin.controller.ts` - Agent management
  - `clientes.admin.controller.ts` - Client management with nested resources
  - `modulos.admin.controller.ts` - Module management (renamed from Modulos)
  - `releases.admin.controller.ts` - Release/hotfix management
  - `rbac.admin.controller.ts` - Role and permission management
  - `configuracion.admin.controller.ts` - Mail configuration
  - `notificaciones.admin.controller.ts` - Mass notifications
- **TareasModule**: Task management (Tareas) with events timeline
- **ClienteFichaModule**: Client profile data with controllers for:
  - Software, Contacts, Connections, Comments, Work Centers, Release Plans, Users, Units
- **MailModule**: Email services with SMTP/Azure OAuth support and cron-based scheduled sending
- **HealthModule**: Health check endpoint
- **PrismaModule**: Database access layer (singleton PrismaService)

### Frontend Routes (apps/web/src/routes/)
- `/login`: Authentication
- `/`: Dashboard (protected)
- `/notificaciones`: Mass notifications (send, schedule, history)
- `/config/agentes`: Agent management
- `/config/clientes`: Client list
- `/config/clientes/:id`: Client edit form
- `/config/modulos`: Module management
- `/config/releases`: Release and hotfix management
- `/config/roles`: Role and permissions management
- `/config/configuracion`: General configuration (mail settings)
- `/clientes/:clienteId/ficha`: Client profile view with tabs

### Key Data Models
- **Agente**: Internal users (ADMIN or AGENTE role)
- **Cliente**: Customer organizations with UnidadComercial units
- **ClienteUsuario**: Customer portal users (mapped to `usuario_cliente` table)
- **Tarea**: Support tickets with TareaEvento timeline
- **RoleEntity/Permission**: RBAC system with PermisoCodigo enum
- **ClienteSoftware**: Client software inventory (PMS, ERP, PERIFERIA, etc.)
- **ClienteContacto**: Client contacts with principal flag
- **ClienteConexion**: Client connection credentials (secretRef for passwords)
- **ClienteComentario**: Internal comments about clients (with destacado flag)
- **ClienteCentroTrabajo**: Client work centers/databases
- **ClienteReleasePlan**: Planned releases/hotfixes per client
- **Release/Hotfix**: Software versions (hotfixes belong to releases)
- **NotificacionMasiva**: Mass email notifications with scheduling
- **ConfiguracionMail**: Email server configuration (SMTP or Azure OAuth)

## Authentication & Permissions
- JWT tokens via `/auth/login`
- Guards in `apps/api/src/auth/guards.ts`
- Permissions defined in `apps/api/src/auth/permissions.ts`
- Available permissions (PermisoCodigo enum):
  - CONFIG_MAESTROS - General master data access
  - CONFIG_AGENTES - Agent management
  - CONFIG_CLIENTES - Full client management
  - CONFIG_CLIENTES_READ - Read-only client access
  - CONFIG_UNIDADES - Commercial unit management
  - CONFIG_MODULOS - Module management
  - CONFIG_RELEASES - Release/hotfix management
  - CONFIG_RBAC - Role and permission management
  - CONFIG_NOTIFICACIONES - Mass notifications and mail config
- Default admin: `admin` / `admin123!`

## Common Commands

### Start Development Environment
```powershell
docker compose -f infra/docker/compose.yml up --build
```

### Reset Database (clean start)
```powershell
docker compose -f infra/docker/compose.yml down -v
docker compose -f infra/docker/compose.yml up --build
```

### Database Operations
For development (Docker environment):
- Database schema is automatically synchronized via `prisma db push` during container startup
- Use migrations only for schema changes that need version control

Inside API container:
```bash
docker exec -it helpdesk-api sh
npx prisma migrate dev --name <migration_name>
npx ts-node prisma/seed.ts
```

### API Development
```bash
cd apps/api
npm run start:dev          # Dev server with watch mode
npm run build              # Build for production
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate:dev # Run migrations
```

### Web Development
```bash
cd apps/web
npm run dev     # Dev server on port 5173
npm run build   # TypeScript check + Vite build
```

## Development URLs
- API: http://localhost:8080 (Docker)
- Swagger: http://localhost:8080/docs (Docker)
- Frontend: http://localhost:5173
- Database: localhost:5433 (PostgreSQL in Docker)

## Auto-bootstrap (dev)
When running `docker compose up`, the API container automatically executes:
- `prisma generate`
- `prisma db push`
- `prisma/seed.ts` (idempotent)

This ensures tables and seed data exist (admin user, modules, demo client, dummy clients).

## Environment Setup
For local development, create a `.env` file in `apps/api/` with:
```
DATABASE_URL="postgresql://app:apppass@localhost:5433/helpdesk?schema=public"
JWT_SECRET="your-secret-key"
```

## Login Credentials
- Admin: admin / admin123!

## Coding Conventions
- Follow existing code style in each file
- Use TypeScript strictly
- No comments unless necessary
- Mimic existing patterns for components, modules, etc.
- Security best practices: no secrets in code
- Use bcryptjs for password hashing (not bcrypt)
- Model names in Prisma use PascalCase (ClienteUsuario, not UsuarioCliente)

## Version Control
- Git repository
- Commit messages in Spanish or English, descriptive
- Never commit secrets or keys
- Co-author commits with AI assistance

## Troubleshooting

### Prisma Schema Not Found
If you get "Could not find Prisma Schema" error:
- Ensure you're in the correct directory: `cd apps/api`
- Schema location: `apps/api/prisma/schema.prisma`

### Database Connection Issues
- Ensure Docker containers are running: `docker ps`
- Check `.env` file exists in `apps/api/` with correct `DATABASE_URL`
- Reset database if needed: `docker compose -f infra/docker/compose.yml down -v && docker compose -f infra/docker/compose.yml up --build`

### TypeScript Compilation Errors
- Check that model names match Prisma schema (e.g., `prisma.clienteUsuario` not `prisma.usuarioCliente`)
- Use bcryptjs instead of bcrypt for password hashing

## AI Coordination Notes
- Always read this file before making changes
- Update this file if project structure or conventions change
- Use tools to verify changes (lint, typecheck)
- Commit only when explicitly asked
- Check existing code patterns before implementing new features
