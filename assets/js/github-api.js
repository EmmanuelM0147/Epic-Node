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
    url: repo.html_url,
    description: repo.description || "",
    language: repo.language || null,
    stars: repo.stargazers_count ?? repo.stars ?? 0,
    forks: repo.forks_count ?? repo.forks ?? 0,
    fork: Boolean(repo.fork),
    private: Boolean(repo.private),
    updated_at: repo.updated_at,
    updated: repo.updated || formatUpdatedDate(repo.updated_at),
  };
}

function isProfileReadmeRepo(repo) {
  return repo.name === GITHUB_USERNAME || repo.full_name === PROFILE_README_REPO;
}

async function loadReposFromJson() {
  const response = await fetch(assetUrl("data/github-repos.json"));
  if (!response.ok) {
    throw new Error("Failed to load cached GitHub repos");
  }
  const data = await response.json();
  return (data.repos || []).map(normalizeRepo).filter((repo) => !isProfileReadmeRepo(repo));
}

async function fetchLiveRepos() {
  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
    {
      headers: { Accept: "application/vnd.github+json" },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const repos = await response.json();
  return repos.map(normalizeRepo).filter((repo) => !isProfileReadmeRepo(repo));
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
    if (type === "public" && (repo.private || repo.fork)) return false;
    if (type === "fork" && !repo.fork) return false;
    if (language !== "all" && repo.language !== language) return false;
    return true;
  });
}
