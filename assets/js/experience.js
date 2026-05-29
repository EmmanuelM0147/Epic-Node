function splitDescriptionBullets(text) {
  if (!text) return [];

  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function renderTechTags(technologies) {
  if (!technologies?.length) return "";

  return `
    <div class="tech-tags">
      ${technologies.map((tech) => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join("")}
    </div>
  `;
}

function renderEntryBullets(description) {
  const bullets = splitDescriptionBullets(description);
  if (!bullets.length) return "";

  return `
    <ul class="cv-bullets">
      ${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderJobCard(job) {
  const subline = [job.company, job.location].filter(Boolean).join(" · ");

  return `
    <article class="cv-entry">
      <div class="cv-entry-head">
        <div class="cv-entry-primary">
          <h4 class="cv-entry-title">${escapeHtml(job.title)}</h4>
          ${subline ? `<p class="cv-entry-sub">${escapeHtml(subline)}</p>` : ""}
        </div>
        <p class="cv-entry-dates">${escapeHtml(job.dates || "")}</p>
      </div>
      ${renderEntryBullets(job.description)}
      ${renderTechTags(job.technologies)}
    </article>
  `;
}

function renderEducationCard(edu) {
  const subline = [edu.school, edu.location].filter(Boolean).join(" · ");

  return `
    <article class="cv-entry cv-entry-compact">
      <div class="cv-entry-head">
        <div class="cv-entry-primary">
          <h4 class="cv-entry-title">${escapeHtml(edu.degree)}</h4>
          ${subline ? `<p class="cv-entry-sub">${escapeHtml(subline)}</p>` : ""}
        </div>
        <p class="cv-entry-dates">${escapeHtml(edu.dates || "")}</p>
      </div>
    </article>
  `;
}

function renderCertItem(cert) {
  const label = cert.url
    ? `<a href="${escapeHtml(cert.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cert.name)}</a>`
    : escapeHtml(cert.name);

  return `
    <li class="cert-item">
      <span class="cert-name">${label}</span>
      <span class="cert-meta">${escapeHtml(cert.issuer)} · ${escapeHtml(cert.date)}</span>
    </li>
  `;
}

function renderCvContact(contact) {
  if (!contact) return "";

  return `
    <div class="cv-contact">
      <a href="${escapeHtml(contact.linkedin)}" target="_blank" rel="noopener noreferrer">${icon("linkedin")} LinkedIn</a>
      <a href="${escapeHtml(contact.github)}" target="_blank" rel="noopener noreferrer">${icon("github")} GitHub</a>
      <a href="${escapeHtml(contact.orcid)}" target="_blank" rel="noopener noreferrer">${icon("orcid")} ORCID</a>
      <a href="mailto:${escapeHtml(contact.email)}">${icon("email")} ${escapeHtml(contact.email)}</a>
    </div>
  `;
}

function formatPrintContact(contact = {}) {
  const items = [];

  if (contact.email) items.push(contact.email);
  if (contact.linkedin) items.push(contact.linkedin.replace(/^https?:\/\/(www\.)?/, ""));
  if (contact.github) items.push(contact.github.replace(/^https?:\/\//, ""));
  if (contact.orcid) items.push(contact.orcid.replace(/^https?:\/\/(www\.)?/, ""));

  return items;
}

function renderPrintBanner(profile, data) {
  const name = profile?.name || "Emmanuel Okeowo";
  const headline = data.headline || "";
  const intro = data.intro || headline;
  const links = formatPrintContact(data.contact);

  return `
    <header class="cv-print-banner">
      <h1 class="cv-print-name">${escapeHtml(name)}</h1>
      ${headline ? `<p class="cv-print-headline">${escapeHtml(headline)}</p>` : ""}
      <p class="cv-print-intro">${escapeHtml(intro)}</p>
      <p class="cv-print-links">${links.map((item) => escapeHtml(item)).join(" · ")}</p>
    </header>
  `;
}

function renderSummary(data) {
  const markup = renderSummaryMarkup(data);
  if (!markup) return "";

  return `
    <section class="cv-section">
      <h3 class="cv-section-title">${icon("list")} Summary</h3>
      ${markup}
    </section>
  `;
}

function printCv(profileName) {
  const previousTitle = document.title;
  document.title = `${profileName || "CV"} - Curriculum Vitae`;
  window.print();
  window.setTimeout(() => {
    document.title = previousTitle;
  }, 500);
}

function renderExperience(data, profile) {
  const container = document.getElementById("experience-content");
  if (!container || !data) return;

  const profileName = profile?.name || "Emmanuel Okeowo";
  const jobs = (data.experience || []).map(renderJobCard).join("");
  const education = (data.education || []).map(renderEducationCard).join("");
  const certifications = sortCertifications(data.certifications || []).map(renderCertItem).join("");

  container.innerHTML = `
    <div class="cv-document">
      ${renderPrintBanner(profile, data)}

      <div class="cv-toolbar">
        <button class="download-btn" type="button" id="cv-download-btn">
          ${icon("download")} Download PDF
        </button>
      </div>

      <div class="cv-intro">
        <p class="cv-focus">${escapeHtml(data.intro || data.headline || "")}</p>
        ${renderCvContact(data.contact)}
      </div>

      ${renderSummary(data)}

      <section class="cv-section">
        <h3 class="cv-section-title">${icon("briefcase")} Professional Experience</h3>
        <div class="cv-entries">${jobs || `<p class="empty-state">No experience entries yet.</p>`}</div>
      </section>

      <section class="cv-section">
        <h3 class="cv-section-title">${icon("graduation")} Education</h3>
        <div class="cv-entries">${education || `<p class="empty-state">No education entries yet.</p>`}</div>
      </section>

      <section class="cv-section cv-section-compact">
        <h3 class="cv-section-title">${icon("book")} Certifications</h3>
        ${
          certifications
            ? `<ul class="cert-grid">${certifications}</ul>`
            : `<p class="empty-state">No certifications listed yet.</p>`
        }
      </section>

      <p class="cv-print-note">Best printed with Google Chrome</p>
    </div>
  `;

  document.getElementById("cv-download-btn")?.addEventListener("click", () => printCv(profileName));
}

async function initExperiencePage() {
  const profile = await initLayout("cv");

  try {
    const data = await loadLinkedInData();
    renderExperience(data, profile);
  } catch {
    const container = document.getElementById("experience-content");
    if (container) {
      container.innerHTML = `<p class="empty-state">CV data unavailable. Edit data/linkedin.json to add your experience.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", initExperiencePage);
