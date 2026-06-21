const GITHUB_USERNAME = "EmmanuelM0147";
const PROFILE_README_REPO = `${GITHUB_USERNAME}/${GITHUB_USERNAME}`;

function formatUpdatedDate(isoDate) {
  if (!isoDate) return "Unknown";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function normalizeRepo(repo) {
  return {
    name: repo.name,
    url: repo.html_url || repo.url || null,
    description: repo.description || "",
    language: repo.language || null,
    stars: repo.stargazers_count ?? repo.stars ?? 0,
    forks: repo.forks_count ?? repo.forks ?? 0,
    fork: Boolean(repo.fork),
    private: Boolean(repo.private),
    curated: Boolean(repo.curated),
    company: repo.company || null,
    dates: repo.dates || null,
    technologies: repo.technologies || null,
    updated_at: repo.updated_at,
    updated: repo.updated || formatUpdatedDate(repo.updated_at),
  };
}

function normalizeCuratedProject(project) {
  return normalizeRepo({
    ...project,
    curated: true,
    private: project.private !== false,
    url: project.url || null,
    stars: 0,
    forks: 0,
    fork: false,
  });
}

async function loadCuratedProjects() {
  try {
    const response = await fetch(assetUrl("data/projects.json"), { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.projects || []).map(normalizeCuratedProject);
  } catch {
    return [];
  }
}

function mergeProjects(githubRepos, curatedProjects) {
  const githubNames = new Set(githubRepos.map((repo) => repo.name.toLowerCase()));
  const curated = curatedProjects.filter((project) => !githubNames.has(project.name.toLowerCase()));
  return [...curated, ...githubRepos];
}

function isProfileReadmeRepo(repo) {
  return repo.name === GITHUB_USERNAME || repo.full_name === PROFILE_README_REPO;
}

async function loadReposFromJson() {
  const [reposResponse, curatedProjects] = await Promise.all([
    fetch(assetUrl("data/github-repos.json"), { cache: "no-store" }),
    loadCuratedProjects(),
  ]);

  if (!reposResponse.ok) {
    throw new Error("Failed to load cached GitHub repos");
  }

  const data = await reposResponse.json();
  const githubRepos = (data.repos || []).map(normalizeRepo).filter((repo) => !isProfileReadmeRepo(repo));
  return mergeProjects(githubRepos, curatedProjects);
}

async function fetchLiveRepos() {
  const [response, curatedProjects] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`, {
      headers: { Accept: "application/vnd.github+json" },
    }),
    loadCuratedProjects(),
  ]);

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const repos = await response.json();
  const githubRepos = repos.map(normalizeRepo).filter((repo) => !isProfileReadmeRepo(repo));
  return mergeProjects(githubRepos, curatedProjects);
}

async function loadRepos({ preferLive = false } = {}) {
  if (preferLive) {
    try {
      return await fetchLiveRepos();
    } catch {
      return loadReposFromJson();
    }
  }

  try {
    return await loadReposFromJson();
  } catch {
    return fetchLiveRepos();
  }
}

async function loadProfile() {
  try {
    const response = await fetch(assetUrl("data/github-profile.json"));
    if (response.ok) {
      return response.json();
    }
  } catch {
    // fall through
  }

  const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error("Unable to load GitHub profile");
  }
  return response.json();
}

function uniqueLanguages(repos) {
  const languages = new Set();
  repos.forEach((repo) => {
    if (repo.language) languages.add(repo.language);
  });
  return [...languages].sort((a, b) => a.localeCompare(b));
}

const OVERVIEW_EXCLUDED_REPO_NAMES = new Set([
  "epic-node",
  "emmanuelm0147",
  "node-template",
  "personalportfolio-project0147",
]);

const OVERVIEW_LOW_VALUE_DESCRIPTIONS = [
  /learning purpose/i,
  /practice purpose/i,
  /educational purposes only/i,
  /for practice/i,
  /tip calculator/i,
  /birthday party registration/i,
];

function normalizeFeaturedPublicEntry(entry) {
  if (typeof entry === "string") {
    return { name: entry, description: null };
  }
  return {
    name: entry.name,
    description: entry.description || null,
  };
}

function isOverviewExcludedRepo(repo) {
  if (repo.curated || repo.fork) return Boolean(repo.fork);
  const name = repo.name.toLowerCase();
  if (OVERVIEW_EXCLUDED_REPO_NAMES.has(name)) return true;
  if (isProfileReadmeRepo(repo)) return true;
  if (name.includes("portfolio") && !(repo.description || "").trim()) return true;
  return false;
}

function hasMeaningfulDescription(repo) {
  const description = (repo.description || "").trim();
  if (description.length < 12) return false;
  return !OVERVIEW_LOW_VALUE_DESCRIPTIONS.some((pattern) => pattern.test(description));
}

function scoreOverviewCandidate(repo) {
  if (isOverviewExcludedRepo(repo) || repo.private || repo.curated) return -1;

  let score = 0;
  const description = (repo.description || "").toLowerCase();
  const name = repo.name.toLowerCase();

  if (hasMeaningfulDescription(repo)) score += 40;
  else if (!description) score -= 25;

  if (repo.language === "TypeScript") score += 15;
  if (repo.language === "Python" || repo.language === "Jupyter Notebook") score += 10;
  if (repo.language === "JavaScript") score += 8;

  [
    "api",
    "postgresql",
    "docker",
    "node",
    "typescript",
    "rag",
    "llm",
    "pipeline",
    "authentication",
    "backend",
    "rest",
  ].forEach((keyword) => {
    if (description.includes(keyword) || name.includes(keyword)) score += 8;
  });

  score += Math.min(repo.stars * 3, 9);
  score += new Date(repo.updated_at || 0).getTime() / 1e15;

  return score;
}

function applyFeaturedPublicOverrides(repo, featuredEntry) {
  if (!featuredEntry?.description || (repo.description || "").trim()) {
    return repo;
  }

  return {
    ...repo,
    description: featuredEntry.description,
  };
}

function pickOverviewFeatured(repos, limit = 3) {
  const filtered = repos.filter((repo) => repo.name !== GITHUB_USERNAME);
  const curated = sortRepos(
    filtered.filter((repo) => repo.curated),
    "updated"
  );
  const featuredNames = new Set(curated.map((repo) => repo.name.toLowerCase()));
  const selected = [...curated];
  const repoByName = new Map(filtered.map((repo) => [repo.name.toLowerCase(), repo]));
  const featuredPublic = (SITE_CONFIG.featuredPublicRepos || []).map(normalizeFeaturedPublicEntry);

  for (const entry of featuredPublic) {
    if (selected.length >= limit) break;

    const repo = repoByName.get(entry.name.toLowerCase());
    if (!repo || featuredNames.has(repo.name.toLowerCase())) continue;

    selected.push(applyFeaturedPublicOverrides(repo, entry));
    featuredNames.add(repo.name.toLowerCase());
  }

  if (selected.length >= limit) {
    return selected.slice(0, limit);
  }

  const scored = filtered
    .filter((repo) => !featuredNames.has(repo.name.toLowerCase()))
    .map((repo) => ({ repo, score: scoreOverviewCandidate(repo) }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.repo.stars - a.repo.stars ||
        a.repo.name.localeCompare(b.repo.name)
    );

  for (const { repo } of scored) {
    if (selected.length >= limit) break;
    selected.push(repo);
    featuredNames.add(repo.name.toLowerCase());
  }

  return selected;
}

function sortRepos(repos, sortBy) {
  const sorted = [...repos];
  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "stars":
      return sorted.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
    case "updated":
    default:
      return sorted.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }
}

function filterRepos(repos, { type = "all", language = "all" } = {}) {
  return repos.filter((repo) => {
    if (type === "public" && (repo.private || repo.fork || repo.curated)) return false;
    if (type === "private" && !repo.private && !repo.curated) return false;
    if (type === "fork" && !repo.fork) return false;
    if (language !== "all" && repo.language !== language) return false;
    return true;
  });
}

function countPortfolioProjects(repos) {
  return repos.filter(
    (repo) => repo.name !== GITHUB_USERNAME && !isOverviewExcludedRepo(repo)
  ).length;
}
