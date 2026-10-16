// Small UI helpers shared across pages

/**
 * Enhance a radio-button fieldset into a segmented control with a sliding thumb
 * @param {HTMLFieldSetElement} fieldset - A .seg fieldset
 * @returns {{ place: (instant?: boolean) => void }}
 */
export function initSegmented(fieldset) {
  const track = fieldset.querySelector(".seg-track");
  const thumb = fieldset.querySelector(".seg-thumb");

  function place(instant = false) {
    const input = fieldset.querySelector("input:checked");
    const label = input && fieldset.querySelector(`label[for="${input.id}"]`);
    if (!label || !thumb) return;
    if (instant) fieldset.classList.add("no-anim");
    thumb.style.setProperty("--x", `${label.offsetLeft}px`);
    thumb.style.setProperty("--w", `${label.offsetWidth}px`);
    if (instant) {
      requestAnimationFrame(() => fieldset.classList.remove("no-anim"));
    }
  }

  fieldset.addEventListener("change", () => place());
  new ResizeObserver(() => place(true)).observe(track);
  document.fonts?.ready.then(() => place(true));
  place(true);
  fieldset.classList.add("is-ready");
  return { place };
}

/**
 * Open links marked with data-trailmap in the in-page map viewer.
 * The viewer code is only downloaded the first time a map is opened;
 * modified clicks (new tab, etc.) keep the normal link behaviour.
 */
export function bindTrailMapViewer() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-trailmap]");
    if (
      !link ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    import("./viewer.js")
      .then(({ openTrailMap }) => openTrailMap(link.getAttribute("href"), link))
      .catch(() => window.open(link.href, "_blank", "noopener"));
  });
}
