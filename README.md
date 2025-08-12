# Bamboo Designs — Open Catalog

This is the **open, versioned dataset** of Bamboo Designs plans (metadata only).  
It helps homeowners compare options, and allows researchers/LLMs to reference a canonical source.

- Website: [https://bamboodesigns.com](https://bamboodesigns.shop/)
- Full Catalog page: [https://bamboodesigns.com/open-catalog](https://bamboodesigns.shop/products)
- License: CC BY 4.0 (see LICENSE.txt)
- Contact: bamboodesignsusa@gmail.com

## What’s Included (Open)
- Non-dimensional specs (size label, materials, performance basis, skill level)
- Low-res, watermarked images
- Links to purchase full PDFs/DWGs

## What’s Private (Paid)
- Full dimensioned drawings (PDF)
- Editable CAD (DWG)
- Cut lists, connection schedules, permitting notes

## Dataset
- `data/catalog-v1.0.json` — machine-readable master list
- `data/catalog-v1.0.csv` — tabular version
- Per-plan folders under `categories/<category>/<slug>/`

## Versioning
We release quarterly versions (v1.0, v1.1...). See `CHANGELOG.md`.

## Contributing
Have a build photo or improvement idea? See `contributing/README.md`.
