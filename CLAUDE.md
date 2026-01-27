# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Primary Documentation: See [PROJECT.md](./PROJECT.md) for complete project documentation.**

## Quick Reference

- **Tech Stack**: NestJS + Fastify + Prisma + PostgreSQL (API), React 18 + Vite + Tailwind (Web)
- **Start Dev**: `docker compose -f infra/docker/compose.yml up --build`
- **Reset DB**: `docker compose -f infra/docker/compose.yml down -v && docker compose -f infra/docker/compose.yml up --build`
- **Default Login**: admin / admin123!
- **API**: http://localhost:8080 | **Frontend**: http://localhost:5173 | **Swagger**: http://localhost:8080/docs

## Key Conventions

- Spanish language codebase (UI text)
- Use bcryptjs (not bcrypt)
- Prisma models use PascalCase
- Check existing patterns before implementing new features
- Update PROJECT.md when making significant changes

## Recent Features

- **Dashboard Customization**: Admins can customize widget layout (visibility/order) for all users
- **Permission-Free Lookups**: `/admin/lookup/*` endpoints for dropdowns (no permission required, just JWT)
- **Plantillas System**: Reusable text templates with wildcard support
