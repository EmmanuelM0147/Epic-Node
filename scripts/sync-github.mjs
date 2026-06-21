#!/usr/bin/env node

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");

const USERNAME = process.env.GITHUB_USERNAME || "EmmanuelM0147";
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const USER_TOKEN = process.env.GITHUB_USER_TOKEN || TOKEN;

function formatUpdatedDate(isoDate) {
  if (!isoDate) return "Unknown";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

async function githubFetch(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Epic-Node-Portfolio-Sync",
  };

  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;

  while (true) {
    const batch = await githubFetch(
      `/users/${USERNAME}/repos?sort=updated&per_page=100&page=${page}`
    );

    if (!batch.length) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return repos;
}

function normalizeRepo(repo) {
  return {
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    description: repo.description,
    language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    fork: repo.fork,
    private: repo.private,
    updated_at: repo.updated_at,
    updated: formatUpdatedDate(repo.updated_at),
  };
}

async function fetchContributions() {
  const response = await fetch(`https://github-contributions-api.deno.dev/${USERNAME}.json`, {
    headers: { Accept: "application/json", "User-Agent": "Epic-Node-Portfolio-Sync" },
  });

  if (!response.ok) {
    throw new Error(`Contributions API failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    username: USERNAME,
    totalContributions: data.totalContributions,
    contributions: data.contributions,
    synced_at: new Date().toISOString(),
  };
}

function loadProfileOverrides() {
  try {
    const linkedin = JSON.parse(readFileSync(join(DATA_DIR, "linkedin.json"), "utf8"));
    return {
      company: linkedin.currentCompany || linkedin.experience?.[0]?.company || null,
      blog: linkedin.portfolioUrl || null,
    };
  } catch {
    return {};
  }
}

async function patchGitHubProfile({ company, blog }) {
  if (!USER_TOKEN) return false;

  const patch = {};
  if (company) patch.company = company;
  if (blog) patch.blog = blog;
  if (!Object.keys(patch).length) return false;

  const response = await fetch("https://api.github.com/user", {
    method: "PATCH",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${USER_TOKEN}`,
      "User-Agent": "Epic-Node-Portfolio-Sync",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    console.warn(`GitHub profile PATCH skipped: ${response.status} ${response.statusText}`);
    return false;
  }

  console.log(`Updated GitHub profile: ${Object.keys(patch).join(", ")}`);
  return true;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const [profile, orgs, repos, contributions] = await Promise.all([
    githubFetch(`/users/${USERNAME}`),
    githubFetch(`/users/${USERNAME}/orgs`).catch(() => []),
    fetchAllRepos(),
    fetchContributions().catch(() => null),
  ]);

  const profileOutput = {
    login: profile.login,
    name: profile.name,
    avatar_url: profile.avatar_url,
    html_url: profile.html_url,
    bio: profile.bio,
    company: profile.company,
    blog: profile.blog,
    location: profile.location,
    email: profile.email,
    hireable: profile.hireable,
    twitter_username: profile.twitter_username,
    public_repos: profile.public_repos,
    public_gists: profile.public_gists,
    followers: profile.followers,
    following: profile.following,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    organizations: orgs.map((org) => ({
      login: org.login,
      avatar_url: org.avatar_url,
      description: org.description,
    })),
    synced_at: new Date().toISOString(),
  };

  const profileOverrides = loadProfileOverrides();
  if (profileOverrides.company) {
    profileOutput.company = profileOverrides.company;
  }
  if (profileOverrides.blog) {
    profileOutput.blog = profileOverrides.blog;
  }

  if (profileOverrides.company || profileOverrides.blog) {
    await patchGitHubProfile(profileOverrides).catch((error) => {
      console.warn(`GitHub profile PATCH failed: ${error.message}`);
    });
  }

  const reposOutput = {
    username: USERNAME,
    count: repos.length,
    synced_at: new Date().toISOString(),
    repos: repos.map(normalizeRepo),
  };

  writeFileSync(
    join(DATA_DIR, "github-profile.json"),
    `${JSON.stringify(profileOutput, null, 2)}\n`
  );
  writeFileSync(join(DATA_DIR, "github-repos.json"), `${JSON.stringify(reposOutput, null, 2)}\n`);

  if (contributions) {
    writeFileSync(
      join(DATA_DIR, "github-contributions.json"),
      `${JSON.stringify(contributions, null, 2)}\n`
    );
    console.log(`Synced ${contributions.totalContributions} contributions`);
  }

  console.log(`Synced profile for ${USERNAME}`);
  console.log(`Synced ${repos.length} repositories`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
