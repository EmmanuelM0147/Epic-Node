function renderProjectPreview(repos) {
  const container = document.getElementById("featured-projects");
  const footer = document.getElementById("projects-footer");
  if (!container) return;

  const filtered = repos.filter((repo) => repo.name !== "EmmanuelM0147");
  const curated = sortRepos(
    filtered.filter((repo) => repo.curated),
    "updated"
  );
  const github = sortRepos(
    filtered.filter((repo) => !repo.curated),
    "stars"
  );
  const featured = [...curated, ...github].slice(0, 3);
  const remaining = filtered.length - featured.length;

  container.innerHTML = featured
    .map((repo) => {
      const titleMarkup = repo.url
        ? `<a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repo.name)}</a>${icon("external")}`
        : escapeHtml(repo.name);
      const metaParts = [repo.company, repo.private ? "Private" : null].filter(Boolean);
      const metaMarkup = metaParts.length
        ? `<p class="preview-card-meta">${metaParts.map((part) => escapeHtml(part)).join(" · ")}</p>`
        : "";

      return `
      <article class="preview-card">
        <h3>${titleMarkup}</h3>
        ${metaMarkup}
        <p>${escapeHtml(repo.description || "No description provided.")}</p>
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

  const featured = (certifications || []).slice(0, 3);
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

function introBioText(bio) {
  if (!bio) return "";
  return bio.replace(/^Backend & AI Engineer\s*\|\s*/i, "").trim();
}

function renderIntro(profile) {
  const intro = document.getElementById("intro-text");
  if (!intro) return;

  const name = profile.name?.split(" ")[0] || "Emmanuel";
  const bio = introBioText(profile.bio);
  intro.textContent = `My name is ${name} and I'm a Backend & AI Engineer based in ${profile.location || "Lagos"}.${bio ? ` ${bio}` : ""}`;
}

function renderReadmeSocial(profile) {
  const social = document.getElementById("readme-social");
  const cta = document.getElementById("readme-cta");
  if (!social) return;

  const twitter = profile?.twitter_username || "Trippie_1800";
  const githubUser = profile?.login || SITE_CONFIG.githubUsername;

  social.innerHTML = `
    <a class="social-icon-link" href="https://x.com/${escapeHtml(twitter)}" target="_blank" rel="noopener noreferrer" aria-label="X @${escapeHtml(twitter)}" title="@${escapeHtml(twitter)}">${icon("x")}</a>
    <a class="social-icon-link" href="https://www.linkedin.com/in/okeowoemmanuelm/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">${icon("linkedin")}</a>
    <a class="social-icon-link" href="https://github.com/${escapeHtml(githubUser)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">${icon("github")}</a>
    <a class="social-icon-link" href="https://orcid.org/0009-0000-2965-8445" target="_blank" rel="noopener noreferrer" aria-label="ORCID" title="ORCID">${icon("orcid")}</a>
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
  renderIntro(profile);
  renderReadmeSocial(profile);
  renderContribution(profile);

  try {
    const [repos, linkedin] = await Promise.all([loadRepos(), loadLinkedInData()]);
    renderProjectPreview(repos);
    renderCertificationPreview(linkedin.certifications);
  } catch {
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
