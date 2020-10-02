import { MongoClient } from 'mongodb';
import redis from 'redis';
import { promisify } from 'util';
import { RedisClientPromisified } from '../types';

export const db = (cfg: Record<'user' | 'password' | 'dbName' | 'rsName' | 'hostName' | 'port', string>) => {
  const url = `mongodb://${cfg.user}:${cfg.password}@${cfg.hostName}:${cfg.port}/?replicaSet=${cfg.rsName}`;

  return MongoClient.connect(url, { useUnifiedTopology: true })
    .then((client) => {
      console.log('Connected correctly to the Mongo server');
      return { db: client.db(cfg.dbName), client };
    });
}

export const initRedis = (cfg: { host: string }): Promise<RedisClientPromisified> => {
  return new Promise((resolve, reject) => {
    const client = redis.createClient({
      host: cfg.host
    });
    console.log('try to connect to redis');

    client.on('error', (error) => {
      console.log('Connected wrong to the Redis server');
      console.error(error);
      reject(error);
    });

    client.on('connect', () => {
      console.log('Connected correctly to the Redis server');
      resolve({
        ...client,
        hset: promisify(client.hset).bind(client),
        hget: promisify(client.hget).bind(client),
      })
    });
  })
}
