[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'HeyUpgrade.psm1') -Force
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("hey-upgrade-test-" + [guid]::NewGuid().ToString('N'))

function Assert-HeyTest {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "Assertion failed: $Message" }
}

try {
    New-Item -ItemType Directory -Force -Path (Join-Path $testRoot 'fixture') | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $testRoot 'scripts/hey-upgrade/modules') | Out-Null
    Set-Content -LiteralPath (Join-Path $testRoot '.gitignore') -Value ".hey-upgrade/`n.hey-upgrade-backups/" -NoNewline
    & git -C $testRoot init --quiet | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not initialize the temporary Git fixture.' }
    Set-Content -LiteralPath (Join-Path $testRoot 'fixture/source.txt') -Value 'replacement' -NoNewline
    Set-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Value 'original' -NoNewline
    $baseline = (Get-FileHash -LiteralPath (Join-Path $testRoot 'target.txt') -Algorithm SHA256).Hash
    $planPath = Join-Path $testRoot 'scripts/hey-upgrade/modules/test-module.json'
    @{
        moduleId = 'test-module'; title = 'Test module'; version = '1'; dependencies = @(); migrations = @(); functions = @()
        backendDeployment = $false; productionBackend = $false; nativeBuild = $false; androidBuild = $false
        files = @(@{ operation='copy'; source='fixture/source.txt'; sourceSha256=(Get-HeySha256 (Join-Path $testRoot 'fixture/source.txt')); target='target.txt'; baselineSha256=$baseline })
        verify = @()
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $planPath -Encoding utf8

    $applied = Invoke-HeyUpgrade -Mode Apply -RepoRoot $testRoot -ModuleId 'test-module' -PlanPath $planPath
    Assert-HeyTest ((Get-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Raw) -eq 'replacement') 'apply replaces the declared file'
    Assert-HeyTest ($applied.status -eq 'verified-local') 'successful apply reaches verified-local'
    $freshStatus = Get-HeyAllStatus -RepoRoot $testRoot
    Assert-HeyTest ($freshStatus.modules[0].status -eq 'verified-local' -and $freshStatus.modules[0].evidenceFresh) 'current verification is tied to the checkout fingerprint'
    Assert-HeyTest ($freshStatus.summary.verified -eq 1) 'fresh verification is counted'

    Set-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Value 'later-user-work' -NoNewline
    $rollbackRefused = $false
    try { Restore-HeyUpgrade -RepoRoot $testRoot -ModuleId 'test-module' -Force | Out-Null } catch { $rollbackRefused = $_.Exception.Message -match 'changed after apply' }
    Assert-HeyTest $rollbackRefused 'rollback protects later work even when Force is supplied'
    $staleStatus = Get-HeyAllStatus -RepoRoot $testRoot
    Assert-HeyTest ($staleStatus.modules[0].status -eq 'stale' -and $staleStatus.modules[0].recordedStatus -eq 'verified-local') 'source changes make old verification stale'
    Assert-HeyTest ($staleStatus.summary.verified -eq 0 -and $staleStatus.summary.stale -eq 1) 'stale verification is excluded from verified totals'
    $singleStatus = Get-HeyUpgradeStatus -RepoRoot $testRoot -ModuleId 'test-module' | ConvertFrom-Json
    Assert-HeyTest ($singleStatus.status -eq 'stale' -and $singleStatus.recordedStatus -eq 'verified-local') 'single-module status also exposes stale evidence'
    $resume = Invoke-HeyAllUpgrade -Mode Resume -RepoRoot $testRoot
    Assert-HeyTest ($resume.results[0].status -eq 'failed' -and $resume.results[0].error -match 'Baseline conflict') 'resume rechecks stale verification and respects the existing baseline guard'
    Assert-HeyTest ((Get-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Raw) -eq 'later-user-work') 'stale resume preserves later user work when the baseline conflicts'

    Set-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Value 'replacement' -NoNewline
    $rolledBack = Restore-HeyUpgrade -RepoRoot $testRoot -ModuleId 'test-module'
    Assert-HeyTest ((Get-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Raw) -eq 'original') 'rollback restores the exact original file'
    Assert-HeyTest ($rolledBack.status -eq 'rolled-back') 'rollback records state'

    $badPlanPath = Join-Path $testRoot 'bad-plan.json'
    @{
        moduleId = 'conflict-module'; version = '1'; dependencies = @(); migrations = @(); functions = @()
        backendDeployment = $false; productionBackend = $false; nativeBuild = $false; androidBuild = $false
        files = @(@{ operation='copy'; source='fixture/source.txt'; target='target.txt'; baselineSha256=('0' * 64) })
        verify = @()
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $badPlanPath -Encoding utf8
    $conflictRefused = $false
    try { Invoke-HeyUpgrade -Mode Apply -RepoRoot $testRoot -ModuleId 'conflict-module' -PlanPath $badPlanPath -Force | Out-Null } catch { $conflictRefused = $_.Exception.Message -match 'Baseline conflict' }
    Assert-HeyTest $conflictRefused 'Force cannot bypass a baseline conflict'

    $redacted = Protect-HeyLogText 'api_key=very-secret-value Authorization: Bearer abc.def.ghi'
    Assert-HeyTest ($redacted -notmatch 'very-secret-value') 'secret-like values are redacted from logs'
    Assert-HeyTest ($redacted -match '\[REDACTED\]') 'redaction is explicit'

    [pscustomobject]@{ success=$true; tests=15; transactionId=$applied.transactionId } | ConvertTo-Json -Compress
} finally {
    if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
}
