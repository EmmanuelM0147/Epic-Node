function renderCertificationCards(certifications) {
  return certifications
    .map(
      (cert) => `
      <article class="cert-card">
        <h3>
          ${
            cert.url
              ? `<a href="${escapeHtml(cert.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cert.name)} ${icon("external")}</a>`
              : escapeHtml(cert.name)
          }
        </h3>
        <p class="cert-meta">${escapeHtml(cert.issuer)} · ${escapeHtml(cert.date)}${cert.credentialId ? ` · ID ${escapeHtml(cert.credentialId)}` : ""}</p>
      </article>
    `
    )
    .join("");
}

function renderCertifications(certifications) {
  const container = document.getElementById("certifications-list");
  if (!container) return;

  if (!certifications?.length) {
    container.innerHTML = `<p class="empty-state">No certifications listed yet.</p>`;
    return;
  }

  const sorted = sortCertifications(certifications);
  const featured = sorted.filter((cert) => cert.featured);
  const additional = sorted.filter((cert) => !cert.featured);

  if (!additional.length) {
    container.innerHTML = `<div class="cert-list">${renderCertificationCards(sorted)}</div>`;
    return;
  }

  container.innerHTML = `
    <section class="content-section content-section-compact">
      <h3 class="section-subtitle">Featured</h3>
      <div class="cert-list">${renderCertificationCards(featured)}</div>
    </section>
    <section class="content-section content-section-compact">
      <h3 class="section-subtitle">Additional</h3>
      <div class="cert-list">${renderCertificationCards(additional)}</div>
    </section>
  `;
}

async function initCertificationsPage() {
  const container = document.getElementById("certifications-list");
  renderLoadingSkeleton(container, 4);
  await initLayout("certifications");

  try {
    const data = await loadLinkedInData();
    renderCertifications(data.certifications);
  } catch {
    if (container) {
      container.innerHTML = `<p class="empty-state">Certifications unavailable. Edit data/linkedin.json to add them.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", initCertificationsPage);
