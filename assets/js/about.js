function renderAboutBlock({ id, title, hint, text, preview = false, maxLength = null }) {
  const countMarkup =
    maxLength != null
      ? `<span class="about-char-count${text.length > maxLength ? " over-limit" : ""}">${text.length}/${maxLength}</span>`
      : "";

  const bodyMarkup = preview
    ? `<div class="about-preview readme-about">${renderMarkdownLite(text)}</div>`
    : `<pre class="about-copy-block">${escapeHtml(text)}</pre>`;

  return `
    <section class="about-panel">
      <div class="about-panel-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${hint ? `<p class="about-hint">${escapeHtml(hint)}</p>` : ""}
        </div>
        <div class="about-panel-actions">
          ${countMarkup}
          <button type="button" class="copy-btn" data-copy-target="${escapeHtml(id)}">Copy</button>
        </div>
      </div>
      ${bodyMarkup}
      <textarea id="${escapeHtml(id)}" class="about-copy-source" readonly aria-hidden="true">${escapeHtml(text)}</textarea>
    </section>
  `;
}

function renderAboutPage(data) {
  const container = document.getElementById("about-content");
  if (!container || !data) return;

  container.innerHTML = [
    renderAboutBlock({
      id: "about-headline",
      title: "LinkedIn headline",
      hint: "Paste into LinkedIn headline field.",
      text: data.headline || "",
    }),
    renderAboutBlock({
      id: "about-github-bio",
      title: "GitHub bio",
      hint: "Paste at github.com/settings/profile. Keep under 160 characters.",
      text: data.githubBio || "",
      maxLength: 160,
    }),
    renderAboutBlock({
      id: "about-github-about",
      title: "GitHub profile README",
      hint: "Paste into your GitHub profile README repo (EmmanuelM0147/EmmanuelM0147).",
      text: data.githubAbout || "",
      preview: true,
    }),
    renderAboutBlock({
      id: "about-linkedin-about",
      title: "LinkedIn About",
      hint: "Paste into LinkedIn About section. Plain text only.",
      text: data.linkedinAbout || "",
    }),
  ].join("");

  container.querySelectorAll(".copy-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const source = document.getElementById(button.dataset.copyTarget);
      if (!source) return;

      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(source.value);
        button.textContent = "Copied!";
      } catch {
        source.select();
        const copied = document.execCommand("copy");
        button.textContent = copied ? "Copied!" : "Copy failed";
      }

      window.setTimeout(() => {
        button.textContent = original;
      }, 2000);
    });
  });
}

async function initAboutPage() {
  await initLayout("about");

  try {
    const data = await loadLinkedInData();
    renderAboutPage(data);
  } catch {
    const container = document.getElementById("about-content");
    if (container) {
      container.innerHTML = `<p class="empty-state">About copy unavailable. Edit data/linkedin.json to add profile text.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", initAboutPage);
