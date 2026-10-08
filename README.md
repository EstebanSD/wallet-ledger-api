# Wallet/Ledger API

API de cuentas y movimientos modelada como ledger: el saldo nunca se guarda
como campo, siempre se deriva de la suma de movimientos inmutables.

Proyecto de aprendizaje enfocado en llevar Docker y Redis de "lab" a
"lo levanté en un proyecto real" — no es un producto fintech, es un vehículo
para practicar infraestructura sobre un dominio con reglas de negocio reales.

## Stack

- Node.js / NestJS / TypeScript
- PostgreSQL
- Redis (cache-aside)
- Docker Compose

## Cómo correrlo

```bash
cp .env.example .env
docker compose up --build
```

Las tres piezas (`postgres`, `redis`, `app`) levantan con healthcheck; `docker
compose ps` debería mostrar las tres como `healthy`.

## Endpoints

| Método | Ruta                      | Qué hace                                             |
| ------ | ------------------------- | ---------------------------------------------------- |
| `POST` | `/accounts`               | Crea una cuenta (sin balance inicial — nace en cero) |
| `POST` | `/accounts/:id/deposit`   | Registra un movimiento `CREDIT`                      |
| `POST` | `/accounts/:id/withdraw`  | Registra un movimiento `DEBIT`, valida no-negativo   |
| `GET`  | `/accounts/:id/balance`   | Balance derivado (cacheado en Redis)                 |
| `GET`  | `/accounts/:id/movements` | Historial paginado                                   |

## Diseño y decisiones

El dominio completo (entidades, invariantes, qué quedó explícitamente afuera)
y las decisiones técnicas con sus alternativas descartadas están documentadas
en `docs/`:

- [`docs/01-domain-contract.md`](docs/01-domain-contract.md) — contrato de dominio
- [`docs/adr/`](docs/adr) — decisiones de arquitectura (balance derivado,
  single-entry, estrategia de cache Redis)

## Decisiones de diseño y trade-offs

La decisión de diseño central del proyecto —balance derivado, nunca
mutado— no inventa el invariante "el saldo no puede quedar negativo" (eso ya
estaba en el contrato de dominio), pero sí determina cómo hay que protegerlo:
al no existir una columna `balance` que actualizar atómicamente, verificar el
invariante bajo concurrencia exige leer el `SUM` agregado con la fila de la
cuenta bloqueada (`SELECT ... FOR UPDATE`) antes de decidir si el retiro
procede. Decidí no aplicar esa misma protección al depósito: un insert sin
lectura previa no tiene ninguna condición de carrera que un lock pudiera
evitar, y agregarlo igual habría sido falsa sensación de seguridad además de
serializar operaciones sin necesidad de negocio.

Redis entra únicamente en la consulta de saldo, como cache-aside con
invalidación activa después del commit (nunca antes, para no servir un valor
que podría no persistir) y un TTL corto como red de seguridad, no como
mecanismo principal. La decisión explícita fue tratar a Redis como asistencia
prescindible: si falla, el sistema cae a Postgres con un warning, nunca con un
error al usuario — la fuente de verdad es siempre la base relacional.

## Qué haría distinto

Separaría desde el día uno los dos `getBalance` que terminé con nombres
iguales y responsabilidades distintas (uno dentro de una transacción con
lock, otro de lectura suelta para la cache) en nombres que no se confundan a
simple vista. Y pondría más disciplina temprana en verificar que el código
que corre en mi máquina es realmente el último que escribí — perdí tiempo
real investigando un "bug de cache" que en realidad era un archivo
desactualizado.
