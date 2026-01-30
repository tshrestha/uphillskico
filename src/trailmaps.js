import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import {
  initTheme,
  toggleTheme,
  setupThemeListener,
  getRankBadge,
  highlightMatch,
  createAutocomplete,
} from "./utils.js";
import { trailMaps } from "./trailmaps-data.js";

// Initialize theme
initTheme();
setupThemeListener();

// Theme toggle button
document.getElementById("themeToggle").addEventListener("click", toggleTheme);

// DOM elements
const grid = document.getElementById("trailMapsGrid");
const searchInput = document.getElementById("searchInput");
const autocompleteList = document.getElementById("autocomplete-list");
const resultsCount = document.getElementById("resultsCount");

// Generate image HTML with picture element for AVIF fallback support
function getImageHtml(map) {
  const imgPath = `/trailmaps/${map.file}`;
  const alt = `${map.name} trail map`;

  // For AVIF images, use picture element with WebP fallback (when available)
  if (map.type === "avif") {
    // Fallback to same file if no WebP version exists (browser will handle gracefully)
    const fallbackPath = map.fallback ? `/trailmaps/${map.fallback}` : imgPath;
    return `
      <picture>
        <source srcset="${imgPath}" type="image/avif">
        <img src="${fallbackPath}" alt="${alt}" loading="lazy" decoding="async" class="card-img-top object-fit-cover rounded-top-4">
      </picture>`;
  }

  // For WebP and other formats, use simple img tag
  return `<img src="${imgPath}" alt="${alt}" loading="lazy" decoding="async" class="card-img-top object-fit-cover rounded-top-4">`;
}

// Render trail maps
function renderTrailMaps(maps) {
  grid.innerHTML = maps
    .map(
      (map) => `
      <div class="col">
        <a href="/trailmaps/${map.file}" target="_blank" rel="noopener noreferrer" class="card h-100 text-decoration-none rounded-4">
          <div class="ratio ratio-4x3 bg-light rounded-4">
            ${getImageHtml(map)}
          </div>
          <div class="card-body py-2 px-3 d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2 text-truncate">
              ${getRankBadge(map.rank)}
              <span class="fw-semibold text-truncate">${map.name}</span>
            </div>
            <span class="badge bg-success text-uppercase small">${map.type}</span>
          </div>
        </a>
      </div>
    `,
    )
    .join("");

  resultsCount.textContent =
    maps.length === trailMaps.length
      ? `${maps.length} trail maps`
      : `${maps.length} of ${trailMaps.length} trail maps`;
}

// Filter trail maps
function filterTrailMaps() {
  const query = searchInput.value.toLowerCase();
  const filtered = trailMaps.filter((map) =>
    map.name.toLowerCase().includes(query),
  );
  renderTrailMaps(filtered);
}

// Setup autocomplete
const autocomplete = createAutocomplete(searchInput, autocompleteList, {
  getData: (query) =>
    trailMaps.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())),
  renderItem: (map, idx) => `
    <li class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2" role="option" id="autocomplete-option-${idx}" data-index="${idx}" data-name="${map.name}">
      <span class="badge bg-secondary">${map.rank ? `#${map.rank}` : "-"}</span>
      <span class="flex-grow-1">${map.name}</span>
      <span class="small text-muted text-uppercase">${map.type}</span>
    </li>
  `,
  onSelect: filterTrailMaps,
  emptyMessage: "No trail maps found",
});

// Input event listener
searchInput.addEventListener("input", (e) => {
  autocomplete.show(e.target.value);
  filterTrailMaps();
});

// Initial render
renderTrailMaps(trailMaps);
