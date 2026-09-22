// Interactive dashboard: filters + measure/breakdown switches + table,
// all recomputed client-side from assets/data/books.json.

const PANEL_DEFAULTS = [
  { id: 1, breakdown: "genre", measure: "count" },
  { id: 2, breakdown: "decade", measure: "avg_rating" },
  { id: 3, breakdown: "language", measure: "count" },
  { id: 4, breakdown: "bookFormat", measure: "avg_rating" },
];

const TABLE_PAGE_SIZE = 25;

let ALL_BOOKS = [];
let ALL_GENRES = [];
let YEAR_MIN = 1873;
let YEAR_MAX = 2021;

const filters = {
  yearFrom: null,
  yearTo: null,
  genres: new Set(),
  language: "All",
  format: "All",
  minRating: 0,
};

const panelCharts = {};
const table = { sortKey: "numRatings", sortDir: "desc", page: 0, rows: [] };

let currentFiltered = [];

loadData().then(({ books }) => {
  ALL_BOOKS = books;
  ALL_GENRES = Array.from(new Set(books.flatMap((b) => b.genres))).sort();
  YEAR_MIN = Math.min(...books.map((b) => b.year));
  YEAR_MAX = Math.max(...books.map((b) => b.year));

  setupFilterControls();
  setupPanelControls();
  setupTableControls();
  resetFilters();
});

function setupFilterControls() {
  document.getElementById("year-from").min = YEAR_MIN;
  document.getElementById("year-from").max = YEAR_MAX;
  document.getElementById("year-to").min = YEAR_MIN;
  document.getElementById("year-to").max = YEAR_MAX;
  document.getElementById("year-from").addEventListener("change", onYearChange);
  document.getElementById("year-to").addEventListener("change", onYearChange);

  const genreList = document.getElementById("genre-list");
  genreList.innerHTML = ALL_GENRES.map(
    (g) => `<label><input type="checkbox" value="${g}" checked /> ${g}</label>`
  ).join("");
  genreList.addEventListener("change", (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      if (e.target.checked) filters.genres.add(e.target.value);
      else filters.genres.delete(e.target.value);
      updateGenreCountLabel();
      update();
    }
  });

  const langCounts = countBy(ALL_BOOKS, (b) => b.language || "Unknown");
  const topLangs = Array.from(langCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([k]) => k);
  const langSelect = document.getElementById("filter-language");
  langSelect.innerHTML =
    `<option value="All">All languages</option>` + topLangs.map((l) => `<option value="${l}">${l} (${langCounts.get(l).toLocaleString()})</option>`).join("");
  langSelect.addEventListener("change", () => {
    filters.language = langSelect.value;
    update();
  });

  const fmtCounts = countBy(ALL_BOOKS, (b) => b.bookFormat || "Unknown");
  const topFmts = Array.from(fmtCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k]) => k);
  const fmtSelect = document.getElementById("filter-format");
  fmtSelect.innerHTML =
    `<option value="All">All formats</option>` + topFmts.map((f) => `<option value="${f}">${f} (${fmtCounts.get(f).toLocaleString()})</option>`).join("");
  fmtSelect.addEventListener("change", () => {
    filters.format = fmtSelect.value;
    update();
  });

  const minRatingInput = document.getElementById("filter-min-rating");
  minRatingInput.addEventListener("input", () => {
    filters.minRating = parseFloat(minRatingInput.value);
    document.getElementById("min-rating-value").textContent = filters.minRating.toFixed(1);
    update();
  });

  document.getElementById("reset-btn").addEventListener("click", resetFilters);
}

function onYearChange() {
  filters.yearFrom = parseInt(document.getElementById("year-from").value, 10);
  filters.yearTo = parseInt(document.getElementById("year-to").value, 10);
  update();
}

function updateGenreCountLabel() {
  document.getElementById("genre-count-label").textContent = `(${filters.genres.size} of ${ALL_GENRES.length} selected)`;
}

function countBy(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}

function setupPanelControls() {
  const measureOptions = Object.entries(MEASURES)
    .map(([key, m]) => `<option value="${key}">${m.label}</option>`)
    .join("");
  const breakdownOptions = Object.entries(BREAKDOWNS)
    .map(([key, b]) => `<option value="${key}">${b.label}</option>`)
    .join("");

  for (const cfg of PANEL_DEFAULTS) {
    const measureSelect = document.querySelector(`select[data-panel="${cfg.id}"][data-role="measure"]`);
    const breakdownSelect = document.querySelector(`select[data-panel="${cfg.id}"][data-role="breakdown"]`);
    measureSelect.innerHTML = measureOptions;
    breakdownSelect.innerHTML = breakdownOptions;
    measureSelect.value = cfg.measure;
    breakdownSelect.value = cfg.breakdown;
    measureSelect.addEventListener("change", () => renderPanel(cfg.id));
    breakdownSelect.addEventListener("change", () => renderPanel(cfg.id));
  }
}

function setupTableControls() {
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (table.sortKey === key) {
        table.sortDir = table.sortDir === "asc" ? "desc" : "asc";
      } else {
        table.sortKey = key;
        table.sortDir = "desc";
      }
      table.page = 0;
      renderTable();
    });
  });
  document.getElementById("prev-page").addEventListener("click", () => {
    if (table.page > 0) {
      table.page -= 1;
      renderTable();
    }
  });
  document.getElementById("next-page").addEventListener("click", () => {
    const maxPage = Math.max(0, Math.ceil(table.rows.length / TABLE_PAGE_SIZE) - 1);
    if (table.page < maxPage) {
      table.page += 1;
      renderTable();
    }
  });
}

function resetFilters() {
  filters.yearFrom = YEAR_MIN;
  filters.yearTo = YEAR_MAX;
  filters.genres = new Set(ALL_GENRES);
  filters.language = "All";
  filters.format = "All";
  filters.minRating = 0;

  document.getElementById("year-from").value = YEAR_MIN;
  document.getElementById("year-to").value = YEAR_MAX;
  document.querySelectorAll('#genre-list input[type="checkbox"]').forEach((cb) => (cb.checked = true));
  document.getElementById("filter-language").value = "All";
  document.getElementById("filter-format").value = "All";
  document.getElementById("filter-min-rating").value = 0;
  document.getElementById("min-rating-value").textContent = "0.0";
  updateGenreCountLabel();

  table.sortKey = "numRatings";
  table.sortDir = "desc";
  table.page = 0;

  update();
}

function getFilteredBooks() {
  return ALL_BOOKS.filter((b) => {
    if (b.year < filters.yearFrom || b.year > filters.yearTo) return false;
    if (b.rating === null || b.rating < filters.minRating) return false;
    if (filters.language !== "All" && (b.language || "Unknown") !== filters.language) return false;
    if (filters.format !== "All" && (b.bookFormat || "Unknown") !== filters.format) return false;
    if (!b.genres.some((g) => filters.genres.has(g))) return false;
    return true;
  });
}

function rowsForBreakdown(filteredBooks, breakdownKey) {
  if (breakdownKey !== "genre") return filteredBooks;
  const rows = [];
  for (const b of filteredBooks) {
    for (const g of b.genres) {
      if (filters.genres.has(g)) rows.push({ ...b, genre: g });
    }
  }
  return rows;
}

function update() {
  currentFiltered = getFilteredBooks();
  renderSummary(currentFiltered);
  for (const cfg of PANEL_DEFAULTS) renderPanel(cfg.id);
  table.page = 0;
  renderTable();
}

function renderSummary(filteredBooks) {
  const tiles = [
    [MEASURES.count.format(MEASURES.count.compute(filteredBooks)), "Books matching filters"],
    [MEASURES.total_ratings.format(MEASURES.total_ratings.compute(filteredBooks)), "Total ratings"],
    [MEASURES.avg_rating.format(MEASURES.avg_rating.compute(filteredBooks)), "Average rating"],
    [MEASURES.median_rating.format(MEASURES.median_rating.compute(filteredBooks)), "Median rating"],
    [MEASURES.liked_rate.format(MEASURES.liked_rate.compute(filteredBooks)), "% liked (avg)"],
  ];
  document.getElementById("summary-stats").innerHTML = tiles
    .map(([value, label]) => `<div class="stat-tile"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`)
    .join("");
}

function renderPanel(panelId) {
  const measureKey = document.querySelector(`select[data-panel="${panelId}"][data-role="measure"]`).value;
  const breakdownKey = document.querySelector(`select[data-panel="${panelId}"][data-role="breakdown"]`).value;

  const rows = rowsForBreakdown(currentFiltered, breakdownKey);
  const results = aggregate(rows, breakdownKey, measureKey).slice(0, 30);

  if (panelCharts[panelId]) panelCharts[panelId].destroy();
  const canvas = document.getElementById(`dash-chart-${panelId}`);
  panelCharts[panelId] = makeBarChart(canvas, {
    labels: results.map((r) => r.key),
    data: results.map((r) => r.value),
    axisLabel: MEASURES[measureKey].label,
    horizontal: breakdownKey === "genre" || breakdownKey === "publisher",
  });
}

function renderTable() {
  const rows = currentFiltered;
  const dir = table.sortDir === "asc" ? 1 : -1;
  const sorted = rows.slice().sort((a, b) => {
    let av = table.sortKey === "genres" ? a.genres.join(", ") : a[table.sortKey];
    let bv = table.sortKey === "genres" ? b.genres.join(", ") : b[table.sortKey];
    if (av === null || av === undefined) av = table.sortDir === "asc" ? Infinity : -Infinity;
    if (bv === null || bv === undefined) bv = table.sortDir === "asc" ? Infinity : -Infinity;
    if (typeof av === "string") return av.localeCompare(bv) * dir;
    return (av - bv) * dir;
  });
  table.rows = sorted;

  const start = table.page * TABLE_PAGE_SIZE;
  const pageRows = sorted.slice(start, start + TABLE_PAGE_SIZE);

  document.getElementById("table-body").innerHTML = pageRows
    .map(
      (b) => `<tr>
        <td>${escapeHtml(b.title || "—")}</td>
        <td>${escapeHtml(b.author || "—")}</td>
        <td>${b.year}</td>
        <td>${escapeHtml(b.genres.join(", "))}</td>
        <td>${fmt.decimal(b.rating, 2)}</td>
        <td>${fmt.int(b.numRatings)}</td>
        <td>${escapeHtml(b.bookFormat || "—")}</td>
      </tr>`
    )
    .join("");

  document.getElementById("table-count").textContent = `${fmt.int(rows.length)} books`;
  const maxPage = Math.max(0, Math.ceil(sorted.length / TABLE_PAGE_SIZE) - 1);
  document.getElementById("page-info").textContent = `Page ${table.page + 1} of ${maxPage + 1}`;
  document.getElementById("prev-page").disabled = table.page <= 0;
  document.getElementById("next-page").disabled = table.page >= maxPage;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
