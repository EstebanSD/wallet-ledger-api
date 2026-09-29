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

## Migraciones (TypeORM) — agregados

- Cada entidad ORM nueva hay que registrarla a mano en
  `src/config/typeorm.config.ts` (`entities: [...]`). Si no, el CLI
  responde "No changes in database schema were found" y la app falla
  al bootear con `forFeature([...])`. Se eligió lista explícita en vez
  de glob porque los globs `.ts` se comportan distinto entre ts-node
  (CLI) y el build compilado (`dist/*.js`).
- El schema se declara en la entidad ORM y la migración solo lo
  refleja. NO editar migraciones generadas a mano para agregar cosas
  (FKs, constraints, índices): la entidad y la DB divergen y el
  próximo `migration:generate` puede intentar revertir el cambio.
  Excepción: el fix de `import type` en el import de `typeorm`.
- Las FKs solo se generan si la entidad declara la relación
  (`@ManyToOne` + `@JoinColumn`). Una columna `uuid` plana no alcanza,
  aunque se llame `account_id`. Se mantiene además `accountId` como
  columna plana para que el repo y el dominio no toquen la relación.
- Una migración que ya corrió en cualquier ambiente es inmutable: los
  cambios van en una migración nueva. Una migración generada que
  todavía no corrió se puede borrar y regenerar.

## Variables de entorno

- POSTGRES_HOST=localhost sirve para correr la app fuera de Docker.
  El día que el servicio `app` corra DENTRO de docker-compose, hay
  que pisarlo con `environment: POSTGRES_HOST: postgres` en ese
  servicio puntual (env_file no alcanza, hay que sobreescribirlo).

## Docker

- docker-compose.yml solo trae Postgres por ahora. Redis se agrega
  recién en el slice de ConsultarSaldo (ADR-0003) — no antes, para no
  tener infra corriendo sin código que la use.

## Moneda

- Montos: siempre enteros en unidad mínima de la moneda (centavos para
  USD). Los decimales en JS son flotantes binarios inexactos (0.1 + 0.2
  !== 0.3) y un ledger tiene que cerrar al centavo.

## Concurrencia en Retirar (invariante de saldo no negativo)

- Estrategia: SELECT ... FOR UPDATE sobre la fila de la cuenta, dentro
  de una transacción (LedgerUnitOfWork). Retiros concurrentes sobre la
  MISMA cuenta se serializan; sobre cuentas distintas no hay contención.
- Requiere el aislamiento default de Postgres (READ COMMITTED). Con
  REPEATABLE READ el snapshot se toma antes de esperar el lock y el SUM
  no vería el retiro previo. No cambiar el nivel sin reevaluar esto.
- Los tests unitarios usan un fake en memoria que NO simula bloqueos:
  prueban la lógica, no la garantía anti-carrera. Esa se verifica
  con requests paralelos contra Postgres real.
- SUM(integer) en Postgres devuelve bigint y `pg` lo entrega como
  string: convertir con Number() (seguro, montos << MAX_SAFE_INTEGER).
- Pendiente slice #4 (ADR-0003): Depositar y Retirar deben invalidar la
  key de Redis DESPUÉS del commit.
