'use client';

/**
 * VisitBookingModal — calendário completo do corretor para o CLIENTE agendar
 * uma visita direto do site (ou durante a vídeo chamada). Fluxo em 3 passos:
 *   1. Quando: modo (presencial/vídeo) + dia + horário, lidos da agenda real do
 *      corretor via GET /api/visits/availability (horários já ocupados somem).
 *   2. Dados: nome, e-mail e telefone + documento com foto (para garantir o
 *      compromisso) — upload reaproveita /api/lots/proposal/documents.
 *   3. Confirmação: POST /api/visits/book agenda, cai na agenda do corretor
 *      (ICS + Google Calendar) e avisa os dois por WhatsApp. Fallback wa.me
 *      sempre disponível.
 *
 * Visual alinhado ao ProposalFormModal (glass navy + dourado), mobile-first.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Calendar, Clock, Loader2, CheckCircle2, ShieldCheck, MessageCircle, Video, MapPin,
  UploadCloud, Paperclip, Trash2, ChevronRight, Camera,
} from 'lucide-react';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

interface Slot { start: string; label: string }
interface Day { date: string; weekdayLabel: string; dayLabel: string; slots: Slot[] }

interface BrokerInfo {
  id?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface Props {
  broker: BrokerInfo;
  developmentId?: string | null;
  developmentName?: string | null;
  developmentSlug?: string | null;
  whatsappPhone?: string | null;
  /** Modo inicial — 'video' quando aberto de dentro da vídeo chamada. */
  defaultMode?: 'presencial' | 'video';
  source?: 'property_page' | 'video_call' | 'lot_map' | 'other';
  onClose: () => void;
}

export default function VisitBookingModal({
  broker, developmentId, developmentName, developmentSlug, whatsappPhone,
  defaultMode = 'presencial', source = 'property_page', onClose,
}: Props) {
  const [step, setStep] = useState<'when' | 'form' | 'done'>('when');
  const [mode, setMode] = useState<'presencial' | 'video'>(defaultMode);

  const [days, setDays] = useState<Day[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [fone, setFone] = useState('');
  const [obs, setObs] = useState('');

  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ whenLabel?: string; videoRoomUrl?: string | null } | null>(null);

  const brokerPhoneDigits = (broker.phone || whatsappPhone || '').replace(/\D/g, '');

  // Carrega a disponibilidade real do corretor.
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingSlots(true);
      try {
        const qs = new URLSearchParams({ days: '21' });
        if (brokerPhoneDigits) qs.set('brokerPhone', brokerPhoneDigits);
        if (broker.id && broker.id !== 'default') qs.set('brokerId', broker.id);
        const res = await fetch(`/api/visits/availability?${qs.toString()}`);
        const body = await res.json().catch(() => ({ days: [] }));
        if (!alive) return;
        const list: Day[] = Array.isArray(body?.days) ? body.days : [];
        setDays(list);
        setSelectedDate(list[0]?.date ?? null);
      } catch {
        if (alive) setDays([]);
      } finally {
        if (alive) setLoadingSlots(false);
      }
    })();
    return () => { alive = false; };
  }, [brokerPhoneDigits, broker.id]);

  const activeDay = useMemo(() => days.find((d) => d.date === selectedDate) ?? null, [days, selectedDate]);
  const selectedSlotLabel = useMemo(() => {
    for (const d of days) {
      const s = d.slots.find((x) => x.start === selectedSlot);
      if (s) return `${d.weekdayLabel}, ${d.dayLabel} · ${s.label}`;
    }
    return null;
  }, [days, selectedSlot]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(fileList).slice(0, 6).forEach((f) => fd.append('files', f));
      const res = await fetch('/api/lots/proposal/documents', { method: 'POST', body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.success) throw new Error(body?.error || 'Não foi possível enviar o documento.');
      const incoming = (body.documents as { name: string; url: string }[]).filter((x) => x.url);
      setDocs((prev) => [...prev, ...incoming].slice(0, 6));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Falha no upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const formValid = nome.trim().length >= 2 && fone.replace(/\D/g, '').length >= 8 && !!selectedSlot;

  const waFallbackUrl = useMemo(() => {
    if (!brokerPhoneDigits) return null;
    const quando = selectedSlotLabel ? ` no dia ${selectedSlotLabel}` : '';
    const txt = `Olá ${broker.name}! Gostaria de agendar uma ${mode === 'video' ? 'vídeo chamada' : 'visita'}${developmentName ? ` para o ${developmentName}` : ''}${quando}.`;
    return `https://wa.me/${brokerPhoneDigits}?text=${encodeURIComponent(txt)}`;
  }, [brokerPhoneDigits, broker.name, developmentName, mode, selectedSlotLabel]);

  async function handleSubmit() {
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/visits/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developmentId: developmentId ?? null,
          developmentName: developmentName ?? null,
          developmentSlug: developmentSlug ?? null,
          brokerId: broker.id ?? null,
          brokerName: broker.name,
          brokerPhone: broker.phone ?? (whatsappPhone ? `+${brokerPhoneDigits}` : null),
          brokerEmail: broker.email ?? null,
          clientName: nome.trim(),
          clientEmail: email.trim() || null,
          clientPhone: fone.trim(),
          when: selectedSlot,
          mode,
          source,
          documents: docs,
          notes: obs.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 409 = horário tomado; recarrega para o cliente reescolher.
        throw new Error(body?.error || 'Não foi possível agendar. Tente outro horário.');
      }
      setResult({ whenLabel: body?.whenLabel, videoRoomUrl: body?.videoRoomUrl });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao agendar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-6"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[22px] overflow-hidden flex flex-col"
        style={{ background: 'rgba(9,20,38,0.99)', border: '1px solid rgba(200,164,74,0.25)', maxHeight: '92svh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: 3, background: GOLD, flexShrink: 0 }} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(200,164,74,0.85)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 4px' }}>
              {developmentName || `Agenda de ${broker.name.split(' ')[0]}`}
            </p>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {step === 'done' ? 'Visita agendada' : 'Agendar visita'}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fechar"
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {step === 'done' ? (
          <SuccessView
            whenLabel={result?.whenLabel ?? selectedSlotLabel ?? undefined}
            mode={mode}
            videoRoomUrl={result?.videoRoomUrl ?? null}
            docCount={docs.length}
            waUrl={waFallbackUrl}
            onClose={onClose}
          />
        ) : (
          <>
            <div className="overflow-y-auto flex-1 px-5 pb-4" style={{ scrollbarWidth: 'thin' }}>
              {/* Seletor de modo */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {([['presencial', 'Presencial', MapPin], ['video', 'Vídeo chamada', Video]] as const).map(([val, lbl, Icon]) => {
                  const active = mode === val;
                  return (
                    <button key={val} type="button" onClick={() => setMode(val)}
                      className="flex items-center justify-center gap-1.5"
                      style={{
                        height: 44, borderRadius: 12, cursor: 'pointer',
                        background: active ? 'rgba(200,164,74,0.16)' : 'rgba(255,255,255,0.05)',
                        border: active ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.10)',
                        color: active ? GOLD : 'rgba(255,255,255,0.6)',
                        fontSize: 12.5, fontWeight: 700, fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
                      }}>
                      <Icon size={14} /> {lbl}
                    </button>
                  );
                })}
              </div>

              {step === 'when' && (
                <>
                  {/* Dias */}
                  <SectionLabel icon={Calendar} text="Escolha o dia" />
                  {loadingSlots ? (
                    <div className="flex items-center justify-center gap-2 py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <Loader2 size={16} className="animate-spin" /> <span style={{ fontSize: 12.5 }}>Carregando a agenda…</span>
                    </div>
                  ) : days.length === 0 ? (
                    <EmptyAgenda waUrl={waFallbackUrl} />
                  ) : (
                    <>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                        {days.map((day) => {
                          const active = day.date === selectedDate;
                          return (
                            <button key={day.date} type="button"
                              onClick={() => { setSelectedDate(day.date); setSelectedSlot(null); }}
                              className="flex flex-col items-center justify-center flex-shrink-0"
                              style={{
                                width: 58, height: 62, borderRadius: 14, cursor: 'pointer',
                                background: active ? GOLD : 'rgba(255,255,255,0.05)',
                                border: active ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.10)',
                                transition: 'all 0.15s',
                              }}>
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? 'rgba(11,25,40,0.7)' : 'rgba(255,255,255,0.45)' }}>
                                {day.weekdayLabel}
                              </span>
                              <span style={{ fontSize: 15, fontWeight: 800, color: active ? NAVY : '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>
                                {day.dayLabel.split(' ')[0]}
                              </span>
                              <span style={{ fontSize: 9, fontWeight: 600, color: active ? 'rgba(11,25,40,0.6)' : 'rgba(255,255,255,0.4)' }}>
                                {day.dayLabel.split(' ')[1]}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Horários */}
                      <div className="mt-4">
                        <SectionLabel icon={Clock} text="Horários livres" />
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {(activeDay?.slots ?? []).map((slot) => {
                            const active = slot.start === selectedSlot;
                            return (
                              <button key={slot.start} type="button" onClick={() => setSelectedSlot(slot.start)}
                                style={{
                                  height: 40, borderRadius: 11, cursor: 'pointer',
                                  background: active ? 'rgba(200,164,74,0.18)' : 'rgba(255,255,255,0.05)',
                                  border: active ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.10)',
                                  color: active ? GOLD : 'rgba(255,255,255,0.82)',
                                  fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.12s',
                                }}>
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                        {activeDay && activeDay.slots.length === 0 && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
                            Sem horários neste dia. Escolha outro.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {step === 'form' && (
                <>
                  {/* Resumo do horário escolhido */}
                  <div className="flex items-center gap-2.5 mb-4" style={{ background: 'rgba(200,164,74,0.10)', border: '1px solid rgba(200,164,74,0.28)', borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(200,164,74,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {mode === 'video' ? <Video size={16} color={GOLD} /> : <Calendar size={16} color={GOLD} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>{selectedSlotLabel}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>
                        {mode === 'video' ? 'Vídeo chamada' : 'Visita presencial'} com {broker.name.split(' ')[0]}
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep('when')}
                      style={{ background: 'none', border: 'none', color: GOLD, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                      Alterar
                    </button>
                  </div>

                  <Field label="Nome completo" required value={nome} onChange={setNome} placeholder="Como no documento" autoFocus />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="WhatsApp / Telefone" required value={fone} onChange={setFone} placeholder="(00) 00000-0000" type="tel" />
                    <Field label="E-mail" value={email} onChange={setEmail} placeholder="voce@email.com" type="email" />
                  </div>

                  {/* Documento com foto */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: '12px 14px', marginTop: 4, marginBottom: 4 }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Camera size={13} color={GOLD} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        Documento com foto
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', lineHeight: 1.45 }}>
                      Envie RG ou CNH (foto ou PDF) para garantir o compromisso da visita.
                    </p>
                    <input ref={fileInputRef} type="file" multiple
                      accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || docs.length >= 6}
                      className="flex items-center justify-center gap-2 w-full"
                      style={{
                        height: 44, borderRadius: 11, background: 'rgba(200,164,74,0.10)',
                        border: '1px dashed rgba(200,164,74,0.45)', color: GOLD, fontSize: 12.5, fontWeight: 700,
                        cursor: uploading || docs.length >= 6 ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif",
                      }}>
                      {uploading ? <><Loader2 size={15} className="animate-spin" /> Enviando…</>
                        : <><UploadCloud size={15} /> {docs.length > 0 ? 'Anexar mais' : 'Anexar documento (foto ou PDF)'}</>}
                    </button>
                    {docs.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        {docs.map((doc, i) => (
                          <div key={doc.url} className="flex items-center gap-2"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '7px 10px' }}>
                            <Paperclip size={12} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
                            <span className="flex-1 truncate" style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.82)' }}>{doc.name}</span>
                            <CheckCircle2 size={13} color="#34D399" style={{ flexShrink: 0 }} />
                            <button type="button" onClick={() => setDocs((p) => p.filter((_, idx) => idx !== i))} aria-label="Remover"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, flexShrink: 0 }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {uploadError && <p style={{ fontSize: 10.5, color: 'rgba(251,191,36,0.9)', margin: '6px 0 0' }}>{uploadError}</p>}
                  </div>

                  <Field label="Observações (opcional)" value={obs} onChange={setObs} placeholder="Algo que o corretor deva saber…" textarea />

                  <div className="flex items-center gap-2 mt-2" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>
                    <ShieldCheck size={13} color="rgba(255,255,255,0.4)" />
                    <span>Seus dados são usados apenas para agendar e confirmar esta visita.</span>
                  </div>

                  {error && (
                    <p style={{ fontSize: 12, color: 'rgba(251,191,36,0.95)', margin: '10px 0 0', lineHeight: 1.5 }}>
                      {error}{waFallbackUrl ? ' Você também pode confirmar pelo WhatsApp abaixo.' : ''}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pt-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
              {step === 'when' ? (
                <button onClick={() => selectedSlot && setStep('form')} disabled={!selectedSlot}
                  className="flex items-center justify-center gap-2 w-full"
                  style={{
                    height: 50, borderRadius: 14, border: 'none',
                    background: selectedSlot ? GOLD : 'rgba(255,255,255,0.10)',
                    color: selectedSlot ? NAVY : 'rgba(255,255,255,0.4)',
                    fontSize: 14, fontWeight: 800, cursor: selectedSlot ? 'pointer' : 'not-allowed',
                    fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
                  }}>
                  Continuar <ChevronRight size={17} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!formValid || submitting}
                  className="flex items-center justify-center gap-2 w-full"
                  style={{
                    height: 50, borderRadius: 14, border: 'none',
                    background: formValid ? GOLD : 'rgba(255,255,255,0.10)',
                    color: formValid ? NAVY : 'rgba(255,255,255,0.4)',
                    fontSize: 14, fontWeight: 800, cursor: formValid && !submitting ? 'pointer' : 'not-allowed',
                    fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
                  }}>
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Agendando…</> : <>Confirmar visita</>}
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function SectionLabel({ icon: Icon, text }: { icon: typeof Calendar; text: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon size={13} color={GOLD} />
      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{text}</span>
    </div>
  );
}

function EmptyAgenda({ waUrl }: { waUrl: string | null }) {
  return (
    <div className="text-center py-6">
      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Não há horários publicados no momento. Fale com o corretor para combinar a visita.
      </p>
      {waUrl && (
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2"
          style={{ height: 46, padding: '0 20px', borderRadius: 13, background: '#25D366', color: '#062b16', fontSize: 13, fontWeight: 800, textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}>
          <MessageCircle size={16} /> Combinar pelo WhatsApp
        </a>
      )}
    </div>
  );
}

function SuccessView({
  whenLabel, mode, videoRoomUrl, docCount, waUrl, onClose,
}: {
  whenLabel?: string; mode: 'presencial' | 'video'; videoRoomUrl: string | null;
  docCount: number; waUrl: string | null; onClose: () => void;
}) {
  return (
    <div className="px-6 pb-6 pt-2 text-center overflow-y-auto">
      <div className="flex justify-center mb-4">
        <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(34,197,94,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={34} color="#34D399" />
        </div>
      </div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, margin: '0 0 6px' }}>
        Sua {mode === 'video' ? 'vídeo chamada' : 'visita'} está agendada
        {whenLabel ? <> para <strong style={{ color: '#fff' }}>{whenLabel}</strong></> : ''}.
        {docCount > 0 ? ' Documento recebido.' : ''}
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 18px' }}>
        Enviamos a confirmação e o convite de calendário no seu WhatsApp. O corretor foi avisado.
      </p>
      {mode === 'video' && videoRoomUrl && (
        <a href={videoRoomUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mb-2"
          style={{ height: 50, borderRadius: 14, border: 'none', background: GOLD, color: NAVY, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", textDecoration: 'none' }}>
          <Video size={17} /> Entrar na sala da vídeo chamada
        </a>
      )}
      {waUrl && (
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mb-2"
          style={{ height: 48, borderRadius: 14, border: 'none', background: '#25D366', color: '#062b16', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", textDecoration: 'none' }}>
          <MessageCircle size={16} /> Falar com o corretor no WhatsApp
        </a>
      )}
      <button onClick={onClose}
        className="w-full"
        style={{ height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
        Fechar
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, required, type = 'text', textarea, autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  required?: boolean; type?: string; textarea?: boolean; autoFocus?: boolean;
}) {
  const common = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder, autoFocus,
    style: {
      width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 11, padding: '11px 13px', color: '#fff', fontSize: 14, outline: 'none',
      fontFamily: "'Outfit', sans-serif",
    } as React.CSSProperties,
  };
  return (
    <label className="block mb-3">
      <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        {label}{required && <span style={{ color: GOLD }}> *</span>}
      </span>
      {textarea ? <textarea {...common} rows={2} /> : (
        <input {...common} type={type} inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined} />
      )}
    </label>
  );
}
