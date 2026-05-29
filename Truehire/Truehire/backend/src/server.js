import cluster from 'node:cluster';
import http from 'node:http';
import os from 'node:os';
import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { startWeeklyJobAlertCron } from './cronJob.js';

const getWorkerCount = () => {
  if (env.workerCount > 0) {
    return env.workerCount;
  }

  return typeof os.availableParallelism === 'function'
    ? os.availableParallelism()
    : os.cpus().length;
};

const configureServer = (server) => {
  server.keepAliveTimeout = env.keepAliveTimeout;
  server.headersTimeout = Math.max(env.headersTimeout, env.keepAliveTimeout + 1_000);
  server.requestTimeout = env.requestTimeout;

  if (env.serverMaxConnections > 0) {
    server.maxConnections = env.serverMaxConnections;
  }
};

const startHttpServer = async () => {
  await connectDatabase();

  const shouldStartCronJobs =
    env.cronJobsEnabled &&
    (!cluster.isWorker || cluster.worker?.id === 1);

  if (shouldStartCronJobs) {
    startWeeklyJobAlertCron();
  }

  const server = http.createServer(app);
  configureServer(server);

  server.on('clientError', (error, socket) => {
    if (error.code === 'ECONNRESET' || !socket.writable) {
      return;
    }

    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };

    const onListening = () => {
      server.off('error', onError);
      const workerLabel = cluster.isWorker ? ` worker ${process.pid}` : '';
      console.log(`TrueHire backend${workerLabel} listening on http://${env.host}:${env.port}`);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(env.port, env.host, env.serverBacklog);
  });

  return server;
};

const startServer = async () => {
  let server;

  try {
    server = await startHttpServer();
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.port} is already in use. Stop the existing backend process or set PORT to a free port in backend/.env.`,
      );
    }

    console.error('Failed to start server', error);
    await disconnectDatabase();
    process.exit(1);
  }

  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing server...`);

    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown('unhandledRejection');
  });
};

const startCluster = () => {
  const workerCount = getWorkerCount();
  let shuttingDown = false;

  console.log(`Starting ${workerCount} TrueHire workers`);

  for (let index = 0; index < workerCount; index += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`Worker ${worker.process.pid} exited`, { code, signal });

    if (!shuttingDown) {
      cluster.fork();
    }
  });

  const shutdown = (signal) => {
    shuttingDown = true;
    console.log(`${signal} received. Stopping workers...`);

    for (const worker of Object.values(cluster.workers)) {
      worker?.process.kill(signal);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

if (env.clusterEnabled && cluster.isPrimary) {
  startCluster();
} else {
  startServer();
}
