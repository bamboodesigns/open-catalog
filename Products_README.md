# Bamboo Designs Open Catalog Drop

Generated from EtsyListingsDownload (3).csv on 2026-03-16T00:08:31-04:00.

## What This Matches From The Repo

- Per-plan files under categories/<category>/<slug>/open-specs.json
- Matching open-specs.md files for human-readable browsing
- Machine-readable catalog exports under data/

## Important Repo Notes

- The current GitHub repo contains Windows-unsafe names such as : in folder paths. This generated drop uses ASCII-safe slugs for every plan folder.
- The Etsy export does not include exact listing URLs. Every product_url is a derived Etsy shop search URL for BambooDesignsPlans.

## Contents

- data/products.master.json - canonical rich dataset
- data/catalog-v1.0.json - repo-friendly machine-readable catalog
- data/catalog-v1.0.csv - flat export for spreadsheet workflows
- data/products.ai-index.jsonl - embedding-ready text records
- data/catalog-stats.json - category counts and coverage summary
- categories/.../open-specs.json
- categories/.../open-specs.md
- scripts/build-open-catalog.ps1

## Stats

- products: 569
- products without explicit footprint in source text: 41
- balconies: 13
- barns: 6
- carports: 21
- decks: 27
- garages: 70
- gazebos: 29
- house plans: 21
- misc: 1
- Outdoor Bars: 3
- pergolas: 55
- pool decks: 143
- sheds: 143
- tiny homes: 37

## Next Steps

1. Drag the contents of this folder into the repo root.
2. If you want exact commerce links, replace the derived Etsy search URLs with per-listing URLs later.
3. If you want the whole repo to stay Windows-friendly, consider migrating existing folder names to safe slugs too.
