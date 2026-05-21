'use client'

/**
 * MethodRecommender — IMI Avaliações
 *
 * Componente de recomendação inteligente de método avaliatório.
 * Exibe a recomendação baseada no tipo de imóvel e finalidade,
 * com explicação simples para o corretor.
 */

import { useState, useEffect } from 'react'
import {
  Brain, ChevronDown, ChevronRight, Info, AlertTriangle,
  CheckCircle, BookOpen, Clock, ArrowRight,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import {
  recomendarMetodo,
  explicarMetodoParaCorretor,
  type MethodRecommendation,
  type MetodoId,
} from '@/features/avaliacoes/services/method-recommender'

interface MethodRecommenderProps {
  tipoImovel: string
  finalidade: string
  onSelectMethod: (metodoId: MetodoId, nome: string) => void
  selectedMethodId?: MetodoId | null
}

export function MethodRecommender({
  tipoImovel,
  finalidade,
  onSelectMethod,
  selectedMethodId,
}: MethodRecommenderProps) {
  const [rec, setRec] = useState<MethodRecommendation | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)

  useEffect(() => {
    if (tipoImovel && finalidade) {
      const recommendation = recomendarMetodo(tipoImovel, finalidade)
      setRec(recommendation)
      // Auto-select primary if nothing selected
      if (!selectedMethodId) {
        onSelectMethod(recommendation.metodo_id, recommendation.metodo_principal)
      }
    }
  }, [tipoImovel, finalidade]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!rec) return null

  const explicacao = explicarMetodoParaCorretor(rec.metodo_id)
  const isSelected = selectedMethodId === rec.metodo_id

  const CONFIANCA_COLOR = {
    alto: 'var(--success)',
    medio: 'var(--warning)',
    baixo: 'var(--error)',
  }

  const CONFIANCA_LABEL = {
    alto: 'Alta confiança',
    medio: 'Média confiança',
    baixo: 'Baixa confiança — consulte um especialista',
  }

  return (
    <div style={{
      border: `1px solid ${isSelected ? 'rgba(200,164,74,0.4)' : T.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      background: isSelected ? 'rgba(200,164,74,0.04)' : T.surface,
      transition: 'all 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: expanded ? `1px solid ${T.borderLight}` : 'none',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: 'rgba(200,164,74,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={18} style={{ color: T.gold }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>
            Método recomendado pela IA
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: T.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {rec.metodo_principal}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            background: `${CONFIANCA_COLOR[rec.grau_confianca]}18`,
            color: CONFIANCA_COLOR[rec.grau_confianca],
          }}>
            {CONFIANCA_LABEL[rec.grau_confianca]}
          </span>

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent', border: `1px solid ${T.border}`,
              borderRadius: 6, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.textMuted,
            }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Justificativa */}
          <div style={{
            padding: 12, background: T.surfaceAlt, borderRadius: 8,
            border: `1px solid ${T.borderLight}`,
          }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>
              Por que este método?
            </div>
            <p style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>
              {rec.justificativa}
            </p>
            <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted, fontFamily: 'monospace' }}>
              Ref: {rec.referencia_nbr}
            </div>
          </div>

          {/* Explicação simples */}
          {explicacao && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>
                Como funciona na prática:
              </div>
              <p style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>
                {explicacao.explicacao_simples}
              </p>

              <div style={{
                padding: 10, background: 'rgba(200,164,74,0.06)',
                border: '1px solid rgba(200,164,74,0.15)', borderRadius: 8,
              }}>
                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, fontWeight: 600 }}>
                  Exemplo prático:
                </div>
                <p style={{ fontSize: 11, color: T.textGold, lineHeight: 1.5 }}>
                  {explicacao.exemplo}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted }}>
                <Clock size={12} />
                <span>Tempo estimado: {explicacao.tempo_estimado}</span>
              </div>
            </div>
          )}

          {/* Dados necessários */}
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 8 }}>
              Dados necessários:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rec.dados_necessarios.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: T.text }}>
                  <CheckCircle size={12} style={{ color: T.success, flexShrink: 0, marginTop: 2 }} />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quando usar / não usar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{
              padding: 10, background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700, marginBottom: 4 }}>
                ✓ Quando usar
              </div>
              <p style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{rec.quando_usar}</p>
            </div>
            <div style={{
              padding: 10, background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, color: 'var(--error)', fontWeight: 700, marginBottom: 4 }}>
                ✗ Quando não usar
              </div>
              <p style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{rec.quando_nao_usar}</p>
            </div>
          </div>

          {/* Alerta */}
          {rec.alerta && (
            <div style={{
              padding: 10, background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8,
              display: 'flex', gap: 8,
            }}>
              <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{rec.alerta}</p>
            </div>
          )}

          {/* Selecionar este método */}
          <button
            onClick={() => onSelectMethod(rec.metodo_id, rec.metodo_principal)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 8,
              background: isSelected
                ? `linear-gradient(135deg, ${T.gold}, #D4B86A)`
                : T.surfaceAlt,
              color: isSelected ? '#050B14' : T.text,
              border: isSelected ? 'none' : `1px solid ${T.border}`,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {isSelected ? (
              <><CheckCircle size={15} /> Método selecionado</>
            ) : (
              <>Usar este método <ArrowRight size={15} /></>
            )}
          </button>

          {/* Métodos alternativos */}
          {rec.metodos_alternativos.length > 0 && (
            <div>
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <BookOpen size={11} />
                Ver métodos alternativos ({rec.metodos_alternativos.length})
                {showAlternatives ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>

              {showAlternatives && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rec.metodos_alternativos.map((alt) => (
                    <div
                      key={alt.id}
                      style={{
                        padding: '10px 12px', borderRadius: 8,
                        border: `1px solid ${selectedMethodId === alt.id ? 'rgba(200,164,74,0.4)' : T.borderLight}`,
                        background: selectedMethodId === alt.id ? 'rgba(200,164,74,0.06)' : T.surfaceAlt,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                      onClick={() => onSelectMethod(alt.id, alt.nome)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                          {alt.nome}
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                          {alt.motivo}
                        </div>
                      </div>
                      {selectedMethodId === alt.id && (
                        <CheckCircle size={14} style={{ color: T.gold, flexShrink: 0 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed summary */}
      {!expanded && (
        <div
          onClick={() => setExpanded(true)}
          style={{
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
            borderTop: `1px solid ${T.borderLight}`,
          }}
        >
          <Info size={12} style={{ color: T.textMuted }} />
          <span style={{ fontSize: 11, color: T.textMuted }}>
            {explicacao?.explicacao_simples.substring(0, 100)}...
          </span>
        </div>
      )}
    </div>
  )
}
