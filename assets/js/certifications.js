function renderCertifications(certifications) {
  const container = document.getElementById("certifications-list");
  if (!container) return;

  if (!certifications?.length) {
    container.innerHTML = `<p class="empty-state">No certifications listed yet.</p>`;
    return;
  }

  container.innerHTML = certifications
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
        <p class="cert-meta">${escapeHtml(cert.issuer)} · ${escapeHtml(cert.date)}</p>
      </article>
    `
    )
    .join("");
}

async function initCertificationsPage() {
  await initLayout("certifications");

  try {
    const data = await loadLinkedInData();
    renderCertifications(data.certifications);
  } catch {
    const container = document.getElementById("certifications-list");
    if (container) {
      container.innerHTML = `<p class="empty-state">Certifications unavailable. Edit data/linkedin.json to add them.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", initCertificationsPage);
