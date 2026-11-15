$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$binDir = "D:\elite we kingdom website\COMPLIER\bin"
$destDir = Join-Path $binDir "gcc"
$zipFile = Join-Path $binDir "w64devkit.zip"
$tempExtract = Join-Path $binDir "w64temp"

if (-not (Test-Path "$destDir\bin\g++.exe")) {
    Write-Host "Downloading w64devkit..." -ForegroundColor Cyan
    curl.exe -L -o "$zipFile" "https://github.com/skeeto/w64devkit/releases/download/v1.23.0/w64devkit-1.23.0.zip"

    Write-Host "Extracting archive with Expand-Archive..." -ForegroundColor Cyan
    if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }
    
    Expand-Archive -Path "$zipFile" -DestinationPath "$tempExtract" -Force

    $inner = Join-Path $tempExtract "w64devkit"
    if (Test-Path $inner) {
        if (Test-Path $destDir) { Remove-Item $destDir -Recurse -Force }
        Move-Item -Path $inner -Destination $destDir -Force
    }

    Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $zipFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Verifying GCC and G++:"
& "$destDir\bin\gcc.exe" --version
& "$destDir\bin\g++.exe" --version
