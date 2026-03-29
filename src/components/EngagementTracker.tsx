// =============================================================================
// IMI LINK TRACKER — ENGAGEMENT TRACKER (Client-Side)
// =============================================================================
// Componente invisível que roda nas páginas de destino para coletar:
// - Tempo na página, profundidade de scroll
// - Cliques em CTAs, WhatsApp, submissão de formulários
// Ativado apenas quando ?_tid= está presente na URL
// =============================================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';

const PAGEVIEW_API = '/api/tracker/pageview';
const BEACON_INTERVAL_MS = 15_000;
const MIN_TIME_TO_TRACK = 2_000;

interface EngagementState {
  clickId: string;
  startTime: number;
  maxScrollDepth: number;
  ctaClicked: boolean;
  whatsappClicked: boolean;
  formSubmitted: boolean;
  lastSentAt: number;
}

function getClickId(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('_tid');
}

function sendBeacon(state: EngagementState) {
  const timeOnPage = Math.round((Date.now() - state.startTime) / 1000);
  if (timeOnPage < MIN_TIME_TO_TRACK / 1000) return;

  const payload = JSON.stringify({
    click_id: state.clickId,
    page_url: window.location.pathname,
    time_on_page_seconds: timeOnPage,
    scroll_depth_percent: Math.round(state.maxScrollDepth),
    cta_clicked: state.ctaClicked,
    whatsapp_clicked: state.whatsappClicked,
    form_submitted: state.formSubmitted,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(PAGEVIEW_API, blob);
  } else {
    fetch(PAGEVIEW_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}

export function EngagementTracker() {
  const stateRef = useRef<EngagementState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleScroll = useCallback(() => {
    if (!stateRef.current) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      const depth = (scrollTop / docHeight) * 100;
      stateRef.current.maxScrollDepth = Math.max(stateRef.current.maxScrollDepth, depth);
    }
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!stateRef.current) return;
    const target = e.target as HTMLElement;
    const el = target.closest('a, button, [data-cta]');
    if (!el) return;

    const href = el.getAttribute('href') || '';
    if (
      href.includes('wa.me') || href.includes('whatsapp') ||
      href.includes('api.whatsapp') || el.hasAttribute('data-whatsapp')
    ) {
      stateRef.current.whatsappClicked = true;
      sendBeacon(stateRef.current);
      return;
    }

    if (
      el.hasAttribute('data-cta') || el.classList.contains('cta') ||
      (el.tagName === 'BUTTON' && el.closest('form')) ||
      href.includes('contato') || href.includes('agendar') || href.includes('proposta')
    ) {
      stateRef.current.ctaClicked = true;
      sendBeacon(stateRef.current);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!stateRef.current) return;
    stateRef.current.formSubmitted = true;
    sendBeacon(stateRef.current);
  }, []);

  useEffect(() => {
    const clickId = getClickId();
    if (!clickId) return;

    stateRef.current = {
      clickId,
      startTime: Date.now(),
      maxScrollDepth: 0,
      ctaClicked: false,
      whatsappClicked: false,
      formSubmitted: false,
      lastSentAt: Date.now(),
    };

    // Remove _tid from URL bar (cosmetic, no reload)
    const url = new URL(window.location.href);
    url.searchParams.delete('_tid');
    window.history.replaceState({}, '', url.toString());

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('submit', handleSubmit, { passive: true });

    intervalRef.current = setInterval(() => {
      if (stateRef.current) sendBeacon(stateRef.current);
    }, BEACON_INTERVAL_MS);

    const handleUnload = () => {
      if (stateRef.current) sendBeacon(stateRef.current);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && stateRef.current) {
        sendBeacon(stateRef.current);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stateRef.current) sendBeacon(stateRef.current);
    };
  }, [handleScroll, handleClick, handleSubmit]);

  return null;
}

export default EngagementTracker;
