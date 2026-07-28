/**
 * Apply supabase/apply-all-migrations.sql via Postgres.
 * Configure supabase/.env.local (DATABASE_URL or SUPABASE_DB_*), then:
 *   npm install pg
 *   node scripts/apply-migrations-pg.js
 */
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  const map = {};
  if (!fs.existsSync(filePath)) return map;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    if (/^\s*#/.test(line)) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (m) map[m[1]] = m[2].trim();
  }
  return map;
}

const env = loadEnv(path.join(__dirname, '..', 'supabase', '.env.local'));
const projectRef = env.SUPABASE_PROJECT_REF || 'rnfiykzkcwaxwpgnoexx';
const password = env.SUPABASE_DB_PASSWORD;
const host = env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
const port = env.SUPABASE_DB_PORT || '5432';
const database = env.SUPABASE_DB_NAME || 'postgres';
const user = env.SUPABASE_DB_USER || 'postgres';

if (!password || password.startsWith('PASTE')) {
  console.error('Add SUPABASE_DB_PASSWORD to supabase/.env.local (Dashboard -> Database password)');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '..', 'supabase', 'apply-all-migrations.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const connectionStrings = [];
if (env.DATABASE_URL && !env.DATABASE_URL.includes('PASTE')) {
  connectionStrings.push(env.DATABASE_URL);
}
connectionStrings.push(
  `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`
);

async function main() {
  let pg;
  try {
    pg = require('pg');
  } catch {
    console.error('Run: npm install pg');
    process.exit(1);
  }

  let lastError = null;
  for (const connectionString of connectionStrings) {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log('Connected. Applying migrations...');
      await client.query(sql);
      await client.end();
      console.log('Migrations applied.');
      return;
    } catch (e) {
      lastError = e;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  console.error('Migration failed:', lastError?.message ?? lastError);
  process.exit(1);
}

main();
