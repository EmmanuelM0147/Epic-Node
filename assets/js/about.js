function renderAboutLinks(contact = {}) {
  const links = [
    contact.email
      ? `<a href="mailto:${escapeHtml(contact.email)}">${icon("email")} Email</a>`
      : "",
    contact.github
      ? `<a href="${escapeHtml(contact.github)}" target="_blank" rel="noopener noreferrer">${icon("github")} GitHub</a>`
      : "",
    contact.linkedin
      ? `<a href="${escapeHtml(contact.linkedin)}" target="_blank" rel="noopener noreferrer">${icon("linkedin")} LinkedIn</a>`
      : "",
    contact.orcid
      ? `<a href="${escapeHtml(contact.orcid)}" target="_blank" rel="noopener noreferrer">${icon("orcid")} ORCID</a>`
      : "",
  ].filter(Boolean);

  if (!links.length) return "";

  return `
    <section class="about-section">
      <h3 class="about-section-title">${icon("link")} Connect</h3>
      <div class="about-links">${links.join("")}</div>
    </section>
  `;
}

function aboutBodyText(data) {
  const text = data.linkedinAbout || data.githubAbout || data.cvIntro || "";
  return text.split(/\n\n(\*\*)?Focus areas:/i)[0].trim();
}

function renderAboutPage(data) {
  const container = document.getElementById("about-content");
  if (!container || !data) return;

  const headline = profileAboutTagline(data);
  const body = aboutBodyText(data);
  const summary = renderSummaryMarkup(data);

  container.innerHTML = `
    <header class="about-hero">
      <h2>About</h2>
      ${headline ? `<p class="about-tagline">${escapeHtml(headline)}</p>` : ""}
    </header>

    <div class="about-body readme-about">${renderMarkdownLite(body)}</div>

    ${
      summary
        ? `<section class="about-section">
            <h3 class="about-section-title">${icon("list")} Summary</h3>
            ${summary}
          </section>`
        : ""
    }

    ${renderAboutLinks(data.contact)}
  `;
}

async function initAboutPage() {
  await initLayout("about");

  try {
    const data = await loadLinkedInData();
    renderAboutPage(data);
  } catch {
    const container = document.getElementById("about-content");
    if (container) {
      container.innerHTML = `<p class="empty-state">About content unavailable.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", initAboutPage);
