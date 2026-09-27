# ADR-0003: Estrategia de cache para balance (Redis)

**Estado:** Aceptada
**Fecha:** 2026-09-26

## Decisión

`ConsultarSaldo` usa cache-aside sobre Redis:

- **Lectura:** intenta `GET balance:{accountId}`. Si hay hit, devuelve ese
  valor. Si hay miss, calcula el balance desde Postgres (ADR-0001) y hace
  `SET` con TTL de 5 minutos antes de responder.
- **Invalidación:** tras `Depositar`/`Retirar`, tan pronto como el `Movement`
  queda commiteado en Postgres (nunca antes), se ejecuta `DEL
balance:{accountId}`. La invalidación ocurre después del commit, no dentro
  de la misma transacción ni antes — invalidar antes del commit deja una
  ventana donde otro request puede repoblar la cache con el valor viejo, y esa
  cache stale no se vuelve a invalidar sola.
- **TTL de 5 minutos** actúa como red de seguridad, no como mecanismo primario
  de invalidación: cubre el caso de que la invalidación activa falle
  silenciosamente (excepción no manejada en el `DEL`, por ejemplo).
- **Redis es una asistencia, no una dependencia dura.** Si Redis está caído,
  `ConsultarSaldo` cae a Postgres directo y el sistema sigue funcionando; se
  emite un warning/log, no un error 500.

## Alternativas consideradas

- **Write-through** (actualizar el valor en Redis en el mismo momento del
  movimiento, en vez de invalidar y recalcular en la próxima lectura).
- **TTL pasivo puro sin invalidación activa** (cache expira sola cada N
  minutos, sin importar si hubo movimientos).
- **Redis como dependencia dura** (si Redis está caído, `ConsultarSaldo`
  falla).

## Por qué esta y no las otras

Cache-aside mantiene un solo lugar como fuente de verdad de escritura
(Postgres); write-through obliga a sincronizar dos escrituras en la misma
operación, con más superficie para inconsistencia si una de las dos falla a
mitad de camino. TTL pasivo puro fue descartado porque en un dominio
financiero, ver tu propio balance desactualizado después de tu propia
transacción es la peor experiencia posible — invalidación activa lo evita en
el caso común, y el TTL queda solo como backstop. Redis como dependencia dura
fue descartado porque el balance siempre puede calcularse sin cache (ADR-0001)
— convertir un optimización en punto único de falla sería un trade-off
injustificable acá.

## Nota de honestidad técnica

El dataset de este proyecto (pocas cuentas, pocos movimientos) no genera una
query realmente cara — un `SUM()` indexado por `account_id` corre en
milisegundos. El cache no se justifica por performance en este proyecto
puntual, sino pedagógicamente: practicar el patrón de invalidación
cache-aside antes de que el volumen lo vuelva necesario de verdad. Esto se
dice explícito acá para no quedar expuesto si en una entrevista preguntan
"¿por qué Redis si la tabla tiene 200 filas?".

## Qué sacrifico

- Complejidad extra (cliente Redis, manejo de fallos, invalidación) para un
  problema que en este dataset puntual no existe todavía.
- Ventana teórica (aunque corta) entre el commit y el `DEL` donde una lectura
  concurrente puede seguir viendo cache stale — aceptable para este proyecto,
  no aceptable si esto fuera producción financiera real.
