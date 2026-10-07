import { revalidateTag } from 'next/cache';

import {
  projectBoqTag,
  projectMetadataTag,
  projectSummaryTag,
  projectWbsTag,
} from '@/lib/cache/cache-tags';

const IMMEDIATE: { expire: number } = { expire: 0 };

export function invalidateProjectCaches(projectId: string): void {
  revalidateTag(projectMetadataTag(projectId), IMMEDIATE);
  revalidateTag(projectWbsTag(projectId), IMMEDIATE);
  revalidateTag(projectSummaryTag(projectId), IMMEDIATE);
  revalidateTag(projectBoqTag(projectId), IMMEDIATE);
}
