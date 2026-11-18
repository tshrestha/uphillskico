// Trail maps index: search over the prerendered map cards
import { createAutocomplete, getRankBadge } from "./utils.js";
import { escapeHtml } from "./shared.js";
import { trailMaps } from "./trailmaps-data.js";
import { initMapPage, bindMapGrid } from "./maps-grid.js";

initMapPage();

// DOM elements
const grid = document.getElementById("trailMapsGrid");
const cards = [...grid.querySelectorAll(".map-card")];
const searchInput = document.getElementById("searchInput");
const autocompleteList = document.getElementById("autocomplete-list");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("mapsEmpty");

// Show only the cards whose name matches the search
function filterTrailMaps() {
  const query = searchInput.value.toLowerCase();
  let shown = 0;
  for (const card of cards) {
    const name = card.querySelector(".map-name").textContent.toLowerCase();
    card.hidden = !name.includes(query);
    // Restart the entrance stagger from the first visible card
    if (!card.hidden) card.style.setProperty("--n", shown++);
  }
  emptyState.hidden = shown > 0;
  resultsCount.textContent =
    shown === cards.length
      ? `${shown} trail maps`
      : `${shown} of ${cards.length} trail maps`;
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

bindMapGrid(grid);
