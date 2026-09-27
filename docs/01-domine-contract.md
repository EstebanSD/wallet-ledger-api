# Contrato del dominio — Wallet/Ledger API

> Documento vivo. Se edita si el entendimiento del dominio cambia.
> Las decisiones técnicas que se derivan de este contrato viven en `docs/adr/`, no acá.

_Última actualización: 26 de septiembre de 2026_

## Decisiones de modelado (resumen)

Antes de las entidades, tres decisiones que enmarcan todo lo demás:

1. **Balance derivado, no almacenado.** El balance de una cuenta es `SUM(movements)`, no un campo mutable. Esto hace que la inmutabilidad de `Movement` sea una propiedad estructural, no una promesa de diseño.
2. **Single-entry, no double-entry.** Cada movimiento pertenece a una sola cuenta (depósito o retiro). El patrón contable real (débito/crédito con contrapartida) se pospone.
3. **Sin transferencias entre cuentas.** La atomicidad multi-cuenta es el objetivo declarado de Proyecto 2 (idempotencia/transacciones) — meterla acá diluye la frontera entre proyectos.

## Entidades

### Account

| Campo        | Tipo      | Nota                                   |
| ------------ | --------- | -------------------------------------- |
| `id`         | —         |                                        |
| `owner_ref`  | string    | libre, sin entidad `User` ni auth      |
| `currency`   | string    | fija al crear, no configurable después |
| `created_at` | timestamp |                                        |

Sin campo `balance` — es derivado.

### Movement

| Campo        | Tipo                | Nota                                             |
| ------------ | ------------------- | ------------------------------------------------ |
| `id`         | —                   |                                                  |
| `account_id` | FK                  |                                                  |
| `type`       | `CREDIT` \| `DEBIT` |                                                  |
| `amount`     | entero              | unidad mínima de moneda (centavos). Nunca float. |
| `created_at` | timestamp           |                                                  |

Inmutable: sin `updated_at`, sin soft-delete, sin endpoint de edición.

## Invariantes de negocio

1. El balance de una cuenta nunca puede ser negativo — un `DEBIT` que lo llevaría a negativo se rechaza.
2. Un `Movement` jamás se actualiza ni se borra una vez persistido. Corregir un error es un movimiento compensatorio, no un update (invariante conceptual — el caso de uso de reversa está fuera de este proyecto).
3. Todo movimiento referencia una cuenta existente — no hay movimientos huérfanos.
4. Los montos son enteros. Cero tolerancia a `float`/`double` para dinero.
5. Una cuenta tiene una única moneda fija de por vida (para este proyecto).

## Casos de uso

- `CrearCuenta` — alta con moneda fija
- `Depositar` — crea movimiento `CREDIT`
- `Retirar` — crea movimiento `DEBIT`, valida invariante de no-negativo
- `ConsultarSaldo` — calcula balance derivado (candidato a cache Redis — ver ADR)
- `ConsultarMovimientos` — historial paginado de una cuenta

## Explícitamente afuera de este proyecto

- Auth/autorización — el caller es confiable, no hay `User`.
- Multi-moneda y conversión.
- Transferencias entre cuentas (queda para Proyecto 2).
- Reversas como caso de uso implementado (el invariante existe conceptualmente, el endpoint no).
- Idempotencia de requests duplicados (tema central de Proyecto 2).
- Multi-tenant / organizaciones.
- Interés, fees, lógica financiera de negocio real — el dominio es vehículo para aprender infra, no producto.

## Decisiones cerradas post-borrador

- `CrearCuenta` **no** acepta balance inicial. Toda cuenta nace en cero; fondear es un `Depositar` posterior. Razón: mantiene el invariante "el balance es siempre suma de movimientos" sin excepciones — si `CrearCuenta` pudiera inyectar plata directamente, ese invariante tendría un caso especial en el mismo caso de uso que se supone lo garantiza.
