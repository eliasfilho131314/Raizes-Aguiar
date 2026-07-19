import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { farmsApi } from '../api/endpoints';
import type { Farm } from '../api/types';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'raizes-aguiar:selected-farm-id';

interface FarmContextValue {
  farms: Farm[];
  isLoading: boolean;
  selectedFarm: Farm | null;
  selectFarm: (id: string) => void;
}

const FarmContext = createContext<FarmContextValue | undefined>(undefined);

// Fonte única de "qual fazenda estou vendo agora" -- toda página de dado
// fazenda-escopado (animais, financeiro, etc.) lê daqui em vez de guardar
// o próprio estado, senão trocar de fazenda pela TopBar não refletiria em
// nenhuma outra tela aberta.
export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const { data: farms, isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: farmsApi.list,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!farms || farms.length === 0) return;
    if (!selectedId || !farms.some((f) => f.id === selectedId)) {
      setSelectedId(farms[0].id);
    }
  }, [farms, selectedId]);

  function selectFarm(id: string) {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
    queryClient.invalidateQueries({ queryKey: ['farm-data'] });
  }

  const selectedFarm = useMemo(() => (farms ?? []).find((f) => f.id === selectedId) ?? null, [farms, selectedId]);

  const value: FarmContextValue = {
    farms: farms ?? [],
    isLoading,
    selectedFarm,
    selectFarm,
  };

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm deve ser usado dentro de FarmProvider');
  return ctx;
}
