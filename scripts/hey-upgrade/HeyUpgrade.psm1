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

function Get-HeyEvidenceFingerprint {
    param([Parameter(Mandatory)][string]$RepoRoot)
    $root = [System.IO.Path]::GetFullPath($RepoRoot)
    $gitRoot = & git -C $root rev-parse --show-toplevel 2>$null
    if (-not $gitRoot) { throw "Unable to enumerate source files for evidence in $root; Git repository not found." }
    $head = & git -C $root rev-parse HEAD 2>$null
    if (-not $head) { $head = 'NO_COMMIT' }
    $paths = @(& git -C $root diff --name-only --no-renames HEAD -- 2>$null)
    $paths += @(& git -C $root ls-files --others --exclude-standard 2>$null)
    $paths = @($paths | Where-Object { $_ } | Sort-Object -Unique)

    $excluded = @(
        'docs/upgrade/MASTER-BUILD-LEDGER.md',
        'docs/upgrade/MASTER-STATUS.json',
        'docs/upgrade/HEY-CAPABILITY-LEDGER.json',
        'docs/upgrade/HEY-VERIFICATION-MATRIX.md',
        'docs/upgrade/HEY-COMPLETE-IMPLEMENTATION-REPORT.md',
        'public/sw.js'
    )
    $rows = [System.Collections.Generic.List[string]]::new()
    $rows.Add("HEAD=$($head.Trim())")
    foreach ($relativePath in $paths) {
        $relative = ([string]$relativePath).Replace('\\', '/')
        if (-not $relative -or $relative.StartsWith('.hey-upgrade/') -or $relative.StartsWith('.hey-upgrade-backups/')) { continue }
        if ($relative.StartsWith('playwright-report/') -or $relative.StartsWith('test-results/')) { continue }
        if ($relative -match '^public/workbox-[^/]+\.js$') { continue }
        if ($relative -in $excluded) { continue }
        $fullPath = Join-Path $root $relativePath
        $fileHash = Get-HeySha256 $fullPath
        $rows.Add("$relative`t$(if ($null -eq $fileHash) { '__deleted__' } else { $fileHash })")
    }
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes(($rows -join "`n"))
        return [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
    } finally { $sha.Dispose() }
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
        $process.Refresh()
        $exitCode = try { [int]$process.ExitCode } catch { -1 }
        $out = Protect-HeyLogText (Get-Content -LiteralPath $stdout -Raw -ErrorAction SilentlyContinue)
        $err = Protect-HeyLogText (Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue)
        $record = [ordered]@{ command = $FilePath; arguments = $ArgumentList; startedAt = [DateTimeOffset]::Now.ToString('o'); exitCode = if ($timedOut) { -1 } else { $exitCode }; timedOut = $timedOut; stdout = $out; stderr = $err }
        if ($LogPath) { Write-HeyJson -Value $record -Path $LogPath }
        if ($timedOut) { throw "Command timed out after $TimeoutSeconds seconds: $FilePath" }
        if ($exitCode -ne 0) { throw "Command failed with exit code ${exitCode}: $FilePath`n$err" }
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
    param($RepoRoot, $ModuleId, $Status, $TransactionId, $Details, [string]$EvidenceFingerprint)
    $allowed = @('pending','applied','verified-local','verified-backend','verified-native','failed','rolled-back')
    if ($Status -notin $allowed) { throw "Invalid state: $Status" }
    if ($Status -match '^verified-' -and -not $EvidenceFingerprint) { $EvidenceFingerprint = Get-HeyEvidenceFingerprint $RepoRoot }
    if ($Status -notmatch '^verified-') { $EvidenceFingerprint = $null }
    Write-HeyJson -Path (Get-HeyStatePath $RepoRoot $ModuleId) -Value ([ordered]@{ moduleId=$ModuleId; status=$Status; transactionId=$TransactionId; updatedAt=[DateTimeOffset]::Now.ToString('o'); evidenceFingerprint=$evidenceFingerprint; details=$Details })
}

function Get-HeyUpgradeStatus {
    param([Parameter(Mandatory)]$RepoRoot, [Parameter(Mandatory)]$ModuleId, [string]$EvidenceFingerprint)
    $path = Get-HeyStatePath $RepoRoot $ModuleId
    if (-not (Test-Path -LiteralPath $path)) { return ([ordered]@{ moduleId=$ModuleId; status='pending'; recordedStatus='pending'; transactionId=$null; evidenceFresh=$false } | ConvertTo-Json -Depth 20) }
    $state = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    $recordedStatus = if ($state.PSObject.Properties.Name -contains 'status') { $state.status } else { 'pending' }
    $hasFingerprint = $state.PSObject.Properties.Name -contains 'evidenceFingerprint'
    if (-not $EvidenceFingerprint) { $EvidenceFingerprint = Get-HeyEvidenceFingerprint $RepoRoot }
    $evidenceFresh = [bool]($recordedStatus -match '^verified-' -and $hasFingerprint -and $state.evidenceFingerprint -and $state.evidenceFingerprint -eq $EvidenceFingerprint)
    $state | Add-Member -NotePropertyName recordedStatus -NotePropertyValue $recordedStatus -Force
    $state | Add-Member -NotePropertyName evidenceFresh -NotePropertyValue $evidenceFresh -Force
    if ($recordedStatus -match '^verified-' -and -not $evidenceFresh) { $state.status = 'stale' }
    return ($state | ConvertTo-Json -Depth 20)
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
    param([ValidateSet('DryRun','Apply','VerifyOnly')]$Mode, $RepoRoot, $ModuleId, $PlanPath, [int]$TimeoutSeconds=900, [switch]$ConfirmProductionDeploy, [switch]$Force, [string]$EvidenceFingerprint)
    $plan = Read-HeyPlan $PlanPath $ModuleId
    Invoke-HeyPreflight -RepoRoot $RepoRoot -Backend:([bool]$plan.backendDeployment) -Native:([bool]$plan.nativeBuild) -Android:([bool]$plan.androidBuild) | Out-Null
    $inspection = @(Test-HeyFileOperations $RepoRoot $plan)
    if ($Mode -eq 'DryRun') { return [pscustomobject]@{ moduleId=$ModuleId; mode=$Mode; files=$inspection; verify=@($plan.verify); note='Force never bypasses baseline conflicts.' } }
    if ($Mode -eq 'VerifyOnly') {
        $results = Invoke-HeyVerification $RepoRoot $plan $null $TimeoutSeconds
        if (-not $EvidenceFingerprint) { $EvidenceFingerprint = Get-HeyEvidenceFingerprint $RepoRoot }
        Set-HeyState $RepoRoot $ModuleId 'verified-local' $null $results $EvidenceFingerprint
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

function Get-HeyModulePlans {
    param([Parameter(Mandatory)]$RepoRoot)
    $dir = ConvertTo-HeySafeRelativePath $RepoRoot 'scripts/hey-upgrade/modules'
    if (-not (Test-Path -LiteralPath $dir)) { throw "Module plans directory not found: $dir" }
    @(Get-ChildItem -LiteralPath $dir -Filter '*.json' -File | Sort-Object Name | ForEach-Object {
        $plan = Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
        if (-not $plan.moduleId) { throw "Module plan missing moduleId: $($_.Name)" }
        $plan | Add-Member -NotePropertyName PlanPath -NotePropertyValue $_.FullName -Force
        $plan
    })
}

function Invoke-HeyAllUpgrade {
    [CmdletBinding()]
    param([ValidateSet('DryRun','Apply','Resume','VerifyOnly')]$Mode, [Parameter(Mandatory)]$RepoRoot, [int]$TimeoutSeconds=900, [switch]$ConfirmProductionDeploy, [switch]$Force)
    $plans = @(Get-HeyModulePlans $RepoRoot)
    if (-not $plans.Count) { throw 'No module plans found.' }
    $results = @()
    $skipVerified = ($Mode -in @('Apply','Resume'))
    $evidenceFingerprint = Get-HeyEvidenceFingerprint $RepoRoot
    foreach ($plan in $plans) {
        $current = Get-HeyUpgradeStatus $RepoRoot $plan.moduleId $evidenceFingerprint | ConvertFrom-Json
        $state = if ($current.status) { $current.status } else { 'pending' }
        $currentFingerprint = if ($current.PSObject.Properties.Name -contains 'evidenceFingerprint') { $current.evidenceFingerprint } else { $null }
        $evidenceFresh = $currentFingerprint -and $currentFingerprint -eq $evidenceFingerprint
        if ($state -match '^verified-' -and -not $evidenceFresh) { $state = 'stale' }
        if ($Mode -eq 'DryRun') {
            $results += [ordered]@{ moduleId=$plan.moduleId; title=$plan.title; state=$state; would=[ordered]@{ apply=(($Mode -eq 'DryRun') -and $true); verify=@($plan.verify) } }
            continue
        }
        if ($skipVerified -and $evidenceFresh -and $state -in @('verified-local','verified-backend','verified-native')) {
            $results += [ordered]@{ moduleId=$plan.moduleId; title=$plan.title; status=$state; skipped='already-verified' }
            continue
        }
        try {
            $result = Invoke-HeyUpgrade -Mode $(if ($Mode -eq 'VerifyOnly') { 'VerifyOnly' } else { 'Apply' }) -RepoRoot $RepoRoot -ModuleId $plan.moduleId -PlanPath $plan.PlanPath -TimeoutSeconds $TimeoutSeconds -ConfirmProductionDeploy:$ConfirmProductionDeploy -Force:$Force -EvidenceFingerprint $(if ($Mode -eq 'VerifyOnly') { $evidenceFingerprint } else { $null })
            if ($Mode -in @('Apply','Resume') -and (($plan.PSObject.Properties.Name -contains 'files' -and @($plan.files).Count -gt 0) -or ($plan.PSObject.Properties.Name -contains 'apply' -and @($plan.apply).Count -gt 0))) {
                $evidenceFingerprint = Get-HeyEvidenceFingerprint $RepoRoot
            }
            $stateAfter = (Get-HeyUpgradeStatus $RepoRoot $plan.moduleId $evidenceFingerprint | ConvertFrom-Json)
            $resultStatus = if ($stateAfter.PSObject.Properties.Name -contains 'status') { $stateAfter.status } else { 'verified-local' }
            $results += [ordered]@{ moduleId=$plan.moduleId; title=$plan.title; status=$resultStatus; skipped=$false }
            if ($resultStatus -eq 'failed') { break }
        } catch {
            $results += [ordered]@{ moduleId=$plan.moduleId; title=$plan.title; status='failed'; error=Protect-HeyLogText $_.Exception.Message }
            break
        }
    }
    $summary = [ordered]@{ mode=$Mode; moduleCount=$plans.Count; results=@($results); completedAt=[DateTimeOffset]::Now.ToString('o') }
    Write-HeyJson $summary (Join-Path $RepoRoot '.hey-upgrade/last-all.json')
    return [pscustomobject]$summary
}

function Get-HeyAllStatus {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$RepoRoot, [switch]$WriteMasterStatus)
    $plans = @(Get-HeyModulePlans $RepoRoot)
    $modules = @()
    $evidenceFingerprint = Get-HeyEvidenceFingerprint $RepoRoot
    foreach ($plan in $plans) {
        $state = Get-HeyUpgradeStatus $RepoRoot $plan.moduleId $evidenceFingerprint
        $decoded = $state | ConvertFrom-Json
        $safe = if ($decoded.PSObject.Properties.Name -contains 'status') { $decoded.status } else { 'pending' }
        $recordedStatus = if ($decoded.PSObject.Properties.Name -contains 'recordedStatus') { $decoded.recordedStatus } else { $safe }
        $evidenceFresh = [bool]($decoded.PSObject.Properties.Name -contains 'evidenceFresh' -and $decoded.evidenceFresh)
        $modules += [ordered]@{
            moduleId = $plan.moduleId
            title = if ($plan.PSObject.Properties.Name -contains 'title') { $plan.title } else { $null }
            status = if ($safe) { $safe } else { 'pending' }
            recordedStatus = if ($recordedStatus) { $recordedStatus } else { 'pending' }
            evidenceFresh = $evidenceFresh
            transactionId = if ($decoded.PSObject.Properties.Name -contains 'transactionId') { $decoded.transactionId } else { $null }
            updatedAt = if ($decoded.PSObject.Properties.Name -contains 'updatedAt') { $decoded.updatedAt } else { $null }
            evidenceFingerprint = if ($decoded.PSObject.Properties.Name -contains 'evidenceFingerprint') { $decoded.evidenceFingerprint } else { $null }
            notes = if ($plan.PSObject.Properties.Name -contains 'notes') { $plan.notes } else { $null }
        }
    }
    $report = [ordered]@{
        generatedAt = [DateTimeOffset]::Now.ToString('o')
        generator = 'Get-HeyAllStatus'
        masterFile = 'docs/upgrade/MASTER-BUILD-LEDGER.md'
        modules = @($modules)
        summary = [ordered]@{ total=$modules.Count; verified=@($modules | Where-Object { $_.status -match '^verified-' -and $_.evidenceFresh }).Count; stale=@($modules | Where-Object status -eq 'stale').Count; applied=@($modules | Where-Object status -eq 'applied').Count; pending=@($modules | Where-Object status -eq 'pending').Count; failed=@($modules | Where-Object status -eq 'failed').Count; rolledBack=@($modules | Where-Object status -eq 'rolled-back').Count }
    }
    if ($WriteMasterStatus) { Write-HeyJson $report (Join-Path $RepoRoot 'docs/upgrade/MASTER-STATUS.json') }
    return [pscustomobject]$report
}

Export-ModuleMember -Function Invoke-HeyPreflight, Invoke-HeyUpgrade, Restore-HeyUpgrade, Get-HeyBackups, Get-HeyUpgradeStatus, Protect-HeyLogText, Get-HeySha256, Get-HeyEvidenceFingerprint, Get-HeyModulePlans, Invoke-HeyAllUpgrade, Get-HeyAllStatus
