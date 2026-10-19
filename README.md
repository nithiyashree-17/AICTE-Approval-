# AICTE FlowGuard

> **Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System**  
> **Problem Statement ID:** 26262

---

## 📌 Overview

AICTE FlowGuard is a secure, configurable web platform designed to streamline and automate the AICTE approval process. It routes applications through scrutiny, re-scrutiny, EVC scheduling, tracks post-approval compliance obligations, and automates deadline reminders and overdue escalations.

---

## 🏗️ Repository & Directory Structure

```text
aicte-flowguard/
├── apps/
│   ├── web/                     # Next.js frontend (App Router, Tailwind CSS, shadcn/ui)
│   │   ├── src/app/             # Role dashboards, forms, case workspace
│   │   └── src/components/      # Reusable UI components (workflow, layout, docs)
│   ├── api/                     # NestJS modular-monolith REST API & Swagger
│   │   └── src/                 # Auth, RBAC, applications, scrutiny, EVC, compliance
│   └── worker/                  # BullMQ background workers (Redis-backed)
│       └── src/                 # Deadlines, reminders, escalations, email, reconciliation
├── packages/
│   ├── shared-types/            # Shared TypeScript types & enums across apps
│   ├── validation/              # Zod validation schemas for forms & DTOs
│   ├── workflow-contracts/      # State machine definitions & transition guards
│   ├── ui/                      # Shared UI component primitives
│   └── config/                  # Shared configurations (ESLint, TSConfig, etc.)
├── prisma/
│   ├── schema.prisma            # PostgreSQL relational database schema
│   ├── migrations/              # Database migration history
│   └── seed.ts                  # Seed script for 10 RBAC roles & demo users
├── workflow-config/             # Configurable, versioned workflow templates
│   ├── application-types/
│   ├── stage-definitions/
│   ├── notification-policies/
│   └── escalation-policies/
├── docs/                        # Specifications, rule matrices & architecture
├── tests/                       # Test suites (unit, integration, e2e, security, fixtures)
├── scripts/                     # Local setup & utility scripts
├── docker-compose.yml           # PostgreSQL 16, Redis 7, MinIO local services
├── .env.example                 # Environment configuration template
├── pnpm-workspace.yaml          # Monorepo workspace configuration
└── package.json
```

---

## 👥 10 Supported RBAC Roles

1. **Institution** - Drafts, submits applications, responds to deficiencies, tracks compliance.
2. **Regional Officer** - Regional queue review, monitoring pendency, authorized escalations.
3. **Bureau Officer** - HQ bureau scope processing and queue coordination.
4. **Scrutiny Officer** - Scrutiny/re-scrutiny evidence review, records observations, raises deficiencies.
5. **EVC Coordinator** - Manages EVC queues, schedules, and committee assignments.
6. **EVC Member** - Conducts visits, submits observations and inspection reports.
7. **SAC / SHC** - Standing Hearing / Appellate Committee hearing observations and recommendations.
8. **Competent Authority** - Records final statutory decisions within explicit authority.
9. **System Administrator** - User management, role grants, workflow versions, system settings.
10. **Auditor** - Read-only access to case histories, audit logs, and compliance reports.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20 or higher
- **pnpm**: v9 or higher (`npm install -g pnpm`)
- **Docker Desktop**: for running PostgreSQL, Redis, and MinIO

### 2. Environment Setup
```bash
# Copy example environment configuration
cp .env.example .env
```

### 3. Start Local Services (Docker)
```bash
docker compose up -d
```

### 4. Install Dependencies
```bash
pnpm install
```

### 5. Initialize Database & Seed
```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed
```

### 6. Run Development Servers
```bash
pnpm dev
```
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **REST API & Swagger**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

---

## 🤝 Team Guidelines

- **Separate UI from Business Logic**: The API independently enforces permissions and transitions.
- **Never Commit Secrets**: Keep `.env` strictly local.
- **Transactional Outbox**: Ensure state changes, audit entries, and outbox events commit together in one transaction.
- **Human Oversight**: AI features are strictly advisory; all statutory decisions require authorized human review.
