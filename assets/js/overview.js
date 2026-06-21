function renderProjectPreviewMeta(repo) {
  const parts = [];

  if (repo.company) {
    parts.push(`<span class="preview-card-meta">${escapeHtml(repo.company)}</span>`);
  }
  if (repo.private || repo.curated) {
    parts.push(`<span class="preview-badge">Private</span>`);
  }

  return parts.length ? `<div class="preview-card-top">${parts.join("")}</div>` : "";
}

function renderProjectPreviewFooter(repo) {
  const parts = [];

  if (repo.language) {
    parts.push(`
      <span class="repo-language">
        <span class="language-dot" style="background:${languageColor(repo.language)}"></span>
        ${escapeHtml(repo.language)}
      </span>
    `);
  }
  if (repo.stars > 0) {
    parts.push(`<span class="repo-stat">${icon("star")} ${formatCount(repo.stars)}</span>`);
  }

  return parts.length ? `<div class="preview-card-footer repo-meta">${parts.join("")}</div>` : "";
}

function renderProjectPreview(repos) {
  const container = document.getElementById("featured-projects");
  const footer = document.getElementById("projects-footer");
  if (!container) return;

  const filtered = repos.filter((repo) => repo.name !== "EmmanuelM0147");
  const featured = pickOverviewFeatured(filtered, 3);
  const remaining = filtered.length - featured.length;

  container.innerHTML = featured
    .map((repo) => {
      const titleMarkup = repo.url
        ? `<a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repo.name)}</a>${icon("external")}`
        : escapeHtml(repo.name);

      return `
      <article class="preview-card">
        <h3>${titleMarkup}</h3>
        ${renderProjectPreviewMeta(repo)}
        <p>${escapeHtml(repo.description || "No description provided.")}</p>
        ${repo.technologies?.length ? renderTechTags(repo.technologies) : ""}
        ${renderProjectPreviewFooter(repo)}
      </article>
    `;
    })
    .join("");

  if (footer) {
    footer.innerHTML =
      remaining > 0
        ? `<a href="${pageUrl("projects.html")}">View ${remaining} more project${remaining === 1 ? "" : "s"} →</a>`
        : `<a href="${pageUrl("projects.html")}">View all projects →</a>`;
  }
}

function renderCertificationPreview(certifications) {
  const container = document.getElementById("featured-certifications");
  const footer = document.getElementById("certifications-footer");
  if (!container) return;

  const featured = sortCertifications(certifications).slice(0, 3);
  const remaining = (certifications || []).length - featured.length;

  if (!featured.length) {
    container.innerHTML = `<p class="empty-state">Certifications will appear after profile data is loaded.</p>`;
    return;
  }

  container.innerHTML = featured
    .map(
      (cert) => `
      <article class="preview-card">
        <h3>
          ${
            cert.url
              ? `<a href="${escapeHtml(cert.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cert.name)}</a>${icon("external")}`
              : escapeHtml(cert.name)
          }
        </h3>
        <p>${escapeHtml(cert.issuer)} · ${escapeHtml(cert.date)}</p>
      </article>
    `
    )
    .join("");

  if (footer && remaining > 0) {
    footer.innerHTML = `<a href="${pageUrl("certifications.html")}">View ${remaining} more certification${remaining === 1 ? "" : "s"} →</a>`;
  } else if (footer) {
    footer.innerHTML = `<a href="${pageUrl("certifications.html")}">View all certifications →</a>`;
  }
}

function renderSummarySection(data) {
  const container = document.getElementById("overview-summary");
  if (!container) return;

  container.innerHTML = renderSummaryMarkup(data);
}

function introBioText(bio) {
  if (!bio) return "";
  return bio
    .replace(/^(Backend (& AI )?Engineer|AI Engineer|Software Engineer)\s*[|·]\s*/i, "")
    .replace(/\s*[|·]\s*Node\.js.*$/i, "")
    .trim();
}

function roleTitle() {
  return SITE_CONFIG.roleTitle || "Software Engineer";
}

function renderIntro(profile, linkedin = {}) {
  const introEl = document.getElementById("intro-text");
  if (!introEl) return;

  const name = profile.name?.split(" ")[0] || "Emmanuel";
  const roleLabel = linkedin.roleLabel || `a ${roleTitle()}`;
  const greeting = `My name is ${name} and I'm ${roleLabel} based in ${profile.location || "Lagos"}.`;
  const tagline =
    profileOverviewTagline(linkedin) ||
    introBioText(profile.bio) ||
    "";

  introEl.innerHTML = tagline
    ? `${escapeHtml(greeting)}<span class="intro-tagline">${escapeHtml(tagline)}</span>`
    : escapeHtml(greeting);
}

function renderReadmeSocial(profile, contact = {}) {
  const social = document.getElementById("readme-social");
  const cta = document.getElementById("readme-cta");
  if (!social) return;

  const twitter = profile?.twitter_username || "Trippie_1800";
  const githubUser = profile?.login || SITE_CONFIG.githubUsername;
  const linkedinUrl = contact.linkedin || "https://www.linkedin.com/in/okeowoemmanuelm/";
  const orcidUrl = contact.orcid || "https://orcid.org/0009-0000-2965-8445";

  social.innerHTML = `
    <a class="readme-link" href="https://x.com/${escapeHtml(twitter)}" target="_blank" rel="noopener noreferrer">${icon("x")} @${escapeHtml(twitter)}</a>
    <a class="readme-link" href="${escapeHtml(linkedinUrl)}" target="_blank" rel="noopener noreferrer">${icon("linkedin")} LinkedIn</a>
    <a class="readme-link" href="https://github.com/${escapeHtml(githubUser)}" target="_blank" rel="noopener noreferrer">${icon("github")} GitHub</a>
    <a class="readme-link" href="${escapeHtml(orcidUrl)}" target="_blank" rel="noopener noreferrer">${icon("orcid")} ORCID</a>
  `;

  if (cta) {
    cta.innerHTML = `
      <a class="btn-sponsor" href="${pageUrl("hire.html")}">
        ${icon("heart")} Hire me for your next project
      </a>
    `;
  }
}

function renderContribution(profile) {
  const box = document.getElementById("contribution-box");
  if (!box) return;

  initContributionActivity(box, profile.login || SITE_CONFIG.githubUsername);
}

async function initOverviewPage() {
  const profile = await initLayout("overview");
  renderContribution(profile);

  try {
    const [repos, linkedin] = await Promise.all([loadRepos(), loadLinkedInData()]);
    renderIntro(profile, linkedin);
    renderReadmeSocial(profile, linkedin.contact);
    renderSummarySection(linkedin);
    renderProjectPreview(repos);
    renderCertificationPreview(linkedin.certifications);
  } catch {
    renderIntro(profile);
    renderReadmeSocial(profile);
    const projects = document.getElementById("featured-projects");
    const certs = document.getElementById("featured-certifications");
    if (projects) {
      projects.innerHTML = `<p class="empty-state">Projects will appear after GitHub data sync.</p>`;
    }
    if (certs) {
      certs.innerHTML = `<p class="empty-state">Certifications will appear after profile data is loaded.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", initOverviewPage);
