# Issue #9 — Suite de tests automatizada con base aislada

## Contexto

Suite de integración HTTP con `node:test` y `supertest` ejecutada con `npm test` contra la base aislada `hospital_test`. Verifica el contrato completo de la API sin tocar la base de desarrollo (`hospitaldb`) ni dejar conexiones o procesos abiertos.

## Tareas

- [x] Slice 1 — `test/issue-09-infra`: `supertest`, `.env.test.example`, `.gitignore`, `docker/init/01-create-test-db.sql`, `docker-compose.yaml`, `src/config/native-enums.js`, `scripts/sync.js`, `test/setup.js`, `test/health-users.test.js`, `test/patients.test.js`, `test/specialties.test.js`.
- [x] Slice 2 — `test/issue-09-doctors-nurses`: `test/doctors.test.js` y `test/nurses.test.js`.
- [x] Slice 3 — `test/issue-09-appointments`: `test/appointments.test.js`.

## Criterios de aceptación

- [x] `npm test` corre la suite completa y termina en verde.
- [x] Corre contra `hospital_test`, nunca contra la base de desarrollo.
- [x] Se puede correr dos veces seguidas con el mismo resultado.
- [x] No depende del orden de ejecución de los archivos.
- [x] Cubre el camino feliz de los cuatro recursos y los errores `400`, `404`, `409` e `INVALID_ID`.
- [x] Cubre los filtros por médico, fecha, documento y nombre.
- [x] Cubre la cancelación y el `409` al cancelar dos veces.
- [x] Cubre el `409` al borrar un paciente con turnos.
- [x] Cubre la regresión de `users`.
- [x] Cierra el pool y el proceso al terminar.

## Validación

- `npm test` dos veces seguidas con salida `0` y sin procesos colgados.
- Independencia del orden: cada archivo por separado y en orden inverso con `node --env-file=.env.test --test --test-concurrency=1`.
- Guard de base de test: `DB_NAME=hospitaldb npm test` falla sin tocar `hospitaldb`.
- Falta de `.env.test`: falla en lugar de caer por default en `.env`.
- Verificación de `scripts/sync.js` contra `hospital_test` y comparación de snapshot de `hospitaldb` antes y después.

## Entrega

`delivery_strategy: stacked-to-main`

Slices 1 y 2 usan `Part of #9`; Slice 3 usa `Closes #9`. El usuario mergea en orden.

## Evidencia

- Slice 1: `npm test` pasó dos veces seguidas (`22` tests, `4` suites, `0` fallos, `exit=0`, terminación limpia). Independencia de orden verificada ejecutando cada archivo por separado (`specialties` 4, `patients` 11, `health-users` 7) y los 3 en orden inverso. Guard `DB_NAME=hospitaldb npm test` rechazó ejecución con `exit=1` (`Refusing to run tests against database "hospitaldb": DB_NAME must be hospital_test`), falta de `.env.test` falló con `exit=9`, y `node --env-file=.env.test scripts/sync.js` sincronizó `hospital_test` (`exit=0`). Snapshot de `hospitaldb` sin cambios (`0|0|0|0|0|5` antes y después). Verificador independiente confirmó inspección estática, dos corridas de `npm test` (`22/22`, `exit=0`) y guard (`exit=1`); `git diff` y `docker exec` quedaron verificados en el padre por timeout de permisos del subagente.
- Slice 2: `npm test` pasó dos veces seguidas (`44` tests, `6` suites, `0` fallos, `exit=0`). Independencia de orden verificada ejecutando `doctors.test.js` (`11`), `nurses.test.js` (`11`) y los 5 archivos en orden inverso (`44/44`, `exit=0`). Guard `DB_NAME=hospitaldb npm test` rechazó con `exit=1` y snapshot de `hospitaldb` sin cambios (`0|0|0|0|0|5` antes y después).
- Slice 3: `npm test` pasó dos veces seguidas (`58` tests, `7` suites, `0` fallos, `exit=0`, terminación limpia). Independencia de orden verificada ejecutando `appointments.test.js` (`14/14`) y los 6 archivos en orden inverso (`58/58`, `exit=0`). Guard `DB_NAME=hospitaldb npm test` rechazó con `exit=1` y snapshot de `hospitaldb` sin cambios (`0|0|0|0|0|5` antes y después).
