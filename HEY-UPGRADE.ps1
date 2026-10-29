[CmdletBinding()]
param(
    [ValidateSet('preflight', 'dry-run', 'apply', 'resume', 'verify-only', 'rollback-last', 'list-backups', 'status')]
    [string]$Operation = 'status',
    [string]$Module = '00-MASTER-ORCHESTRATOR',
    [string]$Plan,
    [switch]$Backend,
    [switch]$Native,
    [switch]$Android,
    [switch]$ConfirmProductionDeploy,
    [switch]$Force,
    [switch]$WriteMasterStatus,
    [int]$TimeoutSeconds = 900
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSCommandPath
Import-Module (Join-Path $repoRoot 'scripts/hey-upgrade/HeyUpgrade.psm1') -Force

if ($Module -eq 'ALL') {
    switch ($Operation) {
        'dry-run' {
            $r = Invoke-HeyAllUpgrade -Mode DryRun -RepoRoot $repoRoot -TimeoutSeconds $TimeoutSeconds
        }
        'apply' {
            $r = Invoke-HeyAllUpgrade -Mode Apply -RepoRoot $repoRoot -TimeoutSeconds $TimeoutSeconds -ConfirmProductionDeploy:$ConfirmProductionDeploy -Force:$Force
        }
        'resume' {
            $r = Invoke-HeyAllUpgrade -Mode Resume -RepoRoot $repoRoot -TimeoutSeconds $TimeoutSeconds -ConfirmProductionDeploy:$ConfirmProductionDeploy -Force:$Force
        }
        'verify-only' {
            $r = Invoke-HeyAllUpgrade -Mode VerifyOnly -RepoRoot $repoRoot -TimeoutSeconds $TimeoutSeconds
        }
        'status' {
            $r = Get-HeyAllStatus -RepoRoot $repoRoot -WriteMasterStatus:$WriteMasterStatus
        }
        'rollback-last' {
            throw "rollback-last requires a concrete -Module ID (not ALL). Use 'status' to find the affected module."
        }
        default {
            throw "Operation '$Operation' does not support -Module ALL."
        }
    }
    $r | ConvertTo-Json -Depth 20
    exit
}

if (-not $Plan) {
    $Plan = Join-Path $repoRoot "scripts/hey-upgrade/modules/$Module.json"
}

$common = @{
    RepoRoot = $repoRoot
    ModuleId = $Module
    PlanPath = $Plan
    TimeoutSeconds = $TimeoutSeconds
}

switch ($Operation) {
    'preflight' {
        Invoke-HeyPreflight -RepoRoot $repoRoot -Backend:$Backend -Native:$Native -Android:$Android
    }
    'dry-run' {
        Invoke-HeyUpgrade -Mode DryRun @common
    }
    'apply' {
        Invoke-HeyUpgrade -Mode Apply -ConfirmProductionDeploy:$ConfirmProductionDeploy -Force:$Force @common
    }
    'resume' {
        Invoke-HeyUpgrade -Mode Apply -ConfirmProductionDeploy:$ConfirmProductionDeploy -Force:$Force @common
    }
    'verify-only' {
        Invoke-HeyUpgrade -Mode VerifyOnly @common
    }
    'rollback-last' {
        Restore-HeyUpgrade -RepoRoot $repoRoot -ModuleId $Module -Force:$Force
    }
    'list-backups' {
        Get-HeyBackups -RepoRoot $repoRoot
    }
    'status' {
        Get-HeyUpgradeStatus -RepoRoot $repoRoot -ModuleId $Module
    }
}

