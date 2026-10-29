import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const Port = process.env.HEY_PG_PORT ? Number(process.env.HEY_PG_PORT) : 5433;
const dataDir = fileURLToPath(new URL('../.pgdata', import.meta.url));

async function main() {
  const { default: PostgresEmbedded } = await import('embedded-postgres');
  const ep = new PostgresEmbedded({
    databaseDir: dataDir,
    user: 'hey',
    password: 'hey_password',
    port: Port,
    persistent: true,
  });

  const cmd = process.argv[2] ?? 'start';

  try {
    if (!existsSync(fileURLToPath(new URL('../.pgdata/PG_VERSION', import.meta.url)))) {
      await ep.initialise();
      console.log('Initialised new Postgres cluster');
    } else {
      console.log('Using existing Postgres cluster');
    }

    if (cmd === 'init') {
      console.log('Cluster ready');
      process.exit(0);
    }

    await ep.start();
    console.log(`Postgres listening on localhost:${Port}`);
    console.log('Ctrl+C or kill this process to stop it.');

    const stop = async () => {
      try {
        await ep.stop();
      } catch {}
      process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);

    setInterval(() => {}, 1 << 30);
  } catch (error) {
    console.error('DB startup failed:', error.message || error);
    process.exit(1);
  }
}

main();