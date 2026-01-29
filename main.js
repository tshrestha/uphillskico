import "bootstrap/dist/css/bootstrap.min.css";
import "./src/styles/shared.css";
import "./src/styles/index.css";
import resorts from "./resorts.json";
import {
  initTheme,
  toggleTheme,
  setupThemeListener,
  getRankBadge,
  highlightMatch,
  debounce,
  createAutocomplete,
} from "./src/utils.js";

// Initialize theme
initTheme();
setupThemeListener();

// Theme toggle button
document.getElementById("themeToggle").addEventListener("click", toggleTheme);

// Safe URL hostname extraction
function getHostname(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getPassBadge(pass, forCard = false) {
  const height = forCard ? 20 : 24;
  // Image intrinsic: Epic 160x39, Ikon 160x71
  const epicWidth = Math.round((height * 160) / 39);
  const ikonWidth = Math.round((height * 160) / 71);

  switch (pass) {
    case "Epic":
      return `<img src="/images/epic-logo.webp" alt="Epic Pass" width="${epicWidth}" height="${height}" class="img-fluid" style="max-height: ${height}px;" decoding="async">`;
    case "Ikon":
      return `<img src="/images/ikon-logo.webp" alt="Ikon Pass" width="${ikonWidth}" height="${height}" class="img-fluid" style="max-height: ${height}px;" decoding="async">`;
    default:
      return `<span class="badge badge-indie">${forCard ? "Indie" : "Independent"}</span>`;
  }
}

function getAccessBadge(hasAccess, forCard = false) {
  if (hasAccess === true) {
    return forCard
      ? `<span class="badge-access badge-yes">Yes</span>`
      : `<span class="badge badge-access badge-yes">Yes</span>`;
  } else if (hasAccess === false) {
    return forCard
      ? `<span class="badge-access badge-no">No</span>`
      : `<span class="badge badge-access badge-no">No</span>`;
  }
  return `<span class="text-muted">-</span>`;
}

function renderCards(filteredResorts) {
  const container = document.getElementById("resortCards");

  container.innerHTML = filteredResorts
    .map(
      (resort) => `
      <article class="resort-card" role="listitem" aria-label="${resort.name} uphill policy">
        <header class="resort-card-header">
          <div class="resort-title-row">
            ${getRankBadge(resort.uphillPolicy?.rank)}
            <div>
              <h3 class="resort-name">${resort.name}</h3>
              <a href="${resort.website}" target="_blank" rel="noopener noreferrer" class="resort-website" aria-label="Visit ${resort.name} website">
                ${getHostname(resort.website)}
              </a>
            </div>
          </div>
          <div class="pass-badge">
            ${getPassBadge(resort.pass, true)}
          </div>
        </header>
        <div class="resort-card-body">
          <div class="info-row">
            <span class="info-label">During Ops</span>
            <span class="info-value">${getAccessBadge(resort.uphillPolicy?.operationalHoursAccess, true)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Schedule</span>
            <span class="info-value">${resort.uphillPolicy?.schedule || "-"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cost</span>
            <span class="info-value">${resort.uphillPolicy?.cost || "-"}</span>
          </div>
        </div>
        ${
          resort.uphillPolicy?.link || resort.uphillPolicy?.trailMap
            ? `
          <footer class="resort-card-footer">
            ${
              resort.uphillPolicy?.link
                ? `<a href="${resort.uphillPolicy.link}" target="_blank" rel="noopener noreferrer" class="btn-policy" aria-label="View ${resort.name} uphill policy">
              Policy
            </a>`
                : ""
            }
            ${
              resort.uphillPolicy?.trailMap
                ? `<a href="${resort.uphillPolicy.trailMap}" target="_blank" rel="noopener noreferrer" class="btn-map" aria-label="View ${resort.name} trail map">
              Trail Map
            </a>`
                : ""
            }
          </footer>
        `
            : ""
        }
      </article>
    `,
    )
    .join("");
}

function renderTable(filteredResorts) {
  const tbody = document.getElementById("resortTableBody");

  tbody.innerHTML = filteredResorts
    .map(
      (resort) => `
      <tr>
        <td class="text-center">
          ${getRankBadge(resort.uphillPolicy?.rank)}
        </td>
        <td class="sticky-col">
          <div class="fw-semibold">${resort.name}</div>
          <a href="${resort.website}" target="_blank" rel="noopener noreferrer" class="small text-muted text-decoration-none">
            ${getHostname(resort.website)}
          </a>
        </td>
        <td>
          ${getPassBadge(resort.pass)}
        </td>
        <td class="text-center">
          ${getAccessBadge(resort.uphillPolicy?.operationalHoursAccess)}
        </td>
        <td class="small" style="max-width: 250px;">
          ${resort.uphillPolicy?.schedule || "-"}
        </td>
        <td class="small" style="max-width: 200px;">
          ${resort.uphillPolicy?.cost || "-"}
        </td>
        <td>
          ${
            resort.uphillPolicy?.link
              ? `<a href="${resort.uphillPolicy.link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary" aria-label="View ${resort.name} uphill policy">
                  View
                </a>`
              : resort.uphillPolicy?.note
                ? `<span class="small text-muted" title="${resort.uphillPolicy.note}">See notes</span>`
                : '<span class="text-muted">-</span>'
          }
        </td>
        <td>
          ${
            resort.uphillPolicy?.trailMap
              ? `<a href="${resort.uphillPolicy.trailMap}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary" aria-label="View ${resort.name} trail map">
                  Map
                </a>`
              : '<span class="text-muted">-</span>'
          }
        </td>
      </tr>
    `,
    )
    .join("");
}

// Check if desktop view (table visible)
const isDesktop = window.matchMedia("(min-width: 992px)").matches;

function renderResorts(filteredResorts) {
  const countEl = document.getElementById("resortCount");

  // Render cards first (mobile-first)
  renderCards(filteredResorts);

  // Defer table render on mobile since it's hidden
  if (isDesktop) {
    renderTable(filteredResorts);
  } else {
    requestIdleCallback
      ? requestIdleCallback(() => renderTable(filteredResorts))
      : setTimeout(() => renderTable(filteredResorts), 0);
  }

  countEl.textContent = `${filteredResorts.length} of ${resorts.length} resorts`;
}

function filterResorts() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const passFilter = document.getElementById("passFilter").value;
  const accessFilter = document.getElementById("accessFilter").value;

  const filtered = resorts.filter((resort) => {
    const matchesSearch = resort.name.toLowerCase().includes(searchTerm);
    const matchesPass = !passFilter || resort.pass === passFilter;
    const matchesAccess =
      !accessFilter ||
      (accessFilter === "true" &&
        resort.uphillPolicy?.operationalHoursAccess === true) ||
      (accessFilter === "false" &&
        resort.uphillPolicy?.operationalHoursAccess === false);
    return matchesSearch && matchesPass && matchesAccess;
  });

  renderResorts(filtered);
}

// Debounced search for better performance
const debouncedFilter = debounce(filterResorts, 150);

// Autocomplete setup
const searchInput = document.getElementById("searchInput");
const autocompleteList = document.getElementById("autocomplete-list");

const autocomplete = createAutocomplete(searchInput, autocompleteList, {
  getData: (query) =>
    resorts.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
  renderItem: (resort, idx) => `
    <li class="autocomplete-item" role="option" id="autocomplete-option-${idx}" data-index="${idx}" data-name="${resort.name}">
      <span class="autocomplete-item-rank">#${resort.uphillPolicy?.rank || "-"}</span>
      <span class="autocomplete-item-name">${highlightMatch(resort.name, searchInput.value)}</span>
      <span class="autocomplete-item-pass">${resort.pass}</span>
    </li>
  `,
  onSelect: filterResorts,
  emptyMessage: "No resorts found",
});

searchInput.addEventListener("input", (e) => {
  autocomplete.show(e.target.value);
  debouncedFilter();
});

document.getElementById("passFilter").addEventListener("change", filterResorts);
document
  .getElementById("accessFilter")
  .addEventListener("change", filterResorts);

// Initial render
renderResorts(resorts);

// Log performance timing in development
if (import.meta.env?.DEV) {
  console.log(`Loaded ${resorts.length} resorts`);
}
