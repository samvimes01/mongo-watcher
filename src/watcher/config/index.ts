import { warehousesConfig } from './warehouses/warehouses';
import type { WatchEntryConfig, WatchProps } from '../types';
import { DEFAULT_PIPELINE } from './defaults';

export function buildConfig({ watchCollectionsConfig, changeCollectionsConfig }: WatchEntryConfig): WatchEntryConfig {
  return {
    changeCollectionsConfig,
    watchCollectionsConfig: watchCollectionsConfig.map(({ collectionName, pipeline }: WatchProps) => ({
      collectionName,
      pipeline: pipeline ?? DEFAULT_PIPELINE,
    }))
  };
}

export const entries: WatchEntryConfig[] = [
  buildConfig(warehousesConfig),
  // add configs other possible entities
];
