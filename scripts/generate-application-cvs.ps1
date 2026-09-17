# Generate print-ready CV PDFs for job applications.
# Requires Microsoft Edge (default on Windows 10/11).

$Root = Split-Path -Parent $PSScriptRoot
$CvDir = Join-Path $Root "applications\cv"
$OutDir = Join-Path $CvDir "pdf"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$EdgePaths = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)

$Edge = $EdgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Edge) {
  Write-Error "Microsoft Edge not found. Open HTML files in applications/cv/ and Print to PDF manually."
  exit 1
}

$Jobs = @(
  @{ Html = "Emmanuel_Okeowo_CV_Applied_AI.html"; Pdf = "Emmanuel_Okeowo_CV_Applied_AI.pdf" },
  @{ Html = "Emmanuel_Okeowo_CV_Senior_Backend.html"; Pdf = "Emmanuel_Okeowo_CV_Senior_Backend.pdf" },
  @{ Html = "Emmanuel_Okeowo_CV_Fullstack_Fintech.html"; Pdf = "Emmanuel_Okeowo_CV_Fullstack_Fintech.pdf" }
)

foreach ($job in $Jobs) {
  $htmlPath = (Resolve-Path (Join-Path $CvDir $job.Html)).Path
  $pdfPath = Join-Path $OutDir $job.Pdf
  $uri = "file:///" + ($htmlPath -replace "\\", "/" -replace " ", "%20")

  & $Edge --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$pdfPath" "$uri"
  Start-Sleep -Seconds 2

  if (Test-Path $pdfPath) {
    Write-Host "Created: $pdfPath"
  } else {
    Write-Warning "Failed: $($job.Pdf). Open $htmlPath in Chrome and Print to PDF."
  }
}

Write-Host ""
Write-Host "Done. PDFs are in applications/cv/pdf/"
