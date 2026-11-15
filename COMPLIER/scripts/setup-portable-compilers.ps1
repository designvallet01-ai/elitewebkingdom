# ==============================================================================
# Elite IDE - Portable Compilers Setup Script
# Downloads official lightweight portable runtimes for 100% offline standalone execution
# Zero system prerequisites (No Python, No MinGW, No GCC needed on user PC!)
# ==============================================================================

$ErrorActionPreference = "Stop"

$baseDir = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $baseDir "bin"
$pythonDir = Join-Path $binDir "python"
$tccDir = Join-Path $binDir "tcc"

Write-Host "🚀 Setting up Elite IDE Portable Compilers in: $binDir" -ForegroundColor Cyan

# Ensure bin directory exists
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

# ------------------------------------------------------------------------------
# 1. Download & Extract Official Python 3.12 Embeddable Package (~10.9 MB)
# ------------------------------------------------------------------------------
if (-not (Test-Path (Join-Path $pythonDir "python.exe"))) {
    Write-Host "📦 Downloading Python 3.12 Portable Embeddable package (10.9 MB)..." -ForegroundColor Yellow
    $pythonZip = Join-Path $binDir "python-embed.zip"
    $pythonUrl = "https://www.python.org/ftp/python/3.12.7/python-3.12.7-embed-amd64.zip"

    try {
        Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonZip -UseBasicParsing
        Write-Host "📂 Extracting Python to $pythonDir..." -ForegroundColor Yellow
        Expand-Archive -Path $pythonZip -DestinationPath $pythonDir -Force
        Remove-Item $pythonZip -Force

        # Enable site-packages / import resolution by uncommenting 'import site' in python312._pth
        $pthFile = Join-Path $pythonDir "python312._pth"
        if (Test-Path $pthFile) {
            $pthContent = Get-Content $pthFile
            $pthContent = $pthContent -replace "#import site", "import site"
            Set-Content -Path $pthFile -Value $pthContent
        }

        Write-Host "✅ Python 3.12 Portable ready at: $(Join-Path $pythonDir 'python.exe')" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Warning: Failed to download portable Python: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "✅ Python 3.12 Portable already installed." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 2. Download & Extract Modern Portable C/C++ GCC Compiler (w64devkit)
# Compiles & executes standard C and C++ offline with zero system dependencies
# ------------------------------------------------------------------------------
$gccDir = Join-Path $binDir "gcc"
$gccExe = Join-Path $gccDir "bin\gcc.exe"
$gppExe = Join-Path $gccDir "bin\g++.exe"

if (-not (Test-Path $gccExe)) {
    Write-Host "📦 Downloading Modern Portable GCC & G++ Compiler (w64devkit)..." -ForegroundColor Yellow
    $gccZip = Join-Path $binDir "w64devkit.zip"
    $gccUrl = "https://github.com/skeeto/w64devkit/releases/download/v1.23.0/w64devkit-1.23.0.zip"

    try {
        curl.exe -L -o $gccZip $gccUrl
        Write-Host "📂 Extracting GCC/G++ to $binDir..." -ForegroundColor Yellow
        tar.exe -xf $gccZip -C $binDir
        
        # If extracted as 'w64devkit', rename or map to 'gcc'
        $w64Path = Join-Path $binDir "w64devkit"
        if (Test-Path $w64Path) {
            if (Test-Path $gccDir) { Remove-Item $gccDir -Recurse -Force }
            Move-Item -Path $w64Path -Destination $gccDir -Force
        }
        Remove-Item $gccZip -Force

        Write-Host "✅ Portable GCC ready at: $(Join-Path $gccDir 'bin\gcc.exe')" -ForegroundColor Green
        Write-Host "✅ Portable G++ ready at: $(Join-Path $gccDir 'bin\g++.exe')" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Warning: Failed to download portable GCC: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "✅ Portable GCC & G++ already installed." -ForegroundColor Green
}

Write-Host "🎉 Elite IDE Portable Offline Runtimes ready!" -ForegroundColor Cyan
