$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$inputBundle = Join-Path $projectDirectory 'android/app/build/outputs/bundle/release/app-release.aab'
$outputBundle = Join-Path $PSScriptRoot 'Nova-AI-1.1.0-v6.aab'
$javaBin = 'D:/eniscagri/nova/.tools/java/jdk-21.0.12.1+1/bin'
$keyStore = 'D:/eniscagri/aab/key.jks'
if (!(Test-Path -LiteralPath $inputBundle)) { throw 'Release AAB bulunamadi.' }
if (!(Test-Path -LiteralPath $keyStore)) { throw 'Mevcut yayin anahtari bulunamadi.' }
$config = Get-Content -LiteralPath (Join-Path $projectDirectory 'capacitor.config.json') -Raw | ConvertFrom-Json
if ($config.versionCode -ne 6 -or $config.versionName -ne '1.1.0') { throw 'Bu betik yalnizca 6 (1.1.0) paketi icindir. Yeniden derlemeyi ve cikti adini kontrol et.' }
Write-Host 'Mevcut key.jks parolasini Java imzalama istemine gir. Parola sohbetle paylasilmaz veya bu betige kaydedilmez.'
& "$javaBin/jarsigner.exe" -keystore $keyStore -signedjar $outputBundle $inputBundle novaai
if ($LASTEXITCODE -ne 0) { throw 'Imzalama basarisiz; ciktiyi Play Console sistemine yukleme.' }
$verification = & "$javaBin/jarsigner.exe" -verify -verbose $outputBundle 2>&1
if ($LASTEXITCODE -ne 0 -or !($verification -match 'jar verified\.')) { throw 'AAB imzasi dogrulanamadi; ciktiyi yukleme.' }
Write-Host "Imza dogrulandi: $outputBundle"
Write-Host 'Play Console upload sertifikasi bu anahtarla eslesmelidir.'
