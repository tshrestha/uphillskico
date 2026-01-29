import "./styles/bootstrap-custom.scss";
import "./styles/theme.css";
import {
  initTheme,
  toggleTheme,
  setupThemeListener,
  getRankBadge,
} from "./utils.js";
import { getMapsByResort } from "./trailmaps-data.js";

// Initialize theme
initTheme();
setupThemeListener();

// Theme toggle button
document.getElementById("themeToggle").addEventListener("click", toggleTheme);

// Get resort ID from data attribute
const resortId = document.body.dataset.resort;
const resortMaps = getMapsByResort(resortId);

// DOM elements
const grid = document.getElementById("trailMapsGrid");
const resultsCount = document.getElementById("resultsCount");

// Generate image HTML with picture element for AVIF fallback support
function getImageHtml(map) {
  const imgPath = `/trailmaps/${map.file}`;
  const alt = `${map.name} trail map`;

  // For AVIF images, use picture element with WebP fallback (when available)
  if (map.type === "avif") {
    const fallbackPath = map.fallback ? `/trailmaps/${map.fallback}` : imgPath;
    return `
      <picture>
        <source srcset="${imgPath}" type="image/avif">
        <img src="${fallbackPath}" alt="${alt}" loading="lazy" decoding="async" class="card-img-top object-fit-cover rounded-top-4">
      </picture>`;
  }

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

  resultsCount.textContent = `${maps.length} trail map${maps.length !== 1 ? "s" : ""}`;
}

// Initial render
renderTrailMaps(resortMaps);
