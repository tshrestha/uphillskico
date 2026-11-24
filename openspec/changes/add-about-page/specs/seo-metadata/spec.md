# Spec Delta

## ADDED Requirements

### Requirement: About page publishes profile structured data
The About page SHALL publish valid JSON-LD describing a `ProfilePage` whose main entity is a `Person` with the owner's name and portrait image URL. The structured data SHALL NOT include an email address, telephone number, street address or birth date.

#### Scenario: Profile structured data parses
- **WHEN** the About page's JSON-LD is parsed
- **THEN** it is valid JSON with `@type` `ProfilePage` and a `mainEntity` of `@type` `Person` that has `name` and `image`

#### Scenario: No contact details in structured data
- **WHEN** the About page's JSON-LD is inspected
- **THEN** it has no `email`, `telephone`, `address` or `birthDate` property
