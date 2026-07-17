#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq > 2) {
      out[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function fail(message, code = 1) {
  console.error(`Catalog search error: ${message}`);
  process.exit(code);
}

function normalize(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeDimensions(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[′'’]/g, '')
    .replace(/[×*]/g, 'x')
    .replace(/\s+/g, '')
    .replace(/feet|foot|ft/g, '');
}

function toNumber(value, label) {
  if (value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) fail(`--${label} must be a number.`);
  return number;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
}

function contains(value, needle) {
  const normalizedNeedle = normalize(needle);
  if (!normalizedNeedle) return true;
  return normalize(value).includes(normalizedNeedle);
}

function versionParts(value) {
  const match = String(value ?? '').match(/v?(\d+(?:\.\d+)*)/i);
  return match ? match[1].split('.').map((part) => Number(part)) : [0];
}

function compareVersions(a, b) {
  const maxLength = Math.max(a.length, b.length);
  for (let i = 0; i < maxLength; i += 1) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

function loadCatalog(candidate) {
  try {
    const raw = fs.readFileSync(candidate, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.products)) return null;
    return { path: candidate, data };
  } catch {
    return null;
  }
}

function resolveCatalog(explicitPath) {
  if (explicitPath) {
    const candidate = path.resolve(process.cwd(), explicitPath);
    const loaded = fs.existsSync(candidate) ? loadCatalog(candidate) : null;
    if (!loaded) fail(`The explicit catalog is missing, malformed, or lacks a products array: ${candidate}`);
    return loaded;
  }

  const directories = [
    baseDir,
    path.join(baseDir, 'data'),
    process.cwd(),
    path.join(process.cwd(), 'data'),
  ];
  const files = [];
  for (const directory of [...new Set(directories)]) {
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) continue;
    for (const name of fs.readdirSync(directory)) {
      if (/^catalog-v\d+(?:\.\d+)*\.json$/i.test(name)) files.push(path.join(directory, name));
    }
  }

  const loaded = [...new Set(files)]
    .map(loadCatalog)
    .filter(Boolean)
    .sort((a, b) => {
      const versionComparison = compareVersions(versionParts(b.data.version ?? path.basename(b.path)), versionParts(a.data.version ?? path.basename(a.path)));
      if (versionComparison !== 0) return versionComparison;
      const aDate = Date.parse(a.data.generated_at ?? '') || 0;
      const bDate = Date.parse(b.data.generated_at ?? '') || 0;
      return bDate - aDate;
    });

  if (loaded.length === 0) {
    fail(`No valid catalog-v*.json file found in: ${[...new Set(directories)].join(', ')}`);
  }
  return loaded[0];
}

function queryScore(product, query) {
  const phrase = normalize(query);
  if (!phrase) return 0;

  const tokens = [...new Set(phrase.split(' ').filter((token) => token.length > 1))];
  const fields = {
    name: normalize(product.name),
    slug: normalize(product.slug),
    category: normalize(product.category),
    type: normalize(asArray(product.type).join(' ')),
    material: normalize(asArray(product.material_type).join(' ')),
    dimensions: normalizeDimensions(product.dimensions_ft),
  };

  let score = 0;
  if (fields.name.includes(phrase)) score += 30;
  if (fields.slug.includes(phrase)) score += 20;

  for (const token of tokens) {
    if (fields.name.includes(token)) score += 8;
    if (fields.slug.includes(token)) score += 5;
    if (fields.category.includes(token)) score += 5;
    if (fields.type.includes(token)) score += 4;
    if (fields.material.includes(token)) score += 3;
    if (fields.dimensions.includes(token)) score += 4;
  }
  return score;
}

function fitReasons(product, filters) {
  const reasons = [];
  if (filters.category && contains(product.category, filters.category)) reasons.push('category match');
  if (filters.dimensions && normalizeDimensions(product.dimensions_ft) === normalizeDimensions(filters.dimensions)) reasons.push('exact dimensions');
  if (filters.material && asArray(product.material_type).some((item) => contains(item, filters.material))) reasons.push('material match');
  if (filters.file && asArray(product.files).some((item) => normalize(item) === normalize(filters.file))) reasons.push('required file type');
  if (filters.targetArea !== null && Number.isFinite(Number(product.area_sf))) {
    const delta = Math.abs(Number(product.area_sf) - filters.targetArea);
    reasons.push(`area difference ${delta} sf`);
  }
  return reasons;
}

function limitations(product) {
  const items = [];
  if (product.wind_rating_mph === null || product.wind_rating_mph === undefined) items.push('wind rating not stated in catalog');
  if (!product.path) items.push('detailed open-spec path not stated');
  if (!product.product_url) items.push('product URL not stated');
  return items;
}

function tableCell(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined) return '';
  return String(value).replace(/\|/g, '\\|');
}

const args = parseArgs(process.argv.slice(2));
const loadedCatalog = resolveCatalog(args.catalog);
const catalogPath = loadedCatalog.path;
const catalog = loadedCatalog.data;

const filters = {
  query: args.query ?? '',
  category: args.category ?? '',
  dimensions: args.dimensions ?? '',
  minArea: toNumber(args['min-area'], 'min-area'),
  maxArea: toNumber(args['max-area'], 'max-area'),
  targetArea: toNumber(args['target-area'], 'target-area'),
  material: args.material ?? '',
  skillLevel: args['skill-level'] ?? '',
  file: args.file ?? '',
  maxPrice: toNumber(args['max-price'], 'max-price'),
  minWind: toNumber(args['min-wind'], 'min-wind'),
};

const limit = Math.max(1, Math.min(100, Number(args.limit ?? 5)));
if (!Number.isInteger(limit)) fail('--limit must be an integer.');

const results = catalog.products
  .filter((product) => {
    const area = Number(product.area_sf);
    const price = Number(product.price_usd);
    const wind = Number(product.wind_rating_mph);

    if (filters.category && !contains(product.category, filters.category)) return false;
    if (filters.dimensions && normalizeDimensions(product.dimensions_ft) !== normalizeDimensions(filters.dimensions)) return false;
    if (filters.minArea !== null && (!Number.isFinite(area) || area < filters.minArea)) return false;
    if (filters.maxArea !== null && (!Number.isFinite(area) || area > filters.maxArea)) return false;
    if (filters.material && !asArray(product.material_type).some((item) => contains(item, filters.material))) return false;
    if (filters.skillLevel && normalize(product.skill_level) !== normalize(filters.skillLevel)) return false;
    if (filters.file && !asArray(product.files).some((item) => normalize(item) === normalize(filters.file))) return false;
    if (filters.maxPrice !== null && (!Number.isFinite(price) || price > filters.maxPrice)) return false;
    if (filters.minWind !== null && (!Number.isFinite(wind) || wind < filters.minWind)) return false;
    return true;
  })
  .map((product) => {
    const score = queryScore(product, filters.query)
      + (filters.dimensions && normalizeDimensions(product.dimensions_ft) === normalizeDimensions(filters.dimensions) ? 30 : 0)
      + (filters.category && contains(product.category, filters.category) ? 12 : 0)
      + (filters.material && asArray(product.material_type).some((item) => contains(item, filters.material)) ? 8 : 0)
      + (filters.file && asArray(product.files).some((item) => normalize(item) === normalize(filters.file)) ? 8 : 0);

    const area = Number(product.area_sf);
    const areaDelta = filters.targetArea !== null && Number.isFinite(area)
      ? Math.abs(area - filters.targetArea)
      : null;

    return {
      ...product,
      _match_score: score,
      _area_delta_sf: areaDelta,
      _fit_reasons: fitReasons(product, filters),
      _limitations: limitations(product),
    };
  })
  .sort((a, b) => {
    if (b._match_score !== a._match_score) return b._match_score - a._match_score;
    if (a._area_delta_sf !== null || b._area_delta_sf !== null) {
      const aDelta = a._area_delta_sf ?? Number.POSITIVE_INFINITY;
      const bDelta = b._area_delta_sf ?? Number.POSITIVE_INFINITY;
      if (aDelta !== bDelta) return aDelta - bDelta;
    }
    const aPrice = Number.isFinite(Number(a.price_usd)) ? Number(a.price_usd) : Number.POSITIVE_INFINITY;
    const bPrice = Number.isFinite(Number(b.price_usd)) ? Number(b.price_usd) : Number.POSITIVE_INFINITY;
    return aPrice - bPrice;
  })
  .slice(0, limit)
  .map((product, index) => ({
    rank: index + 1,
    match_score: product._match_score,
    area_delta_sf: product._area_delta_sf,
    plan_id: product.plan_id ?? null,
    name: product.name ?? null,
    slug: product.slug ?? null,
    category: product.category ?? null,
    dimensions_ft: product.dimensions_ft ?? null,
    area_sf: product.area_sf ?? null,
    type: asArray(product.type),
    material_type: asArray(product.material_type),
    skill_level: product.skill_level ?? null,
    wind_rating_mph: product.wind_rating_mph ?? null,
    price_usd: product.price_usd ?? null,
    currency: product.currency ?? null,
    files: asArray(product.files),
    product_url: product.product_url ?? null,
    image_url: product.image_url ?? null,
    open_specs_path: product.path ?? null,
    fit_reasons: product._fit_reasons,
    limitations: product._limitations,
  }));

const output = {
  source: {
    name: catalog.catalog ?? 'Bamboo Designs Open Catalog',
    catalog_version: catalog.version ?? null,
    generated_at: catalog.generated_at ?? null,
    declared_product_count: catalog.product_count ?? null,
    actual_product_count: catalog.products.length,
    catalog_path: catalogPath,
  },
  filters: {
    query: filters.query || null,
    category: filters.category || null,
    dimensions_ft: filters.dimensions || null,
    min_area_sf: filters.minArea,
    max_area_sf: filters.maxArea,
    target_area_sf: filters.targetArea,
    material: filters.material || null,
    skill_level: filters.skillLevel || null,
    file_type: filters.file || null,
    max_price_usd: filters.maxPrice,
    min_wind_rating_mph: filters.minWind,
  },
  returned_count: results.length,
  matches: results,
};

if ((args.format ?? 'json').toLowerCase() === 'table') {
  console.log('| Rank | Plan ID | Name | Dimensions | Area sf | Price | Files |');
  console.log('|---:|---|---|---|---:|---:|---|');
  for (const item of results) {
    console.log(`| ${item.rank} | ${tableCell(item.plan_id)} | ${tableCell(item.name)} | ${tableCell(item.dimensions_ft)} | ${tableCell(item.area_sf)} | ${tableCell(item.price_usd)} | ${tableCell(item.files)} |`);
  }
} else {
  console.log(JSON.stringify(output, null, 2));
}