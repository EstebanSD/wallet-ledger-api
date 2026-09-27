# ADR-0001: Balance derivado, no almacenado

**Estado:** Aceptada
**Fecha:** 2026-09-26

## Decisión

El balance de una `Account` no es un campo persistido. Se calcula como
`SUM(amount) WHERE account_id = X`, agrupando por `type` (CREDIT/DEBIT), a partir
de la tabla `Movement`.

## Alternativas consideradas

- **Balance como campo mutable en `Account`**, actualizado con cada movimiento
  (patrón "cuenta corriente + log de auditoría al lado"). Es el enfoque más común
  en CRUDs simples y evita el cálculo de agregación en cada lectura.

## Por qué esta y no la otra

Con balance derivado, la inmutabilidad de `Movement` deja de ser una regla que
hay que recordar respetar y pasa a ser una propiedad estructural: no existe
ningún código en el sistema que actualice un balance, porque no hay campo que
actualizar. Además, "aplicar un evento" se reduce siempre a "insertar un
movimiento" — una operación append-only, sin lectura previa de estado. Esto
importa particularmente de cara a Proyecto 2 (idempotencia): resolver
duplicados sobre un append-only es más simple que sobre un patrón
"leer-sumar-escribir", que es justamente donde aparecen las race conditions
que ese proyecto busca ejercitar.

## Qué sacrifico

- `ConsultarSaldo` hace una agregación en cada lectura en vez de un `SELECT`
  directo de un campo. Se mitiga con cache (ver ADR-0003), no evitando el
  cálculo.
- Si el volumen de movimientos por cuenta creciera órdenes de magnitud, la
  agregación dejaría de ser trivial y requeriría un balance materializado con
  reconciliación periódica — fuera de alcance de este proyecto.
