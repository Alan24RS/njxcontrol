# PowerShell script to reset local database
# Equivalent to reset-local-db.sh but native to Windows

$ErrorActionPreference = "Stop"

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "Error: .env.local file not found." -ForegroundColor Red
    Write-Host "   Create it from .env.example and configure your Supabase settings."
    exit 1
}

# Load environment variables from .env.local
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Remove quotes if present
        $value = $value -replace '^["'']|["'']$', ''
        Set-Item -Path "env:$name" -Value $value
    }
}

# Determine database environment
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL

# Validate Supabase URL format early to avoid seeding errors later
if (-not ($supabaseUrl -match '^https?://')) {
    Write-Host "Error: NEXT_PUBLIC_SUPABASE_URL must start with http:// or https://" -ForegroundColor Red
    Write-Host "   Current value: $supabaseUrl"
    Write-Host "   Example local value: http://localhost:54321"
    exit 1
}

if ($supabaseUrl -match '(127\.0\.0\.1|localhost)') {
    $dbEnv = "local (Docker)"
    $warnMsg = "WARNING: This will RESET your LOCAL database."
    $isLocal = $true
}
elseif ($supabaseUrl -match '\.supabase\.co') {
    $dbEnv = "remote (Supabase Cloud)"
    $warnMsg = "WARNING: This will RESET your REMOTE Supabase database!"
    $isLocal = $false
}
else {
    Write-Host "Error: Cannot determine database environment from NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Red
    Write-Host "   Current value: $supabaseUrl"
    exit 1
}

# Display warning
Write-Host ""
Write-Host $warnMsg -ForegroundColor Yellow
Write-Host "   Environment: $dbEnv"
Write-Host "   URL: $supabaseUrl"
Write-Host ""
Write-Host "   This action will:"

if ($isLocal) {
    Write-Host "   - Drop all tables and data"
    Write-Host "   - Re-run all migrations from scratch"
    Write-Host "   - Apply seed data"
    Write-Host "   - Create test users"
}
else {
    Write-Host "   - Delete all users from auth.users"
    Write-Host "   - Link to remote project"
    Write-Host "   - Apply all pending migrations"
    Write-Host "   - Create test users"
    Write-Host ""
    Write-Host "   Note: Remote reset will DELETE all auth users." -ForegroundColor Yellow
    Write-Host "   It will then apply migrations and create test users." -ForegroundColor Yellow
}

Write-Host ""
$confirmation = Read-Host "Are you sure you want to continue? (y/N)"

if ($confirmation -notmatch '^[Yy]$') {
    Write-Host "Database reset cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""

if ($isLocal) {
    Write-Host "Resetting local database..." -ForegroundColor Cyan
    supabase db reset
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Local database reset failed. Ensure Docker Desktop is installed and running." -ForegroundColor Red
        Write-Host "Download: https://docs.docker.com/desktop" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "Deleting all auth users..." -ForegroundColor Cyan
    node --env-file=.env.local --import tsx scripts/delete-auth-users.ts
    
    Write-Host "Applying migrations to remote database..." -ForegroundColor Cyan
    
    # Extract project ref from URL
    if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
        $projectRef = $matches[1]
        Write-Host "Project ref: $projectRef"
    }
    else {
        Write-Host "Error: Could not extract project ref from URL" -ForegroundColor Red
        exit 1
    }
    
    if (-not $env:SUPABASE_DB_PASSWORD) {
        Write-Host "Error: SUPABASE_DB_PASSWORD not set in .env.local" -ForegroundColor Red
        Write-Host "   Find it in: Supabase Dashboard -> Settings -> Database"
        exit 1
    }
    
    Write-Host "Linking to Supabase project..."
    supabase link --project-ref $projectRef --password $env:SUPABASE_DB_PASSWORD
    
    Write-Host "Pushing migrations..."
    supabase db push --linked
}

Write-Host ""
Write-Host "Seeding database..." -ForegroundColor Cyan
node --env-file=.env.local --import tsx scripts/db-seed.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "Seeding failed. See errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Database reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Test users available:"
Write-Host "  - dueno@test.com / test1234 (DUENO)"
Write-Host "  - playero@test.com / test1234 (PLAYERO)"
