#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");

const USERNAME = process.env.GITHUB_USERNAME || "EmmanuelM0147";
const PROFILE_REPO = process.env.GITHUB_PROFILE_REPO || `${USERNAME}/${USERNAME}`;
const TOKEN = process.env.GITHUB_USER_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

function loadLinkedInData() {
  return JSON.parse(readFileSync(join(DATA_DIR, "linkedin.json"), "utf8"));
}

function loadProfileReadme() {
  return readFileSync(join(DATA_DIR, "github-profile-readme.md"), "utf8");
}

async function githubRequest(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${TOKEN}`,
      "User-Agent": "Epic-Node-Portfolio-Push",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${path} failed: ${response.status} ${response.statusText} ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function patchUserProfile(linkedin) {
  const patch = {
    company: linkedin.currentCompany || linkedin.experience?.[0]?.company || undefined,
    blog: linkedin.portfolioUrl || undefined,
    bio: linkedin.githubBio || undefined,
    twitter_username: linkedin.contact?.xUsername || undefined,
  };

  Object.keys(patch).forEach((key) => {
    if (!patch[key]) delete patch[key];
  });

  if (!Object.keys(patch).length) return;

  await githubRequest("/user", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

  console.log(`Updated GitHub profile fields: ${Object.keys(patch).join(", ")}`);
}

async function pushProfileReadme(content) {
  const [owner, repo] = PROFILE_REPO.split("/");
  const path = "README.md";
  const encodedPath = encodeURIComponent(path);

  let sha;
  try {
    const existing = await githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}`);
    sha = existing.sha;
  } catch {
    sha = undefined;
  }

  const body = {
    message: "Update profile README to Applied AI Engineer positioning",
    content: Buffer.from(content, "utf8").toString("base64"),
  };

  if (sha) body.sha = sha;

  await githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  console.log(`Updated ${PROFILE_REPO} README.md`);
}

async function main() {
  if (!TOKEN) {
    throw new Error("Missing GITHUB_USER_TOKEN, GITHUB_TOKEN, or GH_TOKEN");
  }

  const linkedin = loadLinkedInData();
  const readme = loadProfileReadme();

  await patchUserProfile(linkedin);
  await pushProfileReadme(readme);

  console.log("GitHub profile push complete");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
