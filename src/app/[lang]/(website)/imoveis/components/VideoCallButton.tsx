'use client';

/**
 * VideoCallButton — "Vídeo chamada com o corretor": réplica de um Meet sem
 * e-mail/cadastro. Cria uma sala de vídeo sob demanda (POST /api/video-call →
 * Jitsi/Daily) e abre a sala num iframe aqui mesmo no site.
 *
 * NOTIFICAÇÃO DO CORRETOR (garantida, sem depender de gateway): ao criar a
 * sala, o cliente recebe um passo bem visível para **avisar o corretor pelo
 * WhatsApp**, já com o link da sala embutido. O corretor recebe a mensagem na
 * hora, toca no link e entra na chamada. Se o gateway OpenWA estiver
 * configurado no servidor, o corretor também é avisado automaticamente — mas o
 * aviso pelo WhatsApp do próprio cliente funciona sempre, sem nenhuma config.
 */

import { useState } from 'react';
import { X, Video, Loader2, MessageCircle, ExternalLink } from 'lucide-react';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';
const WHATS_GREEN = '#25D366';

interface Props {
  brokerName: string;
  brokerPhone: string;
  clientName?: string;
  /** Contexto curto para a mensagem do WhatsApp ao corretor, ex.: "Alto Bellevue — Quadra L, Lote 22". */
  context?: string;
  compact?: boolean;
}

export default function VideoCallButton({ brokerName, brokerPhone, clientName, context, compact }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCall() {
    setState('loading');
    setError(null);
    try {
      const res = await fetch('/api/video-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerName, brokerPhone, clientName, context }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.roomUrl) {
        setError(body?.error || 'Não foi possível iniciar a vídeo chamada.');
        setState('error');
        return;
      }
      setRoomUrl(body.roomUrl);
      setState('ready');
    } catch {
      setError('Não foi possível iniciar a vídeo chamada.');
      setState('error');
    }
  }

  const brokerDigits = brokerPhone.replace(/\D/g, '');

  // Aviso simples (sem sala) — usado no estado de erro.
  const whatsappFallback = `https://wa.me/${brokerDigits}?text=${encodeURIComponent(
    `Olá ${brokerName}! Gostaria de uma vídeo chamada${context ? ` sobre ${context}` : ''}.`
  )}`;

  // Aviso COM o link da sala — o corretor toca e entra direto na chamada.
  const notifyUrl = roomUrl
    ? `https://wa.me/${brokerDigits}?text=${encodeURIComponent(
        `Olá ${brokerName}! Quero fazer uma vídeo chamada agora${context ? ` sobre ${context}` : ''}. ` +
          `Entre na sala pelo link (não precisa instalar nada): ${roomUrl}`
      )}`
    : whatsappFallback;

  return (
    <>
      <button
        type="button"
        onClick={startCall}
        disabled={state === 'loading'}
        className={`flex items-center justify-center gap-1.5 w-full ${compact ? 'h-9 rounded-lg text-[10px]' : 'h-12 rounded-xl text-[11px]'} font-bold uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.98]`}
        style={{
          background: 'rgba(200,164,74,0.10)',
          color: '#8B7A3A',
          border: '1.5px solid rgba(200,164,74,0.35)',
          fontFamily: "var(--fu, 'Outfit', sans-serif)",
          cursor: state === 'loading' ? 'wait' : 'pointer',
        }}
      >
        {state === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
        {state === 'loading' ? 'Preparando…' : compact ? 'Vídeo chamada' : 'Vídeo chamada com o corretor'}
      </button>

      {state === 'error' && (
        <div className="mt-2 p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <p style={{ fontSize: 11.5, color: '#92620A', margin: '0 0 8px', lineHeight: 1.5 }}>{error}</p>
          <a
            href={whatsappFallback}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5"
            style={{ fontSize: 11.5, fontWeight: 700, color: WHATS_GREEN, textDecoration: 'none' }}
          >
            <MessageCircle size={13} /> Chamar no WhatsApp
          </a>
        </div>
      )}

      {state === 'ready' && roomUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
        >
          <div
            className="w-full flex flex-col overflow-hidden rounded-2xl"
            style={{ maxWidth: 960, height: '85vh', background: NAVY, border: `1px solid rgba(200,164,74,0.3)` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <Video size={16} color={GOLD} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  Vídeo chamada com {brokerName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={roomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir em nova aba"
                  className="flex items-center justify-center"
                  style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => setState('idle')}
                  aria-label="Encerrar chamada"
                  className="flex items-center justify-center"
                  style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Passo 1 — avisar o corretor (garante que ele receba a chamada) */}
            <div
              className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 flex-shrink-0"
              style={{ background: 'rgba(37,211,102,0.10)', borderBottom: '1px solid rgba(37,211,102,0.25)' }}
            >
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                <strong style={{ color: '#fff' }}>Avise {brokerName} para ele entrar.</strong> Ele recebe o link no WhatsApp e entra na hora.
              </span>
              <a
                href={notifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 flex-shrink-0 sm:ml-auto active:scale-[0.98]"
                style={{
                  background: WHATS_GREEN,
                  color: '#04310F',
                  fontWeight: 800,
                  fontSize: 12.5,
                  padding: '9px 16px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <MessageCircle size={15} /> Avisar {brokerName} no WhatsApp
              </a>
            </div>

            {/* Passo 2 — sua sala */}
            <iframe
              src={roomUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              allowFullScreen
              style={{ flex: 1, border: 'none' }}
              title="Vídeo chamada"
            />
          </div>
        </div>
      )}
    </>
  );
}
