// =============================================================================
// IMI LINK TRACKER — REALTIME NOTIFICATION HOOK
// =============================================================================
// Hook React para o painel do corretor.
// Escuta novos cliques via Supabase Realtime e dispara Push Notifications.
// =============================================================================

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import type { ClickNotificationPayload } from '@/types/link-tracker';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showBrowserNotification(payload: ClickNotificationPayload) {
  if (Notification.permission !== 'granted') return;

  const locationParts = [payload.city, payload.country].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(', ') : 'Local desconhecido';

  const title = payload.is_unique
    ? 'Novo lead acessou seu link'
    : 'Acesso ao seu link';

  const body = [
    payload.link_title || payload.short_code,
    `${location}`,
    `${payload.device_type} / ${payload.os}`,
    `${new Date(payload.clicked_at).toLocaleTimeString('pt-BR')}`,
  ].join('\n');

  const notification = new Notification(title, {
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: `click-${payload.click_id}`,
    silent: false,
  });

  setTimeout(() => notification.close(), 8000);

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

interface UseClickNotificationsOptions {
  corretorId: string;
  enabled?: boolean;
  onNewClick?: (click: ClickNotificationPayload) => void;
  maxRecentClicks?: number;
}

interface UseClickNotificationsReturn {
  recentClicks: ClickNotificationPayload[];
  isConnected: boolean;
  unreadCount: number;
  markAllRead: () => void;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useClickNotifications({
  corretorId,
  enabled = true,
  onNewClick,
  maxRecentClicks = 50,
}: UseClickNotificationsOptions): UseClickNotificationsReturn {
  const [recentClicks, setRecentClicks] = useState<ClickNotificationPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const corretorLinksRef = useRef<Set<string>>(new Set());

  // Load corretor's link IDs
  useEffect(() => {
    if (!corretorId || !enabled) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function loadCorretorLinks() {
      const { data } = await supabase
        .from('tracked_links')
        .select('id, short_code, title, destination_url, url')
        .or(`corretor_id.eq.${corretorId},broker_id.eq.${corretorId},created_by.eq.${corretorId}`)
        .eq('is_active', true);

      if (data) {
        corretorLinksRef.current = new Set(data.map(l => l.id));
      }
    }

    loadCorretorLinks();
  }, [corretorId, enabled]);

  // Check notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    return granted;
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!corretorId || !enabled) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const channel = supabase
      .channel(`clicks-corretor-${corretorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'link_clicks',
        },
        async (payload) => {
          const newClick = payload.new as Record<string, unknown>;

          if (!corretorLinksRef.current.has(newClick.link_id as string)) return;
          if (newClick.is_bot) return;

          const { data: linkData } = await supabase
            .from('tracked_links')
            .select('short_code, title, destination_url, url, corretor_id, broker_id, created_by')
            .eq('id', newClick.link_id as string)
            .single();

          if (!linkData) return;

          const notification: ClickNotificationPayload = {
            click_id: newClick.id as string,
            link_id: newClick.link_id as string,
            short_code: linkData.short_code,
            link_title: linkData.title,
            destination_url: linkData.destination_url || linkData.url,
            city: newClick.city as string | null,
            country: newClick.country as string | null,
            device_type: newClick.device_type as ClickNotificationPayload['device_type'],
            os: newClick.os as string,
            browser: newClick.browser as string,
            clicked_at: newClick.clicked_at as string,
            is_unique: newClick.is_unique as boolean,
            corretor_id: linkData.corretor_id || linkData.broker_id || linkData.created_by,
          };

          setRecentClicks(prev => [notification, ...prev].slice(0, maxRecentClicks));
          setUnreadCount(prev => prev + 1);
          showBrowserNotification(notification);
          onNewClick?.(notification);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [corretorId, enabled, maxRecentClicks, onNewClick]);

  return {
    recentClicks,
    isConnected,
    unreadCount,
    markAllRead,
    permissionGranted,
    requestPermission,
  };
}
