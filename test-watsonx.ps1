# Quick test for IBM Watsonx AI - PowerShell version
# Reads from .env file or environment variables

# Try to load from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Get values from environment or use defaults
$API_KEY = $env:IBM_WATSONX_AI_API_KEY
$PROJECT_ID = $env:IBM_WATSONX_AI_PROJECT_ID
$WATSONX_URL = if ($env:IBM_WATSONX_AI_URL) { $env:IBM_WATSONX_AI_URL } else { "https://us-south.ml.cloud.ibm.com" }

if (-not $API_KEY) {
    Write-Host "❌ IBM_WATSONX_AI_API_KEY not found in .env or environment" -ForegroundColor Red
    Write-Host "Please set IBM_WATSONX_AI_API_KEY in your .env file" -ForegroundColor Yellow
    exit 1
}

Write-Host "API Key found (first 10 chars): $($API_KEY.Substring(0, [Math]::Min(10, $API_KEY.Length)))..." -ForegroundColor Gray
Write-Host "Step 1: Getting IAM token..." -ForegroundColor Cyan

# Build form-encoded body as string
$tokenBodyString = "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=$API_KEY"

try {
    $tokenResponse = Invoke-WebRequest -Uri "https://iam.cloud.ibm.com/identity/token" `
        -Method Post `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $tokenBodyString `
        -UseBasicParsing
    
    $tokenData = $tokenResponse.Content | ConvertFrom-Json
    $ACCESS_TOKEN = $tokenData.access_token
} catch {
    Write-Host "Error getting token:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    exit 1
}

if (-not $ACCESS_TOKEN) {
    Write-Host "❌ Failed to get access token" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Got token" -ForegroundColor Green

Write-Host "`nStep 2: Testing WITHOUT project_id..." -ForegroundColor Cyan
$bodyNoProject = @{
    input = "Hello, how are you?"
    model_id = "ibm/granite-13b-instruct-v2"
    parameters = @{
        max_new_tokens = 50
        temperature = 0.7
    }
} | ConvertTo-Json

try {
    $responseNoProject = Invoke-RestMethod -Uri "${WATSONX_URL}/ml/v1/text/generation?version=2024-11-19" `
        -Method Post `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $ACCESS_TOKEN" } `
        -Body $bodyNoProject
    
    Write-Host "✅ SUCCESS without project_id!" -ForegroundColor Green
    Write-Host ($responseNoProject | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ FAILED without project_id" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ($_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10)
}

Write-Host "`n---`n" -ForegroundColor Yellow

Write-Host "Step 3: Testing WITH project_id..." -ForegroundColor Cyan
$bodyWithProject = @{
    input = "Hello, how are you?"
    model_id = "ibm/granite-13b-instruct-v2"
    project_id = $PROJECT_ID
    parameters = @{
        max_new_tokens = 50
        temperature = 0.7
    }
} | ConvertTo-Json

try {
    $responseWithProject = Invoke-RestMethod -Uri "${WATSONX_URL}/ml/v1/text/generation?version=2024-11-19" `
        -Method Post `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $ACCESS_TOKEN" } `
        -Body $bodyWithProject
    
    Write-Host "✅ SUCCESS with project_id!" -ForegroundColor Green
    Write-Host ($responseWithProject | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ FAILED with project_id" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ($_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10)
}
