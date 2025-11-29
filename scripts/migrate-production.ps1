Param()
$ErrorActionPreference = "Stop"
Write-Host "Starting database migration (PowerShell)"

$inCI = ($env:CI -eq "true" -or $env:GITHUB_ACTIONS -eq "true" -or $env:VERCEL -eq "1")
if (-not $inCI) {
    $envFile = Join-Path $PWD ".env.local"
    if (Test-Path $envFile) {
        Write-Host "Loading .env.local"
        Get-Content $envFile | Where-Object { $_ -match "^[A-Za-z_][A-Za-z0-9_]*=" } | ForEach-Object {
            $parts = $_.Split("=", 2)
            $name = $parts[0]
            $value = $parts[1]
            if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Trim('"') }
            Set-Item -Path Env:$name -Value $value
        }
    }
}

if (-not $env:NEXT_PUBLIC_SUPABASE_URL) { throw "NEXT_PUBLIC_SUPABASE_URL is not set" }
$isLocal = ($env:NEXT_PUBLIC_SUPABASE_URL -match "127\.0\.0\.1|localhost")
Write-Host ("URL: {0}" -f $env:NEXT_PUBLIC_SUPABASE_URL)
if ($isLocal) { $envStr = "local" } else { $envStr = "remote" }
Write-Host ("Environment: {0}" -f $envStr)

if ($isLocal) {
    Write-Host "Applying migrations to local DB..."
    supabase db push
} else {
    if (-not $env:SUPABASE_DB_PASSWORD) { throw "SUPABASE_DB_PASSWORD is not set" }
    $uri = [Uri]$env:NEXT_PUBLIC_SUPABASE_URL
    $host = $uri.Host
    $projectRef = ($host -split "\.")[0]
    Write-Host ("Project ref: {0}" -f $projectRef)
    Write-Host "Linking Supabase project..."
    supabase link --project-ref $projectRef --password $env:SUPABASE_DB_PASSWORD
    Write-Host "Applying migrations to remote DB..."
    supabase db push --linked --include-all
}

Write-Host "Running report seed"
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) { throw "SUPABASE_SERVICE_ROLE_KEY is not set" }
if ($inCI) {
    node --import tsx scripts/seed-recaudacion-reportes.ts
} else {
    node --env-file=.env.local --import tsx scripts/seed-recaudacion-reportes.ts
}

Write-Host "Done: migrations + seed"
