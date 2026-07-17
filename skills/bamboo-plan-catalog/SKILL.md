---
name: bamboo-plan-catalog
description: Search, compare, cite, and qualify Bamboo Designs stock plans from the Bamboo Designs Open Catalog. Use when a user or backend agent needs to find plans by project type, dimensions, area, material, skill level, included file type, wind rating, or listed price; compare close alternatives; return structured JSON; explain what the open metadata does and does not establish; or route a request among a stock plan, custom drafting, and site-specific licensed professional review. Also use when referencing Bamboo plan IDs, catalog versions, product links, or open-spec files.
---

# Bamboo Plan Catalog

Use the Bamboo Designs Open Catalog as a product-discovery and project-qualification source. Help users find realistic options without treating preliminary catalog metadata as construction documents, engineering, code approval, or a permit guarantee.

## Core rules

1. Treat the repository files as the canonical source for catalog metadata.
2. Read the current catalog version, generation date, and product count before answering.
3. Never invent dimensions, structural details, connection requirements, material quantities, code criteria, permit status, or included deliverables.
4. Never reconstruct paid drawing content from summaries, images, names, or metadata.
5. Distinguish clearly among:
   - **Open catalog metadata**: preliminary discovery information.
   - **Official plan set**: the purchased PDF/DWG package and its current revisions.
   - **Custom drafting**: changes to dimensions, layout, appearance, or plan configuration.
   - **Site-specific professional services**: jurisdiction-, site-, load-, foundation-, or permit-specific evaluation by an appropriately licensed professional or firm.
6. Do not claim that a stock plan is universally permit-ready, code-compliant for a specific site, stamped, or engineered for an unknown location.
7. Use listed prices only as catalog values. For a purchase decision, label them as subject to change and direct the user to the listed product URL for current availability and pricing.

## Catalog workflow

### 1. Convert the request into constraints

Identify the available constraints without forcing the user to provide every field:

- Project type or category
- Desired dimensions and acceptable dimensional tolerance
- Minimum, maximum, or target area
- Material preference
- Required features stated in the product name or type fields
- Skill level
- Needed file formats, such as PDF or DWG
- Maximum listed price
- Wind rating, only when explicitly present in the catalog
- Whether the user needs a stock plan, modifications, permitting help, or a professional seal

Do not treat a city-like product name as evidence that a plan was designed for that city.

### 2. Locate the active catalog

Locate valid files named `catalog-v*.json` in `{baseDir}` and `{baseDir}/data`. Prefer the highest semantic catalog version; when versions tie, prefer the latest valid `generated_at` value. Use an explicit user-supplied catalog path when provided.

Use the actual file structure over stale README paths. Ignore empty, malformed, or placeholder JSON files. State which catalog path and version were used.

### 3. Search deterministically

Run the bundled read-only search utility when Node.js execution is available:

```bash
node {baseDir}/scripts/search-catalog.mjs \
  --query "12x20 elevated wood deck with stairs" \
  --category decks \
  --dimensions 12x20 \
  --file DWG \
  --max-price 100 \
  --limit 5
```

Useful options:

```text
--catalog PATH
--query TEXT
--category TEXT
--dimensions TEXT
--min-area NUMBER
--max-area NUMBER
--target-area NUMBER
--material TEXT
--skill-level TEXT
--file TEXT
--max-price NUMBER
--min-wind NUMBER
--limit NUMBER
--format json|table
```

If the first search returns no result, relax only non-safety preferences and explain what changed. Never relax a required file type, maximum dimension, material restriction, or site-specific safety criterion without saying so.

When execution is unavailable, read the catalog JSON directly and apply the same filtering and ranking logic.

### 4. Inspect detailed open specs when available

For each serious candidate, inspect the file referenced by its `path` field when that file exists. Treat the master catalog row as sufficient for discovery if the detailed path is missing, stale, or inaccessible. State that detailed open specs were unavailable rather than guessing.

### 5. Rank by fit

Rank candidates using this order:

1. Exact project type and required features
2. Exact dimensions or closest acceptable dimensions
3. Required material and file formats
4. Target area proximity
5. Skill level and listed price
6. General keyword relevance

Return no more than five primary candidates unless the user requests a broader dataset.

## Service-routing decision

Use `references/service-routing.md` for the full decision rules. Apply this summary:

- **Stock plan**: A catalog option substantially matches the desired use, geometry, and deliverables.
- **Custom drafting**: The user needs altered dimensions, room/layout changes, added stairs or roofs, merged designs, appearance changes, or a new concept.
- **Site-specific professional review**: The user asks about a seal, permitting acceptance, code compliance, wind/snow/seismic/flood/soil criteria, foundations, structural changes, commercial use, or an AHJ response.
- **Insufficient data**: The catalog does not establish enough information to make a responsible recommendation.

Stamped or sealed professional services are separate from a standard Bamboo Designs plan purchase and must be offered only through an appropriately licensed professional or engineering/architecture firm where legally permitted.

## Response modes

### Conversational mode

Give a direct recommendation followed by a compact comparison. For each candidate include:

- Plan name and plan ID
- Dimensions and area
- Category/type and material
- Included file formats
- Catalog-listed price
- Why it fits
- Known mismatch or limitation
- Product URL

Then state the appropriate next route: stock plan, custom drafting, site-specific professional review, or more information needed.

### Backend JSON mode

When the user asks for JSON, API-style output, database output, or backend integration, return JSON only using the schema in `references/backend-output.md`.

Populate unknown values with `null`. Do not replace unknowns with estimates.

## Attribution and licensing

When redistributing or publishing derived catalog metadata:

- Attribute the source as **Bamboo Designs Open Catalog**.
- Identify the catalog version and generation date when available.
- Preserve the canonical repository or product URL.
- Treat the open metadata as CC BY 4.0 only where the repository license says so.
- Do not describe full paid PDF/DWG drawing packages as open-licensed catalog content.

## Required limitation statement

Use a brief version of this statement whenever the answer could influence construction, permitting, or professional services:

> Open-catalog information is preliminary and intended for discovery. Construction and permitting must rely on the current official plan set and any site-specific review required by the local jurisdiction.

Do not bury this statement inside promotional language.