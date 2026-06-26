'use client'

import Link from 'next/link'
import { Printer, ArrowLeft } from 'lucide-react'
import { getProposalTemplate, type ProposalGroup } from '@/lib/imi-proposals/template'
import { PROPOSAL_STATUS_LABELS } from '@/lib/imi-proposals/status'
import type { ProposalRow } from './data'

/**
 * Documento imprimível (PDF) — réplica do formulário físico
 * "MI GESTÃO / Mano Imóveis — Proposta de Compra".
 * Folha branca A4, otimizada para impressão (Ctrl+P → Salvar como PDF).
 */
export function ProposalDocument({ proposal }: { proposal: ProposalRow }) {
  const template = getProposalTemplate('mano-imoveis-compra')

  return (
    <div style={{ minHeight: '100dvh', background: '#525659', padding: '24px 12px 60px' }}>
      {/* Barra de ações (escondida na impressão) */}
      <div className="doc-actions" style={{ maxWidth: 800, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <Link
          href={`/users/proposals/${proposal.id}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#fff', fontFamily: 'system-ui, sans-serif', fontSize: 13, textDecoration: 'none', padding: '9px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.12)' }}
        >
          <ArrowLeft size={15} /> Voltar
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1A1206', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 8, background: '#C8A44A', border: 'none', cursor: 'pointer' }}
        >
          <Printer size={15} /> Imprimir / Salvar PDF
        </button>
      </div>

      {/* Folha A4 */}
      <div
        className="doc-sheet"
        style={{
          maxWidth: 800,
          margin: '0 auto',
          background: '#fff',
          color: '#111',
          padding: '40px 48px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          lineHeight: 1.5,
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '2px solid #111', paddingBottom: 14, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>MI GESTÃO</h1>
            <p style={{ fontSize: 10.5, margin: '2px 0 0', color: '#444' }}>Mano Imóveis · Inteligência Imobiliária</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Proposta de Compra</p>
            <p style={{ fontSize: 10, margin: '3px 0 0', color: '#666' }}>
              {proposal.projectName ?? ''} · {PROPOSAL_STATUS_LABELS[proposal.status]}
            </p>
            <p style={{ fontSize: 9, margin: '2px 0 0', color: '#999', fontFamily: 'monospace' }}>#{proposal.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Grupos */}
        {template?.schema.groups.map((group) => (
          <DocGroup key={group.key} group={group} formData={proposal.formData} />
        ))}

        {/* Observação */}
        {template?.schema.observacao && (
          <p style={{ fontSize: 9.5, fontStyle: 'italic', color: '#333', marginTop: 22, borderTop: '1px solid #ccc', paddingTop: 12 }}>
            <strong>Obs.:</strong> {template.schema.observacao}
          </p>
        )}

        {/* Assinaturas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 48 }}>
          <SignatureLine label="Comprador" />
          <SignatureLine label="Corretor / CRECI" />
        </div>
        <p style={{ fontSize: 10, color: '#555', marginTop: 28, textAlign: 'right' }}>
          ______________________, ______ de ____________________ de __________
        </p>
      </div>

      <style>{`
        @media print {
          .doc-actions { display: none !important; }
          .doc-sheet { box-shadow: none !important; max-width: none !important; padding: 0 !important; }
          body { background: #fff !important; }
        }
        @page { size: A4; margin: 16mm; }
      `}</style>
    </div>
  )
}

function DocGroup({ group, formData }: { group: ProposalGroup; formData: Record<string, any> }) {
  const repeats = group.repeat && group.repeat > 1 ? group.repeat : 1
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#000', borderBottom: '1px solid #888', paddingBottom: 3, marginBottom: 8 }}>
        {group.title}
      </p>
      {Array.from({ length: repeats }).map((_, idx) => {
        const dataKey = group.repeat && group.repeat > 1 ? `${group.key}.${idx + 1}` : group.key
        const values = formData[dataKey] ?? {}
        return (
          <div key={dataKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '6px 24px', marginBottom: repeats > 1 ? 8 : 0 }}>
            {group.fields.map((f) => (
              <div key={f.key} style={{ display: 'flex', gap: 6, fontSize: 11, borderBottom: '1px dotted #bbb', paddingBottom: 2 }}>
                <span style={{ color: '#555', whiteSpace: 'nowrap' }}>{f.label}:</span>
                <span style={{ color: '#000', fontWeight: 600 }}>{values[f.key] || ' '}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ borderTop: '1px solid #000', marginBottom: 5 }} />
      <span style={{ fontSize: 10.5, color: '#333' }}>{label}</span>
    </div>
  )
}
