# Cierre — Proyecto 1: Wallet/Ledger API

_Cerrado: 7 de octubre de 2026 (inicio: 26 de septiembre — dentro de la estimación de 1-2 semanas del roadmap)_

## Dominio y persistencia

Construí una API de cuentas y movimientos (depósito, retiro, consulta de saldo
y de historial) modelada como ledger: el saldo nunca se guarda como campo,
siempre se deriva de la suma de movimientos inmutables (ADR-0001). Esa
decisión de diseño —balance derivado, nunca mutado— no inventa el invariante
"el saldo no puede quedar negativo" (eso ya estaba en el contrato de dominio),
pero sí determina cómo hay que protegerlo: al no existir una columna `balance`
que actualizar atómicamente, verificar el invariante bajo concurrencia exige
leer el `SUM` agregado con la fila de la cuenta bloqueada (`SELECT ... FOR
UPDATE`) antes de decidir si el retiro procede. Decidí no aplicar esa misma
protección al depósito: un insert sin lectura previa no tiene ninguna
condición de carrera que un lock pudiera evitar, y agregarlo igual habría sido
falsa sensación de seguridad además de serializar operaciones sin necesidad de
negocio.

## Cache

Redis entra únicamente en la consulta de saldo, como cache-aside con
invalidación activa después del commit (nunca antes, para no servir un valor
que podría no persistir) y un TTL corto como red de seguridad, no como
mecanismo principal (ADR-0003). La decisión explícita fue tratar a Redis como
asistencia prescindible: si falla, el sistema cae a Postgres con un warning,
nunca con un error al usuario — la fuente de verdad es siempre la base
relacional.

## Infraestructura y despliegue

El `Dockerfile` final es multi-stage: una etapa `builder` con `npm ci` +
`nest build`, y una etapa `runtime` limpia que solo copia `dist/` y corre
`node dist/main` con `npm ci --omit=dev` — sin TypeScript ni devDependencies
en la imagen final. Esto reemplaza el Dockerfile de una sola etapa usado
durante Fase 3/4 (pensado para dev con `start:dev` y bind mount), que no era
apto para una imagen que se fuera a desplegar.

Los servicios se resuelven entre sí por nombre vía la red bridge que Docker
Compose crea automáticamente por proyecto (DNS interno) — `app` habla con
`postgres:5432` y `redis:6379`, nunca `localhost`, que solo tiene sentido
corriendo la app fuera de contenedores. El `.env` de desarrollo local sigue
apuntando a `localhost`; el servicio `app` del compose pisa esas dos variables
puntuales vía `environment:` (que tiene prioridad sobre `env_file:`), sin
necesidad de mantener un segundo archivo de entorno.

Verificado: stack completo (`postgres` + `redis` + `app`) levanta healthy con
`docker compose up`, y el endpoint de balance responde correcto resolviendo
contra los contenedores por nombre de servicio.

## Si lo rehiciera

Dos cosas. Separaría desde el día uno los dos `getBalance` que terminé con
nombres iguales y responsabilidades distintas (uno dentro de una transacción
con lock, otro de lectura suelta para la cache) en nombres que no se confundan
a simple vista. Y pondría más disciplina temprana en verificar que el código
que corre en mi máquina es realmente el último que escribí — perdí tiempo real
investigando un "bug de cache" que en realidad era un archivo desactualizado.

A nivel infra, hubiera escrito el Dockerfile multi-stage desde Fase 3 en vez
de arrancar con una sola etapa pensada solo para dev y migrar después — el
costo de cambiarlo a mitad de proyecto fue bajo acá, pero en un proyecto más
grande esa migración tardía puede tocar más superficie de la esperada
(scripts de CI, variables de entorno específicas de cada etapa, etc.).
