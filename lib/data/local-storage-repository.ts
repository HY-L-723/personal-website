import { createSeedData } from '@/lib/data/seed-data';
import type { SiteRepository } from '@/lib/data/repository';
import type { SiteData } from '@/lib/types';

const STORAGE_KEY = 'pvl-notes:data:v1';

function isSiteData(value: unknown): value is SiteData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SiteData>;
  return (
    candidate.version === 1 &&
    !!candidate.settings &&
    Array.isArray(candidate.posts) &&
    Array.isArray(candidate.moments) &&
    Array.isArray(candidate.albums)
  );
}

export const localStorageRepository: SiteRepository = {
  load() {
    if (typeof window === 'undefined') return createSeedData();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createSeedData();
      const parsed: unknown = JSON.parse(raw);
      return isSiteData(parsed) ? parsed : createSeedData();
    } catch {
      return createSeedData();
    }
  },
  save(data) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  reset() {
    const data = createSeedData();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    return data;
  },
};

export function parseImportedData(raw: string): SiteData {
  const parsed: unknown = JSON.parse(raw);
  if (!isSiteData(parsed)) {
    throw new Error('文件不是有效的 PVL随记 数据备份。');
  }
  return parsed;
}
