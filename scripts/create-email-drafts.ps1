# Creates email drafts with CV PDF attachments for each application in the apply kit.
# Outlook desktop: saves directly to your Drafts folder.
# No Outlook: writes .eml files to applications/drafts/ (double-click to open in your mail app).

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$PdfDir = Join-Path $Root "applications\cv\pdf"
$EmlDir = Join-Path $Root "applications\drafts"

if (-not (Test-Path $PdfDir)) {
  Write-Host "CV PDFs missing. Running generate-application-cvs.ps1 first..." -ForegroundColor Yellow
  & (Join-Path $Root "scripts\generate-application-cvs.ps1")
}

New-Item -ItemType Directory -Force -Path $EmlDir | Out-Null

$From = "okeowoemmanuelm@gmail.com"

$Applications = @(
  @{
    FileName = "01-daira-ai-engineer"
    To       = "contact@daira.me"
    Subject  = "Application - AI Engineer (Remote)"
    Body     = @"
Hello Daira Team,

I'm applying for the AI Engineer role.

I build applied AI systems in production - RAG pipelines, LLM integrations, and internal agent-style workflows - not just experiments. At Kings Technologies And Innovations I own Gardenia AI features (recommendation APIs, prompt/schema contracts, FastAPI). Side projects include ChefBot-AI (grounded RAG with Qdrant and Gemini), an FAQ RAG pipeline, and RAG-assisted tooling at Keyrium alongside production fintech APIs.

I'm curious about new AI capabilities, but I focus on shipping useful features: retrieval, evaluation, monitoring, and reliable backend integration.

GitHub: https://github.com/EmmanuelM0147
Portfolio: https://epicnode.hostless.site
LinkedIn: https://www.linkedin.com/in/okeowoemmanuelm/

CV attached. Happy to walk through a recent AI feature or agent workflow.

Best regards,
Emmanuel Okeowo
okeowoemmanuelm@gmail.com
"@
    Attachment = "Emmanuel_Okeowo_CV_Applied_AI.pdf"
  },
  @{
    FileName = "02-veritella-senior-swe"
    To       = "people@veritella.com"
    Subject  = "Application - Senior Software Engineer"
    Body     = @"
Hello Veritella Team,

I'm applying for the Senior Software Engineer role.

I own production backend systems end-to-end - architecture, APIs, third-party integrations, deployment, and testing. At Keyrium Consulting I lead Loyalty Rewards and Stock Trading platforms (Node.js, TypeScript, PostgreSQL, AWS/Docker), promoted from Senior Software Engineer after a year building secure systems and an 85% coverage testing framework. Experience includes auth, payment-adjacent flows, and KYC-style integrations from earlier fintech work.

I'm interested in building verification systems that are fast, accurate, and cost-efficient at scale - the same constraints I already optimize for in production.

Portfolio: https://epicnode.hostless.site
LinkedIn: https://www.linkedin.com/in/okeowoemmanuelm/

CV attached. I'd welcome a conversation about how I can help build Veritella's verification pipeline.

Best regards,
Emmanuel Okeowo
okeowoemmanuelm@gmail.com
"@
    Attachment = "Emmanuel_Okeowo_CV_Senior_Backend.pdf"
  },
  @{
    FileName = "03-securebypay-fullstack"
    To       = "info@securebypay.com"
    Subject  = "Application to Fullstack Role"
    Body     = @"
Hello SecureByPay Team,

I'm applying for the Full Stack Developer role.

I build and ship production fintech backends end-to-end - APIs, integrations, cloud deploy, and testing. At Keyrium Consulting I lead Loyalty Rewards and Stock Trading systems (Node.js, TypeScript, AWS/Docker), including payment-adjacent and KYC-style flows, with strong test coverage. At Kings Technologies And Innovations I also ship applied AI features (recommendation APIs, RAG / LLM integrations), which maps well to your Groq and AI work.

I'm strongest on backend, APIs, AWS, and AI integration, and comfortable collaborating across web and mobile on feature delivery.

Portfolio: https://epicnode.hostless.site
GitHub: https://github.com/EmmanuelM0147
LinkedIn: https://www.linkedin.com/in/okeowoemmanuelm/

CV attached. Happy to discuss how I can help SecureByPay scale its platform.

Best regards,
Emmanuel Okeowo
okeowoemmanuelm@gmail.com
"@
    Attachment = "Emmanuel_Okeowo_CV_Fullstack_Fintech.pdf"
  }
)

function New-EmlDraft {
  param(
    [string]$To,
    [string]$Subject,
    [string]$Body,
    [string]$AttachmentPath,
    [string]$OutPath
  )

  $boundary = "----=_ApplyKit_$([Guid]::NewGuid().ToString('N'))"
  $fileName = [IO.Path]::GetFileName($AttachmentPath)
  $bytes = [IO.File]::ReadAllBytes($AttachmentPath)
  $b64 = [Convert]::ToBase64String($bytes)
  $b64Lines = ($b64 -replace ".{76}", "`$&`r`n").Trim()

  $subjectEncoded = $Subject

  $eml = @"
From: $From
To: $To
Subject: $subjectEncoded
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="$boundary"

--$boundary
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: 8bit

$Body

--$boundary
Content-Type: application/pdf; name="$fileName"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="$fileName"

$b64Lines

--$boundary--
"@

  [IO.File]::WriteAllText($OutPath, $eml, [Text.UTF8Encoding]::new($false))
}

function New-OutlookDraft {
  param(
    [string]$To,
    [string]$Subject,
    [string]$Body,
    [string]$AttachmentPath
  )

  $ol = New-Object -ComObject Outlook.Application
  $mail = $ol.CreateItem(0)
  $mail.To = $To
  $mail.Subject = $Subject
  $mail.Body = $Body
  [void]$mail.Attachments.Add($AttachmentPath)
  $mail.Save()
}

$outlookOk = $false
try {
  $null = New-Object -ComObject Outlook.Application
  $outlookOk = $true
} catch {
  $outlookOk = $false
}

Write-Host ""
Write-Host "Apply Kit - Create email drafts" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$created = @()

foreach ($app in $Applications) {
  $pdfPath = Join-Path $PdfDir $app.Attachment
  if (-not (Test-Path $pdfPath)) {
    Write-Warning "Missing PDF: $($app.Attachment) - skipped $($app.FileName)"
    continue
  }

  if ($outlookOk) {
    try {
      New-OutlookDraft -To $app.To -Subject $app.Subject -Body $app.Body -AttachmentPath $pdfPath
      Write-Host "[Outlook Draft] $($app.Subject) -> $($app.To)" -ForegroundColor Green
      $created += @{ Type = "outlook"; Name = $app.Subject }
    } catch {
      Write-Warning "Outlook failed for $($app.FileName): $_"
      $outlookOk = $false
    }
  }

  if (-not $outlookOk) {
    $emlPath = Join-Path $EmlDir "$($app.FileName).eml"
    New-EmlDraft -To $app.To -Subject $app.Subject -Body $app.Body -AttachmentPath $pdfPath -OutPath $emlPath
    Write-Host "[EML Draft]     $($app.Subject) -> $emlPath" -ForegroundColor Yellow
    $created += @{ Type = "eml"; Path = $emlPath; Name = $app.Subject }
  }
}

Write-Host ""

if ($outlookOk) {
  Write-Host "Done. Open Outlook and check your Drafts folder." -ForegroundColor Green
  Write-Host "Review each message, then click Send when ready." -ForegroundColor Green
  try {
    Start-Process "outlook.exe"
  } catch {
    # ignore
  }
} else {
  Write-Host "Outlook not detected. EML drafts saved to:" -ForegroundColor Yellow
  Write-Host "  $EmlDir" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Double-click each .eml file to open a draft in your default mail app." -ForegroundColor Yellow
  Write-Host "Gmail web: copy from review.html or paste body + attach PDF manually." -ForegroundColor Yellow
  if ($created.Count -gt 0) {
    Start-Process explorer.exe $EmlDir
  }
}

Write-Host ""
