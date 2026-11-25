# Backlog — Hospital API

Lista de trabajo del proyecto: **un issue por unidad entregable**. El estado real se sigue en el [tablero del proyecto](https://github.com/users/aduartekopiustech/projects/1); este archivo es la vista rápida de alcance, dependencias y orden.

| Dato | Valor |
| ---- | ----- |
| Repositorio | [aduartekopiustech/node-fullstack-clase-08](https://github.com/aduartekopiustech/node-fullstack-clase-08) |
| Tablero | [Hospital API Project](https://github.com/users/aduartekopiustech/projects/1) |
| Total | 10 issues, todos en `Todo` |

## Orden sugerido

```text
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
```

El orden no es una regla del tablero: es el camino con menos bloqueos. Los issues 6, 8 y 9 se pueden encarar en paralelo una vez que los cuatro recursos existen.

## Tareas

| # | Tarea | Alcance | Depende de | Estado |
| - | ----- | ------- | ---------- | ------ |
| [#1](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/1) | Modelos Sequelize y esquema desde el ORM | 5 modelos, 3 FK con `RESTRICT`, ENUM `appointment_status`, `sync` / `seed` / `reset` | — | `Todo` |
| [#2](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/2) | CRUD de pacientes y catálogo de especialidades | 7 endpoints, DTOs, `409` por documento duplicado | #1 | `Todo` |
| [#3](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/3) | CRUD de médicos y enfermeros | 10 endpoints, `specialtyId`, matrícula única | #1 | `Todo` |
| [#4](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/4) | Turnos con cancelación y regla de agenda | 5 endpoints, `status`, `cancelledAt`, `409` por horario ocupado | #1, #2, #3 | `Todo` |
| [#5](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/5) | Búsqueda de turnos por médico, fecha y paciente | 4 filtros combinables, rango de día, `iLike` por nombre | #4 | `Todo` |
| [#6](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/6) | Contrato OpenAPI de las 33 operaciones | Schemas, ejemplos, errores reutilizables, lint sin errores | #2, #3, #4 | `Todo` |
| [#7](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/7) | Swagger UI en `/docs` | `/docs` + `/openapi.yaml`, tags, Try it out | #6 | `Todo` |
| [#8](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/8) | Colección de Postman | Flujo encadenado, environment, filtros y casos de error | #2, #3, #4 | `Todo` |
| [#9](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/9) | Suite automatizada con base aislada | `npm test`, `hospital_test`, repetible, regresión de `users` | #2, #3, #4 | `Todo` |
| [#10](https://github.com/aduartekopiustech/node-fullstack-clase-08/issues/10) | README del proyecto y arranque desde cero | Scripts, entorno, verificación limpia | todas | `Todo` |

> [!NOTE]
> El criterio de borrado de #3 (`409` al eliminar un médico con turnos) se verifica cuando #4 existe. Hasta entonces, ese checkbox queda pendiente aunque el resto del issue esté cerrado.

## Definición de terminado

Un issue se cierra cuando:

- todos los checkboxes de sus **criterios de aceptación** están marcados;
- `npm test` pasa con la base levantada;
- `npx @redocly/cli lint docs/openapi.yaml` no reporta errores, cuando el issue toca el contrato;
- el item se movió a `Done` en el tablero.

## Convenciones

| Elemento | Regla |
| -------- | ----- |
| Título | prefijo `feat:`, `docs:` o `test:` |
| Alcance | una unidad entregable, no un paso suelto |
| Criterios | verificables con un comando o una petición HTTP |
| Dependencias | se leen del issue; este archivo las resume |
| Estado | lo mueve quien toma el issue; el tablero es la fuente de verdad |
