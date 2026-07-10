function renderHirePage(config, linkedin) {
  const container = document.getElementById("hire-content");
  if (!container) return;

  const hire = config.hireMe || {};
  const services = hire.services || [];
  const contact = { ...hire.contact, ...linkedin?.contact };
  const headline = hire.headline || "";
  const summary = hire.summary || linkedin?.intro || "";

  container.innerHTML = `
    <header class="section-header">
      <h2>Hire Me</h2>
    </header>
    ${headline ? `<p class="hire-headline">${escapeHtml(headline)}</p>` : ""}
    <p class="hire-intro">${escapeHtml(summary)}</p>
    <div class="preview-grid hire-services">
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
      ${contact.email ? `<a href="mailto:${escapeHtml(contact.email)}">${icon("email")} Email me</a>` : ""}
      ${contact.linkedin ? `<a href="${escapeHtml(contact.linkedin)}" target="_blank" rel="noopener noreferrer">${icon("linkedin")} LinkedIn</a>` : ""}
      ${contact.github ? `<a href="${escapeHtml(contact.github)}" target="_blank" rel="noopener noreferrer">${icon("github")} GitHub</a>` : ""}
      ${contact.orcid ? `<a href="${escapeHtml(contact.orcid)}" target="_blank" rel="noopener noreferrer">${icon("orcid")} ORCID</a>` : ""}
      <a href="${pageUrl("cv.html")}">${icon("user")} View CV</a>
    </div>
  `;
}

async function initHirePage() {
  const container = document.getElementById("hire-content");
  renderLoadingSkeleton(container, 4);

  await bootstrapPage("hire", async () => {
    await loadSiteConfig();

    let linkedin = null;
    try {
      linkedin = await loadLinkedInData();
    } catch {
      // Use config defaults.
    }

    renderHirePage(SITE_CONFIG, linkedin);
  });
}

document.addEventListener("DOMContentLoaded", initHirePage);
