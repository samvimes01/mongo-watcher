import { ChangeStreamWatchers } from './changeStreamWatchers';
import { entries } from './config';
import { db, initRedis } from './db';
import { WatcherContext } from './types';

const configDb = {
  user: process.env.MONGO_INITDB_ROOT_USERNAME!,
  password: process.env.MONGO_INITDB_ROOT_PASSWORD!,
  hostName: process.env.MONGO_HOSTNAME!,
  port: process.env.MONGO_PORT!,
  dbName: process.env.MONGO_INITDB_DATABASE!,
  rsName: process.env.MONGO_REPLICA_SET_NAME!
};
const configRedis = {
  host: process.env.REDIS_HOSTNAME!,
};

const context = {} as WatcherContext;
let watchers: ChangeStreamWatchers;

// Starting watchers app
initRedis(configRedis)
  .catch((e) => {
    console.log('can\'t connect to Redis');
    return null;
  })
  .then((redisClient) => db(configDb)
    .then((mongoconn) => {
      context.db = mongoconn.db;
      context.mongoClient = mongoconn.client;
      if (redisClient) {
        context.redisClient = redisClient;
      }
      context.db.on('error', processFatalError('Database'));
      context.db.once('close', processShutdown('Database closed'));
      watchers = new ChangeStreamWatchers(context, entries);
      return watchers.startChangeStreamWatchers();
      })
  )
    .catch((e) => {
      console.log('can\'t connect to Mongo');
    })


let isShutdownInProgress = false;
const processShutdown = (type: string) => async (): Promise<void> => {
  await watchers.closeWatchers();
  if (isShutdownInProgress) {
    return;
  }
  isShutdownInProgress = true;

  try {
    if (context.mongoClient) {
      await new Promise((resolve, reject) =>
        context.mongoClient.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve();
        })
      );
    }

    console.log(`Received ${type} signal: Closing everything`);

    process.exit(0);
  } catch (err) {
    console.log('Impossible to close gracefully');
    process.exit(1);
  }
};
const processFatalError = (type: string) => async (error: Error): Promise<void> => {
  await watchers.closeWatchers();

  console.log(`Fatal ${type} Error`, error);
  process.exit(1);
};

process.on('uncaughtException', processFatalError('Process uncaughtException'));
process.on('unhandledRejection', processFatalError('Process unhandledRejection'));
process.on('SIGINT', processShutdown('SIGINT'));
process.on('SIGTERM', processShutdown('SIGTERM'));
