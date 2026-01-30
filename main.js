import "bootstrap/dist/css/bootstrap.min.css";
import "./src/styles/theme.css";
import resorts from "./resorts.json";
import {
  initTheme,
  toggleTheme,
  setupThemeListener,
  highlightMatch,
  debounce,
  createAutocomplete,
} from "./src/utils.js";
import { generateCard, generateTableRow, getRankBadge } from "./src/shared.js";

// Initialize theme
initTheme();
setupThemeListener();

// Theme toggle button
document.getElementById("themeToggle").addEventListener("click", toggleTheme);

// DOM elements
const cardsContainer = document.getElementById("resortCards");
const tableBody = document.getElementById("resortTableBody");
const countEl = document.getElementById("resortCount");
const searchInput = document.getElementById("searchInput");
const passFilter = document.getElementById("passFilter");
const accessFilter = document.getElementById("accessFilter");

// Track if we're showing filtered results
let isFiltered = false;

// Store original static HTML for restoration when filters are cleared
const originalCardsHtml = cardsContainer.innerHTML;
const originalTableHtml = tableBody.innerHTML;

// Render cards (only called when filtering)
function renderCards(filteredResorts) {
  cardsContainer.innerHTML = filteredResorts.map(generateCard).join("");
}

// Render table (only called when filtering)
function renderTable(filteredResorts) {
  tableBody.innerHTML = filteredResorts.map(generateTableRow).join("");
}

// Update count display
function updateCount(count) {
  countEl.textContent =
    count === resorts.length
      ? `${count} of ${resorts.length} resorts`
      : `${count} of ${resorts.length} resorts`;
}

// Filter resorts based on current filters
function getFilteredResorts() {
  const searchTerm = searchInput.value.toLowerCase();
  const passValue = passFilter.value;
  const accessValue = accessFilter.value;

  return resorts.filter((resort) => {
    const matchesSearch = resort.name.toLowerCase().includes(searchTerm);
    const matchesPass = !passValue || resort.pass === passValue;
    const matchesAccess =
      !accessValue ||
      (accessValue === "true" &&
        resort.uphillPolicy?.operationalHoursAccess === true) ||
      (accessValue === "false" &&
        resort.uphillPolicy?.operationalHoursAccess === false);
    return matchesSearch && matchesPass && matchesAccess;
  });
}

// Check if any filter is active
function hasActiveFilters() {
  return (
    searchInput.value !== "" ||
    passFilter.value !== "" ||
    accessFilter.value !== ""
  );
}

// Handle filtering
function handleFilter() {
  const filtered = getFilteredResorts();
  const needsRender = hasActiveFilters();

  if (needsRender) {
    // We have active filters, render filtered results
    renderCards(filtered);
    renderTable(filtered);
    isFiltered = true;
  } else if (isFiltered) {
    // Filters cleared, restore original static content
    cardsContainer.innerHTML = originalCardsHtml;
    tableBody.innerHTML = originalTableHtml;
    isFiltered = false;
  }

  updateCount(filtered.length);
}

// Debounced filter for search input
const debouncedFilter = debounce(handleFilter, 150);

// Autocomplete setup
const autocompleteList = document.getElementById("autocomplete-list");

const autocomplete = createAutocomplete(searchInput, autocompleteList, {
  getData: (query) =>
    resorts.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
  renderItem: (resort, idx) => `
    <li class="list-group-item list-group-item-action d-flex align-items-center gap-2 py-2" role="option" id="autocomplete-option-${idx}" data-index="${idx}" data-name="${resort.name}">
      ${getRankBadge(resort.uphillPolicy?.rank)}
      <span class="flex-grow-1">${resort.name}</span>
      <span class="small text-muted text-uppercase">${resort.pass}</span>
    </li>
  `,
  onSelect: handleFilter,
  emptyMessage: "No resorts found",
});

// Event listeners
searchInput.addEventListener("input", (e) => {
  autocomplete.show(e.target.value);
  debouncedFilter();
});

passFilter.addEventListener("change", handleFilter);
accessFilter.addEventListener("change", handleFilter);

// No initial render needed - content is pre-rendered in HTML
// Just ensure the count is correct (it's already set in the static HTML)

// Log performance timing in development
if (import.meta.env?.DEV) {
  console.log(`Hydrated ${resorts.length} resorts (static HTML)`);
}
