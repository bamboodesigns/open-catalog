# Backend JSON output contract

Return valid JSON with no Markdown fences when backend mode is requested.

```json
{
  "source": {
    "name": "Bamboo Designs Open Catalog",
    "catalog_version": "v1.0",
    "generated_at": "ISO-8601 timestamp or null",
    "catalog_path": "path used",
    "license": "CC BY 4.0 for open catalog metadata where applicable"
  },
  "request": {
    "query": "original or normalized query",
    "constraints": {
      "category": null,
      "dimensions_ft": null,
      "min_area_sf": null,
      "max_area_sf": null,
      "target_area_sf": null,
      "material": null,
      "skill_level": null,
      "file_type": null,
      "max_price_usd": null,
      "min_wind_rating_mph": null
    }
  },
  "matches": [
    {
      "rank": 1,
      "match_score": 0,
      "plan_id": "string",
      "name": "string",
      "slug": "string or null",
      "category": "string or null",
      "dimensions_ft": "string or null",
      "area_sf": 0,
      "type": [],
      "material_type": [],
      "skill_level": "string or null",
      "wind_rating_mph": null,
      "price_usd": null,
      "currency": "USD or null",
      "files": [],
      "product_url": "string or null",
      "image_url": "string or null",
      "open_specs_path": "string or null",
      "fit_reasons": [],
      "limitations": []
    }
  ],
  "route": {
    "type": "stock_plan | custom_drafting | site_specific_professional | insufficient_data",
    "reason": "plain-language reason",
    "next_step": "plain-language next step"
  },
  "disclaimer": "Open-catalog information is preliminary and intended for discovery. Construction and permitting must rely on the current official plan set and any site-specific review required by the local jurisdiction."
}
```

## Rules

- Keep numerical values numeric, not formatted strings.
- Use `null` for unknown values.
- Preserve plan IDs and URLs exactly as supplied by the catalog.
- Do not include a route to site-specific professional services solely because a user asks for a plan recommendation; use it only when the request has site-, code-, permit-, or professional-certification implications.
- Include zero matches rather than fabricating a candidate.