Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# PowerShell 7 exposes $IsWindows/$IsMacOS/$IsLinux as automatic variables;
# Windows PowerShell 5.1 does not. Define them so the module runs on either edition.
if (-not (Get-Variable -Name 'IsWindows' -ErrorAction SilentlyContinue)) {
    $env:OS -eq 'Windows_NT'        | Set-Variable -Name 'IsWindows'    -Scope 1
    $env:OS -ne 'Windows_NT'        | Set-Variable -Name 'IsMacOS'     -Scope 1
    $env:OS -ne 'Windows_NT'        | Set-Variable -Name 'IsLinux'     -Scope 1
}

function Get-HeySha256 {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant()
}

function ConvertTo-HeySafeRelativePath {
    param([Parameter(Mandatory)][string]$RepoRoot, [Parameter(Mandatory)][string]$Path)
    if ([System.IO.Path]::IsPathRooted($Path)) { throw "Plan paths must be repository-relative: $Path" }
    $root = [System.IO.Path]::GetFullPath($RepoRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    $full = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $Path))
    if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Path escapes repository: $Path" }
    return $full
}

function Protect-HeyLogText {
    param([AllowNull()][string]$Text)
    if ($null -eq $Text) { return '' }
    $result = $Text
    $patterns = @(
        '(?i)(authorization\s*:\s*bearer\s+)[^\s\"'']+',
        '(?i)((?:api[_-]?key|service[_-]?role[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[=:]\s*)[^\s,;\"'']+',
        'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
    )
    foreach ($pattern in $patterns) { $result = [regex]::Replace($result, $pattern, '${1}[REDACTED]') }
    return $result
}

function Write-HeyJson {
    param([Parameter(Mandatory)]$Value, [Parameter(Mandatory)][string]$Path)
    $parent = Split-Path -Parent $Path
    if ($parent) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    $Value | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $Path -Encoding utf8
}

function Read-HeyPlan {
    param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ModuleId)
    if (-not (Test-Path -LiteralPath $PlanPath -PathType Leaf)) { throw "Module plan not found: $PlanPath" }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
    if (-not $plan.moduleId -or $plan.moduleId -ne $ModuleId) { throw "Plan moduleId must equal '$ModuleId'." }
    if ($ModuleId -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$') { throw 'Invalid module id.' }
    return $plan
}

function Invoke-HeyProcess {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [string[]]$ArgumentList = @(),
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [int]$TimeoutSeconds = 900,
        [string]$LogPath
    )
    $stdout = [System.IO.Path]::GetTempFileName()
    $stderr = [System.IO.Path]::GetTempFileName()
    try {
        $process = Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory -NoNewWindow -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
        if (-not $process.WaitForExit([Math]::Max(1, $TimeoutSeconds) * 1000)) {
            $process.Kill($true)
            $process.WaitForExit()
            $timedOut = $true
        } else { $timedOut = $false }
        $out = Protect-HeyLogText (Get-Content -LiteralPath $stdout -Raw -ErrorAction SilentlyContinue)
        $err = Protect-HeyLogText (Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue)
        $record = [ordered]@{ command = $FilePath; arguments = $ArgumentList; startedAt = [DateTimeOffset]::Now.ToString('o'); exitCode = if ($timedOut) { -1 } else { $process.ExitCode }; timedOut = $timedOut; stdout = $out; stderr = $err }
        if ($LogPath) { Write-HeyJson -Value $record -Path $LogPath }
        if ($timedOut) { throw "Command timed out after $TimeoutSeconds seconds: $FilePath" }
        if ($process.ExitCode -ne 0) { throw "Command failed with exit code $($process.ExitCode): $FilePath`n$err" }
        return [pscustomobject]$record
    } finally {
        Remove-Item -LiteralPath $stdout, $stderr -Force -ErrorAction SilentlyContinue
    }
}

function Get-HeyCommandInfo {
    param([string]$Name, [string[]]$VersionArguments = @('--version'))
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) { return [ordered]@{ name = $Name; available = $false; path = $null; version = $null } }
    $version = try { (& $command.Source @VersionArguments 2>&1 | Select-Object -First 1) -join '' } catch { $null }
    return [ordered]@{ name = $Name; available = $true; path = $command.Source; version = Protect-HeyLogText $version }
}

function Invoke-HeyPreflight {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RepoRoot, [switch]$Backend, [switch]$Native, [switch]$Android)
    $required = @((Get-HeyCommandInfo node), (Get-HeyCommandInfo npm), (Get-HeyCommandInfo git))
    $optional = @((Get-HeyCommandInfo cargo), (Get-HeyCommandInfo rustc), (Get-HeyCommandInfo supabase), (Get-HeyCommandInfo java), (Get-HeyCommandInfo adb))
    $isMac = $IsMacOS
    $report = [ordered]@{
        timestamp = [DateTimeOffset]::Now.ToString('o'); repoRoot = $RepoRoot; platform = [System.Environment]::OSVersion.Platform.ToString()
        required = $required; optional = $optional
        stages = [ordered]@{ backend = if ($Backend) { 'requested' } else { 'not-requested' }; native = if ($Native) { 'requested' } else { 'not-requested' }; android = if ($Android) { 'requested' } else { 'not-requested' }; ios = if ($isMac) { 'host-supported; Xcode still requires validation' } else { 'unavailable: iOS builds require macOS and Xcode' } }
    }
    $missing = @($required | Where-Object { -not $_.available })
    if ($Backend -and -not ($optional | Where-Object { $_.name -eq 'supabase' }).available) { $report.stages.backend = 'blocked: Supabase CLI missing' }
    if ($Native -and (-not ($optional | Where-Object { $_.name -eq 'cargo' }).available -or -not ($optional | Where-Object { $_.name -eq 'rustc' }).available)) { $report.stages.native = 'blocked: Rust/Cargo missing' }
    if ($Android -and (-not ($optional | Where-Object { $_.name -eq 'java' }).available -or -not ($optional | Where-Object { $_.name -eq 'adb' }).available)) { $report.stages.android = 'blocked: Java/ADB tooling incomplete' }
    if ($missing.Count) { throw "Required tooling missing: $($missing.name -join ', ')" }
    return [pscustomobject]$report
}

function Get-HeyStatePath { param($RepoRoot, $ModuleId) Join-Path $RepoRoot ".hey-upgrade/state/$ModuleId.json" }

function Set-HeyState {
    param($RepoRoot, $ModuleId, $Status, $TransactionId, $Details)
    $allowed = @('pending','applied','verified-local','verified-backend','verified-native','failed','rolled-back')
    if ($Status -notin $allowed) { throw "Invalid state: $Status" }
    Write-HeyJson -Path (Get-HeyStatePath $RepoRoot $ModuleId) -Value ([ordered]@{ moduleId=$ModuleId; status=$Status; transactionId=$TransactionId; updatedAt=[DateTimeOffset]::Now.ToString('o'); details=$Details })
}

function Get-HeyUpgradeStatus {
    param([Parameter(Mandatory)]$RepoRoot, [Parameter(Mandatory)]$ModuleId)
    $path = Get-HeyStatePath $RepoRoot $ModuleId
    if (Test-Path -LiteralPath $path) { Get-Content -LiteralPath $path -Raw } else { [ordered]@{ moduleId=$ModuleId; status='pending'; transactionId=$null } | ConvertTo-Json }
}

function Get-HeyBackups {
    param([Parameter(Mandatory)]$RepoRoot)
    $root = Join-Path $RepoRoot '.hey-upgrade-backups'
    if (-not (Test-Path -LiteralPath $root)) { return @() }
    Get-ChildItem -LiteralPath $root -Directory | Sort-Object Name -Descending | ForEach-Object {
        $transaction = Join-Path $_.FullName 'transaction.json'
        if (Test-Path -LiteralPath $transaction) { Get-Content -LiteralPath $transaction -Raw | ConvertFrom-Json }
        else { [pscustomobject]@{ transactionId=$_.Name; moduleId='legacy/unknown'; status='legacy-backup'; path=$_.FullName } }
    }
}

function Test-HeyFileOperations {
    param($RepoRoot, $Plan)
    $items = @()
    foreach ($file in @($Plan.files)) {
        $target = ConvertTo-HeySafeRelativePath $RepoRoot $file.target
        $actual = Get-HeySha256 $target
        $expected = if ($file.PSObject.Properties.Name -contains 'baselineSha256') { $file.baselineSha256 } else { $null }
        $conflict = $false
        if ($expected -eq '__absent__') { $conflict = $null -ne $actual }
        elseif ($expected) { $conflict = $actual -ne $expected.ToUpperInvariant() }
        $items += [pscustomobject]@{ operation=$file.operation; target=$file.target; actualSha256=$actual; expectedSha256=$expected; conflict=$conflict }
        if ($file.operation -in @('copy','move')) {
            $source = ConvertTo-HeySafeRelativePath $RepoRoot $file.source
            $sourceActual = Get-HeySha256 $source
            $sourceExpected = if ($file.PSObject.Properties.Name -contains 'sourceSha256') { $file.sourceSha256 } else { $null }
            $sourceConflict = $null -eq $sourceActual -or ($sourceExpected -and $sourceActual -ne $sourceExpected.ToUpperInvariant())
            $items += [pscustomobject]@{ operation="$($file.operation)-source"; target=$file.source; actualSha256=$sourceActual; expectedSha256=$sourceExpected; conflict=$sourceConflict }
        }
    }
    return $items
}

function Invoke-HeyVerification {
    param($RepoRoot, $Plan, $TransactionRoot, $TimeoutSeconds)
    $results = @()
    $index = 0
    foreach ($command in @($Plan.verify)) {
        $index++
        $log = if ($TransactionRoot) { Join-Path $TransactionRoot "logs/verify-$index.json" } else { $null }
        $result = Invoke-HeyProcess -FilePath $command.file -ArgumentList @($command.args) -WorkingDirectory $RepoRoot -TimeoutSeconds $TimeoutSeconds -LogPath $log
        $results += [ordered]@{ file=$command.file; args=@($command.args); exitCode=$result.exitCode; timedOut=$result.timedOut; log=$log }
    }
    return $results
}

function Invoke-HeyCommandStage {
    param($RepoRoot, $Commands, $TransactionRoot, $Stage, $TimeoutSeconds)
    $results = @(); $index = 0
    foreach ($command in @($Commands)) {
        $index++
        $log = Join-Path $TransactionRoot "logs/$Stage-$index.json"
        $result = Invoke-HeyProcess -FilePath $command.file -ArgumentList @($command.args) -WorkingDirectory $RepoRoot -TimeoutSeconds $TimeoutSeconds -LogPath $log
        $results += [ordered]@{ stage=$Stage; file=$command.file; args=@($command.args); exitCode=$result.exitCode; timedOut=$result.timedOut; log=$log }
    }
    return $results
}

function Invoke-HeyUpgrade {
    [CmdletBinding()]
    param([ValidateSet('DryRun','Apply','VerifyOnly')]$Mode, $RepoRoot, $ModuleId, $PlanPath, [int]$TimeoutSeconds=900, [switch]$ConfirmProductionDeploy, [switch]$Force)
    $plan = Read-HeyPlan $PlanPath $ModuleId
    Invoke-HeyPreflight -RepoRoot $RepoRoot -Backend:([bool]$plan.backendDeployment) -Native:([bool]$plan.nativeBuild) -Android:([bool]$plan.androidBuild) | Out-Null
    $inspection = @(Test-HeyFileOperations $RepoRoot $plan)
    if ($Mode -eq 'DryRun') { return [pscustomobject]@{ moduleId=$ModuleId; mode=$Mode; files=$inspection; verify=@($plan.verify); note='Force never bypasses baseline conflicts.' } }
    if ($Mode -eq 'VerifyOnly') {
        $results = Invoke-HeyVerification $RepoRoot $plan $null $TimeoutSeconds
        Set-HeyState $RepoRoot $ModuleId 'verified-local' $null $results
        return $results
    }
    $conflicts = @($inspection | Where-Object conflict)
    if ($conflicts.Count) { throw "Baseline conflict detected in: $($conflicts.target -join ', '). Reconcile the live file and update the plan baseline; -Force does not bypass this check." }
    if ($plan.backendDeployment -and $plan.productionBackend -and -not $ConfirmProductionDeploy) { throw 'Production backend deployment requires -ConfirmProductionDeploy immediately before apply.' }

    $transactionId = "$(Get-Date -Format 'yyyyMMdd-HHmmss')-$ModuleId"
    $transactionRoot = Join-Path $RepoRoot ".hey-upgrade-backups/$transactionId"
    New-Item -ItemType Directory -Force -Path (Join-Path $transactionRoot 'files') | Out-Null
    $manifest = @()
    try {
        foreach ($entry in $inspection) {
            $target = ConvertTo-HeySafeRelativePath $RepoRoot $entry.target
            if (Test-Path -LiteralPath $target -PathType Leaf) {
                $backup = ConvertTo-HeySafeRelativePath (Join-Path $transactionRoot 'files') $entry.target
                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
                Copy-Item -LiteralPath $target -Destination $backup -Force
            }
            $manifest += [ordered]@{ relativePath=$entry.target; operation=$entry.operation; existed=($null -ne $entry.actualSha256); originalSha256=$entry.actualSha256; appliedSha256=$null }
        }
        Write-HeyJson $manifest (Join-Path $transactionRoot 'manifest.json')
        foreach ($file in @($plan.files)) {
            $target = ConvertTo-HeySafeRelativePath $RepoRoot $file.target
            switch ($file.operation) {
                'copy' { $source = ConvertTo-HeySafeRelativePath $RepoRoot $file.source; New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null; Copy-Item -LiteralPath $source -Destination $target -Force }
                'delete' { if (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target -Force } }
                'move' { $source = ConvertTo-HeySafeRelativePath $RepoRoot $file.source; New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null; Move-Item -LiteralPath $source -Destination $target }
                default { throw "Unsupported operation: $($file.operation)" }
            }
        }
        for ($i=0; $i -lt $manifest.Count; $i++) { $manifest[$i].appliedSha256 = Get-HeySha256 (ConvertTo-HeySafeRelativePath $RepoRoot $manifest[$i].relativePath) }
        Write-HeyJson $manifest (Join-Path $transactionRoot 'manifest.json')
        $transaction = [ordered]@{ transactionId=$transactionId; moduleId=$ModuleId; version=$plan.version; status='applied'; createdAt=[DateTimeOffset]::Now.ToString('o'); planSha256=Get-HeySha256 $PlanPath; dependencies=@($plan.dependencies); migrations=@($plan.migrations); functions=@($plan.functions); applyResults=@(); verification=@(); backendResults=@(); nativeResults=@() }
        Write-HeyJson $transaction (Join-Path $transactionRoot 'transaction.json')
        Set-HeyState $RepoRoot $ModuleId 'applied' $transactionId $null
        if ($plan.PSObject.Properties.Name -contains 'apply') { $transaction.applyResults = @(Invoke-HeyCommandStage $RepoRoot $plan.apply $transactionRoot 'apply' $TimeoutSeconds) }
        $transaction.verification = @(Invoke-HeyVerification $RepoRoot $plan $transactionRoot $TimeoutSeconds)
        $transaction.status = 'verified-local'
        if ($plan.backendDeployment -and $plan.PSObject.Properties.Name -contains 'backend') {
            $transaction.backendResults = @(Invoke-HeyCommandStage $RepoRoot $plan.backend $transactionRoot 'backend' $TimeoutSeconds)
            $transaction.status = 'verified-backend'
        }
        if ($plan.nativeBuild -and $plan.PSObject.Properties.Name -contains 'native') {
            $transaction.nativeResults = @(Invoke-HeyCommandStage $RepoRoot $plan.native $transactionRoot 'native' $TimeoutSeconds)
            $transaction.status = 'verified-native'
        }
        Write-HeyJson $transaction (Join-Path $transactionRoot 'transaction.json')
        Set-HeyState $RepoRoot $ModuleId $transaction.status $transactionId $transaction.verification
        return [pscustomobject]$transaction
    } catch {
        if (Test-Path -LiteralPath $transactionRoot) {
            $failure = [ordered]@{ transactionId=$transactionId; moduleId=$ModuleId; status='failed'; failedAt=[DateTimeOffset]::Now.ToString('o'); error=Protect-HeyLogText $_.Exception.Message }
            Write-HeyJson $failure (Join-Path $transactionRoot 'transaction.json')
        }
        Set-HeyState $RepoRoot $ModuleId 'failed' $transactionId (Protect-HeyLogText $_.Exception.Message)
        throw
    }
}

function Restore-HeyUpgrade {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$RepoRoot, [Parameter(Mandatory)]$ModuleId, [switch]$Force)
    $backupRoot = Join-Path $RepoRoot '.hey-upgrade-backups'
    $candidate = Get-ChildItem -LiteralPath $backupRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Where-Object {
        $p = Join-Path $_.FullName 'transaction.json'; if (-not (Test-Path -LiteralPath $p)) { return $false }; (Get-Content -LiteralPath $p -Raw | ConvertFrom-Json).moduleId -eq $ModuleId
    } | Select-Object -First 1
    if (-not $candidate) { throw "No transactional backup found for $ModuleId." }
    $manifestPath = Join-Path $candidate.FullName 'manifest.json'
    $decoded = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $manifest = @($decoded)
    $changedAfterApply = @()
    foreach ($entry in $manifest) {
        $current = Get-HeySha256 (ConvertTo-HeySafeRelativePath $RepoRoot $entry.relativePath)
        if ($current -ne $entry.appliedSha256) { $changedAfterApply += $entry.relativePath }
    }
    if ($changedAfterApply.Count) { throw "Rollback refused because files changed after apply: $($changedAfterApply -join ', '). -Force cannot discard later work; reconcile manually." }
    foreach ($entry in $manifest) {
        $target = ConvertTo-HeySafeRelativePath $RepoRoot $entry.relativePath
        if ($entry.existed) {
            $backup = ConvertTo-HeySafeRelativePath (Join-Path $candidate.FullName 'files') $entry.relativePath
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
            Copy-Item -LiteralPath $backup -Destination $target -Force
        } elseif (Test-Path -LiteralPath $target -PathType Leaf) { Remove-Item -LiteralPath $target -Force }
    }
    $transactionPath = Join-Path $candidate.FullName 'transaction.json'
    $transaction = Get-Content -LiteralPath $transactionPath -Raw | ConvertFrom-Json
    $transaction.status = 'rolled-back'
    $transaction | Add-Member -NotePropertyName rolledBackAt -NotePropertyValue ([DateTimeOffset]::Now.ToString('o')) -Force
    Write-HeyJson $transaction $transactionPath
    Set-HeyState $RepoRoot $ModuleId 'rolled-back' $transaction.transactionId $null
    return $transaction
}

Export-ModuleMember -Function Invoke-HeyPreflight, Invoke-HeyUpgrade, Restore-HeyUpgrade, Get-HeyBackups, Get-HeyUpgradeStatus, Protect-HeyLogText, Get-HeySha256
