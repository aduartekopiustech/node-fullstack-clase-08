# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Class 8 of the Kopius Academy Node.js course. It extends the Class 7 `users` API into the MVP of a hospital API: `specialties`, `patients`, `doctors`, `nurses`, `appointments`. Express 5 + Sequelize 6 + PostgreSQL 16, plain JavaScript with ES modules (`"type": "module"`).

`README.md` (Spanish, ~3000 lines) is the course material and the **spec**: domain model, DER, every endpoint with expected status codes and error codes, model code samples, and the acceptance criteria. `docs/backlog.md` lists the 10 issues to implement in order (mirrored on the GitHub project board). Read the relevant README section before implementing a resource.

**Current state vs. target:** only `users` and `auth` exist in `src/`. The README section "8. Arquitectura" describes the target layout (new models, DTOs, controllers, routes, `routes/index.js`, `validate-query` middleware, `docs/openapi.yaml`, Swagger UI at `/docs`, `test/`, `docker/init/`). Several npm scripts the README references (`db:reset`, `db:seed`, `test`) do not exist yet.

## Commands

```bash
docker compose up -d --wait   # Postgres 16 container "hospitaldb", data in ./postgres
npm run dev                   # node --watch src/server.js
npm start                     # node src/server.js
npm run db:sync               # scripts/sync.js: sync models -> tables (alter: true)
```

There is no test runner, linter, or formatter configured yet (`npm test` exits 1). Choosing and wiring the test suite is backlog work (README 9.6); tests must run against a separate `hospital_test` database, not the dev one.

Env vars (`.env`, loaded via `dotenv/config`): `DB_NAME`, `DB_USER`, `DB_PASSWORD` are required (fail fast on startup); `DB_HOST`, `DB_PORT`, `DB_LOGGING`, `PORT`, `CORS_ORIGIN` are optional.

## Architecture

Classic layered flow, one file per resource per layer: **Route → Middleware → Controller → Model**, with Yup DTOs at the HTTP boundary.

- `src/server.js` connects the DB (`connectDatabase`, fail fast), then listens; handles SIGINT/SIGTERM. `src/app.js` exports `createApp()` (no listen) so tests can mount the app directly.
- `src/config/database.js` holds the single `sequelize` instance with `define: { underscored: true, timestamps: true }`: JS attributes are camelCase, columns are snake_case.
- Models never see `req`/`res`; DTOs never import Sequelize; controllers translate HTTP ↔ data.
- Route order matters: `/search` is declared **before** `/:id`, otherwise it hits the id validator and returns `INVALID_ID`.
- `requireRole` reads the role from the `x-user-role` header. It is a teaching stub, not real auth.

### Conventions that are easy to break

- **Response shape:** success is `{ data: ... }`; errors are `{ error: { code, message, details? } }`. Throw `AppError` (`src/errors/app-error.js`) with `status`/`code` and let `error.middleware.js` format it. 5xx never leak the message.
- **Sequelize errors map in `error.middleware.js`:** `UniqueConstraintError` → 409, `ValidationError` → 400. Today the 409 is hardcoded as `EMAIL_TAKEN`; new resources need the code chosen per constraint (`DOCUMENT_NUMBER_TAKEN`, license, `appointments_doctor_slot_unique` → slot taken), plus `ForeignKeyConstraintError` → 400 on create and 409 on delete (`PATIENT_HAS_APPOINTMENTS`). The `users` responses must stay byte-identical.
- **Native Postgres ENUMs:** `user_role` and `appointment_status` are referenced as `type: "user_role"` (a string), not `DataTypes.ENUM`, paired with `validate.isIn`. `DataTypes.ENUM` would make Sequelize look for `enum_<table>_<col>`.
- **Associations** live in `src/models/index.js` (both sides, `onDelete: "RESTRICT"`). The `as` alias must match what DTOs and `include` use, and `models/index.js` must be imported before queries or `sync` (otherwise `EagerLoadingError` or an empty `sequelize.models`). `scripts/sync.js` currently imports only `User` and must be updated as models are added.
- `password` stores a bcrypt hash and is never returned or documented in OpenAPI; output DTOs project fields explicitly.
- Appointments: cancel is `PATCH { status: "CANCELLED" }` (server sets `cancelledAt`), not `DELETE`. Date search uses a day range on `scheduled_at` (TIMESTAMPTZ), never equality. Query params are strings and must pass a query DTO before reaching `where`.
- `sync({ alter: true })` can drop columns; it is dev-only (migrations come later in the course).

## Issue completion

When an issue is moved to `Done`, document its completion in the GitHub issue and in Engram before reporting it closed. Include the implemented behavior, changed files, verification commands and observed results, branch/commit/PR links, and any skipped or pending checks. Do not mark an issue `Done` while acceptance criteria remain unverified.

## Language

Code, identifiers, and API error codes/messages are in English. Code comments and the README/backlog are in Spanish; keep that when extending them.
