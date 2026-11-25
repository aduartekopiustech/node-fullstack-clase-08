# Issue #6 — Contrato OpenAPI de las 33 operaciones

## Contexto

La API ya implementa health, users, patients, specialties, doctors, nurses y appointments. El contrato debe describir el comportamiento real, incluidos DTOs, relaciones anidadas, errores, ejemplos y parámetros de búsqueda. La fuente funcional es `README.md` secciones 4 y 6, complementada por los controladores actuales.

Conteo normativo del README: health 1 + users 6 + patients 6 + doctors 6 + nurses 6 + appointments 6 + specialties 2 = **33 operaciones**. La asignación de rol y el login no forman parte de ese conteo.

## Tareas

- [x] Slice 1 — `docs/issue-06-openapi-foundation`: documento base, tags, componentes comunes, health y users (7 operaciones). Incluye la regla pendiente de `CLAUDE.md` como commit separado.
- [x] Slice 2 — `docs/issue-06-openapi-patients`: patients y specialties (8 operaciones), con acumulado de 15.
- [x] Slice 3 — `docs/issue-06-openapi-doctors`: doctors (6 operaciones), con acumulado de 21.
- [ ] Slice 4 — `docs/issue-06-openapi-nurses`: nurses (6 operaciones), con acumulado de 27.
- [ ] Slice 5 — `docs/issue-06-openapi-appointments`: appointments (6 operaciones), con total final de 33.

## Criterios de aceptación

- Las 33 operaciones tienen entrada, salida y errores esperados.
- Cada schema y cada respuesta tiene al menos un ejemplo.
- `400`, `404`, `409` por duplicado, horario ocupado y recurso en uso son respuestas reutilizables.
- `AppointmentStatus` contiene `SCHEDULED`, `CANCELLED`, `COMPLETED` y `NO_SHOW`.
- Los filtros de appointments son parámetros `query` documentados.
- Todos los `operationId` son únicos.
- `password` no aparece en schemas ni ejemplos de salida.
- `npx @redocly/cli lint docs/openapi.yaml` termina sin errores.

## Validación

- Lint de Redocly en cada slice; los componentes todavía sin uso pueden generar warnings intermedios, nunca errores.
- Conteo de operaciones por path/método: 7, 15, 27 y 33 al terminar cada slice.
- Verificación de `operationId` únicos y referencias internas resueltas.
- Revisión manual de respuestas contra los DTOs y controladores.
- Sin unit tests, según la instrucción vigente del usuario.

## Entrega

`delivery_strategy: stacked-to-main`

Cada slice tiene rama, commit y PR propios hacia `main`, vinculados al issue #6. El usuario realiza los merges en orden. No se abre el siguiente PR hasta que el anterior esté mergeado, para mantener diffs limpios y por debajo de aproximadamente 400 líneas cuando sea posible.

## Evidencia

- Slice 1: 7 operaciones y 7 `operationId` únicos verificados; Redocly válido sin errores, con 5 warnings de estilo. Commit de OpenAPI pendiente de PR.
- Slice 2: 15 operaciones y 15 `operationId` únicos verificados; Redocly válido sin errores, con 8 warnings de estilo. Diff: 300 líneas de contrato.
- Slice 3: 21 operaciones y 21 `operationId` únicos; Redocly válido sin errores, con 10 warnings de estilo. Diff: 233 líneas de contrato.
- Slice 4: pendiente.
- Slice 5: pendiente.
