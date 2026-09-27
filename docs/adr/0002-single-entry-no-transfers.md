# ADR-0002: Single-entry, sin transferencias entre cuentas

**Estado:** Aceptada
**Fecha:** 2026-09-26

## Decisión

Cada `Movement` pertenece a una única cuenta (CREDIT o DEBIT). No existe el
concepto de transferencia entre dos cuentas en este proyecto, ni double-entry
accounting (débito en una cuenta = crédito en otra, con la suma dando cero).

## Alternativas consideradas

- **Double-entry real**, el patrón contable estándar en sistemas fintech: todo
  movimiento tiene una contrapartida en otra cuenta.
- **Transferencias como caso de uso propio** (`Transferir(origen, destino,
monto)`), sin necesariamente modelar double-entry completo, pero sí
  escribiendo en 2 filas de forma atómica.

## Por qué esta y no las otras

La parte no trivial de una transferencia no es el modelado — es la atomicidad
multi-fila (¿qué pasa si la escritura en la cuenta destino falla después de
confirmarse la de origen?) y el nivel de aislamiento de transacción correcto
para evitar condiciones de carrera. Ese es exactamente el objetivo declarado
de Proyecto 2. Resolverlo acá adelanta ese aprendizaje y le saca filo al
proyecto siguiente, además de diluir la frontera entre proyectos que separa
"una complejidad nueva por vez".

## Qué sacrifico

- El dominio queda más simple de lo que sería un ledger real (que casi siempre
  es double-entry). Es una simplificación consciente, documentada, no un
  descuido — vale la pena poder explicar esto en una entrevista si preguntan
  "¿por qué no modelaste double-entry si es un ledger?".
