# Email Service

[![CI](https://github.com/devallisamuel/email/actions/workflows/ci.yml/badge.svg)](https://github.com/devallisamuel/email/actions/workflows/ci.yml)

A NestJS service that accepts email requests over HTTP, stores them in PostgreSQL, and delivers them through SMTP using a background worker. Delivery is retried with exponential backoff, and the service ships with Prometheus metrics and Loki logging.

## Features

- **HTTP API** for queuing single or bulk (up to 100) emails, documented with Swagger.
- **CQRS and hexagonal layout**: commands, queries, domain entities, ports and adapters.
- **Background delivery worker** that leases pending emails, sends them over SMTP, and retries failures with exponential backoff until `EMAIL_MAX_ATTEMPTS` is reached.
- **PostgreSQL persistence** with TypeORM migrations.
- **Observability**: Prometheus metrics at `/metrics`, structured logs pushed to Loki, and a provisioned Grafana instance.

## Architecture

```
            POST /emails             poll + lease            SMTP
 Client ───────────────▶  API  ──▶  PostgreSQL  ◀──────  Worker  ──────▶ Provider
                           │                               │
                           └──── metrics / logs ───────────┴──▶ Prometheus · Loki · Grafana
```

| Process | Entry point | Purpose |
| --- | --- | --- |
| API | `src/main.ts` | Validates requests and stores emails as `pending`. |
| Worker | `src/worker.ts` | Sends pending emails and records the result (`completed`, retry, or `failed`). |

Source layout:

```
src/
├── database/            # TypeORM data source and migrations
├── modules/email/
│   ├── application/     # Commands, queries, ports, delivery worker
│   ├── domain/          # Email entity and value objects
│   ├── infrastructure/  # TypeORM repository and SMTP adapter
│   └── presentation/    # HTTP controller and DTOs
├── monitoring/          # Metrics, Loki logger, HTTP middleware
└── shared/              # Base entity and value object
```

## Requirements

- Node.js 22
- npm
- Docker and Docker Compose (for the full local stack)

## Configuration

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection. |
| `EMAIL_FROM` | Sender address used for every email. |
| `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_SECURE` | SMTP server settings. |
| `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD` | SMTP credentials (optional if the server needs no auth). |
| `EMAIL_WORKER_BATCH_SIZE` | Emails the worker claims per poll (default `10`). |
| `EMAIL_WORKER_IDLE_DELAY_MS` | Wait between polls when the queue is empty (default `1000`). |
| `EMAIL_WORKER_LEASE_MS` | How long a claimed email stays locked to one worker (default `300000`). |
| `EMAIL_MAX_ATTEMPTS` | Attempts before an email is marked `failed` (default `5`). |
| `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`, `GRAFANA_PORT` | Local Grafana settings. |

Never commit `.env`; it is git-ignored.

## Running locally

### Full stack with Docker Compose

Starts the API, worker, PostgreSQL, Loki, Prometheus, and Grafana:

```bash
docker compose up --build -d
```

| Service | Address |
| --- | --- |
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/api |
| Metrics | http://localhost:3000/metrics |
| Grafana | http://localhost:3300 |
| Prometheus | http://localhost:9090 |
| Loki | http://localhost:3100 |

See [observability/README.md](observability/README.md) for useful LogQL and PromQL queries.

### Without Docker

Start PostgreSQL (for example `docker compose up -d db`), then:

```bash
npm install
npm run migration:run   # apply database migrations
npm run start:dev       # API in watch mode
npm run worker:dev      # delivery worker in watch mode (separate terminal)
```

## API

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/emails` | Queue one email. |
| `POST` | `/emails/bulk` | Queue up to 100 emails. |
| `GET` | `/metrics` | Prometheus metrics. |
| `GET` | `/api` | Swagger UI. |

Example:

```bash
curl -X POST http://localhost:3000/emails \
  -H 'Content-Type: application/json' \
  -d '{
    "recipient": "recipient@example.com",
    "subject": "Welcome to the service.",
    "body": "Hello from the email service."
  }'
```

The response contains the email's `id` and its `pending` status. The worker picks it up and delivers it.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Run the API in watch mode. |
| `npm run worker:dev` | Run the delivery worker in watch mode. |
| `npm run build` | Compile to `dist/`. |
| `npm run start:prod` | Run the compiled API. |
| `npm run worker` | Build and run the compiled worker. |
| `npm run migration:run` | Apply database migrations. |
| `npm run migration:revert` | Revert the last migration. |
| `npm run lint` | Lint and auto-fix. |
| `npm run lint:ci` | Lint without fixing; fails on any warning. |
| `npm test` | Run unit tests. |
| `npm run test:cov` | Run unit tests with coverage. |
| `npm run test:e2e` | Run end-to-end tests. |

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request to `main`:

1. **Lint**: `npm run lint:ci`
2. **Unit tests**: `npm test`
3. **Build**: compiles the app and uploads `dist/` as an artifact (after lint and tests pass)
4. **Docker image**: checks that the `Dockerfile` builds (after lint and tests pass)

## License

UNLICENSED. Private project.
