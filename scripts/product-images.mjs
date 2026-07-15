// Bulk product images: work out which products have no photo, then fill them in.
//
//   1. node scripts/product-images.mjs manifest
//        -> writes product-images.csv listing every product with no photo.
//           Open it and paste an image URL next to each SKU you have one for.
//
//   2. node scripts/product-images.mjs upload --token=<admin jwt> [--dry-run]
//        -> downloads each URL, checks it, and uploads it to that product.
//
// Re-runnable: products that already have a photo are skipped, so you can do
// this in batches as you source images. Rows with a blank url are skipped too.
//
// Options:
//   --api=<url>     API base (default https://business.mwendavano.com/api)
//   --token=<jwt>   Admin token. Required for upload — the endpoint is not public.
//   --file=<path>   CSV path (default ./product-images.csv)
//   --dry-run       Fetch and validate everything, upload nothing.
//   --only=<SKU>    Just this one SKU. Good for testing the first upload.
//   --force         Re-upload even if the product already has a photo.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const command = process.argv[2];

const API = (args.api || 'https://business.mwendavano.com/api').replace(/\/$/, '');
const CSV = args.file || './product-images.csv';
const MAX_BYTES = 5 * 1024 * 1024; // matches the endpoint's own limit
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const die = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

async function fetchCatalogue() {
  // The public storefront feed: no token needed, and it already tells us which
  // products have a photo and which don't.
  const res = await fetch(`${API}/items/storefront`);
  if (!res.ok) {
    die(
      `GET ${API}/items/storefront returned ${res.status}.\n` +
        `  If this is 400 or 404, the backend running there predates the storefront\n` +
        `  endpoint — deploy it first, or point --api at a build that has it.`,
    );
  }
  return res.json();
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Minimal CSV reader: handles quoted fields, which product names need (commas).
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((f) => f.trim()));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

async function manifest() {
  const products = await fetchCatalogue();
  const missing = products.filter((p) => !p.imageUrl);

  // Sellable-but-invisible first: those cost money every day they stay blank.
  missing.sort((a, b) =>
    Number(b.inStock) - Number(a.inStock) || (b.sellingPrice ?? 0) - (a.sellingPrice ?? 0));

  const lines = ['sku,name,price,in_stock,url'];
  for (const p of missing) {
    lines.push([p.code, p.name, p.sellingPrice ?? '', p.inStock ? 'yes' : 'no', '']
      .map(csvEscape).join(','));
  }
  writeFileSync(CSV, lines.join('\n') + '\n');

  const sellable = missing.filter((p) => p.inStock).length;
  const value = missing.filter((p) => p.inStock)
    .reduce((s, p) => s + (p.sellingPrice ?? 0), 0);

  console.log(`\n  ${products.length} products, ${missing.length} with no photo`);
  console.log(`  ${sellable} of those are in stock — TZS ${value.toLocaleString('en-US')} of stock nobody can see`);
  console.log(`\n  Wrote ${CSV}`);
  console.log(`  Paste an image URL into the 'url' column for each one you have,`);
  console.log(`  then: node scripts/product-images.mjs upload --token=<jwt> --dry-run\n`);
}

async function download(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);

  const type = (res.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!ALLOWED.includes(type)) {
    // Catches the usual mistake: pasting a link to a product *page* rather than
    // the image itself, which comes back as text/html.
    throw new Error(`not an image (content-type: ${type || 'unknown'})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    throw new Error(`too large: ${(buf.length / 1024 / 1024).toFixed(1)}MB (limit 5MB)`);
  }
  if (buf.length < 1024) throw new Error(`suspiciously small: ${buf.length} bytes`);

  return { buf, type };
}

async function upload() {
  if (!args.token && !args['dry-run']) {
    die('--token=<admin jwt> is required to upload (the endpoint is not public).\n' +
        '  Add --dry-run to check your URLs without one.');
  }
  if (!existsSync(CSV)) die(`${CSV} not found. Run: node scripts/product-images.mjs manifest`);

  const products = await fetchCatalogue();
  const byCode = new Map(products.filter((p) => p.code).map((p) => [p.code.toUpperCase(), p]));

  let rows = parseCsv(readFileSync(CSV, 'utf8')).filter((r) => r.url);
  if (args.only) rows = rows.filter((r) => r.sku?.toUpperCase() === String(args.only).toUpperCase());

  if (!rows.length) die('No rows with a url. Fill in the url column first.');

  console.log(`\n  ${rows.length} row(s) with a URL${args['dry-run'] ? '  [DRY RUN — nothing will upload]' : ''}\n`);

  const done = [], failed = [], skipped = [];

  for (const row of rows) {
    const product = byCode.get(row.sku?.toUpperCase());
    const label = `${row.sku} ${(product?.name ?? row.name ?? '').slice(0, 26)}`.padEnd(42);

    if (!product) { console.log(`  ${label} SKIP  no product with that SKU`); skipped.push(row.sku); continue; }
    if (product.imageUrl && !args.force) { console.log(`  ${label} SKIP  already has a photo`); skipped.push(row.sku); continue; }

    try {
      const { buf, type } = await download(row.url);
      const kb = `${Math.round(buf.length / 1024)}KB`.padStart(6);

      if (args['dry-run']) { console.log(`  ${label} OK    ${kb}  ${type}  (not uploaded)`); done.push(row.sku); continue; }

      const form = new FormData();
      form.append('image', new Blob([buf], { type }), `${row.sku}.${type.split('/')[1]}`);

      const res = await fetch(`${API}/items/${product.id}/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${args.token}` },
        body: form,
      });

      if (!res.ok) throw new Error(`upload failed: HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);

      console.log(`  ${label} DONE  ${kb}  uploaded`);
      done.push(row.sku);
    } catch (err) {
      console.log(`  ${label} FAIL  ${err.message}`);
      failed.push(`${row.sku}: ${err.message}`);
    }
  }

  console.log(`\n  ${done.length} ok, ${failed.length} failed, ${skipped.length} skipped`);
  if (failed.length) {
    console.log('\n  Failures:');
    failed.forEach((f) => console.log(`    ${f}`));
  }
  // Leave the CSV alone: re-running skips anything already uploaded, so the
  // same file works for the next batch.
  console.log('');
}

const commands = { manifest, upload };
if (!commands[command]) {
  die('Usage:\n' +
      '  node scripts/product-images.mjs manifest\n' +
      '  node scripts/product-images.mjs upload --token=<jwt> [--dry-run] [--only=SKU] [--force]');
}
await commands[command]();
