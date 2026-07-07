'use client';

/**
 * /carrinho?id=<token> — landing da seleção compartilhada de lotes.
 *
 * Decodifica o token (src/lib/lotmap/cart.ts), carrega o dataset do
 * empreendimento e mostra os lotes selecionados + totais + ações
 * (WhatsApp / copiar link / imprimir-PDF). Quando o token carrega um
 * `p` (proposalToken — ver ProposalFormModal), busca o status ao vivo em
 * public.proposals (rascunho/enviada/aceita/contrato) via
 * /api/lots/proposal/status. Sem proposta ainda, oferece "Preencher
 * proposta" direto por aqui (mesmo ProposalFormModal do mapa).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingCart, MessageCircle, Link2, Printer, Check, AlertCircle, MapPin,
  FileText, Clock, Send, Eye, CheckCircle2, XCircle, FileSignature,
} from 'lucide-react';
import {
  decodeCart,
  toCartLot,
  cartTotals,
  buildCartWhatsAppUrl,
  buildCartShareUrl,
  type CartLot,
  type RawLotLike,
} from '@/lib/lotmap/cart';
import { getDevelopmentBySlug } from '@/lib/lotmap/engine';
import ProposalFormModal from '../imoveis/components/ProposalFormModal';

const NAVY = '#0B1928';
const GOLD = '#C8A44A';

// slug → dataset de lotes (engine.mapJsonUrl ainda tem caminho legado p/ o MM)
const DATASET: Record<string, string> = {
  'alto-bellevue': '/maps/alto-bellevue-lots.json',
  'miguel-marques': '/maps/miguel-marques-cad-lots.json',
};

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Math.round(n || 0));
const fmtM2 = (n: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n || 0)} m²`;

type State =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'ready'; devName: string; devSlug: string; whatsapp?: string; items: CartLot[]; missing: number };

interface ProposalStatus {
  status: string;
  signature_status: string | null;
  valor_proposta: number | null;
  valor_entrada: number | null;
  pdf_url: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABEL: Record<string, { label: string; icon: typeof Send; color: string }> = {
  draft: { label: 'Rascunho', icon: FileText, color: '#948F84' },
  sent: { label: 'Proposta enviada', icon: Send, color: GOLD },
  viewed: { label: 'Em análise pela equipe', icon: Eye, color: GOLD },
  negotiating: { label: 'Em negociação', icon: Clock, color: GOLD },
  countered: { label: 'Contraproposta enviada', icon: Clock, color: GOLD },
  accepted: { label: 'Proposta aceita', icon: CheckCircle2, color: '#16A34A' },
  rejected: { label: 'Proposta recusada', icon: XCircle, color: '#DC2626' },
  expired: { label: 'Proposta expirada', icon: XCircle, color: '#948F84' },
};

const SIGNATURE_LABEL: Record<string, { label: string; color: string }> = {
  enviada: { label: 'Contrato enviado para assinatura', color: GOLD },
  assinada: { label: 'Contrato assinado', color: '#16A34A' },
  recusada: { label: 'Assinatura recusada', color: '#DC2626' },
  expirada: { label: 'Assinatura expirada', color: '#948F84' },
  cancelada: { label: 'Assinatura cancelada', color: '#948F84' },
};

export default function CarrinhoClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('id');
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [copied, setCopied] = useState(false);
  const [proposalToken, setProposalToken] = useState<string | undefined>(undefined);
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);

  useEffect(() => {
    let alive = true;
    const share = token ? decodeCart(token) : null;
    if (!share) {
      setState({ kind: 'invalid' });
      return;
    }
    setProposalToken(share.p);
    const dev = getDevelopmentBySlug(share.d);
    const url = DATASET[share.d];
    if (!url) {
      setState({ kind: 'invalid' });
      return;
    }
    fetch(url)
      .then((r) => r.json())
      .then((data: { lots?: RawLotLike[] }) => {
        if (!alive) return;
        const byId = new Map<string, RawLotLike>();
        for (const l of data.lots ?? []) byId.set(l.id, l);
        const items: CartLot[] = [];
        let missing = 0;
        for (const id of share.ids) {
          const raw = byId.get(id);
          if (raw) items.push(toCartLot(raw, { slug: share.d, name: dev?.name }));
          else missing += 1;
        }
        setState({ kind: 'ready', devName: dev?.name ?? 'Empreendimento', devSlug: share.d, whatsapp: dev?.whatsappContact, items, missing });
      })
      .catch(() => {
        if (alive) setState({ kind: 'invalid' });
      });
    return () => {
      alive = false;
    };
  }, [token]);

  // Status ao vivo da proposta (se este link já tiver uma associada).
  useEffect(() => {
    if (!proposalToken) return;
    let alive = true;
    fetch(`/api/lots/proposal/status?token=${encodeURIComponent(proposalToken)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { proposal?: ProposalStatus } | null) => {
        if (alive && body?.proposal) setProposalStatus(body.proposal);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [proposalToken]);

  const totals = useMemo(() => (state.kind === 'ready' ? cartTotals(state.items) : null), [state]);

  function copyLink() {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponível */
    }
  }

  // Quando uma proposta é enviada a partir desta própria página, o link
  // (URL + "Copiar link") passa a carregar o token de status também.
  const handleProposalSubmitted = useCallback(
    (newProposalToken?: string) => {
      setShowProposalForm(false);
      if (!newProposalToken || state.kind !== 'ready') return;
      setProposalToken(newProposalToken);
      const newUrl = buildCartShareUrl(window.location.origin, {
        d: state.devSlug,
        ids: state.items.map((l) => l.id),
        p: newProposalToken,
      });
      router.replace(newUrl.replace(window.location.origin, ''));
    },
    [router, state]
  );

  const statusInfo = proposalStatus ? STATUS_LABEL[proposalStatus.status] : null;
  const signatureInfo = proposalStatus?.signature_status ? SIGNATURE_LABEL[proposalStatus.signature_status] : null;

  return (
    <main style={{ minHeight: '100vh', background: '#F8F6F2', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart size={18} style={{ color: GOLD }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
            {proposalStatus ? 'Sua proposta' : 'Seleção de lotes'}
          </h1>
        </div>

        {state.kind === 'loading' && (
          <p style={{ color: '#948F84', fontSize: 14 }}>Carregando seleção…</p>
        )}

        {state.kind === 'invalid' && (
          <div className="flex items-start gap-2 mt-4 p-4 rounded-xl" style={{ background: '#fff', border: '1px solid rgba(248,113,113,0.3)' }}>
            <AlertCircle size={18} style={{ color: '#F87171', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 700, color: NAVY, margin: 0 }}>Link inválido ou expirado.</p>
              <p style={{ fontSize: 13, color: '#948F84', margin: '4px 0 0' }}>
                Confira o link de compartilhamento ou monte uma nova seleção no mapa do empreendimento.
              </p>
            </div>
          </div>
        )}

        {state.kind === 'ready' && totals && (
          <>
            <p style={{ fontSize: 13, color: '#948F84', margin: '0 0 18px' }}>
              {state.devName} · {totals.count} {totals.count === 1 ? 'lote' : 'lotes'}
            </p>

            {/* Status ao vivo da proposta, quando este link já tiver uma */}
            {statusInfo && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl mb-3"
                style={{ background: '#fff', border: `1px solid ${statusInfo.color}40` }}
              >
                <statusInfo.icon size={18} style={{ color: statusInfo.color, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{statusInfo.label}</div>
                  {signatureInfo && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <FileSignature size={12} style={{ color: signatureInfo.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: signatureInfo.color }}>{signatureInfo.label}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {totals.count === 0 ? (
              <p style={{ color: '#948F84', fontSize: 14 }}>Nenhum lote nesta seleção.</p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {state.items.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: '#fff', border: '1px solid rgba(184,179,168,0.35)' }}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(200,164,74,0.12)', color: GOLD }}
                      >
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>
                          Quadra {l.block} · Lote {l.lot}
                        </div>
                        <div style={{ fontSize: 12, color: '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                          {fmtM2(l.areaM2)}
                        </div>
                        {l.selectedPlan && (
                          <div style={{ fontSize: 11.5, color: GOLD, fontWeight: 700, marginTop: 2 }}>
                            {l.selectedPlan.label}{l.selectedPlan.parcela ? ` · ${fmtBRL(l.selectedPlan.parcela)}/mês` : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", whiteSpace: 'nowrap' }}>
                        {l.price > 0 ? fmtBRL(l.price) : 'Sob consulta'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="mt-4 p-4 rounded-xl" style={{ background: NAVY, color: '#fff' }}>
                  <div className="grid grid-cols-2 gap-y-2" style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Área total</span>
                    <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{fmtM2(totals.totalArea)}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Valor total</span>
                    <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right', color: GOLD }}>{fmtBRL(totals.totalPrice)}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Valor médio/lote</span>
                    <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{fmtBRL(totals.avgPrice)}</span>
                  </div>
                </div>

                {state.missing > 0 && (
                  <p style={{ fontSize: 11, color: '#948F84', margin: '8px 0 0' }}>
                    {state.missing} lote(s) da seleção não foram encontrados no mapa atual.
                  </p>
                )}

                {/* Ações */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {!proposalToken && (
                    <button
                      onClick={() => setShowProposalForm(true)}
                      className="flex items-center gap-2 px-4 h-11 rounded-xl"
                      style={{ background: GOLD, color: NAVY, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}
                    >
                      <FileText size={16} /> Preencher proposta
                    </button>
                  )}
                  {state.whatsapp && (
                    <a
                      href={buildCartWhatsAppUrl(state.whatsapp, state.items, {
                        developmentName: state.devName,
                        shareUrl: typeof window !== 'undefined' ? window.location.href : undefined,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 h-11 rounded-xl"
                      style={{ background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                    >
                      <MessageCircle size={16} /> Enviar no WhatsApp
                    </a>
                  )}
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-2 px-4 h-11 rounded-xl"
                    style={{ background: '#fff', color: NAVY, fontWeight: 700, fontSize: 14, border: '1.5px solid rgba(184,179,168,0.5)', cursor: 'pointer' }}
                  >
                    {copied ? <Check size={16} style={{ color: '#16A34A' }} /> : <Link2 size={16} />}
                    {copied ? 'Link copiado' : 'Copiar link'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 h-11 rounded-xl"
                    style={{ background: '#fff', color: NAVY, fontWeight: 700, fontSize: 14, border: '1.5px solid rgba(184,179,168,0.5)', cursor: 'pointer' }}
                  >
                    <Printer size={16} /> Imprimir / PDF
                  </button>
                </div>
              </>
            )}

            {showProposalForm && (
              <ProposalFormModal
                developmentName={state.devName}
                developmentSlug={state.devSlug}
                whatsappPhone={state.whatsapp ?? ''}
                items={state.items}
                onClose={() => setShowProposalForm(false)}
                onSubmitted={handleProposalSubmitted}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
