'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createSeedData } from '@/lib/data/seed-data';
import {
  localStorageRepository,
  parseImportedData,
} from '@/lib/data/local-storage-repository';
import type { SiteData } from '@/lib/types';

interface DataContextValue {
  data: SiteData;
  ready: boolean;
  updateData: (updater: (current: SiteData) => SiteData) => void;
  replaceData: (next: SiteData) => void;
  resetData: () => void;
  exportData: () => void;
  importData: (raw: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(() => createSeedData());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(localStorageRepository.load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorageRepository.save(data);
  }, [data, ready]);

  const updateData = useCallback(
    (updater: (current: SiteData) => SiteData) => setData(updater),
    [],
  );
  const replaceData = useCallback((next: SiteData) => setData(next), []);
  const resetData = useCallback(() => {
    setData(localStorageRepository.reset());
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download =
      'pvl-notes-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback((raw: string) => {
    setData(parseImportedData(raw));
  }, []);

  const value = useMemo(
    () => ({
      data,
      ready,
      updateData,
      replaceData,
      resetData,
      exportData,
      importData,
    }),
    [data, ready, updateData, replaceData, resetData, exportData, importData],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useSiteData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useSiteData must be used inside DataProvider');
  }
  return context;
}
