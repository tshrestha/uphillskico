// Shared utilities for Uphill Ski Colorado

// Re-export getRankBadge from shared.js for backwards compatibility
export { getRankBadge } from "./shared.js";

// Theme management
export function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else if (prefersDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  updateThemeColorMeta(newTheme);
}

export function updateThemeColorMeta(theme) {
  const lightColor = "#f8fafc";
  const darkColor = "#0f172a";
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  themeColorMetas.forEach((meta) => {
    meta.setAttribute("content", theme === "dark" ? darkColor : lightColor);
  });
}

export function setupThemeListener() {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        updateThemeColorMeta(newTheme);
      }
    });
}

// Text highlighting for search matches
export function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return text.replace(regex, "<mark>$1</mark>");
}

// Debounce utility
export function debounce(func, wait) {
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

// Autocomplete controller factory
export function createAutocomplete(searchInput, autocompleteList, options) {
  let activeIndex = -1;
  const {
    getData,
    renderItem,
    onSelect,
    emptyMessage = "No results found",
  } = options;

  function show(query) {
    if (!query || query.length < 1) {
      hide();
      return;
    }

    const matches = getData(query).slice(0, 8);

    if (matches.length === 0) {
      autocompleteList.innerHTML = `<li class="list-group-item text-center text-muted py-3">${emptyMessage}</li>`;
      autocompleteList.classList.add("show");
      searchInput.setAttribute("aria-expanded", "true");
      return;
    }

    autocompleteList.innerHTML = matches
      .map((item, idx) => renderItem(item, idx))
      .join("");
    autocompleteList.classList.add("show");
    searchInput.setAttribute("aria-expanded", "true");
    activeIndex = -1;
  }

  function hide() {
    autocompleteList.classList.remove("show");
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  }

  function select(name) {
    searchInput.value = name;
    hide();
    onSelect(name);
  }

  function updateActive(newIndex) {
    const items = autocompleteList.querySelectorAll(".list-group-item-action");
    if (items.length === 0) return;

    items.forEach((item) => item.classList.remove("active"));

    if (newIndex >= 0 && newIndex < items.length) {
      activeIndex = newIndex;
      items[activeIndex].classList.add("active");
      items[activeIndex].scrollIntoView({ block: "nearest" });
      searchInput.setAttribute(
        "aria-activedescendant",
        `autocomplete-option-${newIndex}`,
      );
    } else {
      activeIndex = -1;
      searchInput.removeAttribute("aria-activedescendant");
    }
  }

  // Event listeners
  searchInput.addEventListener("keydown", (e) => {
    const items = autocompleteList.querySelectorAll(".list-group-item-action");

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!autocompleteList.classList.contains("show")) {
          show(searchInput.value);
        } else {
          updateActive(activeIndex < items.length - 1 ? activeIndex + 1 : 0);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        updateActive(activeIndex > 0 ? activeIndex - 1 : items.length - 1);
        break;
      case "Enter":
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          select(items[activeIndex].dataset.name);
        }
        break;
      case "Escape":
        hide();
        break;
    }
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value) {
      show(searchInput.value);
    }
  });

  autocompleteList.addEventListener("click", (e) => {
    const item = e.target.closest(".list-group-item-action");
    if (item) {
      select(item.dataset.name);
    }
  });

  // Click outside to close - check if click is on input or dropdown
  document.addEventListener("click", (e) => {
    const isInsideInput = searchInput.contains(e.target);
    const isInsideDropdown = autocompleteList.contains(e.target);
    if (!isInsideInput && !isInsideDropdown) {
      hide();
    }
  });

  return { show, hide, select };
}
