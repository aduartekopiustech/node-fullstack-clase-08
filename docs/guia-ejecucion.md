# Guía de ejecución, Swagger UI, Postman y tests — Hospital API

Esta guía reúne los pasos operativos para levantar **Hospital API** desde cero, consultar y probar su contrato interactivo en **Swagger UI**, ejecutar la colección automatizada de **Postman / Newman** y correr la suite de integración con **`npm test`**.

---

## 1. Plan de ejecución desde cero (camino rápido)

### Requisitos previos

- **Node.js** con soporte nativo para ES Modules, `--watch`, `node:test` y `--env-file` (Node.js 22 LTS o superior).
- **Docker** y **Docker Compose** (levanta PostgreSQL `16.15` en el contenedor `hospitaldb`).

### Paso a paso

1. **Crear los archivos locales de entorno** a partir de las plantillas versionadas (sin secretos reales en el repositorio):

   ```bash
   cp .env.example .env
   cp .env.test.example .env.test
   ```

   Definir la misma contraseña local de PostgreSQL en `DB_PASSWORD` dentro de `.env` y `.env.test` antes de iniciar el contenedor por primera vez.

2. **Instalar dependencias, levantar PostgreSQL, inicializar la base y arrancar el servidor**:

   ```bash
   npm install && docker compose up -d --wait && npm run db:reset && npm run dev
   ```

3. **Comprobar que el servicio responde**:

   ```bash
   curl http://localhost:3000/api/health
   # {"status":"ok"}
   ```

4. **Detener el servidor de forma limpia**: presionar `Ctrl + C` (`SIGINT`). El proceso deja de aceptar conexiones HTTP, cierra el pool de Sequelize y finaliza con código `0`.

> [!WARNING]
> `npm run db:reset` ejecuta `sync({ force: true })` y **elimina todas las tablas y sus datos** en la base configurada antes de sembrar las 5 especialidades iniciales. Úsalo únicamente en el arranque inicial o cuando quieras reiniciar el entorno de desarrollo. Para actualizar el esquema o sembrar el catálogo sin borrar datos existentes, utiliza `npm run db:sync` y `npm run db:seed`.

> [!NOTE]
> El script `docker/init/01-create-test-db.sql` crea automáticamente la base `hospital_test` **solo cuando el volumen `./postgres` se inicializa vacío**. Si el contenedor ya había sido creado antes de montar `docker/init`, crea la base de pruebas una única vez con:
>
> ```bash
> docker exec hospitaldb psql -U postgres -c "CREATE DATABASE hospital_test;"
> ```

---

## 2. Variables de entorno y persistencia

Los archivos `.env` y `.env.test` están ignorados en `.gitignore`. En el repositorio solo se versionan `.env.example` y `.env.test.example`.

| Variable      | Requerida | Ejemplo (`.env.example`) | Ejemplo (`.env.test.example`) | Propósito                                           |
| ------------- | --------- | ------------------------ | ----------------------------- | --------------------------------------------------- |
| `DB_NAME`     | Sí        | `hospitaldb`             | `hospital_test`               | Base de datos objetivo (desarrollo vs. tests)       |
| `DB_USER`     | Sí        | `postgres`               | `postgres`                    | Usuario de PostgreSQL                               |
| `DB_PASSWORD` | Sí        | `change_me`              | `change_me`                   | Contraseña local del contenedor PostgreSQL          |
| `DB_HOST`     | No        | `127.0.0.1`              | `127.0.0.1`                   | Host de conexión (`127.0.0.1` por defecto)          |
| `DB_PORT`     | No        | `5432`                   | `5432`                        | Puerto expuesto por Docker (`5432` por defecto)     |
| `DB_LOGGING`  | No        | `false`                  | `false`                       | Imprime las consultas SQL de Sequelize si es `true` |
| `PORT`        | No        | `3000`                   | `3000`                        | Puerto HTTP del servidor Express                    |
| `CORS_ORIGIN` | No        | `http://localhost:5173`  | `http://localhost:5173`       | Orígenes permitidos separados por coma              |

Los datos de PostgreSQL se almacenan en el volumen local `./postgres` montado en `/var/lib/postgresql/data`, por lo que **sobreviven tanto al reinicio del proceso Node como a la recreación del contenedor** (`docker compose up -d --force-recreate`).

---

## 3. Referencia de scripts (`package.json`)

| Comando            | Qué ejecuta                                                               | Base que utiliza         | Cuándo usarlo                                                  |
| ------------------ | ------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------- |
| `npm run dev`      | `node --watch src/server.js`                                              | `.env` (`hospitaldb`)    | Desarrollo local con recarga automática                        |
| `npm start`        | `node src/server.js`                                                      | `.env` (`hospitaldb`)    | Ejecución estándar del servidor HTTP                           |
| `npm run db:sync`  | `node scripts/sync.js` (`ensureNativeEnums` + `sync({ alter: true })`)    | `.env` (`hospitaldb`)    | Crear o sincronizar tablas y ENUMs sin vaciar registros        |
| `npm run db:seed`  | `node scripts/seed.js` (`bulkCreate` con `ignoreDuplicates: true`)        | `.env` (`hospitaldb`)    | Sembrar las 5 especialidades base de forma idempotente         |
| `npm run db:reset` | `node scripts/sync.js --force && node scripts/seed.js`                    | `.env` (`hospitaldb`)    | Recrear todas las tablas desde cero y sembrar especialidades   |
| `npm test`         | `node --env-file=.env.test --test --test-concurrency=1 "test/**/*.test.js"` | `.env.test` (`hospital_test`) | Ejecutar la suite completa de tests de integración aislados |

---

## 4. Ver la documentación de Swagger UI en el navegador

La aplicación sirve directamente el contrato OpenAPI `3.2.1` (`docs/openapi.yaml`) y la interfaz interactiva basada en `swagger-ui-dist`.

### Pasos para abrir y usar Swagger UI

1. Asegúrate de tener el servidor levantado (`npm run dev` o `npm start`).
2. Abre en el navegador:
   - **Swagger UI interactivo**: [http://localhost:3000/docs](http://localhost:3000/docs)
   - **Contrato OpenAPI crudo (YAML)**: [http://localhost:3000/openapi.yaml](http://localhost:3000/openapi.yaml)
3. Las **33 operaciones** aparecen agrupadas por tags: `Health`, `Users`, `Auth`, `Specialties`, `Patients`, `Doctors`, `Nurses` y `Appointments`.
4. Para probar una operación desde el navegador:
   - Despliega el endpoint deseado (por ejemplo, `GET /api/specialties`, `POST /api/patients` o `GET /api/appointments/search`).
   - Haz clic en **Try it out**.
   - Completa los parámetros de consulta o el cuerpo JSON de ejemplo y pulsa **Execute**.
   - Revisa debajo el comando `curl` generado, el código de estado HTTP, los headers (`Location` en altas `201`) y el cuerpo de respuesta.

### Validar el contrato OpenAPI por consola

```bash
npx @redocly/cli lint docs/openapi.yaml
```

---

## 5. Guía para correr pruebas automatizadas en Postman y Newman

El repositorio incluye la colección completa en formato Postman v2.1 y su entorno local:

| Archivo                                           | Propósito                                                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `docs/postman/Hospital-API.postman_collection.json` | **68 solicitudes** organizadas por carpeta (`Health`, `Users`, `Patients`, `Specialties`, `Doctors`, `Nurses`, `Appointments`) con datos dinámicos, encadenamiento de IDs y limpieza final |
| `docs/postman/Local.postman_environment.json`     | Entorno `Local` con `baseUrl = http://localhost:3000`                                              |

### Preparación previa

La colección realiza peticiones HTTP reales contra el servidor local y requiere el catálogo de especialidades sembrado:

```bash
docker compose up -d --wait
npm run db:sync
npm run db:seed
npm run dev
```

### Opción A — Ejecutar en Postman Desktop (Collection Runner)

1. Abre **Postman** y pulsa **Import**.
2. Importa `docs/postman/Hospital-API.postman_collection.json` y `docs/postman/Local.postman_environment.json`.
3. En el selector de entornos (esquina superior derecha), selecciona **Local**.
4. Haz clic derecho sobre la colección **Hospital API** → **Run collection**.
5. Verifica que las carpetas mantengan su orden original y pulsa **Run Hospital API**.
6. Todas las solicitudes capturan sus IDs automáticamente mediante scripts (`pm.collectionVariables`), validan el camino feliz, los filtros de turnos, la cancelación y los errores `400` / `404` / `409`, y eliminan al final los registros creados en la corrida.

### Opción B — Ejecutar de forma automatizada por terminal con Newman

Con el servidor corriendo en `http://localhost:3000`, abre otra terminal y ejecuta:

```bash
npx newman run docs/postman/Hospital-API.postman_collection.json \
  -e docs/postman/Local.postman_environment.json
```

Resultado esperado: **68 requests** y **68 assertions** con `0` fallos, dejando intacto el catálogo de 5 especialidades y sin residuos de prueba.

---

## 6. Guía para ejecutar los tests automatizados (`npm test`)

La suite automatizada utiliza `node:test` y `supertest` montando `createApp()` en memoria: **no abre el puerto `3000` ni requiere tener `npm run dev` encendido**. Solo necesita el contenedor PostgreSQL arriba y el archivo `.env.test`.

### Ejecutar toda la suite

```bash
docker compose up -d --wait
npm test
```

### Ejecutar un único archivo de tests

```bash
node --env-file=.env.test --test --test-concurrency=1 test/appointments.test.js
```

### Garantías de aislamiento y cobertura

- **Protección de la base de desarrollo**: `assertTestDatabase()` en `test/setup.js` exige `DB_NAME === "hospital_test"` antes de ejecutar `sync({ force: true })` o `TRUNCATE`. Si `.env.test` falta o `DB_NAME` apunta a `hospitaldb`, la corrida aborta con código distinto de `0` sin tocar los datos de desarrollo.
- **Repetibilidad e independencia de orden**: `--test-concurrency=1` evita colisiones entre archivos y `beforeEach(resetTables)` ejecuta `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` antes de cada caso.
- **Cierre limpio**: `after(closeDatabase)` limpia las tablas y cierra el pool con `sequelize.close()`, terminando el proceso sin conexiones abiertas.
- **Alcance (`58` tests en `6` archivos)**:
  - `test/health-users.test.js`: `GET /api/health` y regresión completa de `users`.
  - `test/specialties.test.js`: listado, detalle, `404` e `INVALID_ID`.
  - `test/patients.test.js`: CRUD, `Location`, DTO de salida sin columnas internas, `400`, `404`, `409 DOCUMENT_NUMBER_TAKEN` e `INVALID_ID`.
  - `test/doctors.test.js`: CRUD, `specialty` anidada, `400 INVALID_REFERENCE`, `409 LICENSE_NUMBER_TAKEN`, `400`, `404` e `INVALID_ID`.
  - `test/nurses.test.js`: CRUD, `409 LICENSE_NUMBER_TAKEN`, rechazo de campos desconocidos (`specialtyId`), `400`, `404` e `INVALID_ID`.
  - `test/appointments.test.js`: CRUD, `409 DOCTOR_SLOT_TAKEN`, los cuatro filtros de búsqueda (`doctorId`, rango UTC `date`, `documentNumber`, `patientName`), cancelación y doble cancelación (`409 APPOINTMENT_ALREADY_CANCELLED`), restricción `409 PATIENT_HAS_APPOINTMENTS` al borrar paciente con turnos e `INVALID_ID`.

---

## 7. Checklist de verificación rápida

- [ ] `.env` y `.env.test` creados localmente e ignorados por Git (`git check-ignore -v .env .env.test`).
- [ ] `docker compose up -d --wait` deja el contenedor `hospitaldb` en estado `healthy`.
- [ ] `GET http://localhost:3000/api/health` responde `200 {"status":"ok"}`.
- [ ] `http://localhost:3000/docs` renderiza Swagger UI con las 33 operaciones y `/openapi.yaml` sirve el contrato.
- [ ] `npx @redocly/cli lint docs/openapi.yaml` finaliza sin errores.
- [ ] `npx newman run docs/postman/Hospital-API.postman_collection.json -e docs/postman/Local.postman_environment.json` pasa las 68 solicitudes sin fallos.
- [ ] `npm test` pasa los 58 tests contra `hospital_test` con código de salida `0`.
- [ ] `Ctrl + C` detiene el servidor y cierra el pool de conexiones limpiamente.

<sub>[⬅ Volver al README principal](../README.md)</sub>
