$docFiles = @(
    'docs/requirements.md',
    'docs/aph-rule-matrix.md',
    'docs/unresolved-regulatory-questions.md',
    'docs/architecture.md',
    'docs/workflow-diagrams.md',
    'docs/rbac-matrix.md',
    'docs/database-design.md',
    'docs/api-contracts.md',
    'docs/notification-design.md',
    'docs/security.md',
    'docs/test-plan.md',
    'docs/deployment.md'
)

foreach ($f in $docFiles) {
    if (-not (Test-Path $f)) {
        $name = [System.IO.Path]::GetFileNameWithoutExtension($f)
        Set-Content -Path $f -Value "# $name`n"
    }
}

$dirsToCheck = @(
    'packages/config',
    'packages/ui',
    'packages/validation',
    'packages/workflow-contracts',
    'packages/shared-types'
)

foreach ($d in $dirsToCheck) {
    $keep = Join-Path $d '.gitkeep'
    if (-not (Test-Path $keep)) {
        New-Item -ItemType File -Path $keep -Force | Out-Null
    }
}

Write-Output "Doc placeholders and packages verified."
