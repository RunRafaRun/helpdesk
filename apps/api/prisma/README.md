# Database Seeding and Data Management

This project includes scripts to manage dummy data for development and testing.

## Available Scripts

### Main Seed
- `npm run prisma:seed` - Runs the main seed script that creates:
  - RBAC permissions and roles
  - Admin user (admin/admin123!)
  - DEMO client with basic setup
  - All modules (32 total)
  - Dummy clients (10 hotel chains) with full data

### Data Backup/Restore (for preserving dummy data)

When making big database changes that require resetting the database, you can backup and restore dummy data:

1. **Before resetting the database:**
   ```bash
   npm run prisma:backup-dummy
   ```

2. **After running migrations and seed:**
   ```bash
   npm run prisma:restore-dummy
   ```

### Development Workflow

Instead of losing all dummy data when making schema changes:

1. Backup dummy data: `npm run prisma:backup-dummy`
2. Reset database: `docker compose -f infra/docker/compose.yml down -v`
3. Restart: `docker compose -f infra/docker/compose.yml up --build`
4. Run migrations if needed: `npm run prisma:migrate:dev`
5. Run seed: `npm run prisma:seed`
6. Restore dummy data: `npm run prisma:restore-dummy`

## Docker Commands

- Start development: `docker compose -f infra/docker/compose.yml up --build`
- Reset database (clean start): `docker compose -f infra/docker/compose.yml down -v && docker compose -f infra/docker/compose.yml up --build`

## Running Scripts in Docker

All prisma commands should be run inside the API container:

```bash
docker exec helpdesk-api sh -c "cd /app && npm run prisma:seed"
docker exec helpdesk-api sh -c "cd /app && npm run prisma:backup-dummy"
docker exec helpdesk-api sh -c "cd /app && npm run prisma:restore-dummy"
```