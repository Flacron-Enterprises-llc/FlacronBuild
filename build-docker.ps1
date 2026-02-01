# PowerShell script to build Docker image with Firebase environment variables
# Usage: .\build-docker.ps1

param(
    [string]$ImageTag = "flacronbuild:latest"
)

Write-Host "Building Docker image: $ImageTag" -ForegroundColor Cyan

# Read .env file and extract VITE_FIREBASE_* variables
$buildArgs = @()
if (Test-Path .env) {
    $envContent = Get-Content .env
    foreach ($line in $envContent) {
        $line = $line.Trim()
        # Skip comments and empty lines
        if ($line -and -not $line.StartsWith("#") -and $line -match "^VITE_FIREBASE_") {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                # Remove quotes if present
                $value = $value -replace '^["'']|["'']$', ''
                $buildArgs += "--build-arg"
                $buildArgs += "$key=$value"
                Write-Host "  Found: $key" -ForegroundColor Gray
            }
        }
    }
} else {
    Write-Host "Warning: .env file not found" -ForegroundColor Yellow
}

if ($buildArgs.Count -eq 0) {
    Write-Host "Warning: No VITE_FIREBASE_* variables found" -ForegroundColor Yellow
    Write-Host "Building without Firebase config - app may show white page" -ForegroundColor Yellow
    docker build -t $ImageTag .
} else {
    Write-Host "Building with Firebase environment variables..." -ForegroundColor Green
    docker build -t $ImageTag @buildArgs .
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

