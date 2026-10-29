# Generates per-module reports docs/upgrade/<module-id>.md from the live module
# plans and upgrade state. Evidence is read from the plans (verify stages,
# notes) and the current `.hey-upgrade/state/<module-id>.json` - never invented.
# Run from the repository root:
#   powershell -NoProfile -File scripts/hey-upgrade/generate-module-reports.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outDir = Join-Path $repoRoot 'docs/upgrade'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Import-Module (Join-Path $repoRoot 'scripts/hey-upgrade/HeyUpgrade.psm1') -Force

$plans = Get-HeyModulePlans $repoRoot
if (-not $plans.Count) { throw 'No module plans found.' }

foreach ($plan in $plans) {
    if ($plan.moduleId -eq '00-MASTER-ORCHESTRATOR') { continue }
    $state = (Get-HeyUpgradeStatus $repoRoot $plan.moduleId | ConvertFrom-Json)
    $status = if ($state.PSObject.Properties.Name -contains 'status') { $state.status } else { 'pending' }
    $tx = if ($state.PSObject.Properties.Name -contains 'transactionId') { $state.transactionId } else { $null }
    $at = if ($state.PSObject.Properties.Name -contains 'updatedAt') { $state.updatedAt } else { $null }

    $verifyLines = foreach ($v in @($plan.verify)) {
        $joined = ($v.args -join ' ')
        "- **Verify command:** ``$($v.file) $joined``"
    }

    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('# ' + $plan.moduleId)
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## ' + $plan.title)
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('Status: **' + $status + '**')
    [void]$sb.AppendLine('Module id: ``' + $plan.moduleId + '``')
    [void]$sb.AppendLine('Plan version: ``' + $plan.version + '``')
    if ($tx) { [void]$sb.AppendLine('Verified transaction: ``' + $tx + '``') }
    if ($at) { [void]$sb.AppendLine('Verified at: ' + $at) }
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Mission')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine($plan.title)
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Dependencies')
    [void]$sb.AppendLine('')
    if (@($plan.dependencies).Count) { [void]$sb.AppendLine($plan.dependencies -join ', ') } else { [void]$sb.AppendLine('none (root module)') }
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Evidence (from the canonical plan)')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine($plan.notes)
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Verification gate')
    [void]$sb.AppendLine('')
    foreach ($line in $verifyLines) { [void]$sb.AppendLine($line) }
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## What is NOT verified in this local pass')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.')
    [void]$sb.AppendLine('- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.')
    [void]$sb.AppendLine('- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.')
    [void]$sb.AppendLine('- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('## Rollback')
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/' + $plan.moduleId + '.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.')
    [void]$sb.AppendLine('')

    $path = Join-Path $outDir ($plan.moduleId + '.md')
    $sb.ToString() | Set-Content -LiteralPath $path -Encoding utf8
    Write-Host "wrote $($plan.moduleId).md ($status)"
}

Write-Host "Generated reports for $($plans.Count - 1) modules (00 kept its hand-written report)."