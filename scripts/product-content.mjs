// Bulk product names and descriptions, from a reviewed spreadsheet.
//
//   1. Open scripts/product-content.csv and review it. For each product:
//        name         -> the name to publish. Leave as-is to accept, edit to change.
//        description  -> the description to publish. Blank means "leave the
//                        current description alone".
//        category     -> the category code to file it under (as listed in the
//                        admin, e.g. SMART_WATCHES). Blank means "leave it".
//        note         -> things to check before applying. Not sent anywhere.
//
//   2. node scripts/product-content.mjs
//        -> dry run: prints what would change, changes nothing.
//
//   3. node scripts/product-content.mjs --apply --token=<admin jwt>
//        -> writes the changes. Start with --only=<SKU> to try one product.
//
// Re-runnable: a product whose name and description already match is skipped.
// Only name, desc and category are ever sent; price, stock and brand are untouched.
//
// Options:
//   --api=<url>     API base (default https://business.mwendavano.com/api)
//   --token=<jwt>   Admin token. Required with --apply.
//   --file=<path>   CSV path (default ./scripts/product-content.csv)
//   --only=<SKU>    Just this one SKU.
//   --apply         Actually write. Without it nothing is changed.

import { readFileSync, existsSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }),
);

const API = (args.api || 'https://business.mwendavano.com/api').replace(/\/$/, '');
const CSV = args.file || './scripts/product-content.csv';

const die = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

// Quoted fields may contain commas, quotes ("") and line breaks.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field);
  if (row.some((cell) => cell !== '')) rows.push(row);

  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((key, i) => [key.trim(), (cells[i] ?? '').trim()])));
}

if (!existsSync(CSV)) die(`No file at ${CSV}.`);
if (args.apply && !args.token) die('--apply needs --token=<admin jwt>.');

let rows = parseCsv(readFileSync(CSV, 'utf8'));
if (args.only) rows = rows.filter((r) => r.sku === args.only);
if (rows.length === 0) die('No matching rows.');

const res = await fetch(`${API}/items/storefront`);
if (!res.ok) die(`Could not read the catalogue: HTTP ${res.status}`);
const catalogue = new Map((await res.json()).map((p) => [p.id, p]));

const categoriesRes = await fetch(`${API}/common/type/ITEM_CATEGORY`);
if (!categoriesRes.ok) die(`Could not read the categories: HTTP ${categoriesRes.status}`);
const categoryIds = new Map((await categoriesRes.json()).map((c) => [c.code, c.id]));

const unknown = [...new Set(rows.map((r) => r.category).filter((code) => code && !categoryIds.has(code)))];
if (unknown.length) die(`Unknown category code(s) in the file: ${unknown.join(', ')}`);

let changed = 0;
let skipped = 0;
let failed = 0;

for (const row of rows) {
  const product = catalogue.get(Number(row.id));
  if (!product) {
    console.log(`  ?  ${row.sku}  not in the catalogue any more — skipped`);
    skipped++;
    continue;
  }
  // Guard against a spreadsheet whose ids no longer line up with the SKUs.
  if (product.code !== row.sku) {
    console.log(`  !  id ${row.id} is ${product.code} in the catalogue, ${row.sku} in the file — skipped`);
    failed++;
    continue;
  }

  const update = {};
  if (row.name && row.name !== product.name) update.name = row.name;
  if (row.description && row.description !== (product.desc ?? '')) update.desc = row.description;

  if (row.category && row.category !== product.category?.code) update.categoryId = categoryIds.get(row.category);

  if (Object.keys(update).length === 0) {
    skipped++;
    continue;
  }

  console.log(`\n  ${row.sku}`);
  if (update.name) console.log(`     name: ${product.name}\n        -> ${update.name}`);
  if (update.desc) console.log(`     desc: ${product.desc || '(none)'}\n        -> ${update.desc}`);

  if (update.categoryId) console.log(`     category: ${product.category?.code ?? '(none)'} -> ${row.category}`);

  if (!args.apply) {
    changed++;
    continue;
  }

  const put = await fetch(`${API}/items/${product.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${args.token}` },
    body: JSON.stringify(update),
  });
  if (put.ok) {
    changed++;
  } else {
    failed++;
    console.log(`     FAILED: HTTP ${put.status} ${(await put.text()).slice(0, 200)}`);
  }
}

console.log(
  `\n  ${args.apply ? 'Updated' : 'Would update'} ${changed}, unchanged ${skipped}, failed ${failed}.` +
    (args.apply ? '' : '\n  Dry run — nothing was changed. Add --apply --token=<admin jwt> to write.') +
    '\n',
);
