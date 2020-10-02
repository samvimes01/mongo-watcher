import { Db, MongoClient, ObjectId, Timestamp, ChangeStream, ChangeEvent, ResumeToken } from 'mongodb';
import { CollectionName } from './config/defaults';

export type WatcherContext = {
  db: Db,
  client: MongoClient
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
  _id: ResumeToken;
  collectionName: CollectionName;
  documentId: ObjectId;
  operationType: OperationType;
};

export type StoredResumeToken = {
  _id: ObjectId;
  collectionName: CollectionName;
  resumeToken: ResumeToken;
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