function renderHirePage(config) {
  const container = document.getElementById("hire-content");
  if (!container) return;

  const hire = config.hireMe || {};
  const services = hire.services || [];
  const contact = hire.contact || {};

  container.innerHTML = `
    <header class="section-header">
      <h2>Hire Me</h2>
    </header>
    <p class="hire-intro">${escapeHtml(hire.summary || "")}</p>
    <div class="preview-grid">
      ${services
        .map(
          (service) => `
        <article class="service-card">
          <h3>${escapeHtml(service.title)}</h3>
          <p>${escapeHtml(service.description)}</p>
        </article>
      `
        )
        .join("")}
    </div>
    <div class="contact-actions">
      ${contact.email ? `<a href="mailto:${escapeHtml(contact.email)}">Email me</a>` : ""}
      ${contact.linkedin ? `<a href="${escapeHtml(contact.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ""}
      ${contact.github ? `<a href="${escapeHtml(contact.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ""}
      <a href="${pageUrl("experience.html")}">View CV →</a>
    </div>
  `;
}

async function initHirePage() {
  await initLayout("hire");
  await loadSiteConfig();
  renderHirePage(SITE_CONFIG);
}

document.addEventListener("DOMContentLoaded", initHirePage);
