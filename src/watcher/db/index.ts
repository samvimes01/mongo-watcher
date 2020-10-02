import { MongoClient } from 'mongodb';

export const db = (cfg: Record<'user' | 'password' | 'dbName' | 'rsName' | 'hostName' | 'port', string>) => {
  const url = `mongodb://${cfg.user}:${cfg.password}@${cfg.hostName}:${cfg.port}/?replicaSet=${cfg.rsName}`;

  return MongoClient.connect(url, { useUnifiedTopology: true })
    .then((client) => {
      console.log("Connected correctly to the Mongo server");
      return { db: client.db(cfg.dbName), client };
    });
}
