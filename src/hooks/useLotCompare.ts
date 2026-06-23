'use client';

/**
 * useLotCompare — estado da comparação de lotes (máx. 3), compartilhado por
 * AB + MM. Genérico no formato do lote. A lógica/limite vive em
 * src/lib/lotmap/compare.ts. Sem persistência (comparação é transitória).
 *
 * `add` retorna false quando rejeitado e expõe `lastReject` para o aviso elegante.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { MAX_COMPARE, canAddToCompare, type CompareReject } from '@/lib/lotmap/compare';

export interface UseLotCompare<T> {
  items: T[];
  ids: Set<string>;
  has: (id: string) => boolean;
  isFull: boolean;
  max: number;
  lastReject: CompareReject | null;
  add: (lot: T) => boolean;
  remove: (id: string) => void;
  toggle: (lot: T) => void;
  clear: () => void;
  clearReject: () => void;
}

export function useLotCompare<T extends { id: string }>(): UseLotCompare<T> {
  const [items, setItems] = useState<T[]>([]);
  const [lastReject, setLastReject] = useState<CompareReject | null>(null);

  // Espelho síncrono de `items` p/ decidir add sem depender da ordem de updates.
  const itemsRef = useRef<T[]>(items);
  itemsRef.current = items;

  const ids = useMemo(() => new Set(items.map((l) => l.id)), [items]);
  const has = useCallback((id: string) => ids.has(id), [ids]);

  const add = useCallback((lot: T): boolean => {
    const res = canAddToCompare(itemsRef.current, lot);
    if (!res.ok) {
      setLastReject(res.reason ?? 'duplicate');
      return false;
    }
    setItems((c) => [...c, lot]);
    setLastReject(null);
    return true;
  }, []);

  const remove = useCallback((id: string) => setItems((c) => c.filter((l) => l.id !== id)), []);

  const toggle = useCallback(
    (lot: T) => {
      if (itemsRef.current.some((l) => l.id === lot.id)) remove(lot.id);
      else add(lot);
    },
    [add, remove],
  );

  const clear = useCallback(() => {
    setItems([]);
    setLastReject(null);
  }, []);
  const clearReject = useCallback(() => setLastReject(null), []);

  return {
    items,
    ids,
    has,
    isFull: items.length >= MAX_COMPARE,
    max: MAX_COMPARE,
    lastReject,
    add,
    remove,
    toggle,
    clear,
    clearReject,
  };
}
