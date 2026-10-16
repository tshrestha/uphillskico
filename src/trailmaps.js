import { createAutocomplete, getRankBadge } from "./utils.js";
import { escapeHtml } from "./shared.js";
import { trailMaps } from "./trailmaps-data.js";
import { initMapPage, renderMapCards, bindMapGrid } from "./maps-grid.js";

initMapPage();

// DOM elements
const grid = document.getElementById("trailMapsGrid");
const searchInput = document.getElementById("searchInput");
const autocompleteList = document.getElementById("autocomplete-list");
const resultsCount = document.getElementById("resultsCount");

let visibleMaps = trailMaps;

// Render trail maps
function renderTrailMaps(maps) {
  visibleMaps = maps;
  renderMapCards(grid, maps);
  document.getElementById("mapsEmpty").hidden = maps.length > 0;

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
    <li class="ac-item" role="option" id="autocomplete-option-${idx}" data-index="${idx}" data-name="${escapeHtml(map.name)}">
      ${getRankBadge(map.rank)}
      <span class="ac-name">${escapeHtml(map.name)}</span>
      <span class="ac-meta">${map.type}</span>
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

bindMapGrid(grid, () => visibleMaps);

// Initial render
renderTrailMaps(trailMaps);
