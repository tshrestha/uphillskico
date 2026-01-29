// Shared utilities for Uphill Ski Colorado
// Used by both browser (main.js) and build script (generate-static.js)

/**
 * Extract hostname from URL, removing www. prefix
 * @param {string} url - The URL to extract hostname from
 * @returns {string} The hostname without www. prefix
 */
export function getHostname(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Generate rank badge HTML with gold/silver/bronze styling
 * @param {number|undefined} rank - The resort rank (1-24)
 * @returns {string} HTML string for the rank badge
 */
export function getRankBadge(rank) {
  if (!rank) return "";
  let badgeClass = "rank-base";
  if (rank <= 5) badgeClass = "rank-gold";
  else if (rank <= 10) badgeClass = "rank-silver";
  else if (rank <= 15) badgeClass = "rank-bronze";

  return `<span class="rank-badge ${badgeClass}" title="Uphill Policy Rank #${rank}">#${rank}</span>`;
}

/**
 * Generate pass badge HTML (Epic/Ikon logo or Independent badge)
 * @param {string} pass - The pass type (Epic, Ikon, or independent)
 * @param {boolean} forCard - Whether this is for card view (smaller size)
 * @returns {string} HTML string for the pass badge
 */
export function getPassBadge(pass, forCard = false) {
  const height = forCard ? 20 : 24;
  const epicWidth = Math.round((height * 160) / 39);
  const ikonWidth = Math.round((height * 160) / 71);

  switch (pass) {
    case "Epic":
      return `<img src="/images/epic-logo.webp" alt="Epic Pass" width="${epicWidth}" height="${height}" class="img-fluid" style="max-height: ${height}px;" decoding="async">`;
    case "Ikon":
      return `<img src="/images/ikon-logo.webp" alt="Ikon Pass" width="${ikonWidth}" height="${height}" class="img-fluid" style="max-height: ${height}px;" decoding="async">`;
    default:
      return `<span class="badge bg-secondary">${forCard ? "Indie" : "Independent"}</span>`;
  }
}

/**
 * Generate access badge HTML (Yes/No/Unknown)
 * @param {boolean|undefined} hasAccess - Whether uphill access is allowed during operational hours
 * @returns {string} HTML string for the access badge
 */
export function getAccessBadge(hasAccess) {
  if (hasAccess === true) {
    return `<span class="badge bg-success">Yes</span>`;
  } else if (hasAccess === false) {
    return `<span class="badge bg-warning text-dark">No</span>`;
  }
  return `<span class="text-muted">-</span>`;
}

/**
 * Generate card HTML for a resort
 * @param {object} resort - Resort object from resorts.json
 * @returns {string} HTML string for the resort card
 */
export function generateCard(resort) {
  const buttonsHtml =
    resort.uphillPolicy?.link || resort.uphillPolicy?.trailMap
      ? `
            <div class="d-flex gap-2 mt-3 pt-3 border-top">
              ${
                resort.uphillPolicy?.link
                  ? `<a href="${resort.uphillPolicy.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm flex-fill rounded-pill" aria-label="View ${resort.name} uphill policy">
                Policy
              </a>`
                  : ""
              }
              ${
                resort.uphillPolicy?.trailMap
                  ? `<a href="${resort.uphillPolicy.trailMap}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm flex-fill rounded-pill" aria-label="View ${resort.name} trail map">
                Trail Map
              </a>`
                  : ""
              }
            </div>
          `
      : "";

  return `
      <article class="card mb-3 rounded-4" aria-label="${resort.name} uphill policy" data-resort="${resort.name.toLowerCase()}" data-pass="${resort.pass}" data-access="${resort.uphillPolicy?.operationalHoursAccess}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex align-items-center gap-2">
              ${getRankBadge(resort.uphillPolicy?.rank)}
              <div>
                <h2 class="card-title h5 mb-1">${resort.name}</h2>
                <a href="${resort.website}" target="_blank" rel="noopener noreferrer" class="small text-decoration-none">
                  ${getHostname(resort.website)}
                </a>
              </div>
            </div>
            <div class="flex-shrink-0">
              ${getPassBadge(resort.pass, true)}
            </div>
          </div>
          <div class="row g-2 small">
            <div class="col-12 d-flex">
              <span class="text-muted text-uppercase fw-semibold me-2 card-label">During Ops</span>
              <span>${getAccessBadge(resort.uphillPolicy?.operationalHoursAccess)}</span>
            </div>
            <div class="col-12 d-flex">
              <span class="text-muted text-uppercase fw-semibold me-2 card-label">Schedule</span>
              <span>${resort.uphillPolicy?.schedule || "-"}</span>
            </div>
            <div class="col-12 d-flex">
              <span class="text-muted text-uppercase fw-semibold me-2 card-label">Cost</span>
              <span>${resort.uphillPolicy?.cost || "-"}</span>
            </div>
          </div>${buttonsHtml}
        </div>
      </article>`;
}

/**
 * Generate table row HTML for a resort
 * @param {object} resort - Resort object from resorts.json
 * @returns {string} HTML string for the table row
 */
export function generateTableRow(resort) {
  return `
      <tr data-resort="${resort.name.toLowerCase()}" data-pass="${resort.pass}" data-access="${resort.uphillPolicy?.operationalHoursAccess}">
        <td class="text-center align-middle">
          ${getRankBadge(resort.uphillPolicy?.rank)}
        </td>
        <td class="align-middle">
          <div class="fw-semibold">${resort.name}</div>
          <a href="${resort.website}" target="_blank" rel="noopener noreferrer" class="small text-muted text-decoration-none">
            ${getHostname(resort.website)}
          </a>
        </td>
        <td class="align-middle">
          ${getPassBadge(resort.pass)}
        </td>
        <td class="text-center align-middle">
          ${getAccessBadge(resort.uphillPolicy?.operationalHoursAccess)}
        </td>
        <td class="small align-middle" style="max-width: 250px;">
          ${resort.uphillPolicy?.schedule || "-"}
        </td>
        <td class="small align-middle" style="max-width: 200px;">
          ${resort.uphillPolicy?.cost || "-"}
        </td>
        <td class="align-middle">
          ${
            resort.uphillPolicy?.link
              ? `<a href="${resort.uphillPolicy.link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary rounded-pill" aria-label="View ${resort.name} uphill policy">
                  View
                </a>`
              : resort.uphillPolicy?.note
                ? `<span class="small text-muted" title="${resort.uphillPolicy.note}">See notes</span>`
                : '<span class="text-muted">-</span>'
          }
        </td>
        <td class="align-middle">
          ${
            resort.uphillPolicy?.trailMap
              ? `<a href="${resort.uphillPolicy.trailMap}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary rounded-pill" aria-label="View ${resort.name} trail map">
                  Map
                </a>`
              : '<span class="text-muted">-</span>'
          }
        </td>
      </tr>`;
}
