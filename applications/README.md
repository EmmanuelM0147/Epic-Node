# Application Kit — Emmanuel Okeowo

## Create email drafts (main step)

**Double-click:**

```
applications/CREATE-DRAFTS.bat
```

This will:
1. Ensure CV PDFs exist (generates them if needed)
2. Create **3 email drafts** with the correct CV attached

### Where drafts go

| Your setup | What happens |
|------------|----------------|
| **Outlook desktop** | Drafts appear in Outlook **Drafts** folder (review → Send) |
| **No Outlook** | `.eml` files open in `applications/drafts/` — double-click each file |
| **Gmail in browser only** | EML may not import to Gmail Drafts — use `review.html` to copy body + attach PDF manually |

---

## Review before sending

Open **`applications/review.html`** in your browser to preview CV PDFs and email text.

---

## Applications

| Priority | Role | Send to | CV PDF |
|----------|------|---------|--------|
| 1 | AI Engineer — Daira | contact@daira.me | `Emmanuel_Okeowo_CV_Applied_AI.pdf` |
| 2 | Senior SWE — Veritella | people@veritella.com | `Emmanuel_Okeowo_CV_Senior_Backend.pdf` |
| 3 | Full Stack — SecureByPay | info@securebypay.com | `Emmanuel_Okeowo_CV_Fullstack_Fintech.pdf` |

---

## Regenerate CV PDFs only

```powershell
cd "c:\Users\pc\Desktop\Epic Node"
.\scripts\generate-application-cvs.ps1
```

## Recreate drafts after edits

Run `CREATE-DRAFTS.bat` again.
