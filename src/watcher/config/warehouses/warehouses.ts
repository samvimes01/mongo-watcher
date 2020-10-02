import { ChangeEvent, ObjectId, UpdateWriteOpResult } from 'mongodb';
import { DefaultDocument, Manufacturer, WatchEntryConfig, WatcherContext } from '../../types';
import { CollectionName, COLLECTIONS } from '../defaults';

export const warehousesConfig: WatchEntryConfig = {
  watchCollectionsConfig: [
    { collectionName: COLLECTIONS.manufacturers }, // DEFAULT_PIPELINE will be used if pipeline field is not set
  ],
  changeCollectionsConfig: [
    {
      collectionName: COLLECTIONS.warehouses,
      processNextDocument: onWarehouseChange,
    },
    {
      collectionName: COLLECTIONS.serviceCenters,
      processNextDocument: onWarehouseChange,
    },
    // future targeted entries collections
  ],
};

export async function onWarehouseChange(
  context: WatcherContext,
  collectionToChange: CollectionName,
  nextDoc: ChangeEvent | DefaultDocument
): Promise<unknown> {
  const {
    documentId,
    operationType,
    collectionName,
  } = nextDoc as DefaultDocument;

  if (!documentId) {
    return Promise.resolve();
  }

  if (operationType === 'delete') {
    return removeManufacturer(
      context,
      documentId,
      collectionToChange
    );
  }


  let manufacturer: Manufacturer | null = null;

  if (collectionName === COLLECTIONS.manufacturers) {
    manufacturer = await getChangedManufacturer(context, documentId);
  }
  if (!manufacturer) {
    return Promise.resolve();
  }
  return updateDocuments({
    context,
    documentId,
    manufacturer,
    collectionToChange,
  });
}

export function getChangedManufacturer(
  context: WatcherContext,
  manufId: ObjectId
): Promise<Manufacturer | null> {
  return context.db.collection(COLLECTIONS.manufacturers)
    .findOne<Manufacturer>({ _id: manufId })
    .catch((err: Error) => {
      console.error(`error on get manufacturer ${manufId} from db`);
      return null;
    });
}

export function updateDocuments(args: {
  context: WatcherContext;
  documentId: ObjectId;
  manufacturer: Manufacturer;
  collectionToChange: CollectionName;
}): Promise<UpdateWriteOpResult> {
  const { context, documentId, manufacturer, collectionToChange } = args;

  return context.db.collection(collectionToChange).updateMany(
    { 'manufacturers': { $elemMatch: { _id: documentId } } },
    { $set: { 'manufacturers.$.name': manufacturer.name } }
  )
    .then((res: UpdateWriteOpResult) => {
      console.log(`update manufacturer ${documentId} in ${collectionToChange} ${res.modifiedCount} document(s) on update`);
      return res;
    })
    .catch((err: unknown) => {
      console.error(`error on remove manufacturer ${documentId} from document(s) in ${collectionToChange}`);
      throw err;
    });
}

export function removeManufacturer(
  context: WatcherContext,
  manufId: ObjectId,
  collectionToChange: CollectionName
): Promise<UpdateWriteOpResult> {
  return context.db.collection(collectionToChange).updateMany(
    { 'manufacturers._id': manufId },
    { $pull: { 'manufacturers': { _id: manufId } } }
  )
    .then((res: UpdateWriteOpResult) => {
      console.log(`remove manufacturer ${manufId} from ${res.modifiedCount} document(s) in ${collectionToChange} on delete`);
      return res;
    })
    .catch((err: unknown) => {
      console.error(`error on remove manufacturer ${manufId} from document(s) in ${collectionToChange}`);
      throw err;
    });
}
