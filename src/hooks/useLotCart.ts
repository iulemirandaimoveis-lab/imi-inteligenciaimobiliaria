'use client';

/**
 * useLotCart — carrinho de lotes compartilhado (Alto Bellevue + Miguel Marques).
 *
 * Estado + persistência em localStorage por empreendimento. Sem limite de itens.
 * Lógica pura (totais/encode) vive em src/lib/lotmap/cart.ts.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type CartLot,
  type CartTotals,
  cartTotals,
  buildCartShareUrl,
  encodeCart,
} from '@/lib/lotmap/cart';

const storageKey = (slug: string) => `imi:lot-cart:${slug}:v1`;

export interface UseLotCart {
  items: CartLot[];
  ids: Set<string>;
  has: (id: string) => boolean;
  add: (lot: CartLot) => void;
  remove: (id: string) => void;
  toggle: (lot: CartLot) => void;
  clear: () => void;
  totals: CartTotals;
  /** Token compacto da seleção (p/ /carrinho?id=…). */
  shareToken: string;
  /** URL compartilhável absoluta (usa window.location.origin quando disponível). */
  shareUrl: string;
}

export function useLotCart(developmentSlug: string): UseLotCart {
  const [items, setItems] = useState<CartLot[]>([]);
  const [ready, setReady] = useState(false);

  // Hidrata uma vez do localStorage (client-only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(developmentSlug));
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) setItems(parsed as CartLot[]);
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
  const add = useCallback((lot: CartLot) => setItems((c) => (c.some((l) => l.id === lot.id) ? c : [...c, lot])), []);
  const remove = useCallback((id: string) => setItems((c) => c.filter((l) => l.id !== id)), []);
  const toggle = useCallback(
    (lot: CartLot) => setItems((c) => (c.some((l) => l.id === lot.id) ? c.filter((l) => l.id !== lot.id) : [...c, lot])),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => cartTotals(items), [items]);
  const shareToken = useMemo(
    () => encodeCart({ d: developmentSlug, ids: items.map((l) => l.id) }),
    [items, developmentSlug],
  );
  const shareUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return buildCartShareUrl(origin, { d: developmentSlug, ids: items.map((l) => l.id) });
  }, [items, developmentSlug]);

  return { items, ids, has, add, remove, toggle, clear, totals, shareToken, shareUrl };
}
