$res = Invoke-RestMethod -Uri 'https://api.github.com/repos/brechtsanders/winlibs_mingw/releases/latest'
$asset = $res.assets | Where-Object { $_.name -like '*posix*ucrt*gcc*zip*' -and $_.name -notlike '*llvm*' } | Select-Object -First 1
if ($asset) {
    Write-Output "NAME:$($asset.name)"
    Write-Output "URL:$($asset.browser_download_url)"
} else {
    $fallback = $res.assets | Where-Object { $_.name -like '*zip*' } | Select-Object -First 1
    Write-Output "FALLBACK_NAME:$($fallback.name)"
    Write-Output "FALLBACK_URL:$($fallback.browser_download_url)"
}
