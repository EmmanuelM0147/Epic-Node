let allCertifications = [];
let currentPage = 1;

function certificationsPageSize() {
  return SITE_CONFIG.pagination?.certificationsPageSize || 6;
}

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

function renderCertificationPageSlice(items, page) {
  if (page !== 1) {
    return `<div class="cert-list">${renderCertificationCards(items)}</div>`;
  }

  const featured = items.filter((cert) => cert.featured);
  const additional = items.filter((cert) => !cert.featured);
  const sections = [];

  if (featured.length) {
    sections.push(`
      <section class="content-section content-section-compact">
        <h3 class="section-subtitle">Featured</h3>
        <div class="cert-list">${renderCertificationCards(featured)}</div>
      </section>
    `);
  }

  if (additional.length) {
    sections.push(`
      <section class="content-section content-section-compact">
        <h3 class="section-subtitle">Additional</h3>
        <div class="cert-list">${renderCertificationCards(additional)}</div>
      </section>
    `);
  }

  if (!sections.length) {
    return `<div class="cert-list">${renderCertificationCards(items)}</div>`;
  }

  return sections.join("");
}

function updateCertificationsCount(meta) {
  const count = document.getElementById("certifications-count");
  if (!count) return;

  if (!meta || meta.total === 0) {
    count.textContent = "0 certifications";
    return;
  }

  count.textContent = `Showing ${meta.start}–${meta.end} of ${meta.total} certification${meta.total === 1 ? "" : "s"}`;
}

function renderCertificationsPage({ resetPage = false } = {}) {
  const container = document.getElementById("certifications-list");
  const pagination = document.getElementById("certifications-pagination");
  if (!container) return;

  if (resetPage) {
    currentPage = 1;
    writePageToQuery(1);
  } else {
    currentPage = readPageFromQuery(currentPage);
  }

  const meta = paginateItems(allCertifications, {
    page: currentPage,
    pageSize: certificationsPageSize(),
  });

  if (meta.page !== currentPage) {
    currentPage = meta.page;
    writePageToQuery(currentPage);
  }

  if (!meta.total) {
    container.innerHTML = `<p class="empty-state">No certifications listed yet.</p>`;
    updateCertificationsCount(meta);
    if (pagination) pagination.innerHTML = "";
    return;
  }

  container.innerHTML = renderCertificationPageSlice(meta.items, meta.page);
  updateCertificationsCount(meta);

  if (pagination) {
    pagination.innerHTML = renderPaginationNav(meta, { ariaLabel: "Certifications pagination" });
    bindPaginationNav(pagination, (nextPage) => {
      currentPage = nextPage;
      writePageToQuery(currentPage);
      renderCertificationsPage();
      scrollListIntoView("#certifications-list");
    });
  }
}

async function initCertificationsPage() {
  const container = document.getElementById("certifications-list");
  renderLoadingSkeleton(container, 4);
  currentPage = readPageFromQuery(1);

  await bootstrapPage("certifications", async () => {
    try {
      const data = await loadLinkedInData();
      allCertifications = sortCertifications(data.certifications || []);
      renderCertificationsPage({ resetPage: false });
    } catch {
      if (container) {
        container.innerHTML = `<p class="empty-state">Certifications unavailable. Edit data/linkedin.json to add them.</p>`;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", initCertificationsPage);
