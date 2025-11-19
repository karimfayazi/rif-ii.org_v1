# PowerShell script to kill Next.js dev server and remove lock files
# Run this if you get "Unable to acquire lock" error

Write-Host "Checking for Next.js dev server processes..." -ForegroundColor Yellow

# Find processes using port 3000
$port3000 = netstat -ano | findstr ":3000" | ForEach-Object {
    if ($_ -match '\s+(\d+)\s*$') {
        $matches[1]
    }
} | Select-Object -Unique

if ($port3000) {
    Write-Host "Found processes using port 3000: $port3000" -ForegroundColor Yellow
    foreach ($pid in $port3000) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "Stopped process $pid" -ForegroundColor Green
        } catch {
            Write-Host "Could not stop process $pid: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No processes found on port 3000" -ForegroundColor Green
}

# Remove lock files
Write-Host "`nRemoving lock files..." -ForegroundColor Yellow
if (Test-Path ".next\dev\lock") {
    Remove-Item ".next\dev\lock" -Force -ErrorAction SilentlyContinue
    Write-Host "Removed .next\dev\lock" -ForegroundColor Green
} else {
    Write-Host "No lock file found" -ForegroundColor Green
}

# Remove all lock files in .next directory
Get-ChildItem -Path ".next" -Recurse -Filter "*lock*" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    Write-Host "Removed $($_.FullName)" -ForegroundColor Green
}

Write-Host "`nDone! You can now run 'npm run dev' without errors." -ForegroundColor Cyan

