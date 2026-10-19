# Backend API (`apps/api`)

Modular Monolith REST API built with **NestJS**, **TypeScript**, and **Prisma ORM**.

## Architecture & Principles

- **Modular Monolith**: Core domains are separated into modules (`auth`, `applications`, `workflow`, `scrutiny`, `evc`, `compliance`, `documents`, `notifications`, `audit`), but remain in a single codebase to ensure ACID database transactions.
- **Transactional Outbox**: All state transitions update the case, write stage history, record an audit event, and create an `OutboxEvent` within a single PostgreSQL transaction.
- **Strict Server-Side RBAC**: Role and scope checks (region, institution, assigned committee) are strictly enforced in NestJS guards and interceptors. Client-provided roles/scopes are never trusted.
- **Swagger Documentation**: Interactive OpenAPI documentation available at `/api/docs`.

## Module Directory Structure

```
apps/api/src/
├── auth/           # JWT, OIDC adapter, password hashing, local demo switcher
├── users/          # User management and profile retrieval
├── roles/          # Granular RBAC definitions and scope validators
├── institutions/   # Institution profiles, regional mappings, contact registry
├── applications/   # Application intake, drafting, validation, submission
├── workflow/       # Deterministic state machine engine & transition guards
├── scrutiny/       # Scrutiny officer observation & deficiency management
├── evc/            # Expert Visit Committee scheduling, assignments & reports
├── committees/     # SHC & SAC hearing management
├── compliance/     # Post-approval compliance obligations and renewals
├── documents/      # S3-compatible pre-signed upload intent & checksum validation
├── notifications/  # Notification generation & in-app persistence
├── escalations/    # Multi-level hierarchical alert escalation triggers
├── reports/        # Aggregation queries for pendency, ageing, and compliance
├── audit/          # Append-only immutable security and workflow audit trail
├── rules/          # APH regulatory rule matrix repository and provenance
└── main.ts         # Application entry point
```

## Running Locally

```bash
# Start API in development watch mode
pnpm dev:api

# Run database migrations
pnpm prisma:migrate

# Seed demo users and reference data
pnpm db:seed
```
API runs on `http://localhost:4000`.
Swagger documentation: `http://localhost:4000/api/docs`.
