const SITE_CONFIG = {
  baseUrl: "/Epic-Node",
  githubUsername: "EmmanuelM0147",
  siteTitle: "Emmanuel Okeowo - Senior Backend & AI Engineer",
  siteName: "epicnode.dev",
  portfolioUrl: "https://epicnode.hostless.site",
  ogImageUrl: "https://epicnode.hostless.site/assets/og-image.png",
  email: "okeowoemmanuelm@gmail.com",
  highlights: ["Senior Backend & AI Engineer", "Open to hybrid & remote roles"],
  roleTitle: "Senior Backend & AI Engineer",
};

let tabCounts = { projects: 0, certifications: 0 };
let linkedInDataCache = null;
let linkedInDataPromise = null;

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

async function loadSiteConfig() {
  try {
    const response = await fetch(assetUrl("config.json"));
    if (response.ok) {
      const config = await response.json();
      Object.assign(SITE_CONFIG, config);
    }
  } catch {
    // Use defaults for local preview.
  }
}

async function loadTabCounts() {
  try {
    const [reposRes, projectsRes, linkedin] = await Promise.all([
      fetch(assetUrl("data/github-repos.json"), { cache: "no-store" }),
      fetch(assetUrl("data/projects.json"), { cache: "no-store" }),
      fetchLinkedInJson().catch(() => null),
    ]);

    let githubCount = 0;
    let curatedCount = 0;
    const githubNames = new Set();

    if (reposRes.ok) {
      const data = await reposRes.json();
      const repos = (data.repos || []).filter(
        (repo) => repo.name !== SITE_CONFIG.githubUsername
      );
      githubCount = repos.length;
      repos.forEach((repo) => githubNames.add(repo.name.toLowerCase()));
    }

    if (projectsRes.ok) {
      const data = await projectsRes.json();
      curatedCount = (data.projects || []).filter(
        (project) => !githubNames.has(project.name.toLowerCase())
      ).length;
    }

    tabCounts.projects = githubCount + curatedCount;
    tabCounts.certifications = linkedin?.certifications?.length || 0;
  } catch {
    tabCounts.projects = tabCounts.projects || 0;
    tabCounts.certifications = tabCounts.certifications || 0;
  }
}

function baseUrl() {
  const path = window.location.pathname;
  if (path.includes("/Epic-Node")) {
    return "/Epic-Node";
  }
  return SITE_CONFIG.baseUrl === "/Epic-Node" && !path.includes("/Epic-Node")
    ? ""
    : SITE_CONFIG.baseUrl;
}

function assetUrl(relativePath) {
  const base = baseUrl();
  const clean = relativePath.replace(/^\//, "");
  return base ? `${base}/${clean}` : `/${clean}`;
}

function pageUrl(page) {
  const base = baseUrl();
  if (!page || page === "index.html") {
    return base ? `${base}/` : "/";
  }
  return base ? `${base}/${page}` : `/${page}`;
}

function formatCount(value) {
  const num = Number(value) || 0;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(num);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function renderTechTags(technologies) {
  if (!technologies?.length) return "";

  return `
    <div class="tech-tags">
      ${technologies.map((tech) => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join("")}
    </div>
  `;
}

function renderSkillsSection(skills, { title = "Skills" } = {}) {
  if (!skills?.length) return "";

  return `
    <section class="cv-section">
      <h3 class="cv-section-title">${icon("list")} ${escapeHtml(title)}</h3>
      ${renderTechTags(skills)}
    </section>
  `;
}

function renderLoadingSkeleton(container, lines = 3) {
  if (!container) return;
  container.innerHTML = `
    <div class="loading-skeleton" aria-hidden="true">
      ${Array.from({ length: lines }, () => `<span class="skeleton-line"></span>`).join("")}
    </div>
  `;
}

function parseMonthYearDate(value) {
  if (!value) return 0;

  const match = String(value).match(/([A-Za-z]{3,9})\s+(\d{4})/);
  if (match) {
    const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      return new Date(Number(match[2]), month, 1).getTime();
    }
  }

  return Date.parse(value) || 0;
}

function parseExperienceDate(value) {
  if (!value) return 0;
  if (/present/i.test(value)) return Date.now();

  const matches = [...String(value).matchAll(/([A-Za-z]{3,9})\s+(\d{4})/g)];
  const last = matches.at(-1);
  if (last) {
    const month = MONTH_INDEX[last[1].slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      return new Date(Number(last[2]), month, 1).getTime();
    }
  }

  return parseMonthYearDate(value);
}

function portfolioUrl(linkedin = null) {
  return SITE_CONFIG.portfolioUrl || linkedin?.portfolioUrl || "";
}

function xProfileUsername(contact = {}, profile = {}) {
  return contact.xUsername || profile?.twitter_username || SITE_CONFIG.githubUsername || "Trippie_1800";
}

function xProfileUrl(contact = {}, profile = {}) {
  if (contact.x) return contact.x;
  const username = xProfileUsername(contact, profile).replace(/^@/, "");
  return `https://x.com/${encodeURIComponent(username)}`;
}

function renderXProfileLink(contact = {}, profile = {}) {
  const username = xProfileUsername(contact, profile).replace(/^@/, "");
  const url = xProfileUrl(contact, profile);

  return `
    <a
      class="readme-link readme-link-x"
      href="${escapeHtml(url)}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="@${escapeHtml(username)} on X"
      title="@${escapeHtml(username)} on X"
    >
      <span class="social-icon-link">${icon("x")}</span>
      <span>@${escapeHtml(username)}</span>
    </a>
  `;
}

function currentEmployer(linkedin = null) {
  return linkedin?.currentCompany || linkedin?.experience?.[0]?.company || null;
}

function sidebarProfileOverrides(profile, linkedin = null) {
  const nextProfile = { ...profile };
  const employer = currentEmployer(linkedin);
  const siteUrl = portfolioUrl(linkedin);

  if (employer) {
    nextProfile.company = employer;
  }
  if (siteUrl) {
    nextProfile.blog = siteUrl;
  }

  return nextProfile;
}

function formatInlineMarkdown(text) {
  if (!text) return "";

  const parts = [];
  const pattern = /(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(`<strong>${escapeHtml(token.slice(2, -2))}</strong>`);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          `<a href="${escapeHtml(linkMatch[2])}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkMatch[1])}</a>`
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)));
  }

  return parts.join("");
}

function renderMarkdownLite(text) {
  if (!text) return "";

  return text
    .trim()
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      const isList = lines.length > 0 && lines.every((line) => /^[*-]\s/.test(line));

      if (isList) {
        return `<ul class="readme-list">${lines
          .map((line) => `<li>${formatInlineMarkdown(line.replace(/^[*-]\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }

      return `<p>${lines.map((line) => formatInlineMarkdown(line)).join("<br>")}</p>`;
    })
    .join("");
}

function icon(name) {
  const icons = {
    location:
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192-9.193 6.5 6.5 0 0 1 0 9.193Z"/><path fill="var(--color-canvas-default)" d="M8 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>',
    briefcase:
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M11.5 3a1.5 1.5 0 0 0-1.415 1H9V2.5A1.5 1.5 0 0 0 7.5 1h-3A1.5 1.5 0 0 0 3 2.5V4H1.915A1.5 1.5 0 0 0 .5 5.415l-.001.002-.001.002-.001.003A1.5 1.5 0 0 0 0 6.912V12.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V6.912a1.5 1.5 0 0 0-.413-1.029l-.001-.003-.001-.002A1.5 1.5 0 0 0 14.085 4H13V2.5A1.5 1.5 0 0 0 11.5 1h-3A1.5 1.5 0 0 0 7 2.5V4h-.085A1.5 1.5 0 0 0 5.5 3h6ZM9 4V2.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V4h4Z"/></svg>',
    link: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.642a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"/></svg>',
    email:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h15a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3v-15Zm18 1.5-7.928 4.893a1.5 1.5 0 0 1-1.572 0L1.5 6v12a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V6Z" clip-rule="evenodd"/></svg>',
    star: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>',
    fork: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-1.5v6.5h1.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-.75a.75.75 0 0 1 .75-.75H6v-6.5h-.5a.75.75 0 0 1-.75-.75v-.878a2.25 2.25 0 0 0-1.5 0Z"/><path fill="currentColor" d="M9.5 3.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/></svg>',
    folder:
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>',
    book: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25ZM3.5 3.5h9v1h-9v-1Zm0 3h9v1h-9v-1Zm0 3h5v1h-5v-1Z"/></svg>',
    list:
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 4.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 4a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 4a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM5.25 4.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5Zm0 4a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5Zm0 4a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5Z"/></svg>',
    graduation:
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8.985 1.018a.75.75 0 0 0-.97 0L1.71 4.992a.75.75 0 0 0-.43.685v7.323a.75.75 0 0 0 .316.608l6.304 4.412a.75.75 0 0 0 .86 0l6.304-4.412a.75.75 0 0 0 .316-.608V5.677a.75.75 0 0 0-.43-.685ZM2.71 5.677 8 2.618l5.29 3.059v6.905L8 14.382 2.71 10.582Z"/><path fill="currentColor" d="M14.75 5.677v7.323a.75.75 0 0 1-1.5 0V6.918l-4.47 2.587a.75.75 0 0 1-.75 0L3.56 6.918v6.082a.75.75 0 0 1-1.5 0V5.677a.75.75 0 0 1 .43-.685l6.304-3.974a.75.75 0 0 1 .732 0l6.304 3.974a.75.75 0 0 1 .43.685Z"/></svg>',
    user: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M10.5 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/><path fill="currentColor" d="M3 13.25c0-.813.244-1.573.657-2.2A5.002 5.002 0 0 1 8 9.5c1.653 0 3.122.8 4.043 2.032A4.625 4.625 0 0 1 12.75 13.25c0 .621-.504 1.125-1.125 1.125h-7.25A1.125 1.125 0 0 1 3 13.25Z"/></svg>',
    heart:
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a15.015 15.015 0 0 1-4.802-3.908C1.28 9.293.5 7.875.5 6.25c0-2.236 1.654-4.062 3.75-4.062 1.226 0 2.315.602 3 1.562.685-.96 1.774-1.562 3-1.562 2.096 0 3.75 1.826 3.75 4.062 0 1.625-.78 3.043-2.339 4.652a15.015 15.015 0 0 1-4.802 3.908l-.018.01-.008.004Z"/></svg>',
    external:
      '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-2.564l6.293 6.293a.75.75 0 0 1-1.06 1.06L3.625 4.561V7.25a.75.75 0 0 1-1.5 0v-3.5a.75.75 0 0 1 .75-.75Z"/><path fill="currentColor" d="M8.75 2.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V4.561l-5.22 5.22a.75.75 0 1 1-1.06-1.06l5.22-5.22H9.5a.75.75 0 0 1-.75-.75Z"/></svg>',
    sun: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0-11a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V0A.75.75 0 0 1 8 0Zm0 14.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 14.5ZM0 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H.75A.75.75 0 0 1 0 8Zm14.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14.5 8Z"/></svg>',
    moon: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Z"/></svg>',
    download:
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/><path fill="currentColor" d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.97a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.97Z"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    linkedin:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    github:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    orcid:
      '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.443 4.099c.526 0 .953.427.953.953s-.427.953-.953.953-.526 0-.953-.427-.953-.953 0-.526.427-.953.953-.953zm-.715 3.334h1.432v9.996H6.728V7.433zm4.562 0h2.784c2.763 0 4.456 1.797 4.456 4.912 0 3.116-1.693 4.913-4.456 4.913h-2.784V7.433zm1.432 1.349v7.305h1.352c1.944 0 3.022-1.296 3.022-3.655 0-2.358-1.078-3.65-3.022-3.65h-1.352z"/></svg>',
  };
  return icons[name] || "";
}

const LANGUAGE_COLORS = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  "Jupyter Notebook": "#DA5B0B",
  Markdown: "#083fa1",
  Shell: "#89e051",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Vue: "#41b883",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
};

function languageColor(language) {
  return LANGUAGE_COLORS[language] || "#8b949e";
}

function renderHeader() {
  const header = document.getElementById("site-header");
  if (!header) return;

  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  header.innerHTML = `
    <div class="site-header-inner">
      <a class="site-brand" href="${pageUrl("index.html")}">${escapeHtml(SITE_CONFIG.siteName || "epicnode.dev")}</a>
      <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Toggle color theme" aria-pressed="${theme === "light" ? "true" : "false"}">
        ${theme === "light" ? icon("moon") : icon("sun")}
      </button>
    </div>
  `;

  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
}

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  renderHeader();
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const theme = saved || "dark";
  document.documentElement.setAttribute("data-theme", theme);
}

function renderSidebar(profile, activeTab, options = {}) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar || !profile) return;

  const username = profile.login || SITE_CONFIG.githubUsername;
  const orgs = profile.organizations || [];
  const highlights = SITE_CONFIG.highlights || [];
  const email = SITE_CONFIG.email || profile.email;
  const sidebarBio = options.bio || profile.bio || "";

  sidebar.innerHTML = `
    <div class="sidebar-profile">
      <img class="avatar" src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.name || username)}" width="280" height="280">
      <h1 class="sidebar-name">${escapeHtml(profile.name || username)}</h1>
      <p class="sidebar-username">@${escapeHtml(username)}</p>
      <p class="sidebar-bio">${escapeHtml(sidebarBio)}</p>
      <a class="btn-follow" href="${pageUrl("hire.html")}">${icon("briefcase")} Hire me</a>
    </div>
    <div class="sidebar-stats">
      <span><strong>${formatCount(profile.followers)}</strong> followers</span>
      <span>·</span>
      <span><strong>${formatCount(profile.following)}</strong> following</span>
    </div>
    <ul class="sidebar-info">
      ${profile.company ? `<li>${icon("briefcase")}<span>${escapeHtml(profile.company)}</span></li>` : ""}
      ${profile.location ? `<li>${icon("location")}<span>${escapeHtml(profile.location)}</span></li>` : ""}
      ${email ? `<li>${icon("email")}<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></li>` : ""}
      ${profile.blog ? `<li>${icon("link")}<a href="${escapeHtml(profile.blog)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.blog.replace(/^https?:\/\//, ""))}</a></li>` : ""}
    </ul>
    ${
      highlights.length
        ? `<div class="sidebar-highlights">
            <h3>Highlights</h3>
            <ul>${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>`
        : ""
    }
    ${
      orgs.length
        ? `<div class="sidebar-orgs">
            <h3>Organizations</h3>
            <ul>${orgs.map((org) => `<li><a href="https://github.com/${escapeHtml(org.login)}" target="_blank" rel="noopener noreferrer"><span class="org-badge">${escapeHtml(org.login.slice(0, 2).toUpperCase())}</span>${escapeHtml(org.login)}</a></li>`).join("")}</ul>
          </div>`
        : ""
    }
  `;

  renderTabs(activeTab);
}

function renderTabs(activeTab) {
  const tabs = document.getElementById("tabs");
  if (!tabs) return;

  const items = [
    { id: "overview", label: "Overview", href: pageUrl("index.html"), icon: "book" },
    { id: "about", label: "About", href: pageUrl("about.html"), icon: "list" },
    {
      id: "certifications",
      label: "Certifications",
      href: pageUrl("certifications.html"),
      icon: "graduation",
      count: tabCounts.certifications,
    },
    {
      id: "projects",
      label: "Projects",
      href: pageUrl("projects.html"),
      icon: "folder",
      count: tabCounts.projects,
    },
    { id: "hire", label: "Hire Me", href: pageUrl("hire.html"), icon: "briefcase" },
    { id: "cv", label: "CV", href: pageUrl("cv.html"), icon: "user" },
  ];

  tabs.innerHTML = `
    <nav class="tab-nav" aria-label="Profile sections">
      ${items
        .map(
          (item) => `
        <a class="tab-link${activeTab === item.id ? " active" : ""}" href="${item.href}">
          <span class="tab-icon">${icon(item.icon)}</span>
          <span>${item.label}</span>
          ${item.count ? `<span class="tab-count">${item.count}</span>` : ""}
        </a>`
        )
        .join("")}
    </nav>
  `;
}

async function initLayout(activeTab) {
  initTheme();
  await loadSiteConfig();
  await loadTabCounts();
  renderHeader();
  document.title = document.title || SITE_CONFIG.siteTitle;

  let profile = null;
  try {
    const response = await fetch(assetUrl("data/github-profile.json"), { cache: "no-store" });
    if (response.ok) {
      profile = await response.json();
    }
  } catch {
    profile = {
      login: SITE_CONFIG.githubUsername,
      name: "Emmanuel Okeowo",
      avatar_url: "https://avatars.githubusercontent.com/u/155535967?v=4",
      bio: "Software Engineer · Backend & AI · Node.js · TypeScript · Python · RAG & production APIs",
      company: "Keyrium Consulting",
      location: "Lagos",
      followers: 9,
      following: 37,
      public_repos: 50,
      twitter_username: "Trippie_1800",
      organizations: [
        { login: "AMP-marketplace" },
        { login: "AltHub-NutriPlan" },
        { login: "Keyrium-Launchpad" },
      ],
    };
  }

  let linkedin = null;
  let sidebarBio = profile?.bio || "";
  try {
    linkedin = await fetchLinkedInJson();
    if (linkedin.sidebarBio) {
      sidebarBio = linkedin.sidebarBio;
    } else if (linkedin.githubBio) {
      sidebarBio = linkedin.githubBio;
    } else if (linkedin.intro) {
      sidebarBio = linkedin.intro;
    }
  } catch {
    // Fall back to GitHub bio.
  }

  profile = sidebarProfileOverrides(profile, linkedin);
  renderSidebar(profile, activeTab, { bio: sidebarBio });
  renderSiteFooter(linkedin);
  injectPersonSchema(profile, linkedin);
  applyPageMetaFromDocument();
  return profile;
}

function applyPageMetaFromDocument() {
  const { pageTitle, pageDescription } = document.body.dataset;
  if (pageTitle || pageDescription) {
    initPageMeta({ title: pageTitle, description: pageDescription });
  }
}

function renderSiteFooter(linkedin = null) {
  let footer = document.getElementById("site-footer");
  if (!footer) {
    footer = document.createElement("footer");
    footer.id = "site-footer";
    footer.className = "site-footer";
    document.querySelector(".site-shell")?.insertAdjacentElement("afterend", footer);
  }

  const updated = linkedin?.updatedAt ? `Profile updated ${linkedin.updatedAt}` : "";
  const portfolio = portfolioUrl(linkedin);
  const username = SITE_CONFIG.githubUsername;

  footer.innerHTML = `
    <div class="site-footer-inner">
      <p class="site-footer-copy">© ${new Date().getFullYear()} Emmanuel Okeowo · Software Engineer</p>
      <div class="site-footer-links">
        ${portfolio ? `<a href="${escapeHtml(portfolio)}" target="_blank" rel="noopener noreferrer">Portfolio</a>` : ""}
        <a href="${pageUrl("cv.html")}">CV</a>
        <a href="${pageUrl("hire.html")}">Hire Me</a>
        <a href="https://github.com/${escapeHtml(username)}" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
      ${updated ? `<p class="site-footer-meta">${escapeHtml(updated)}</p>` : ""}
    </div>
  `;
}

function setMetaTag(name, content, { property = false } = {}) {
  if (!content) return;

  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    if (property) {
      tag.setAttribute("property", name);
    } else {
      tag.setAttribute("name", name);
    }
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function initPageMeta({ title, description } = {}) {
  const pageTitle = title || SITE_CONFIG.siteTitle;
  const pageDescription = description || SITE_CONFIG.siteDescription || "";
  const url = window.location.href;
  const imageUrl =
    SITE_CONFIG.ogImageUrl ||
    new URL(assetUrl("assets/og-image.png"), window.location.origin).href;
  const imageAlt = "Emmanuel Okeowo - Senior Backend & AI Engineer";

  if (title) {
    document.title = title;
  }
  setMetaTag("description", pageDescription);
  setMetaTag("og:title", pageTitle, { property: true });
  setMetaTag("og:description", pageDescription, { property: true });
  setMetaTag("og:url", url, { property: true });
  setMetaTag("og:type", "website", { property: true });
  setMetaTag("og:image", imageUrl, { property: true });
  setMetaTag("og:image:alt", imageAlt, { property: true });
  setMetaTag("twitter:card", "summary_large_image");
  setMetaTag("twitter:title", pageTitle);
  setMetaTag("twitter:description", pageDescription);
  setMetaTag("twitter:image", imageUrl);
  setMetaTag("twitter:image:alt", imageAlt);
}

function injectPersonSchema(profile, linkedin = null) {
  if (document.getElementById("person-schema")) return;

  const contact = linkedin?.contact || {};
  const sameAs = [contact.linkedin, contact.github, contact.orcid, contact.x || xProfileUrl(contact, profile)].filter(
    Boolean
  );
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile?.name || "Emmanuel Okeowo",
    jobTitle: SITE_CONFIG.roleTitle || "Software Engineer",
    url: portfolioUrl(linkedin) || window.location.origin + pageUrl("index.html"),
    email: contact.email || SITE_CONFIG.email,
    sameAs,
    knowsAbout: (linkedin?.skills || []).slice(0, 12),
  };

  const script = document.createElement("script");
  script.id = "person-schema";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function sortCertifications(certifications = []) {
  return [...certifications].sort((a, b) => {
    const featuredA = a.featured ? 1 : 0;
    const featuredB = b.featured ? 1 : 0;
    if (featuredB !== featuredA) return featuredB - featuredA;
    return parseMonthYearDate(b.date) - parseMonthYearDate(a.date);
  });
}

function sortExperience(experience = []) {
  return [...experience].sort(
    (a, b) => parseExperienceDate(b.dates) - parseExperienceDate(a.dates)
  );
}

function buildSummaryLead(summary = {}) {
  const currentYear = new Date().getFullYear();
  const since = summary.softwareSince || null;
  const years = since ? currentYear - since : null;

  if (summary.lead) {
    return summary.lead
      .replace(/\{years\}/g, years != null ? String(years) : "")
      .replace(/\{since\}/g, since != null ? String(since) : "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  if (years && since) {
    return `Career Arc: ${years}+ years shipping backend systems — from web platforms to fintech APIs, loyalty backends, and RAG pipelines`;
  }

  return null;
}

function buildSummaryItems(data) {
  const summary = data?.summary || {};
  const highlights = summary.highlights || [];
  const lead = buildSummaryLead(summary);
  const items = [];

  if (lead) items.push(lead);
  items.push(...highlights);

  return items;
}

function renderSummaryMarkup(data) {
  const items = buildSummaryItems(data);
  if (!items.length) return "";

  return `
    <div class="summary-card">
      <ul class="summary-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </div>
  `;
}

async function fetchLinkedInJson() {
  if (linkedInDataCache) {
    return linkedInDataCache;
  }

  if (!linkedInDataPromise) {
    linkedInDataPromise = fetch(assetUrl("data/linkedin.json"), { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load profile data");
        }
        return response.json();
      })
      .then((data) => {
        linkedInDataCache = data;
        return data;
      })
      .finally(() => {
        linkedInDataPromise = null;
      });
  }

  return linkedInDataPromise;
}

async function loadLinkedInData() {
  return fetchLinkedInJson();
}

function profileAboutTagline(data = {}) {
  return data.aboutTagline || "Senior Backend & AI Engineer · Backend & AI Systems";
}

function profileOverviewTagline(data = {}) {
  return data.stackLine || SITE_CONFIG.roleTagline || "";
}

function profileCvIntro(data = {}) {
  return data.cvIntro || data.intro || "";
}

function profileCvPrintHeadline(data = {}) {
  return data.headline || "";
}
