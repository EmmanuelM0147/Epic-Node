const CONTRIBUTIONS_API = "https://github-contributions-api.deno.dev";
const CONTRIBUTIONS_REFRESH_MS = 5 * 60 * 1000;

let contributionsRefreshTimer = null;

function contributionLevelClass(day) {
  const levels = {
    NONE: "",
    FIRST_QUARTILE: "level-1",
    SECOND_QUARTILE: "level-2",
    THIRD_QUARTILE: "level-3",
    FOURTH_QUARTILE: "level-4",
  };

  if (day.contributionLevel && levels[day.contributionLevel] !== undefined) {
    return levels[day.contributionLevel];
  }

  if (!day.contributionCount) return "";
  if (day.contributionCount <= 3) return "level-1";
  if (day.contributionCount <= 9) return "level-2";
  if (day.contributionCount <= 19) return "level-3";
  return "level-4";
}

function normalizeContributions(data, source = "unknown") {
  return {
    username: data.username,
    totalContributions: data.totalContributions,
    contributions: data.contributions,
    synced_at: data.synced_at || new Date().toISOString(),
    source,
  };
}

async function fetchLiveContributions(username) {
  const response = await fetch(`${CONTRIBUTIONS_API}/${encodeURIComponent(username)}.json`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Live contributions unavailable");
  }

  const data = await response.json();
  return normalizeContributions(
    {
      username,
      totalContributions: data.totalContributions,
      contributions: data.contributions,
      synced_at: new Date().toISOString(),
    },
    "live"
  );
}

async function fetchCachedContributions() {
  const response = await fetch(assetUrl("data/github-contributions.json"), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Cached contributions unavailable");
  }

  const data = await response.json();
  return normalizeContributions(data, "cache");
}

function renderContributionGraph(container, data, { live = false } = {}) {
  if (!container || !data) return;

  const weeks = data.contributions || [];
  const total = data.totalContributions || 0;

  const weeksHtml = weeks
    .map(
      (week) => `
      <div class="graph-week">
        ${week
          .map(
            (day) => `
          <span
            class="graph-day ${contributionLevelClass(day)}"
            title="${escapeHtml(day.date)}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}"
            aria-label="${escapeHtml(day.date)}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}"
          ></span>`
          )
          .join("")}
      </div>`
    )
    .join("");

  container.innerHTML = `
    <div class="contribution-graph">
      <div class="graph-container">${weeksHtml}</div>
    </div>
    <p class="contribution-text">
      <strong>${Number(total).toLocaleString()}</strong> contributions in the last year
      ${live ? `<span class="contribution-live"> · Live</span>` : ""}
    </p>
  `;
}

function renderContributionFallback(container, username) {
  container.innerHTML = `
    <p class="empty-state">
      Contribution graph unavailable.
      <a href="https://github.com/${escapeHtml(username)}" target="_blank" rel="noopener noreferrer">View on GitHub</a>.
    </p>
  `;
}

async function loadContributions(username = SITE_CONFIG.githubUsername, { preferLive = true } = {}) {
  if (preferLive) {
    try {
      return await fetchLiveContributions(username);
    } catch {
      return fetchCachedContributions();
    }
  }

  try {
    return await fetchCachedContributions();
  } catch {
    return fetchLiveContributions(username);
  }
}

function initContributionActivity(container, username = SITE_CONFIG.githubUsername) {
  if (!container) return;

  container.innerHTML = `<p class="empty-state">Loading contribution activity…</p>`;

  const refreshLive = async () => {
    try {
      const live = await fetchLiveContributions(username);
      renderContributionGraph(container, live, { live: true });
      return true;
    } catch {
      return false;
    }
  };

  const bootstrap = async () => {
    fetchCachedContributions()
      .then((cached) => renderContributionGraph(container, cached))
      .catch(() => {});

    const liveLoaded = await refreshLive();

    if (!liveLoaded && !container.querySelector(".graph-container")) {
      try {
        const cached = await fetchCachedContributions();
        renderContributionGraph(container, cached);
      } catch {
        renderContributionFallback(container, username);
      }
    }
  };

  bootstrap();

  if (contributionsRefreshTimer) {
    clearInterval(contributionsRefreshTimer);
  }

  contributionsRefreshTimer = setInterval(refreshLive, CONTRIBUTIONS_REFRESH_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshLive();
    }
  });
}
