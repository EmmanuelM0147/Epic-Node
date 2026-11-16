# One-off: Outlook/EML drafts for DirectFN, G2i, Trust Wallet (clean copy, no em dashes).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$PdfDir = Join-Path $Root "applications\cv\pdf"
$EmlDir = Join-Path $Root "applications\drafts"
$From = "okeowoemmanuelm@gmail.com"

New-Item -ItemType Directory -Force -Path $EmlDir | Out-Null

$Applications = @(
  @{
    FileName   = "04-directfn-senior-swe-ai"
    To         = "careers@directfn.com"
    Subject    = "Application - Senior Software Engineer - AI"
    Attachment = "Emmanuel_Okeowo_CV_Applied_AI_plain.pdf"
    Body       = @"
Hello DirectFN Team,

I'm applying for the Senior Software Engineer - AI role.

I build applied AI systems in production: RAG pipelines, LLM integrations, prompt and schema contracts, and agent-style workflows. At Kings Technologies And Innovations I own Gardenia AI features and the AI Tools workspace (Python, FastAPI, recommendation APIs). Side projects include ChefBot-AI (grounded RAG with Qdrant and Gemini), an FAQ RAG pipeline, and RAG-assisted tooling at Keyrium alongside production fintech APIs.

I focus on retrieval, evaluation, and reliable backend integration. Open to confirm remote or location expectations early.

GitHub: https://github.com/EmmanuelM0147
Portfolio: https://epicnode.hostless.site
LinkedIn: https://www.linkedin.com/in/okeowoemmanuelm/

CV attached.

Best regards,
Emmanuel Okeowo
okeowoemmanuelm@gmail.com
"@
  },
  @{
    FileName   = "05-g2i-ai-training"
    To         = $From
    Subject    = "APPLY REMINDER - G2i Senior SWE AI Training (Ashby)"
    Attachment = "Emmanuel_Okeowo_CV_Senior_Backend_plain.pdf"
    Body       = @"
Ashby apply (not an email application):
https://jobs.ashbyhq.com/g2i/6f5d8b62-52c7-48cb-9362-1dfcf8d815c0

Upload the attached Senior Backend CV. Paste notes below into the form.

Headline fit:
Senior backend and applied AI engineer. Production Node.js/TypeScript and Python/FastAPI. Daily Cursor use for AI-assisted development. Comfortable judging agent output on engineering taste, not just syntax.

Cursor / AI workflow:
I use Cursor as my primary IDE across Node.js/TypeScript (Keyrium) and Python/FastAPI (Kings / Gardenia AI). I review agent diffs for correctness, missing edge cases, unsafe assumptions, and whether the explanation would help a senior engineer ship safely.

Evaluation angle:
I already do senior code review on production systems. For coding agents I care about useful preamble, correct high-level approach, honest uncertainty, and whether the interaction builds trust, not only whether the snippet compiles.

Links:
Portfolio: https://epicnode.hostless.site
GitHub: https://github.com/EmmanuelM0147
LinkedIn: https://www.linkedin.com/in/okeowoemmanuelm/
Location: Lagos, Nigeria (remote)
"@
  },
  @{
    FileName   = "06-trust-wallet-lead-ai"
    To         = $From
    Subject    = "APPLY REMINDER - Trust Wallet Lead AI (Ashby) - check Go/Web3 gaps"
    Attachment = "Emmanuel_Okeowo_CV_Applied_AI_plain.pdf"
    Body       = @"
Ashby apply (not an email application):
https://jobs.ashbyhq.com/trust-wallet/87c32867-4e32-473c-b818-8eae0306f46a

Gaps: Golang backend + preferred Web3 employer. Do not invent either. Upload attached Applied AI CV if you still submit.

Paste pitch:

I'm an Applied AI Engineer who ships LLM features into production backends: recommendation APIs and prompt/schema contracts at Kings Technologies (Gardenia / AI Tools workspace, Python + FastAPI), plus grounded RAG systems (ChefBot-AI, FAQ pipeline, Qdrant/Gemini) and RAG-assisted internal tooling alongside Keyrium fintech APIs.

I own production concerns that map to this role: API contracts, retrieval quality, iteration after launch, and backend integration. My primary languages today are Python and TypeScript/Node.js. I do not claim production Golang, and I have not worked at a crypto wallet or DeFi protocol. I am applying because the agent/RAG/eval ownership matches what I already ship, and I can ramp Go for Trust Wallet's AI services if that is the team's language.

Portfolio: https://epicnode.hostless.site
GitHub: https://github.com/EmmanuelM0147
LinkedIn: https://www.linkedin.com/in/okeowoemmanuelm/
"@
  }
)

function Assert-NoAiTells([string]$text, [string]$label) {
  if ($text.Contains([char]0x2014) -or $text.Contains([char]0x2013)) {
    throw "Em/en dash found in $label"
  }
  if ($text -match "I'd welcome|cutting-edge|leverage |seamlessly|delve |thrilled") {
    throw "AI-tell phrase found in $label"
  }
}

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

  $eml = @"
From: $From
To: $To
Subject: $Subject
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
Write-Host "Create drafts: DirectFN / G2i / Trust Wallet" -ForegroundColor Cyan
Write-Host ""

foreach ($app in $Applications) {
  Assert-NoAiTells $app.Body $app.FileName
  Assert-NoAiTells $app.Subject $app.FileName

  $pdfPath = Join-Path $PdfDir $app.Attachment
  if (-not (Test-Path $pdfPath)) {
    Write-Warning "Missing PDF: $($app.Attachment) - skipped $($app.FileName)"
    continue
  }

  $saved = $false
  if ($outlookOk) {
    try {
      New-OutlookDraft -To $app.To -Subject $app.Subject -Body $app.Body -AttachmentPath $pdfPath
      Write-Host "[Outlook Draft] $($app.Subject) -> $($app.To)" -ForegroundColor Green
      $saved = $true
    } catch {
      Write-Warning "Outlook failed for $($app.FileName): $_"
      $outlookOk = $false
    }
  }

  # Always write EML backup
  $emlPath = Join-Path $EmlDir "$($app.FileName).eml"
  New-EmlDraft -To $app.To -Subject $app.Subject -Body $app.Body -AttachmentPath $pdfPath -OutPath $emlPath
  Write-Host "[EML Draft]     $($app.Subject) -> $emlPath" -ForegroundColor Yellow
}

Write-Host ""
if ($outlookOk) {
  Write-Host "Open Outlook Drafts, review, then Send (DirectFN) or use notes for Ashby." -ForegroundColor Green
  try { Start-Process "outlook.exe" } catch {}
} else {
  Write-Host "Outlook not detected. Open EML files in: $EmlDir" -ForegroundColor Yellow
  Start-Process explorer.exe $EmlDir
}
Write-Host ""
