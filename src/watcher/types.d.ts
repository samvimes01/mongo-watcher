import { Db, MongoClient, ObjectId, ChangeStream, ChangeEvent, ResumeToken } from 'mongodb';
import { RedisClient } from 'redis';
import { CollectionName } from './config/defaults';

export type RedisClientPromisified = Omit<RedisClient, 'hset' | 'hget'> & { 
  hget: (key: string, field: string) => Promise<string>,
  hset: (arg1: [string, ...string[]]) => Promise<number>,
};

export type WatcherContext = {
  db: Db;
  mongoClient: MongoClient;
  redisClient?: RedisClientPromisified;
};

export type WatchProps = {
  collectionName: CollectionName;
  pipeline?: object[];
};
export type ChangeProps = {
  collectionName: CollectionName;
  processNextDocument: (context: WatcherContext, changedCollecion: CollectionName, document: ChangeEvent | DefaultDocument) => Promise<any>;
};
export type WatchEntryConfig = {
  changeCollectionsConfig: ChangeProps[];
  watchCollectionsConfig: WatchProps[];
};

export type OperationType = 'insert' | 'update' | 'delete' | 'replace' | 'drop';

export type DefaultDocument = {
  _id: ResumeToken & { _data: string };
  collectionName: CollectionName;
  documentId: ObjectId;
  operationType: OperationType;
};

export type StoredResumeToken = {
  _id: ObjectId;
  collectionName: CollectionName;
  resumeToken: ResumeToken & { _data: string };
};

export type Watcher = {
  changeStream: ChangeStream;
  resumeToken?: ResumeToken;
};
export type Watchers = Record<CollectionName, Watcher>;

export type Manufacturer = {
  _id: ObjectId;
  name: string;
  adress: string;
};