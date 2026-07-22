import app from './app.js';
import { ensureStorageDirectories, runMigrations } from './lib/database.js';
import { markWorkerHeartbeat } from './state/worker-state.js';
import { appConfig } from './config.js';

const PORT = appConfig.port;

async function start() {
  await ensureStorageDirectories()
  await runMigrations()
  markWorkerHeartbeat()

  const server = app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

start().catch((error) => {
  console.error('Failed to start server', error)
  process.exit(1)
})

export default app;
