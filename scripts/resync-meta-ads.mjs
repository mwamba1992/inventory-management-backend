// One-off backfill: pull Meta ad insights for a date range and upsert into core.meta_ad_insights.
// Mirrors MetaAdsService.fetchAndStoreInsights (same fields, same extractConversions logic).
import { readFileSync } from 'node:fs';
import pg from 'pg';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const TOKEN = env.META_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN;
let ACCT = env.META_AD_ACCOUNT_ID;
if (!ACCT.startsWith('act_')) ACCT = 'act_' + ACCT;
const BUSINESS_ID = 1;
const SINCE = process.argv[2] || '2026-05-22';
const UNTIL = process.argv[3] || new Date().toISOString().slice(0, 10);

const CONVERSION_TYPES = [
  'offsite_conversion.fb_pixel_purchase',
  'omni_purchase',
  'onsite_conversion.messaging_conversation_started_7d',
  'onsite_conversion.messaging_first_reply',
];
function extractConversions(actions) {
  if (!Array.isArray(actions)) return 0;
  for (const t of CONVERSION_TYPES) {
    const a = actions.find(x => x.action_type === t);
    if (a) return Number(a.value || 0);
  }
  return 0;
}

const fields = ['campaign_id','campaign_name','adset_id','adset_name','ad_id','ad_name',
  'spend','impressions','clicks','reach','frequency','cpc','cpm','ctr','actions'].join(',');

async function fetchAll() {
  const rows = [];
  let url = `https://graph.facebook.com/v21.0/${ACCT}/insights?` + new URLSearchParams({
    fields, level: 'ad', time_increment: '1',
    time_range: JSON.stringify({ since: SINCE, until: UNTIL }),
    limit: '500', access_token: TOKEN,
  });
  while (url) {
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) throw new Error(JSON.stringify(json.error));
    rows.push(...(json.data || []));
    url = json.paging?.next || null;
  }
  return rows;
}

const client = new pg.Client({
  host: env.DB_HOST, port: Number(env.DB_PORT || 5432),
  user: env.DB_USERNAME, password: env.DB_PASSWORD, database: env.DB_DATABASE,
});

const rows = await fetchAll();
console.log(`Fetched ${rows.length} insight rows from Meta (${SINCE} → ${UNTIL})`);
await client.connect();
let n = 0;
for (const r of rows) {
  await client.query(
    `INSERT INTO core.meta_ad_insights
       (business_id, campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name,
        date, spend, impressions, clicks, conversions, reach, frequency, cpc, cpm, ctr, actions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (campaign_id, ad_id, date, business_id) DO UPDATE SET
       spend=EXCLUDED.spend, impressions=EXCLUDED.impressions, clicks=EXCLUDED.clicks,
       conversions=EXCLUDED.conversions, reach=EXCLUDED.reach, frequency=EXCLUDED.frequency,
       cpc=EXCLUDED.cpc, cpm=EXCLUDED.cpm, ctr=EXCLUDED.ctr, actions=EXCLUDED.actions`,
    [BUSINESS_ID, r.campaign_id, r.campaign_name, r.adset_id || null, r.adset_name || null,
     r.ad_id || null, r.ad_name || null, r.date_start,
     Number(r.spend || 0), Number(r.impressions || 0), Number(r.clicks || 0),
     extractConversions(r.actions), Number(r.reach || 0), Number(r.frequency || 0),
     Number(r.cpc || 0), Number(r.cpm || 0), Number(r.ctr || 0),
     r.actions ? JSON.stringify(r.actions) : null],
  );
  n++;
}
await client.end();
console.log(`Upserted ${n} rows into core.meta_ad_insights`);
