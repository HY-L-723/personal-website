import type { SiteData } from '@/lib/types';

export interface SiteRepository {
  load(): SiteData;
  save(data: SiteData): void;
  reset(): SiteData;
}
