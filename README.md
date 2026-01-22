# HELPDESK

Sistema de gestion de soporte tecnico con autenticacion JWT, control de acceso basado en roles (RBAC), y gestion de clientes, agentes, tareas y modulos.

**Documentacion completa: Ver [PROJECT.md](./PROJECT.md)**

## Arranque rapido

```powershell
docker compose -f infra/docker/compose.yml up --build
```

## Reset DB (arranque limpio)

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

## Tech Stack

- **Backend**: NestJS + Fastify + Prisma + PostgreSQL
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Infra**: Docker Compose

## Caracteristicas principales

- Autenticacion JWT con validacion completa
- CRUD de maestros (Clientes, Agentes, Modulos) con validacion
- Gestion completa de tareas con timeline y comentarios
- Ficha de cliente (software, contactos, conexiones, releases)
- Notificaciones masivas con programacion
- Configuracion de email (SMTP/Azure OAuth)
- Lookup tables con colores (tipos, estados, prioridades)
- Dashboard con estadisticas y colores dinamicos
- Controles de integridad de datos (releases/hotfixes)
- Estados sin iconos para apariencia mas profesional
- Soporte UTF-8 completo en base de datos
