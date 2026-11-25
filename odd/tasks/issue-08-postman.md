# Issue #8 — Colección de Postman

## Contexto

La API y Swagger ya están implementados. Se necesita una colección Postman v2.1 y un environment local, con flujos encadenados por ids capturados, datos de prueba dinámicos, errores reales del contrato y ejecución completa con Newman. No puede contener secretos ni datos reales.

## Tareas

- [x] Slice 1 — `docs/issue-08-postman-foundation`: environment, Health y Users.
- [x] Slice 2 — `docs/issue-08-postman-patients`: Patients y Specialties.
- [x] Slice 3 — `docs/issue-08-postman-doctors`: Doctors.
- [x] Slice 4 — `docs/issue-08-postman-nurses`: Nurses.
- [ ] Slice 5 — `docs/issue-08-postman-appointments`: Appointments, filtros, cancelación, conflictos y limpieza final.

## Criterios de aceptación

- Colección y environment en `docs/postman/`.
- Una carpeta por recurso: Health, Users, Patients, Doctors, Nurses, Appointments y Specialties.
- Flujo crear → obtener → actualizar → buscar → eliminar en cada recurso con escritura.
- IDs y datos dinámicos capturados con scripts, sin ids manuales ni duplicados entre ejecuciones.
- Cuatro filtros de appointments por separado y uno combinado.
- Cancelación y `409 APPOINTMENT_ALREADY_CANCELLED`.
- Cobertura de `400`, `404` y `409` en los recursos.
- Ejecución completa con Collection Runner/Newman sobre base sembrada.
- JSON sin secretos ni datos reales.

## Validación

- Parseo JSON y comprobación de estructura v2.1 en cada slice.
- Newman contra la app real y catálogo preparado con `npm run db:seed`.
- Limpieza de todos los registros creados por la colección.
- Sin unit tests y sin ejecutar el destructivo `db:reset`.

## Entrega

`delivery_strategy: stacked-to-main`

Cada slice agrega carpetas a la misma colección y abre un PR parcial hacia `main`. El usuario mergea en orden. Solo el slice final usa `Closes #8`; los anteriores usan `Part of #8`.

## Evidencia

- Slice 1: JSON válido, 9 requests y environment Local; Newman ejecutó 9 requests y 9 assertions sin fallos, con borrado del usuario temporal.
- Slice 2: 21 requests acumulados; Newman ejecutó 21 assertions sin fallos. Patients usa documento dinámico e id capturado; Specialties valida catálogo, detalle y errores.
- Slice 3: 30 requests acumulados; Newman ejecutó 30 assertions sin fallos. Doctors valida especialidad anidada, LICENSE_NUMBER_TAKEN e INVALID_REFERENCE.
- Slice 4: 39 requests acumulados; Newman ejecutó 39 assertions sin fallos. Nurses no requiere especialidad y rechaza specialtyId, además de validar matrícula duplicada y errores.
- Slice 5: pendiente.
