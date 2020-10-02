import {
  ChangeStreamOptions,
  FindAndModifyWriteOpResultObject,
  ChangeStream,
  ResumeToken,
  ChangeEvent
} from 'mongodb';
import { CollectionName, COLLECTIONS } from './config/defaults';
import type {
  WatcherContext,
  DefaultDocument,
  WatchProps,
  ChangeProps,
  StoredResumeToken,
  Watchers,
  WatchEntryConfig,
} from './types';

// for change event occurred in any watched collections
// run processNextDocument for every collection from changeCollectionsConfig
export class ChangeStreamWatchers {
  private watchers = {} as Watchers;

  constructor(
    private context: WatcherContext,
    private entries: WatchEntryConfig[]
  ) {}

  getWatchers(): Watchers {
    return this.watchers;
  }

  async closeWatchers(): Promise<void> {
    for (const [collectionName, watcher] of Object.entries(this.watchers)) {
      if (!watcher || !watcher.changeStream) {
        return;
      }
      const { changeStream, resumeToken } = watcher;

      await changeStream.close();
      if (resumeToken) {
        await this.setCollectionResumeToken(
          collectionName as CollectionName,
          resumeToken
        );
      }
    }
  }

  async startChangeStreamWatchers(): Promise<void> {
    for (const entry of this.entries) {
      const { watchCollectionsConfig, changeCollectionsConfig } = entry;

      for (const watchConfig of watchCollectionsConfig) {
        await this.startWatchCollection({
          watchConfig,
          changeConfigs: changeCollectionsConfig,
          isResumable: true,
        });
      }
    }
  }

  async startWatchCollection(args: {
    watchConfig: WatchProps;
    changeConfigs: ChangeProps[];
    isResumable: boolean;
  }): Promise<void> {
    const { watchConfig, changeConfigs, isResumable } = args;
    const { collectionName, pipeline } = watchConfig;
    const options = await this.getChangeStreamOptions(
      collectionName,
      isResumable
    );

    let changeStream: ChangeStream;

    try {
      changeStream = await this.context.db
        .collection(collectionName)
        .watch(pipeline, options);
    } catch (error) {
      // if it fails to start with resumeToken - start without it
      changeStream = await this.context.db
        .collection(collectionName)
        .watch(pipeline, { fullDocument: 'updateLookup' });
    }

    changeStream.on('error', (err: unknown) => {
      delete this.watchers[collectionName];
      this.startWatchCollection({
        watchConfig,
        changeConfigs,
        isResumable: false,
      });
    });
    changeStream.on('change', (nextDoc: ChangeEvent | DefaultDocument) => {
      this.onCollectionChange(changeConfigs, collectionName, nextDoc);
    });
    this.watchers[collectionName] = { changeStream };
  }

  async getChangeStreamOptions(
    collectionName: CollectionName,
    isResumable: boolean
  ): Promise<ChangeStreamOptions> {
    const options: ChangeStreamOptions = {
      // we need this to get fullDocument on update operation, we need fullDocument to get org_id
      fullDocument: 'updateLookup',
    };

    if (isResumable) {
      const resumeToken = await this.getCollectionResumeToken(collectionName);

      if (resumeToken) {
        options.startAfter = resumeToken;
      }
    }

    return options;
  }

  onCollectionChange(
    changeConfigs: ChangeProps[],
    collectionName: CollectionName,
    nextDoc: ChangeEvent | DefaultDocument
  ): void {
    changeConfigs.forEach((config) =>
      config.processNextDocument(this.context, config.collectionName, nextDoc).then(() => {
        this.watchers[collectionName].resumeToken = nextDoc._id;
      })
    );
  }

  getCollectionResumeToken(
    collection: CollectionName
  ): Promise<ResumeToken | null> {
    return this.context.db
      .collection(COLLECTIONS.resumeTokens)
      .findOne({ collection }, { projection: { resumeToken: 1 } })
      .then((doc: { resumeToken: ResumeToken } | undefined) => {
        return doc?.resumeToken || null;
      })
      .catch((err) => {
        return null;
      });
  }

  setCollectionResumeToken(
    collection: CollectionName,
    resumeToken: ResumeToken
  ): Promise<void> {
    return this.context.db
      .collection(COLLECTIONS.resumeTokens)
      .findOneAndUpdate(
        { collection },
        { $set: { resumeToken } },
        { upsert: true }
      )
      .then(
        ({ value }: FindAndModifyWriteOpResultObject<StoredResumeToken>) => {
          if (value) {
            console.log(`Set ${collection} resumeToken ${value.resumeToken}`);
          }
        }
      )
      .catch((err) => {
        console.error(`Error on setting ${collection} resumeToken ${resumeToken}`);
      });
  }
}
