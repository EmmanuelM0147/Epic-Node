function paginateItems(items, { page = 1, pageSize = 12 } = {}) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  return {
    items: items.slice(startIndex, endIndex),
    page: safePage,
    pageSize,
    total,
    totalPages,
    start: total === 0 ? 0 : startIndex + 1,
    end: endIndex,
  };
}

function readPageFromQuery(defaultPage = 1, paramName = "page") {
  const params = new URLSearchParams(window.location.search);
  const raw = Number.parseInt(params.get(paramName) || "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : defaultPage;
}

function writePageToQuery(page, { paramName = "page", replace = true } = {}) {
  const url = new URL(window.location.href);
  if (page <= 1) {
    url.searchParams.delete(paramName);
  } else {
    url.searchParams.set(paramName, String(page));
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (replace) {
    history.replaceState(null, "", nextUrl);
  } else {
    history.pushState(null, "", nextUrl);
  }
}

function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const normalized = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const result = [];

  for (let index = 0; index < normalized.length; index += 1) {
    const page = normalized[index];
    const previous = normalized[index - 1];
    if (index > 0 && page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  }

  return result;
}

function renderPaginationNav(meta, { ariaLabel = "Pagination" } = {}) {
  if (!meta || meta.totalPages <= 1) {
    return "";
  }

  const pageItems = buildPageNumbers(meta.page, meta.totalPages)
    .map((item) => {
      if (item === "ellipsis") {
        return `<span class="pagination-ellipsis" aria-hidden="true">…</span>`;
      }

      const isActive = item === meta.page;
      return `
        <button
          type="button"
          class="pagination-page${isActive ? " is-active" : ""}"
          data-page="${item}"
          aria-label="Page ${item}"
          ${isActive ? 'aria-current="page"' : ""}
        >${item}</button>
      `;
    })
    .join("");

  return `
    <div class="pagination-inner">
      <button
        type="button"
        class="pagination-btn"
        data-page="${meta.page - 1}"
        data-action="prev"
        aria-label="Previous page"
        ${meta.page <= 1 ? "disabled" : ""}
      >Previous</button>
      <div class="pagination-pages" aria-hidden="false">${pageItems}</div>
      <span class="pagination-summary">Page ${meta.page} of ${meta.totalPages}</span>
      <button
        type="button"
        class="pagination-btn"
        data-page="${meta.page + 1}"
        data-action="next"
        aria-label="Next page"
        ${meta.page >= meta.totalPages ? "disabled" : ""}
      >Next</button>
    </div>
  `;
}

function bindPaginationNav(container, onPageChange) {
  if (!container || typeof onPageChange !== "function") return;

  container.onclick = (event) => {
    const button = event.target.closest("[data-page]");
    if (!button || button.disabled || !container.contains(button)) return;

    const nextPage = Number.parseInt(button.dataset.page || "", 10);
    if (!Number.isFinite(nextPage) || nextPage < 1) return;

    onPageChange(nextPage);
  };
}

function scrollListIntoView(selector) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}
