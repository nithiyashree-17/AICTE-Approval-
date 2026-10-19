# Web Application (`apps/web`)

Responsive, role-aware web frontend built with **Next.js (App Router)**, **React**, **TypeScript**, and **Tailwind CSS**.

## Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/login/             # Secure login & local demo account switcher
│   │   └── (dashboard)/
│   │       ├── dashboard/            # Role-specific dashboard (KPI cards, queues)
│   │       ├── applications/         # Application draft, view, timeline, submissions
│   │       ├── scrutiny/             # Scrutiny & re-scrutiny workspace
│   │       ├── evc/                  # EVC scheduling, committee assignment, reports
│   │       ├── compliance/           # Compliance obligations & renewal tracking
│   │       ├── documents/            # Document verification & version viewer
│   │       ├── notifications/        # Notification centre (read/unread, deep-links)
│   │       ├── reports/              # Pendency, ageing, workload, compliance analytics
│   │       └── users/                # Administrative user & role management
│   ├── components/
│   │   ├── layout/                   # Role-aware sidebar, navbar, page headers
│   │   ├── dashboard/                # Metric cards, pending action tables, charts
│   │   ├── workflow/                 # Interactive stage stepper, transition action modal
│   │   ├── documents/                # Secure previewer, version diff, upload intent
│   │   └── notifications/            # Bell popup, toast alerts, list views
│   ├── features/                     # Feature-specific state and custom hooks
│   └── lib/                          # API client, auth session helper, utils
└── package.json
```

## Team Guidelines

1. **Role-Aware UI**:
   - Navigation and UI elements adapt based on the user's authenticated role (10 supported roles).
   - Important: The UI may disable/hide actions for convenience, but the NestJS backend API is the authoritative gatekeeper for RBAC and scope checks.

2. **UX Requirements (Section 14.1)**:
   - Consistent, professional government/enterprise visual system; avoid overdecorated screens.
   - Use explicit statuses with readable text badges, not colour alone.
   - Every list must implement loading, empty, error, and paginated states.
   - Buttons must trigger actual API transitions or be explicitly disabled with a tooltip explaining why.

3. **Running Locally**:
   ```bash
   pnpm dev:web
   ```
   Runs on `http://localhost:3000`.
