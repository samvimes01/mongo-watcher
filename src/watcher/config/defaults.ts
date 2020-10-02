export const DEFAULT_MATCH = {
  operationType: { $in: ['update', 'delete', 'replace'] }
};
export const DEFAULT_PROJECTION = {
  collectionName: '$ns.coll',
  documentId: '$documentKey._id',
  operationType: 1,
};

export const DEFAULT_PIPELINE: object[] = [
  { $match: DEFAULT_MATCH },
  { $project: DEFAULT_PROJECTION }
];

export const COLLECTIONS = {
  warehouses: 'warehouses',
  manufacturers: 'manufacturers',
  serviceCenters: 'serviceCenters',
  resumeTokens: 'resumeTokens'
} as const;
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];