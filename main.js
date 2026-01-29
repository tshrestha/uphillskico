import "bootstrap/dist/css/bootstrap.min.css";
import resorts from "./resorts.json";

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else if (prefersDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update theme-color meta tag for browsers
  updateThemeColorMeta(newTheme);
}

function updateThemeColorMeta(theme) {
  const lightColor = "#f8fafc";
  const darkColor = "#0f172a";
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  themeColorMetas.forEach((meta) => {
    meta.setAttribute("content", theme === "dark" ? darkColor : lightColor);
  });
}

// Initialize theme on load
initTheme();

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      const newTheme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      updateThemeColorMeta(newTheme);
    }
  });

// Theme toggle button
document.getElementById("themeToggle").addEventListener("click", toggleTheme);

// Debounce utility for search input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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
  // Calculate width to maintain aspect ratio
  const epicWidth = Math.round((height * 160) / 39);
  const ikonWidth = Math.round((height * 160) / 71);

  switch (pass) {
    case "Epic":
      return `<img src="/images/epic-logo.jpg" alt="Epic Pass" width="${epicWidth}" height="${height}" class="img-fluid" style="max-height: ${height}px;" decoding="async">`;
    case "Ikon":
      return `<img src="/images/ikon-logo.png" alt="Ikon Pass" width="${ikonWidth}" height="${height}" class="img-fluid" style="max-height: ${height}px;" decoding="async">`;
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

function getRankBadge(rank) {
  if (!rank) return "";
  const tier =
    rank <= 5 ? "gold" : rank <= 10 ? "silver" : rank <= 15 ? "bronze" : "base";
  return `<span class="rank-badge rank-${tier}" title="Uphill Policy Rank #${rank}">#${rank}</span>`;
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

// Autocomplete functionality
const searchInput = document.getElementById("searchInput");
const autocompleteList = document.getElementById("autocomplete-list");
let activeIndex = -1;

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return text.replace(regex, "<mark>$1</mark>");
}

function showAutocomplete(query) {
  if (!query || query.length < 1) {
    hideAutocomplete();
    return;
  }

  const matches = resorts
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  if (matches.length === 0) {
    autocompleteList.innerHTML = `<li class="autocomplete-empty">No resorts found</li>`;
    autocompleteList.classList.add("show");
    searchInput.setAttribute("aria-expanded", "true");
    return;
  }

  autocompleteList.innerHTML = matches
    .map(
      (resort, idx) => `
      <li class="autocomplete-item" role="option" data-index="${idx}" data-name="${resort.name}">
        <span class="autocomplete-item-rank">#${resort.uphillPolicy?.rank || "-"}</span>
        <span class="autocomplete-item-name">${highlightMatch(resort.name, query)}</span>
        <span class="autocomplete-item-pass">${resort.pass}</span>
      </li>
    `,
    )
    .join("");

  autocompleteList.classList.add("show");
  searchInput.setAttribute("aria-expanded", "true");
  activeIndex = -1;
}

function hideAutocomplete() {
  autocompleteList.classList.remove("show");
  searchInput.setAttribute("aria-expanded", "false");
  activeIndex = -1;
}

function selectItem(name) {
  searchInput.value = name;
  hideAutocomplete();
  filterResorts();
}

function updateActiveItem(newIndex) {
  const items = autocompleteList.querySelectorAll(".autocomplete-item");
  if (items.length === 0) return;

  items.forEach((item) => item.classList.remove("active"));

  if (newIndex >= 0 && newIndex < items.length) {
    activeIndex = newIndex;
    items[activeIndex].classList.add("active");
    items[activeIndex].scrollIntoView({ block: "nearest" });
  } else {
    activeIndex = -1;
  }
}

searchInput.addEventListener("input", (e) => {
  showAutocomplete(e.target.value);
  debouncedFilter();
});

searchInput.addEventListener("keydown", (e) => {
  const items = autocompleteList.querySelectorAll(".autocomplete-item");

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (!autocompleteList.classList.contains("show")) {
        showAutocomplete(searchInput.value);
      } else {
        updateActiveItem(activeIndex < items.length - 1 ? activeIndex + 1 : 0);
      }
      break;
    case "ArrowUp":
      e.preventDefault();
      updateActiveItem(activeIndex > 0 ? activeIndex - 1 : items.length - 1);
      break;
    case "Enter":
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        selectItem(items[activeIndex].dataset.name);
      }
      break;
    case "Escape":
      hideAutocomplete();
      break;
  }
});

searchInput.addEventListener("focus", () => {
  if (searchInput.value) {
    showAutocomplete(searchInput.value);
  }
});

autocompleteList.addEventListener("click", (e) => {
  const item = e.target.closest(".autocomplete-item");
  if (item) {
    selectItem(item.dataset.name);
  }
});

// Close autocomplete when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete-container")) {
    hideAutocomplete();
  }
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
