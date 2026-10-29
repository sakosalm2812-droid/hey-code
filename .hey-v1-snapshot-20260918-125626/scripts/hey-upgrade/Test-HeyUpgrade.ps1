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
    Set-Content -LiteralPath (Join-Path $testRoot 'fixture/source.txt') -Value 'replacement' -NoNewline
    Set-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Value 'original' -NoNewline
    $baseline = (Get-FileHash -LiteralPath (Join-Path $testRoot 'target.txt') -Algorithm SHA256).Hash
    $planPath = Join-Path $testRoot 'plan.json'
    @{
        moduleId = 'test-module'; version = '1'; dependencies = @(); migrations = @(); functions = @()
        backendDeployment = $false; productionBackend = $false; nativeBuild = $false; androidBuild = $false
        files = @(@{ operation='copy'; source='fixture/source.txt'; sourceSha256=(Get-HeySha256 (Join-Path $testRoot 'fixture/source.txt')); target='target.txt'; baselineSha256=$baseline })
        verify = @()
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $planPath -Encoding utf8

    $applied = Invoke-HeyUpgrade -Mode Apply -RepoRoot $testRoot -ModuleId 'test-module' -PlanPath $planPath
    Assert-HeyTest ((Get-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Raw) -eq 'replacement') 'apply replaces the declared file'
    Assert-HeyTest ($applied.status -eq 'verified-local') 'successful apply reaches verified-local'

    Set-Content -LiteralPath (Join-Path $testRoot 'target.txt') -Value 'later-user-work' -NoNewline
    $rollbackRefused = $false
    try { Restore-HeyUpgrade -RepoRoot $testRoot -ModuleId 'test-module' -Force | Out-Null } catch { $rollbackRefused = $_.Exception.Message -match 'changed after apply' }
    Assert-HeyTest $rollbackRefused 'rollback protects later work even when Force is supplied'

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

    [pscustomobject]@{ success=$true; tests=8; transactionId=$applied.transactionId } | ConvertTo-Json -Compress
} finally {
    if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
}
