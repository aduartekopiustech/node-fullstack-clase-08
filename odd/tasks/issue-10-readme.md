# Issue #10 — Guía de ejecución del proyecto y arranque desde cero

## Contexto

Por decisión del usuario, se preserva íntegro el material teórico de la clase en `README.md` y se documenta el plan de ejecución del proyecto, la navegación de Swagger UI en el navegador, la ejecución de pruebas automatizadas en Postman / Newman y la suite `npm test` en `docs/guia-ejecucion.md`, enlazada desde `README.md`. Además se versiona `.env.example` alineado con `hospitaldb` junto a `.env.test.example`.

## Tareas

- [x] Crear `docs/guia-ejecucion.md`, enlazarla desde `README.md`, alinear `.env.example` y verificar los criterios de aceptación.

## Criterios de aceptación

- [x] El README explica instalación, scripts, Postman y tests (a través del enlace directo a `docs/guia-ejecucion.md`).
- [x] `.env` y `.env.test` están en `.gitignore`; los `.example` están en el repo.
- [x] Ningún archivo tiene credenciales hardcodeadas.
- [x] `npm install && docker compose up -d --wait && npm run db:reset && npm run dev` levanta todo.
- [x] Los datos sobreviven a reiniciar Node y a recrear el contenedor.
- [x] `Ctrl + C` cierra el servidor y el pool.

## Validación

- `git check-ignore -v .env .env.test` y presencia de `.env.example` y `.env.test.example` en Git.
- Escaneo de archivos versionados para descartar credenciales reales hardcodeadas.
- Prueba de `db:reset` sobre base temporal, arranque del servidor HTTP, respuesta de `/api/health`, `/docs` y `/openapi.yaml`, persistencia tras reinicio de Node y recreación del contenedor PostgreSQL, y cierre limpio ante `SIGINT` (`Ctrl + C`).
- Ejecución de `npm test` y `npx @redocly/cli lint docs/openapi.yaml`, conservando intacta `hospitaldb`.

## Evidencia

- `.gitignore` ignora `.env` (`.gitignore:69`) y `.env.test` (`.gitignore:70`); `git ls-files --error-unmatch .env.example .env.test.example` confirma ambos `.example` versionados.
- Escaneo con `git grep` sobre archivos versionados confirma ausencia de credenciales reales (`DB_PASSWORD=change_me`, `${DB_PASSWORD}`).
- `DB_NAME=hospital_verify npm run db:reset` sobre base temporal sincronizó el esquema y sembró 5 especialidades (`0|0|0|0|0|5`), eliminando luego `hospital_verify` sin tocar `hospitaldb`.
- `npm install && docker compose up -d --wait` + `node src/server.js` levantó el servidor con `/api/health` (`200 {"status":"ok"}`), `/docs` (`200`) y `/openapi.yaml` (`200`).
- Persistencia y `Ctrl + C`: se creó un paciente de prueba (`id=20`), se envió `SIGINT` (`SIGINT received: shutting down`, `exit=0`), se recreó el contenedor (`docker compose up -d --force-recreate --wait` -> `Healthy`), se reinició Node y `GET /api/patients/20` devolvió `200` con los datos intactos; luego se limpió con `DELETE` (`204`) y nuevo `SIGINT` (`exit=0`).
- `npx @redocly/cli lint docs/openapi.yaml` validó sin errores y `npm test` pasó `58/58` tests (`7` suites, `exit=0`). Snapshot de `hospitaldb` intacto (`0|0|0|0|0|5`).
