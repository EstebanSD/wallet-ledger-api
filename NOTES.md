# NOTES.md — decisiones de infra y gotchas resueltos

## Entorno

- Node 24.9+ obligatorio. Nest 12 publica sus paquetes core como ESM
  puro; Jest 30 recién puede hacer `require(esm)` de eso en Node
  ≥24.9, y todavía necesita el flag `--experimental-vm-modules`
  (por eso los scripts de test en package.json usan
  `node --experimental-vm-modules node_modules/.bin/jest`, no `jest` a secas).
- Proyecto en CommonJS (`tsconfig.json`: module/moduleResolution
  "nodenext", sin "type": "module" en package.json). No usar ESM acá,
  fue evaluado y descartado — no aporta nada a este proyecto y
  multiplica fricción de tooling.

## Migraciones (TypeORM)

- Flujo obligatorio: generar UNA migración → leerla → `migration:run`
  → recién ahí generar la siguiente. Generar dos migraciones seguidas
  sin correr la primera hace que TypeORM recalcule el diff contra una
  base vacía y duplique el CREATE TABLE.
- El CLI de `migration:generate` genera el import como
  `import { MigrationInterface, QueryRunner } from "typeorm"` — hay
  que cambiarlo a mano a `import type { ... }` en cada migración
  nueva, o Nest explota al bootear (MigrationInterface no existe
  como export en runtime, solo como tipo).
- TypeORM requiere pg como driver de PostgreSQL; instalarlo explícitamente (npm install pg)

## Variables de entorno

- POSTGRES_HOST=localhost sirve para correr la app fuera de Docker.
  El día que el servicio `app` corra DENTRO de docker-compose, hay
  que pisarlo con `environment: POSTGRES_HOST: postgres` en ese
  servicio puntual (env_file no alcanza, hay que sobreescribirlo).

## Docker

- docker-compose.yml solo trae Postgres por ahora. Redis se agrega
  recién en el slice de ConsultarSaldo (ADR-0003) — no antes, para no
  tener infra corriendo sin código que la use.
