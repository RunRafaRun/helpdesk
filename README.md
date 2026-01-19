# HELPDESK

Sistema de gestión de soporte técnico con autenticación JWT, control de acceso basado en roles (RBAC), y gestión de clientes, agentes, tareas y módulos.

## Características

- Autenticación JWT (login admin)
- CRUD de maestros (Clientes, Unidades Comerciales, Agentes, Usuarios Cliente)
- Gestión de ficha de cliente (software, contactos, usuarios, conexiones, comentarios, centros de trabajo, releases)
- Notificaciones masivas con programación
- Gestión de releases y hotfixes
- Configuración de email (SMTP/Azure OAuth)

## Arranque rápido

```powershell
docker compose -f infra/docker/compose.yml up --build
```

## Arranque limpio (reset DB)

```powershell
docker compose -f infra/docker/compose.yml down -v
docker compose -f infra/docker/compose.yml up --build
```

## URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/docs |
| PostgreSQL | localhost:5433 |

## Credenciales

- **Admin**: admin / admin123!

## Auto-bootstrap

Al levantar `docker compose up`, el contenedor `api` ejecuta automáticamente:
- `prisma generate`
- `prisma db push`
- `prisma/seed.ts` (idempotente)

Esto crea:
- Usuario admin
- 32 módulos de software
- Cliente DEMO con unidades CENTRAL/TODOS
- 10 clientes dummy (cadenas hoteleras)

## Tech Stack

- **Backend**: NestJS + Fastify + Prisma + PostgreSQL
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Infra**: Docker Compose

## Comandos útiles

```bash
# Entrar al contenedor API
docker exec -it helpdesk-api sh

# Ejecutar migraciones
npx prisma migrate dev --name <nombre>

# Ejecutar seed
npx ts-node prisma/seed.ts

# Desarrollo web (fuera de Docker)
cd apps/web && npm run dev

# Desarrollo API (fuera de Docker)
cd apps/api && npm run start:dev
```
