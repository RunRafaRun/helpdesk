# HELPDESK (V1 - FIXED3)
Incluye:
- Auth JWT (login admin)
- CRUD básico de maestros (Clientes, Unidades Comerciales, Agentes, UsuariosCliente)
- Seed crea un agente ADMIN inicial (usuario: admin, password: admin123!)
- Seed crea un cliente DEMO con unidades CENTRAL/TODOS

## Arranque limpio
```powershell
docker compose -f infra/docker/compose.yml down -v
docker compose -f infra/docker/compose.yml up --build
```

## Migración + seed
```powershell
docker exec -it helpdesk-api sh
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

## Swagger
- http://localhost:8080/docs

## Login admin
POST http://localhost:8080/auth/login
```json
{ "usuario": "admin", "password": "admin123!" }
```
En Swagger: **Authorize** -> `Bearer <token>`


## Frontend (dev)
- http://localhost:5173
Login: admin / admin123!


## Auto-bootstrap (dev)
Al levantar `docker compose up`, el contenedor `api` ejecuta automáticamente:
- `prisma generate`
- `prisma db push`
- `prisma/seed.ts` (idempotente)

Esto asegura que existen las tablas (incluida `Agente`) y el usuario admin:
- admin / admin123!
