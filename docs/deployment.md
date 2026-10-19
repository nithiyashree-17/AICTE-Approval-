# AICTE FlowGuard — Deployment & Operations Runbook

**Document Control:**
- **Project:** AICTE FlowGuard (Problem Statement ID: 26262)
- **Document Role:** Teammate D (Automation / DevOps / Integration)
- **Status:** Complete Deployment Runbook & Infrastructure Specifications
- **Local Infrastructure:** Docker Compose (PostgreSQL 16, Redis 7, MinIO)
- **Source Basis:** Section 20 of AICTE FlowGuard Implementation Plan

---

## 1. Local Development Architecture & Docker Compose

FlowGuard utilizes Docker Compose to run required backing services locally in development and testing environments:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: aicte-flowguard-postgres
    restart: always
    environment:
      POSTGRES_USER: flowguard_user
      POSTGRES_PASSWORD: flowguard_secret_password
      POSTGRES_DB: aicte_flowguard_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U flowguard_user -d aicte_flowguard_dev']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: aicte-flowguard-redis
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:RELEASE.2024-01-18T22-51-28Z
    container_name: aicte-flowguard-minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio_admin
      MINIO_ROOT_PASSWORD: minio_secret_password
    ports:
      - '9000:9000' # S3 API endpoint
      - '9001:9001' # Web Console
    volumes:
      - minio_data:/data
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## 2. Environment Variables Configuration (`.env.example`)

Create a `.env` file in the repository root by copying `.env.example`:

```bash
# ==============================================
# AICTE FLOWGUARD ENVIRONMENT CONFIGURATION
# ==============================================
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# --- DATABASE (PostgreSQL) ---
DATABASE_URL="postgresql://flowguard_user:flowguard_secret_password@localhost:5432/aicte_flowguard_dev?schema=public&connection_limit=20"

# --- CACHE & BACKGROUND QUEUES (Redis) ---
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""

# --- OBJECT STORAGE (MinIO / S3) ---
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET_NAME=aicte-flowguard-documents
S3_ACCESS_KEY_ID=minio_admin
S3_SECRET_ACCESS_KEY=minio_secret_password
S3_FORCE_PATH_STYLE=true

# --- AUTHENTICATION & SECRETS ---
JWT_SECRET=super_secret_jwt_signing_key_at_least_32_characters_long_for_dev
JWT_EXPIRATION_SECONDS=86400
ENABLE_DEV_DEMO_SWITCHER=true

# --- NOTIFICATION & EMAIL (Mock in development) ---
EMAIL_PROVIDER=mock # Options: mock, smtp, resend
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=""
SMTP_PASS=""
RESEND_API_KEY=""

# --- APPLICATION & REGULATORY SETTINGS ---
DEFAULT_DEFICIENCY_DAYS=7
DEFAULT_APPEAL_DAYS=7
RECONCILIATION_INTERVAL_MINUTES=60
```

---

## 3. Seed Personas & Demo Users (`seed.ts`)

FlowGuard seeds 10 distinct user accounts to facilitate instant role testing and demonstration:

| Persona Email | Default Password | Role Code | Assigned Entity / Scope |
| :--- | :--- | :--- | :--- |
| `institution@apex-tech.edu` | `Password123!` | `ROLE_INSTITUTION` | Apex Institute of Technology (`inst-001`) |
| `regional.director@aicte.gov.in`| `Password123!` | `ROLE_REGIONAL_OFFICER` | North Western Regional Office (`reg-nw-001`) |
| `bureau.head@aicte.gov.in` | `Password123!` | `ROLE_BUREAU_OFFICER` | Central Approval Bureau, New Delhi |
| `scrutiny.officer@aicte.gov.in` | `Password123!` | `ROLE_SCRUTINY_OFFICER` | Assigned Scrutiny Officer (`u-so-001`) |
| `evc.coordinator@aicte.gov.in` | `Password123!` | `ROLE_EVC_COORDINATOR`| Regional EVC Logistics Cell |
| `evc.expert@iit.ac.in` | `Password123!` | `ROLE_EVC_MEMBER` | Nominated Subject Expert (`u-evc-001`) |
| `shc.bench@judiciary.gov.in` | `Password123!` | `ROLE_SAC_SHC` | Standing Hearing Committee Quorum |
| `member.secretary@aicte.gov.in`| `Password123!` | `ROLE_COMPETENT_AUTHORITY`| AICTE Executive Committee / Council |
| `system.admin@aicte.gov.in` | `Password123!` | `ROLE_SYSTEM_ADMIN` | Technical Infrastructure Administrator |
| `auditor@cag.gov.in` | `Password123!` | `ROLE_AUDITOR` | Independent Oversight & Audit (Read-Only)|

---

## 4. Local Execution & Developer Runbook

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/nithiyashree-17/AICTE-Approval-.git
cd aicte-flowguard
pnpm install
```

### Step 2: Boot Docker Services
```bash
docker compose up -d
docker compose ps
```

### Step 3: Run Database Migrations & Seed Baseline Data
```bash
# Push schema and generate Prisma client
pnpm prisma migrate dev --name init_flowguard_baseline

# Seed the 10 demo personas, regions, and workflow templates
pnpm prisma db seed
```

### Step 4: Start Applications in Development Mode
```bash
# Starts Next.js (port 3000), NestJS API (port 3001), and BullMQ Worker concurrently
pnpm dev
```

### Step 5: Verification & Pre-Demo Checks
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

---

## 5. Health Check Endpoints

The NestJS API exposes standardized health probes for Kubernetes / container orchestration:

- **Liveness Probe (`GET /health/liveness`):** Confirms the HTTP server process is responsive.
- **Readiness Probe (`GET /health/readiness`):** Confirms active database connection pools to PostgreSQL, Redis connectivity, and MinIO storage bucket availability. Returns `200 OK` when all subsystems are healthy, or `503 Service Unavailable` with details of failing subsystems.
