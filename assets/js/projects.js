let allRepos = [];
let currentFilters = { type: "all", language: "all", sort: "updated" };

function renderProjectCard(repo) {
  const languageMarkup = repo.language
    ? `<span class="repo-language"><span class="language-dot" style="background-color:${languageColor(repo.language)}"></span>${escapeHtml(repo.language)}</span>`
    : "";

  return `
    <article class="repo-card" data-name="${escapeHtml(repo.name.toLowerCase())}">
      <div class="repo-card-header">
        <h3 class="repo-name">
          <a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(repo.name)}</a>
        </h3>
        <span class="label label-public">Public</span>
        <a class="btn-star" href="${escapeHtml(repo.url)}" target="_blank" rel="noopener noreferrer">
          ${icon("star")} Star
        </a>
      </div>
      <p class="repo-description">${escapeHtml(repo.description || "No description provided.")}</p>
      <div class="repo-meta">
        ${languageMarkup}
        <span class="repo-stat">${icon("star")} ${Number(repo.stars).toLocaleString()}</span>
        <span class="repo-stat">${icon("fork")} ${Number(repo.forks).toLocaleString()}</span>
        <span class="repo-updated">Updated ${escapeHtml(repo.updated)}</span>
      </div>
    </article>
  `;
}

function renderProjects(repos) {
  const container = document.getElementById("projects-list");
  const count = document.getElementById("projects-count");
  if (!container) return;

  if (count) {
    count.textContent = `${repos.length} project${repos.length === 1 ? "" : "s"}`;
  }

  if (!repos.length) {
    container.innerHTML = `<p class="empty-state">No projects match the current filters.</p>`;
    return;
  }

  container.innerHTML = repos.map(renderProjectCard).join("");
}

function populateLanguageFilter(repos) {
  const select = document.getElementById("filter-language");
  if (!select) return;

  const languages = uniqueLanguages(repos);
  select.innerHTML =
    `<option value="all">All</option>` +
    languages.map((lang) => `<option value="${escapeHtml(lang)}">${escapeHtml(lang)}</option>`).join("");
}

function applyFilters() {
  const filtered = filterRepos(allRepos, currentFilters);
  const sorted = sortRepos(filtered, currentFilters.sort);
  renderProjects(sorted);
}

function bindFilterEvents() {
  const typeSelect = document.getElementById("filter-type");
  const languageSelect = document.getElementById("filter-language");
  const sortSelect = document.getElementById("filter-sort");
  const refreshBtn = document.getElementById("refresh-repos");

  typeSelect?.addEventListener("change", (event) => {
    currentFilters.type = event.target.value;
    applyFilters();
  });

  languageSelect?.addEventListener("change", (event) => {
    currentFilters.language = event.target.value;
    applyFilters();
  });

  sortSelect?.addEventListener("change", (event) => {
    currentFilters.sort = event.target.value;
    applyFilters();
  });

  refreshBtn?.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "Refreshing…";
    try {
      allRepos = await loadRepos({ preferLive: true });
      populateLanguageFilter(allRepos);
      applyFilters();
      setStatus("Live data refreshed from GitHub.");
    } catch {
      setStatus("Could not refresh live data. Showing cached repos.", true);
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "Refresh from GitHub";
    }
  });
}

function setStatus(message, isError = false) {
  const status = document.getElementById("projects-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function initProjectsPage() {
  await initLayout("projects");
  bindFilterEvents();

  try {
    allRepos = await loadRepos();
    populateLanguageFilter(allRepos);
    applyFilters();
    setStatus("Loaded from cached GitHub data.");
  } catch (error) {
    setStatus(error.message || "Failed to load projects.", true);
  }
}

document.addEventListener("DOMContentLoaded", initProjectsPage);
