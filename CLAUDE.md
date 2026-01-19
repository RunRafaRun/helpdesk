# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Helpdesk application with JWT authentication, RBAC (Role-Based Access Control), and CRUD operations for managing clients, agents, tasks, and modules. Spanish language codebase.

## Tech Stack

- **Backend (apps/api)**: NestJS with Fastify, Prisma ORM, PostgreSQL, JWT auth
- **Frontend (apps/web)**: React 18, Vite, React Router, Tailwind CSS
- **Infrastructure**: Docker Compose (PostgreSQL, API, Web containers)

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

### Database Operations (inside api container)
```powershell
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

## Architecture

### Monorepo Structure
- `apps/api/` - NestJS backend API
- `apps/web/` - React frontend SPA
- `infra/docker/` - Docker Compose configuration

### Backend Modules (apps/api/src/)
- **AuthModule**: JWT authentication with Passport, login endpoint at `/auth/login`
- **AdminModule**: Admin CRUD controllers for Agentes, Clientes, Modulos, Releases, RBAC, Configuracion, Notificaciones
- **TareasModule**: Task management (Tareas) with events timeline
- **ClienteFichaModule**: Client profile data (software, contacts, users, connections, comments, work centers, release plans)
- **MailModule**: Email services with SMTP/Azure OAuth support and scheduled sending
- **HealthModule**: Health check endpoint
- **PrismaModule**: Database access layer (singleton PrismaService)

### Frontend Routes (apps/web/src/routes/)
- `/login` - Authentication
- `/` - Dashboard (protected)
- `/notificaciones` - Mass notifications management
- `/config/agentes` - Agent management
- `/config/clientes` - Client management
- `/config/clientes/:id` - Client edit
- `/config/modulos` - Module management
- `/config/releases` - Releases and hotfixes management
- `/config/roles` - Role and permissions management
- `/config/configuracion` - General configuration (mail settings)
- `/clientes/:clienteId/ficha` - Client profile view

### Key Data Models
- **Agente**: Internal users (ADMIN or AGENTE role)
- **Cliente**: Customer organizations with UnidadComercial units
- **ClienteUsuario**: Customer portal users (mapped to usuario_cliente table)
- **Tarea**: Support tickets with TareaEvento timeline
- **RoleEntity/Permission**: RBAC system with PermisoCodigo enum
- **ClienteSoftware**: Client software inventory (PMS, ERP, etc.)
- **ClienteContacto**: Client contacts
- **ClienteConexion**: Client connection credentials
- **ClienteComentario**: Internal comments about clients
- **ClienteCentroTrabajo**: Client work centers/databases
- **ClienteReleasePlan**: Planned releases/hotfixes per client
- **Release/Hotfix**: Software versions
- **NotificacionMasiva**: Mass email notifications
- **ConfiguracionMail**: Email server configuration

### Authentication & Permissions
- JWT tokens via `/auth/login`
- Guards in `apps/api/src/auth/guards.ts`
- Permissions defined in `apps/api/src/auth/permissions.ts`
- Available permissions:
  - CONFIG_MAESTROS, CONFIG_AGENTES, CONFIG_CLIENTES, CONFIG_CLIENTES_READ
  - CONFIG_UNIDADES, CONFIG_MODULOS, CONFIG_RELEASES, CONFIG_RBAC, CONFIG_NOTIFICACIONES
- Default admin: `admin` / `admin123!`

## Development URLs
- API: http://localhost:8080
- Swagger: http://localhost:8080/docs
- Frontend: http://localhost:5173
- Database: localhost:5433 (PostgreSQL)

## Seed Data
The seed script creates:
- RBAC permissions and default roles
- Admin user (admin/admin123!)
- DEMO client with CENTRAL/TODOS units
- 32 software modules (AV-*, AVCLOUD-*, APP-*)
- 10 dummy hotel chain clients with full data (MARRIOTT, HILTON, MELIA, etc.)
