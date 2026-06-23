'use client';

/**
 * useLotCart — carrinho de lotes compartilhado (Alto Bellevue + Miguel Marques).
 *
 * Estado + persistência em localStorage por empreendimento. Sem limite de itens.
 * Genérico no formato do lote (T) — cada empreendimento usa o seu próprio tipo.
 * Totais, token de compartilhamento e mensagem de WhatsApp são funções puras em
 * src/lib/lotmap/cart.ts (sobre CartLot) — mapeie com `toCartLot` quando precisar.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

const storageKey = (slug: string) => `imi:lot-cart:${slug}:v1`;

export interface UseLotCart<T> {
  items: T[];
  ids: Set<string>;
  has: (id: string) => boolean;
  add: (lot: T) => void;
  remove: (id: string) => void;
  toggle: (lot: T) => void;
  clear: () => void;
}

export function useLotCart<T extends { id: string }>(developmentSlug: string): UseLotCart<T> {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  // Hidrata uma vez do localStorage (client-only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(developmentSlug));
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) setItems(parsed as T[]);
    } catch {
      /* storage corrompido/indisponível — começa vazio */
    }
    setReady(true);
  }, [developmentSlug]);

  // Persiste só depois de hidratar (evita sobrescrever com [] no primeiro render).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey(developmentSlug), JSON.stringify(items));
    } catch {
      /* quota / modo privado — ignora */
    }
  }, [items, ready, developmentSlug]);

  const ids = useMemo(() => new Set(items.map((l) => l.id)), [items]);
  const has = useCallback((id: string) => ids.has(id), [ids]);
  const add = useCallback((lot: T) => setItems((c) => (c.some((l) => l.id === lot.id) ? c : [...c, lot])), []);
  const remove = useCallback((id: string) => setItems((c) => c.filter((l) => l.id !== id)), []);
  const toggle = useCallback(
    (lot: T) => setItems((c) => (c.some((l) => l.id === lot.id) ? c.filter((l) => l.id !== lot.id) : [...c, lot])),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  return { items, ids, has, add, remove, toggle, clear };
}
