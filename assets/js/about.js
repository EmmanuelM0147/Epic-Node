function normalizeCopy(text) {
  return (text || "").trim().replace(/\s+/g, " ");
}

function formatSyncDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function loadGitHubProfile() {
  const response = await fetch(assetUrl("data/github-profile.json"));
  if (!response.ok) {
    throw new Error("Failed to load GitHub profile");
  }
  return response.json();
}

function renderSyncStatus(data, githubProfile) {
  const container = document.getElementById("about-sync-status");
  if (!container) return;

  const intendedBio = data.githubBio || "";
  const liveBio = githubProfile?.bio || "";
  const bioMatches = normalizeCopy(intendedBio) === normalizeCopy(liveBio);
  const portfolioUpdated = formatSyncDate(data.updatedAt);
  const githubSynced = formatSyncDate(githubProfile?.synced_at);

  container.innerHTML = `
    <section class="about-sync-panel">
      <h3 class="about-sync-title">Sync status</h3>
      <ul class="about-sync-list">
        <li>
          <span class="about-sync-label">Portfolio copy</span>
          <span class="about-sync-value">Updated ${escapeHtml(portfolioUpdated)} · source: data/linkedin.json</span>
        </li>
        <li>
          <span class="about-sync-label">GitHub bio</span>
          <span class="about-sync-value">
            <span class="sync-badge ${bioMatches ? "sync-ok" : "sync-warn"}">${bioMatches ? "In sync" : "Out of sync"}</span>
            Last pulled ${escapeHtml(githubSynced)}
            · <a href="https://github.com/settings/profile" target="_blank" rel="noopener noreferrer">Edit on GitHub</a>
          </span>
        </li>
        <li>
          <span class="about-sync-label">LinkedIn</span>
          <span class="about-sync-value">
            <span class="sync-badge sync-manual">Manual paste</span>
            No auto-sync · <a href="${escapeHtml(data.profileUrl || "https://www.linkedin.com/in/okeowoemmanuelm/")}" target="_blank" rel="noopener noreferrer">Edit on LinkedIn</a>
          </span>
        </li>
      </ul>
      ${
        bioMatches
          ? `<p class="about-sync-note">GitHub bio matches your intended copy. LinkedIn headline and About still need manual updates when you change linkedin.json.</p>`
          : `<div class="about-sync-alert">
              <p><strong>GitHub bio mismatch.</strong> Live GitHub bio differs from the copy below.</p>
              <p class="about-sync-live"><span>Live:</span> ${escapeHtml(liveBio || "(empty)")}</p>
              <p class="about-sync-live"><span>Intended:</span> ${escapeHtml(intendedBio || "(empty)")}</p>
            </div>`
      }
    </section>
  `;
}

function renderAboutBlock({ id, title, hint, text, preview = false, maxLength = null, status = null }) {
  const countMarkup =
    maxLength != null
      ? `<span class="about-char-count${text.length > maxLength ? " over-limit" : ""}">${text.length}/${maxLength}</span>`
      : "";

  const statusMarkup = status
    ? `<span class="sync-badge ${status.className}">${escapeHtml(status.label)}</span>`
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
          ${statusMarkup}
          ${countMarkup}
          <button type="button" class="copy-btn" data-copy-target="${escapeHtml(id)}">Copy</button>
        </div>
      </div>
      ${bodyMarkup}
      <textarea id="${escapeHtml(id)}" class="about-copy-source" readonly aria-hidden="true">${escapeHtml(text)}</textarea>
    </section>
  `;
}

function renderAboutPage(data, githubProfile) {
  const container = document.getElementById("about-content");
  if (!container || !data) return;

  const bioMatches = normalizeCopy(data.githubBio) === normalizeCopy(githubProfile?.bio);

  container.innerHTML = [
    renderAboutBlock({
      id: "about-headline",
      title: "LinkedIn headline",
      hint: "Paste into LinkedIn headline field.",
      text: data.headline || "",
      status: { className: "sync-manual", label: "Manual" },
    }),
    renderAboutBlock({
      id: "about-github-bio",
      title: "GitHub bio",
      hint: "Paste at github.com/settings/profile. Keep under 160 characters.",
      text: data.githubBio || "",
      maxLength: 160,
      status: bioMatches
        ? { className: "sync-ok", label: "In sync" }
        : { className: "sync-warn", label: "Out of sync" },
    }),
    renderAboutBlock({
      id: "about-github-about",
      title: "GitHub profile README",
      hint: "Paste into your GitHub profile README repo (EmmanuelM0147/EmmanuelM0147).",
      text: data.githubAbout || "",
      preview: true,
      status: { className: "sync-manual", label: "Manual" },
    }),
    renderAboutBlock({
      id: "about-linkedin-about",
      title: "LinkedIn About",
      hint: "Paste into LinkedIn About section. Plain text only.",
      text: data.linkedinAbout || "",
      status: { className: "sync-manual", label: "Manual" },
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
    const [data, githubProfile] = await Promise.all([loadLinkedInData(), loadGitHubProfile()]);
    renderSyncStatus(data, githubProfile);
    renderAboutPage(data, githubProfile);
  } catch {
    const container = document.getElementById("about-content");
    if (container) {
      container.innerHTML = `<p class="empty-state">About copy unavailable. Edit data/linkedin.json to add profile text.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", initAboutPage);
