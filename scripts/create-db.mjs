import { Client } from 'pg';

const host = process.env.HEY_PG_HOST ?? 'localhost';
const port = Number(process.env.HEY_PG_PORT ?? 5433);
const user = 'hey';
const password = 'hey_password';

async function main() {
  const c = new Client({ host, port, user, password, database: 'postgres' });
  await c.connect();
  const r = await c.query("SELECT 1 FROM pg_database WHERE datname = 'hey'");
  if (r.rowCount === 0) {
    await c.query('CREATE DATABASE hey');
    console.log('created database hey');
  } else {
    console.log('database hey already exists');
  }
  await c.end();
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});