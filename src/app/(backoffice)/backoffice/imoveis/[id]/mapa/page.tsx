'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Save, Image as ImageIcon, Video, Globe, Check, Shield, Dumbbell, Building2, TreePine } from 'lucide-react'

interface MapAmenity {
  id: string
  title?: string
  subtitle?: string
  description?: string
  fn?: string
  photos?: string[]
  video?: string
  tour360?: string
}

const DEFAULT_AREAS: { id: string; label: string }[] = [
  { id: 'portaria',      label: 'Portaria Principal'        },
  { id: 'lazer',         label: 'Área de Lazer / Clube'     },
  { id: 'coworking',     label: 'Coworking · Bloco Adm.'    },
  { id: 'recreativa-01', label: 'Área Recreativa 01'        },
  { id: 'recreativa-02', label: 'Área Recreativa 02'        },
  { id: 'recreativa-03', label: 'Área Recreativa 03'        },
  { id: 'area-verde',    label: 'Áreas Verdes'              },
  { id: 'capela',        label: 'Capela'                    },
]

/* ── Design tokens (IMI brandkit dark) ─────────────────────────────────── */
const N   = '#060D16'
const N2  = '#0B1928'
const N3  = '#0F2035'
const N4  = '#142840'
const GOLD = '#C8A44A'
const G_BORDER     = 'rgba(200,164,74,.18)'
const G_BORDER_MED = 'rgba(200,164,74,.30)'
const G_BG     = 'rgba(200,164,74,.08)'
const G_BG_MED = 'rgba(200,164,74,.14)'
const T1 = '#E8E4DC'
const T2 = '#94A0B2'
const T3 = '#556170'
const BDR = 'rgba(255,255,255,.06)'
const FONT = "'Outfit', system-ui, sans-serif"
const MONO = "'JetBrains Mono', monospace"

/* ── Area icon — SVG por tipo de área ─────────────────────────────────────── */
function AreaIcon({ id, size = 18 }: { id: string; size?: number }) {
  const c = GOLD
  const prefix = id.replace(/-\d+$/, '')
  if (prefix === 'portaria') return <Shield size={size} color={c} />
  if (prefix === 'lazer') return <Dumbbell size={size} color={c} />
  if (prefix === 'coworking') return <Building2 size={size} color={c} />
  if (prefix === 'area-verde') return <TreePine size={size} color={c} />
  if (prefix === 'recreativa') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="9" x2="9" y2="21"/>
      <line x1="15" y1="9" x2="15" y2="21"/>
    </svg>
  )
  if (prefix === 'capela') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="7"/>
      <line x1="9.5" y1="4.5" x2="14.5" y2="4.5"/>
      <path d="M4 22V12l8-5 8 5v10"/>
      <path d="M9 22v-5a3 3 0 0 1 6 0v5"/>
    </svg>
  )
  return <Globe size={size} color={c} />
}

export default function MapaAreasComunsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [areas, setAreas] = useState<Record<string, MapAmenity>>({})
  const [globalTourUrl, setGlobalTourUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/developments/${id}/map-amenities`).then(r => r.json()),
      fetch(`/api/developments?id=${id}`).then(r => r.json()),
    ])
      .then(([d, devData]) => {
        const savedAreas: MapAmenity[] = Array.isArray(d?.amenities) ? d.amenities : []
        const map: Record<string, MapAmenity> = {}
        for (const a of DEFAULT_AREAS) map[a.id] = { id: a.id }
        for (const a of savedAreas) map[a.id] = { ...map[a.id], ...a }
        setAreas(map)
        const dev = Array.isArray(devData) ? devData[0] : devData
        setGlobalTourUrl(dev?.virtual_tour_url || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const update = (areaId: string, patch: Partial<MapAmenity>) =>
    setAreas((prev: Record<string, MapAmenity>) => ({ ...prev, [areaId]: { ...prev[areaId], ...patch } }))

  const uploadPhoto = useCallback(async (areaId: string, file: File) => {
    setUploadingFor(areaId)
    setMsg(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload?bucket=media&folder=alto-bellevue-areas', { method: 'POST', body: fd })
      const data = await res.json()
      const url = data?.data?.url
      if (!res.ok || !url) { setMsg(data?.error || 'Falha no upload'); return }
      setAreas((prev: Record<string, MapAmenity>) => {
        const a: MapAmenity = prev[areaId] ?? { id: areaId }
        return { ...prev, [areaId]: { ...a, photos: [...(a.photos ?? []), url] } }
      })
    } catch {
      setMsg('Falha no upload')
    } finally {
      setUploadingFor(null)
    }
  }, [])

  const removePhoto = (areaId: string, idx: number) =>
    setAreas((prev: Record<string, MapAmenity>) => {
      const a: MapAmenity = prev[areaId]; const photos = [...(a.photos ?? [])]; photos.splice(idx, 1)
      return { ...prev, [areaId]: { ...a, photos } }
    })

  const save = useCallback(async () => {
    setSaving(true); setMsg(null); setSaved(false)
    const payload = Object.values(areas as Record<string, MapAmenity>).filter(
      (a: MapAmenity) => a.description || a.title || a.subtitle || a.video || a.tour360 || (a.photos && a.photos.length),
    )
    try {
      const [amenRes, tourRes] = await Promise.all([
        fetch(`/api/developments/${id}/map-amenities`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amenities: payload }),
        }),
        fetch('/api/developments', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, virtual_tour_url: globalTourUrl || null }),
        }),
      ])
      const data = await amenRes.json()
      if (amenRes.ok && tourRes.ok) { setSaved(true); setMsg(`${data.count ?? payload.length} áreas + tour 360° salvos`) }
      else setMsg(data?.error || 'Erro ao salvar')
    } catch {
      setMsg('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }, [areas, id, globalTourUrl])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: N, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: T2, fontFamily: FONT, fontSize: 13 }}>Carregando áreas…</div>
    </div>
  )

  const filledCount = Object.values(areas as Record<string, MapAmenity>).filter(
    (a: MapAmenity) => a.title || a.description || a.video || a.tour360 || (a.photos?.length ?? 0) > 0
  ).length
  const totalCount = DEFAULT_AREAS.length
  const progressPct = Math.round((filledCount / totalCount) * 100)

  return (
    <div style={{ minHeight: '100vh', background: N, color: T1, fontFamily: FONT, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(6,13,22,.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${G_BORDER}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 16px' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(255,255,255,.04)',
              border: `1px solid ${BDR}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T1, flexShrink: 0,
              transition: 'all .2s',
            }}
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, letterSpacing: '-0.2px', lineHeight: 1.2 }}>
              Áreas Comuns
            </div>
            <div style={{ fontSize: 10, color: T3, letterSpacing: '0.3px', marginTop: 1 }}>
              Mídia e informações de cada área do mapa
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 14px', borderRadius: 8,
              background: saved ? 'rgba(74,222,128,.12)' : N4,
              border: `1px solid ${saved ? 'rgba(74,222,128,.3)' : G_BORDER}`,
              color: saved ? '#4ADE80' : GOLD,
              fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
              textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer',
              transition: 'all .25s cubic-bezier(0.16,1,0.3,1)',
              opacity: saving ? 0.7 : 1, flexShrink: 0,
            }}
          >
            {saved
              ? <><Check size={12} /> Salvo</>
              : saving
              ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 12 }}>⟳</span> Salvando…</>
              : <><Save size={12} /> Salvar</>
            }
          </button>
        </div>

        {/* Status message */}
        {msg && (
          <div style={{
            padding: '6px 16px 8px',
            fontSize: 11, color: saved ? '#4ADE80' : '#F87171',
            fontFamily: MONO, letterSpacing: '0.3px',
          }}>
            {msg}
          </div>
        )}
      </div>

      {/* ── Progress indicator ────────────────────────────────────── */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: GOLD, fontFamily: FONT, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Progresso
          </span>
          <span style={{ fontSize: 9, color: T2, fontFamily: MONO, letterSpacing: '0.5px' }}>
            {filledCount} de {totalCount} áreas configuradas
          </span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: 'rgba(200,164,74,.7)',
            borderRadius: 2,
            transition: 'width .4s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
      </div>

      {/* ── Tour Virtual 360° global ──────────────────────────────── */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{
          background: 'rgba(14,28,48,.52)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${globalTourUrl ? G_BORDER : BDR}`,
          borderLeft: globalTourUrl ? '3px solid rgba(200,164,74,.5)' : `1px solid ${BDR}`,
          borderRadius: 16, padding: '14px 16px', marginBottom: 4,
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
            <Globe size={11} /> Tour Virtual 360° do Empreendimento
          </label>
          <input
            value={globalTourUrl}
            onChange={e => setGlobalTourUrl(e.target.value)}
            placeholder="https://kuula.co/share/collection/… ou https://matterport.com/…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(20,36,64,.5)',
              border: `1px solid ${globalTourUrl ? 'rgba(167,139,250,.35)' : G_BORDER_MED}`,
              borderRadius: 8, padding: '8px 11px',
              fontSize: 11, color: T1, fontFamily: MONO,
              outline: 'none', transition: 'border-color .15s',
            }}
          />
          {globalTourUrl && (
            <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', position: 'relative', paddingTop: '50%', background: '#000' }}>
              <iframe
                src={globalTourUrl}
                title="Tour virtual 360°"
                allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen; autoplay"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          )}
          <p style={{ fontSize: 9.5, color: T3, fontFamily: FONT, marginTop: 6, lineHeight: 1.4 }}>
            Aparece no mapa público e como fallback nas áreas sem tour específico.
          </p>
        </div>
      </div>

      {/* ── Area cards ────────────────────────────────────────────── */}
      <div style={{ padding: '12px 14px 100px' }}>
        {DEFAULT_AREAS.map(({ id: aId, label }, index) => {
          const a = areas[aId] ?? { id: aId }
          const isUploading = uploadingFor === aId
          const photoCount = a.photos?.length ?? 0
          const hasSomeData = !!(a.title || a.subtitle || a.description || a.video || a.tour360 || photoCount)

          return (
            <div
              key={aId}
              style={{
                background: 'rgba(14,28,48,.52)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${hasSomeData ? G_BORDER : BDR}`,
                borderLeft: hasSomeData ? '3px solid rgba(200,164,74,.5)' : `1px solid ${BDR}`,
                borderRadius: 16,
                marginBottom: 12,
                overflow: 'hidden',
                boxShadow: hasSomeData
                  ? '0 4px 20px rgba(200,164,74,.06), inset 0 1px 0 rgba(255,255,255,.04)'
                  : '0 4px 20px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.03)',
                transition: 'border-color .25s',
              }}
            >
              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: `1px solid ${BDR}`,
                background: 'rgba(255,255,255,.015)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: G_BG, border: `1px solid ${G_BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AreaIcon id={aId} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T1, letterSpacing: '-0.1px' }}>
                    {a.title || label}
                  </div>
                  {a.subtitle && (
                    <div style={{ fontSize: 11, color: T2, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.subtitle}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 9, fontFamily: MONO, color: GOLD,
                  background: 'rgba(200,164,74,.12)', border: `1px solid ${G_BORDER}`,
                  borderRadius: 5, padding: '3px 7px', letterSpacing: '0.5px',
                  flexShrink: 0,
                }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Form body */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Título + Subtítulo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 9.5, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
                      Título
                    </label>
                    <input
                      value={a.title ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(aId, { title: e.target.value })}
                      placeholder="ex.: Área de Lazer"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(20,36,64,.5)',
                        border: `1px solid ${G_BORDER_MED}`,
                        borderRadius: 8, padding: '8px 11px',
                        fontSize: 12, color: T1, fontFamily: FONT,
                        outline: 'none', transition: 'border-color .15s',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 9.5, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
                      Subtítulo
                    </label>
                    <input
                      value={a.subtitle ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(aId, { subtitle: e.target.value })}
                      placeholder="ex.: Convivência e bem-estar"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(20,36,64,.5)',
                        border: `1px solid ${G_BORDER_MED}`,
                        borderRadius: 8, padding: '8px 11px',
                        fontSize: 12, color: T1, fontFamily: FONT,
                        outline: 'none', transition: 'border-color .15s',
                      }}
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label style={{ display: 'block', fontSize: 9.5, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
                    Descrição
                  </label>
                  <textarea
                    value={a.description ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(aId, { description: e.target.value })}
                    placeholder="Descreva esta área do condomínio…"
                    rows={2}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(20,36,64,.5)',
                      border: `1px solid ${G_BORDER_MED}`,
                      borderRadius: 8, padding: '8px 11px',
                      fontSize: 12, color: T1, fontFamily: FONT,
                      outline: 'none', resize: 'none',
                      lineHeight: 1.6, transition: 'border-color .15s',
                    }}
                  />
                </div>

                {/* Vídeo + Tour 360 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
                      <Video size={10} /> Vídeo
                    </label>
                    <input
                      value={a.video ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(aId, { video: e.target.value })}
                      placeholder="youtube.com/embed/…"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(20,36,64,.5)',
                        border: `1px solid ${a.video ? 'rgba(96,165,250,.35)' : G_BORDER_MED}`,
                        borderRadius: 8, padding: '8px 11px',
                        fontSize: 11, color: T1, fontFamily: MONO,
                        outline: 'none', transition: 'border-color .15s',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
                      <Globe size={10} /> Tour 360°
                    </label>
                    <input
                      value={a.tour360 ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(aId, { tour360: e.target.value })}
                      placeholder="kuula.co/share/…"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(20,36,64,.5)',
                        border: `1px solid ${a.tour360 ? 'rgba(167,139,250,.35)' : G_BORDER_MED}`,
                        borderRadius: 8, padding: '8px 11px',
                        fontSize: 11, color: T1, fontFamily: MONO,
                        outline: 'none', transition: 'border-color .15s',
                      }}
                    />
                  </div>
                </div>

                {/* Fotos */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
                      <ImageIcon size={10} /> Fotos {photoCount > 0 && <span style={{ color: T2, fontFamily: MONO, fontSize: 9 }}>({photoCount})</span>}
                    </label>
                    <button
                      onClick={() => fileRefs.current[aId]?.click()}
                      disabled={isUploading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        height: 28, padding: '0 10px', borderRadius: 7,
                        background: G_BG, border: `1px solid ${G_BORDER}`,
                        color: GOLD, fontSize: 10, fontWeight: 700,
                        letterSpacing: '0.8px', textTransform: 'uppercase',
                        cursor: isUploading ? 'wait' : 'pointer',
                        opacity: isUploading ? 0.6 : 1,
                        transition: 'all .2s',
                        fontFamily: FONT,
                      }}
                    >
                      <Upload size={11} />
                      {isUploading ? 'Enviando…' : 'Enviar foto'}
                    </button>
                    <input
                      ref={(el: HTMLInputElement | null) => { fileRefs.current[aId] = el }}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) uploadPhoto(aId, f); e.target.value = '' }}
                    />
                  </div>

                  {photoCount === 0 ? (
                    <button
                      onClick={() => fileRefs.current[aId]?.click()}
                      style={{
                        width: '100%', padding: '24px 0',
                        border: `1px dashed rgba(200,164,74,.22)`,
                        borderRadius: 10,
                        background: 'rgba(200,164,74,.03)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <Upload size={20} style={{ color: T3 }} />
                      <span style={{ fontSize: 11, color: T2, fontFamily: FONT }}>Nenhuma foto adicionada</span>
                      <span style={{ fontSize: 9, color: GOLD, fontFamily: FONT, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Toque para enviar</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {(a.photos ?? []).map((url: string, i: number) => (
                        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            style={{
                              height: 72, width: 100, objectFit: 'cover',
                              borderRadius: 8,
                              border: `1px solid ${BDR}`,
                            }}
                          />
                          <button
                            onClick={() => removePhoto(aId, i)}
                            aria-label="Remover"
                            style={{
                              position: 'absolute', top: -6, right: -6,
                              width: 20, height: 20, borderRadius: '50%',
                              background: '#F87171', border: '2px solid ' + N,
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Fixed save bar ────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: 'rgba(6,13,22,.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: `1px solid ${G_BORDER}`,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          {msg
            ? <span style={{ fontSize: 12, fontFamily: MONO, color: saved ? '#4ADE80' : '#F87171', letterSpacing: '0.3px' }}>{msg}</span>
            : <span style={{ fontSize: 11, color: T3, fontFamily: FONT }}>
                {filledCount} de {totalCount} áreas preenchidas
              </span>
          }
        </div>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            height: 42, padding: '0 20px', borderRadius: 10,
            background: saved ? 'rgba(74,222,128,.12)' : N4,
            border: `1px solid ${saved ? 'rgba(74,222,128,.35)' : G_BORDER}`,
            color: saved ? '#4ADE80' : T1,
            fontSize: 11, fontWeight: 700,
            letterSpacing: '1.2px', textTransform: 'uppercase',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all .25s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: saved ? '0 0 16px rgba(74,222,128,.12)' : '0 0 16px rgba(200,164,74,.06)',
            fontFamily: FONT,
          }}
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar áreas comuns'}
        </button>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #6B7A8E; }
        input:focus, textarea:focus { border-color: rgba(200,164,74,.5) !important; box-shadow: 0 0 0 3px rgba(200,164,74,.08); }
      `}</style>
    </div>
  )
}
