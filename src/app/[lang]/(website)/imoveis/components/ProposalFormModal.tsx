'use client';

/**
 * ProposalFormModal — o CLIENTE preenche a proposta de compra a partir da
 * seleção de lotes (carrinho). Usa o modelo "Proposta de Compra — Mano Imóveis"
 * (src/lib/imi-proposals/template.ts), pré-preenchendo Imóvel + Condições com os
 * lotes escolhidos. Ao enviar:
 *   1. POST /api/lots/proposal → confirmação ao cliente via WhatsApp (OpenWA) +
 *      notificação ao responsável do empreendimento, gestor e corretores;
 *   2. abre o WhatsApp da imobiliária com o resumo (canal garantido).
 *
 * Visual alinhado aos painéis do mapa (glass navy + dourado). Mobile-first.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingCart, Loader2, CheckCircle2, ShieldCheck, MessageCircle } from 'lucide-react';
import { cartTotals, buildCartWhatsAppMessage, type CartLot } from '@/lib/lotmap/cart';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Math.round(n || 0));
const fmtM2 = (n: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(n || 0)} m²`;

interface Props {
  developmentId?: string | null;
  developmentName: string;
  developmentSlug?: string;
  whatsappPhone: string;
  items: CartLot[];
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ProposalFormModal({
  developmentId, developmentName, developmentSlug, whatsappPhone, items, onClose, onSubmitted,
}: Props) {
  const totals = useMemo(() => cartTotals(items), [items]);
  const suggestedDown = Math.round(totals.totalPrice * 0.2);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [fone, setFone] = useState('');
  const [conjuge, setConjuge] = useState('');
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');
  const [showMore, setShowMore] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = nome.trim().length >= 2 && fone.replace(/\D/g, '').length >= 8;

  async function handleSubmit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);

    const lotesStr = items.map((l) => l.lot).join(', ');
    const quadrasStr = Array.from(new Set(items.map((l) => l.block))).join(', ');

    const formData = {
      comprador: { nome: nome.trim(), cpf: cpf.trim() },
      conjuge: { nome: conjuge.trim() },
      contato: { email: email.trim(), fone: fone.trim(), end_residencial: endereco.trim() },
      imovel: {
        loteamento: developmentName,
        lotes: lotesStr,
        quadras: quadrasStr,
        metragem: String(Math.round(totals.totalArea)),
      },
      condicoes: { valor: totals.totalPrice, sinal: suggestedDown },
      observacao: obs.trim(),
    };

    try {
      const res = await fetch('/api/lots/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developmentId: developmentId ?? null,
          developmentName,
          developmentSlug: developmentSlug ?? null,
          templateKey: 'mano-imoveis-compra',
          clientName: nome.trim(),
          clientPhone: fone.trim(),
          clientEmail: email.trim() || null,
          formData,
          lots: items.map((l) => ({ id: l.id, block: l.block, lot: l.lot, areaM2: l.areaM2, price: l.price })),
          totalAmount: totals.totalPrice,
          downPayment: suggestedDown,
        }),
      });
      // Best-effort: mesmo que o gateway falhe, garantimos o canal via wa.me.
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 400 && body?.error) throw new Error(body.error);
      }
      setDone(true);
    } catch (e) {
      // Não bloqueia o cliente: seguimos para o WhatsApp mesmo assim.
      setError(e instanceof Error ? e.message : null);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  function openWhatsApp() {
    const msg = buildCartWhatsAppMessage(items, {
      developmentName,
      note:
        `Proposta de ${nome || 'cliente'}` +
        (fone ? ` · ${fone}` : '') +
        (cpf ? ` · CPF ${cpf}` : '') +
        `\nEntrada sugerida: ${fmtBRL(suggestedDown)}` +
        (obs ? `\nObs.: ${obs}` : ''),
    });
    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`;
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
    onSubmitted();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
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
              {developmentName}
            </p>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {done ? 'Proposta recebida' : 'Preencher proposta'}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fechar"
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {done ? (
          <SuccessView
            count={items.length}
            error={error}
            onWhatsApp={openWhatsApp}
          />
        ) : (
          <>
            <div className="overflow-y-auto flex-1 px-5 pb-4" style={{ scrollbarWidth: 'thin' }}>
              {/* Resumo dos lotes */}
              <div style={{ background: 'rgba(200,164,74,0.08)', border: '1px solid rgba(200,164,74,0.22)', borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart size={13} color={GOLD} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {items.length} {items.length === 1 ? 'lote selecionado' : 'lotes selecionados'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 mb-2">
                  {items.map((l) => (
                    <div key={l.id} className="flex items-center justify-between" style={{ fontSize: 12 }}>
                      <span style={{ color: 'rgba(255,255,255,0.78)' }}>Quadra {l.block} · Lote {l.lot}</span>
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtM2(l.areaM2)} · {fmtBRL(l.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Total · {fmtM2(totals.totalArea)}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: GOLD, fontFamily: "'JetBrains Mono', monospace" }}>{fmtBRL(totals.totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Entrada sugerida (20%)</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtBRL(suggestedDown)}</span>
                </div>
              </div>

              {/* Campos essenciais */}
              <Field label="Nome completo" required value={nome} onChange={setNome} placeholder="Como no documento" autoFocus />
              <Field label="WhatsApp / Telefone" required value={fone} onChange={setFone} placeholder="(00) 00000-0000" type="tel" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF" value={cpf} onChange={setCpf} placeholder="000.000.000-00" />
                <Field label="E-mail" value={email} onChange={setEmail} placeholder="voce@email.com" type="email" />
              </div>

              {/* Progressive disclosure */}
              <button
                type="button"
                onClick={() => setShowMore((s) => !s)}
                style={{ fontSize: 12, fontWeight: 700, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', marginTop: 2 }}
              >
                {showMore ? '— Menos informações' : '+ Dados complementares (opcional)'}
              </button>
              {showMore && (
                <div className="mt-1">
                  <Field label="Cônjuge" value={conjuge} onChange={setConjuge} placeholder="Nome do cônjuge" />
                  <Field label="Endereço residencial" value={endereco} onChange={setEndereco} placeholder="Rua, nº, bairro, cidade" />
                  <Field label="Observações" value={obs} onChange={setObs} placeholder="Forma de pagamento desejada, dúvidas…" textarea />
                </div>
              )}

              <div className="flex items-center gap-2 mt-3" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>
                <ShieldCheck size={13} color="rgba(255,255,255,0.4)" />
                <span>Reserva válida por 24h após a confirmação. Seus dados são usados apenas para esta proposta.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={handleSubmit}
                disabled={!valid || submitting}
                className="flex items-center justify-center gap-2 w-full"
                style={{
                  height: 50, borderRadius: 14, border: 'none',
                  background: valid ? GOLD : 'rgba(255,255,255,0.10)',
                  color: valid ? NAVY : 'rgba(255,255,255,0.4)',
                  fontSize: 14, fontWeight: 800, letterSpacing: '0.02em',
                  cursor: valid && !submitting ? 'pointer' : 'not-allowed',
                  fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s',
                }}
              >
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Enviando…</> : 'Enviar proposta'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function SuccessView({ count, error, onWhatsApp }: { count: number; error: string | null; onWhatsApp: () => void }) {
  return (
    <div className="px-6 pb-6 pt-2 text-center">
      <div className="flex justify-center mb-4">
        <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(34,197,94,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={34} color="#34D399" />
        </div>
      </div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, margin: '0 0 6px' }}>
        Sua proposta para {count} {count === 1 ? 'lote' : 'lotes'} foi registrada. Você receberá no WhatsApp a
        relação de documentação, o contrato e a forma de pagamento da entrada.
      </p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '0 0 18px' }}>
        Um corretor entrará em contato para concluir a reserva.
      </p>
      {error && (
        <p style={{ fontSize: 11, color: 'rgba(251,191,36,0.85)', marginBottom: 12 }}>
          Confirme também pelo WhatsApp abaixo para garantir o atendimento.
        </p>
      )}
      <button
        onClick={onWhatsApp}
        className="flex items-center justify-center gap-2 w-full"
        style={{ height: 50, borderRadius: 14, border: 'none', background: '#25D366', color: '#062b16', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
      >
        <MessageCircle size={17} /> Confirmar pelo WhatsApp
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
    placeholder,
    autoFocus,
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
      {textarea ? (
        <textarea {...common} rows={2} />
      ) : (
        <input {...common} type={type} inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined} />
      )}
    </label>
  );
}
