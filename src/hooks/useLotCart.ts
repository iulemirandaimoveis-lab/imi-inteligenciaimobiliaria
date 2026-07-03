'use client';

/**
 * useLotCart — carrinho de lotes compartilhado (Alto Bellevue + Miguel Marques).
 *
 * Estado + persistência em localStorage por empreendimento. Sem limite de itens.
 * Genérico no formato do lote (T) — cada empreendimento usa o seu próprio tipo.
 * Totais, token de compartilhamento e mensagem de WhatsApp são funções puras em
 * src/lib/lotmap/cart.ts (sobre CartLot) — mapeie com `toCartLot` quando precisar.
 *
 * Sincronização: várias instâncias do hook podem coexistir na mesma página
 * (ex.: AltoBellevueMapExplorer + vista de mapa ativa). Cada escrita dispara um
 * evento local (`imi:lot-cart-sync`) e as demais instâncias re-hidratam do
 * localStorage — sem isso, o FAB da proposta de uma vista ficava obsoleto após
 * adicionar/remover lotes em outra. O evento nativo 'storage' cobre outras abas.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const storageKey = (slug: string) => `imi:lot-cart:${slug}:v1`;
const SYNC_EVENT = 'imi:lot-cart-sync';

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
  // Última serialização vista por ESTA instância — corta o eco do evento de
  // sync (escrever → evento → re-hidratar → escrever…) comparando por valor.
  const lastSerializedRef = useRef<string | null>(null);

  // Hidrata uma vez do localStorage (client-only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(developmentSlug));
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        setItems(parsed as T[]);
        lastSerializedRef.current = raw;
      }
    } catch {
      /* storage corrompido/indisponível — começa vazio */
    }
    setReady(true);
  }, [developmentSlug]);

  // Persiste só depois de hidratar (evita sobrescrever com [] no primeiro render).
  useEffect(() => {
    if (!ready) return;
    try {
      const serialized = JSON.stringify(items);
      if (serialized === lastSerializedRef.current) return;
      window.localStorage.setItem(storageKey(developmentSlug), serialized);
      lastSerializedRef.current = serialized;
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key: storageKey(developmentSlug) } }));
    } catch {
      /* quota / modo privado — ignora */
    }
  }, [items, ready, developmentSlug]);

  // Re-hidrata quando outra instância (mesma página ou outra aba) escreve.
  useEffect(() => {
    const key = storageKey(developmentSlug);
    const rehydrate = () => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === lastSerializedRef.current) return;
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          lastSerializedRef.current = raw;
          setItems(parsed as T[]);
        }
      } catch {
        /* ignora leitura inválida */
      }
    };
    const onLocal = (e: Event) => {
      if ((e as CustomEvent).detail?.key === key) rehydrate();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) rehydrate();
    };
    window.addEventListener(SYNC_EVENT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, [developmentSlug]);

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
