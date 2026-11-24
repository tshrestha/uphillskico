# Spec Delta

## MODIFIED Requirements

### Requirement: Public page URLs are stable
The site SHALL serve its pages at exactly these URLs, each returning HTTP 200 from a static file: `/`, `/trailmaps.html`, `/trailmaps/aspen.html`, `/trailmaps/monarch.html`, `/trailmaps/cooper.html` and `/about.html`. It SHALL NOT add redirects for any of them.

#### Scenario: Each public page URL resolves directly
- **WHEN** any of the listed URLs is requested
- **THEN** the response is HTTP 200 with that page's HTML and no redirect

#### Scenario: No URL changes across the migration
- **WHEN** the set of HTML page paths in the new build is compared with the previous build
- **THEN** every previous path is still present and unchanged, and the only new path is `/about.html`

#### Scenario: Host-level URL variants unchanged
- **WHEN** host-generated variants such as `/trailmaps`, `/trailmaps/` or `/trailmaps/aspen/` are requested
- **THEN** each returns the same status code and redirect target as before the change
