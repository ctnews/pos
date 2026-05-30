import 'dotenv/config';
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3002', 10);

createApp()
  .then((app) => {
    const server = app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${PORT} is already in use. Stop the old server first:`);
        console.error(`  kill $(lsof -ti :${PORT})\n`);
      } else {
        console.error('Server error:', err.message);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
