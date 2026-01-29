import "./styles/shared.css";
import "./styles/trailmaps.css";
import {
  initTheme,
  toggleTheme,
  setupThemeListener,
  getRankBadge,
  highlightMatch,
  createAutocomplete,
} from "./utils.js";

// Initialize theme
initTheme();
setupThemeListener();

// Theme toggle button
document.getElementById("themeToggle").addEventListener("click", toggleTheme);

// Trail maps data - sorted by uphill policy rank
const trailMaps = [
  { name: "Winter Park", file: "WinterPark.webp", type: "webp", rank: 1 },
  { name: "Howelsen Hill", file: "HowelsenHill.webp", type: "webp", rank: 2 },
  { name: "Aspen Snowmass", file: "AspenSnowmass.webp", type: "webp", rank: 3 },
  {
    name: "Aspen Buttermilk",
    file: "AspenButtermilk.webp",
    type: "webp",
    rank: 3,
  },
  {
    name: "Aspen Highlands",
    file: "AspenHighlands.webp",
    type: "webp",
    rank: 3,
  },
  { name: "Aspen Mountain", file: "AspenMountain.webp", type: "webp", rank: 3 },
  { name: "Copper Mountain", file: "Copper.webp", type: "webp", rank: 4 },
  { name: "Ski Cooper (Front)", file: "Cooper-1.webp", type: "webp", rank: 5 },
  { name: "Ski Cooper (Back)", file: "Cooper-2.webp", type: "webp", rank: 5 },
  {
    name: "Monarch (Frontside)",
    file: "MonarchFrontside.webp",
    type: "webp",
    rank: 6,
  },
  {
    name: "Monarch (No Name Basin)",
    file: "MonarchNoNameBasin.webp",
    type: "webp",
    rank: 6,
  },
  { name: "Telluride", file: "Telluride.webp", type: "webp", rank: 7 },
  { name: "Powderhorn", file: "Powderhorn.webp", type: "webp", rank: 8 },
  { name: "Sunlight", file: "Sunlight.webp", type: "webp", rank: 9 },
  { name: "Arapahoe Basin", file: "A-Basin.webp", type: "webp", rank: 10 },
  { name: "Eldora", file: "Eldora.webp", type: "webp", rank: 11 },
  { name: "Granby Ranch", file: "GranbyRanch.webp", type: "webp", rank: 12 },
  { name: "Echo Mountain", file: "EchoMountain.webp", type: "webp", rank: 13 },
  { name: "Wolf Creek", file: "WolfCreek.webp", type: "webp", rank: 14 },
  { name: "Loveland", file: "Loveland.webp", type: "webp", rank: 15 },
  { name: "Vail", file: "Vail.avif", type: "avif", rank: 16 },
  { name: "Beaver Creek", file: "BeaverCreek.avif", type: "avif", rank: 17 },
  { name: "Breckenridge", file: "Breck.webp", type: "webp", rank: 18 },
  { name: "Keystone", file: "Keystone.webp", type: "webp", rank: 19 },
  { name: "Crested Butte", file: "CrestedButte.avif", type: "avif", rank: 20 },
  { name: "Steamboat", file: "Steamboat.webp", type: "webp", rank: 21 },
  { name: "Kendall Mountain", file: "Kendall.webp", type: "webp", rank: 22 },
  { name: "Silverton", file: "Silverton.webp", type: "webp", rank: 23 },
  { name: "Purgatory", file: "Purgatory.webp", type: "webp", rank: 24 },
  {
    name: "Mirkwood Basin",
    file: "MirkwoodBasin.webp",
    type: "webp",
    rank: null,
  },
];

// DOM elements
const grid = document.getElementById("trailMapsGrid");
const searchInput = document.getElementById("searchInput");
const autocompleteList = document.getElementById("autocomplete-list");
const resultsCount = document.getElementById("resultsCount");

// Render trail maps
function renderTrailMaps(maps) {
  grid.innerHTML = maps
    .map(
      (map) => `
      <a href="/trailmaps/${map.file}" target="_blank" rel="noopener noreferrer" class="trail-map-card">
        <div class="trail-map-thumbnail">
          <img src="/trailmaps/${map.file}" alt="${map.name} trail map" loading="lazy" decoding="async">
        </div>
        <div class="trail-map-info">
          <div class="trail-map-label">
            ${getRankBadge(map.rank)}
            <span class="trail-map-name">${map.name}</span>
          </div>
          <span class="trail-map-type type-${map.type}">${map.type.toUpperCase()}</span>
        </div>
      </a>
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
    <li class="autocomplete-item" role="option" id="autocomplete-option-${idx}" data-index="${idx}" data-name="${map.name}">
      <span class="autocomplete-item-rank">${map.rank ? "#" + map.rank : "-"}</span>
      <span class="autocomplete-item-name">${highlightMatch(map.name, searchInput.value)}</span>
      <span class="autocomplete-item-type">${map.type}</span>
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
