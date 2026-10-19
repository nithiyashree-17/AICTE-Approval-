$dirs = @(
    'apps/web/src/app/(auth)/login',
    'apps/web/src/app/(dashboard)/dashboard',
    'apps/web/src/app/(dashboard)/applications',
    'apps/web/src/app/(dashboard)/scrutiny',
    'apps/web/src/app/(dashboard)/evc',
    'apps/web/src/app/(dashboard)/compliance',
    'apps/web/src/app/(dashboard)/documents',
    'apps/web/src/app/(dashboard)/notifications',
    'apps/web/src/app/(dashboard)/reports',
    'apps/web/src/app/(dashboard)/users',
    'apps/web/src/components/layout',
    'apps/web/src/components/dashboard',
    'apps/web/src/components/workflow',
    'apps/web/src/components/documents',
    'apps/web/src/components/notifications',
    'apps/web/src/features',
    'apps/web/src/lib',
    'apps/api/src/auth',
    'apps/api/src/users',
    'apps/api/src/roles',
    'apps/api/src/institutions',
    'apps/api/src/applications',
    'apps/api/src/workflow',
    'apps/api/src/scrutiny',
    'apps/api/src/evc',
    'apps/api/src/committees',
    'apps/api/src/compliance',
    'apps/api/src/documents',
    'apps/api/src/notifications',
    'apps/api/src/escalations',
    'apps/api/src/reports',
    'apps/api/src/audit',
    'apps/api/src/rules',
    'apps/worker/src/deadline',
    'apps/worker/src/reminders',
    'apps/worker/src/escalations',
    'apps/worker/src/email',
    'apps/worker/src/reconciliation',
    'packages/shared-types/src',
    'packages/validation/src',
    'packages/workflow-contracts/src',
    'packages/ui/src',
    'packages/config/src',
    'prisma/migrations',
    'workflow-config/application-types',
    'workflow-config/stage-definitions',
    'workflow-config/notification-policies',
    'workflow-config/escalation-policies',
    'docs',
    'tests/unit',
    'tests/integration',
    'tests/e2e',
    'tests/security',
    'tests/fixtures',
    'scripts'
)

foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
    }
    $keep = Join-Path $d '.gitkeep'
    if (-not (Test-Path $keep)) {
        New-Item -ItemType File -Path $keep -Force | Out-Null
    }
}
Write-Output "Scaffolded $($dirs.Count) directories with .gitkeep."
