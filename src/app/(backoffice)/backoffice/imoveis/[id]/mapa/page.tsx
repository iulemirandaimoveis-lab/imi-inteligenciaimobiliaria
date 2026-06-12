'use client'

import { useState, useEffect, useCallback, useRef, ElementType, CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Upload, X, Save, Image as ImageIcon, Video, Globe, Check, Loader2,
  Building2, Waves, Briefcase, TreePine, Leaf, Church,
} from 'lucide-react'

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

const AREA_META: { id: string; label: string; Icon: ElementType }[] = [
  { id: 'portaria',      label: 'Portaria Principal',      Icon: Building2 },
  { id: 'lazer',         label: 'Área de Lazer / Clube',   Icon: Waves     },
  { id: 'coworking',     label: 'Coworking · Bloco Adm.',  Icon: Briefcase },
  { id: 'recreativa-01', label: 'Área Recreativa 01',      Icon: TreePine  },
  { id: 'recreativa-02', label: 'Área Recreativa 02',      Icon: TreePine  },
  { id: 'recreativa-03', label: 'Área Recreativa 03',      Icon: TreePine  },
  { id: 'area-verde',    label: 'Áreas Verdes',            Icon: Leaf      },
  { id: 'capela',        label: 'Capela',                  Icon: Church    },
]

// Design tokens — admin panel always uses dark context
const BG      = '#05080F'
const INPUT_BG = '#071422'
const GOLD     = '#C8A44A'
const GOLD_DIM = '#A8842A'
const GOLD_B   = 'rgba(200,164,74,0.18)'
const GOLD_BM  = 'rgba(200,164,74,0.30)'
const T1       = '#E8E4DC'
const T2       = '#8E99AB'
const T3       = '#4F5B6B'
const FS       = 'var(--font-ui, system-ui, sans-serif)'
const FM       = "var(--font-data, 'JetBrains Mono', monospace)"

const INPUT_S: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 40,
  background: INPUT_BG,
  border: `1px solid ${GOLD_B}`,
  borderRadius: 10,
  padding: '0 12px',
  fontSize: 13,
  color: T1,
  fontFamily: FS,
  outline: 'none',
  transition: 'border-color .15s, box-shadow .15s',
}

const TEXTAREA_S: CSSProperties = {
  ...INPUT_S,
  height: 'auto',
  padding: '10px 12px',
  resize: 'none',
  lineHeight: 1.6,
}

const LABEL_S: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 11,
  color: GOLD,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  fontWeight: 700,
  marginBottom: 6,
  fontFamily: FS,
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
        for (const a of AREA_META) map[a.id] = { id: a.id }
        for (const a of savedAreas) map[a.id] = { ...map[a.id], ...a }
        setAreas(map)
        const dev = Array.isArray(devData) ? devData[0] : devData
        setGlobalTourUrl(dev?.virtual_tour_url || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const update = (areaId: string, patch: Partial<MapAmenity>) =>
    setAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], ...patch } }))

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
      setAreas(prev => {
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
    setAreas(prev => {
      const a: MapAmenity = prev[areaId]
      const photos = [...(a.photos ?? [])]
      photos.splice(idx, 1)
      return { ...prev, [areaId]: { ...a, photos } }
    })

  const save = useCallback(async () => {
    setSaving(true); setMsg(null); setSaved(false)
    const payload = Object.values(areas).filter(
      a => a.description || a.title || a.subtitle || a.video || a.tour360 || (a.photos && a.photos.length),
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
      if (amenRes.ok && tourRes.ok) {
        setSaved(true)
        setMsg(`${data.count ?? payload.length} áreas + tour 360° salvos`)
      } else {
        setMsg(data?.error || 'Erro ao salvar')
      }
    } catch {
      setMsg('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }, [areas, id, globalTourUrl])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T2, fontFamily: FS, fontSize: 13 }}>
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: GOLD }} />
        Carregando áreas…
      </div>
    </div>
  )

  const filledCount = Object.values(areas).filter(
    a => a.title || a.description || a.video || a.tour360 || (a.photos?.length ?? 0) > 0
  ).length
  const totalCount = AREA_META.length
  const progressPct = Math.round((filledCount / totalCount) * 100)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: T1, fontFamily: FS, WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(5,8,15,0.94)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: `1px solid ${GOLD_B}`,
        boxShadow: '0 1px 0 rgba(200,164,74,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 60, padding: '0 16px' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T2, flexShrink: 0,
              transition: 'background .18s, border-color .18s',
            }}
            aria-label="Voltar"
          >
            <ArrowLeft size={17} strokeWidth={2} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: T1, letterSpacing: '-0.3px', lineHeight: 1.25 }}>
              Áreas Comuns
            </div>
            <div style={{ fontSize: 11, color: T3, letterSpacing: '0.2px', marginTop: 2, lineHeight: 1.3 }}>
              Mídia e informações de cada área do mapa
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 16px', borderRadius: 9,
              background: saved
                ? 'rgba(74,222,128,0.12)'
                : 'linear-gradient(135deg, #162840 0%, #0F2035 100%)',
              border: `1.5px solid ${saved ? 'rgba(74,222,128,0.35)' : GOLD_BM}`,
              color: saved ? '#4ADE80' : GOLD,
              fontSize: 11, fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer',
              transition: 'all .25s cubic-bezier(0.16,1,0.3,1)',
              opacity: saving ? 0.7 : 1, flexShrink: 0,
              boxShadow: saved
                ? '0 0 16px rgba(74,222,128,0.12)'
                : '0 2px 12px rgba(200,164,74,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {saved
              ? <><Check size={13} strokeWidth={2.5} /> Salvo</>
              : saving
              ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Salvando…</>
              : <><Save size={12} /> Salvar</>}
          </button>
        </div>

        {msg && (
          <div style={{
            padding: '4px 16px 8px',
            fontSize: 11, color: saved ? '#4ADE80' : '#F87171',
            fontFamily: FM, letterSpacing: '0.3px',
          }}>
            {msg}
          </div>
        )}
      </div>

      {/* ── Progress indicator ────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
          }}>
            <div style={{ width: 3, height: 12, borderRadius: 2, background: GOLD, opacity: 0.7, flexShrink: 0 }} />
            Progresso
          </span>
          <span style={{
            fontSize: 11, color: T2, fontFamily: FM,
            background: 'rgba(200,164,74,0.08)',
            padding: '2px 10px', borderRadius: 20,
            border: `1px solid ${GOLD_B}`,
          }}>
            {filledCount}/{totalCount} áreas
          </span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${GOLD_DIM}, ${GOLD})`,
            borderRadius: 6,
            transition: 'width .5s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: '0 0 8px rgba(200,164,74,0.35)',
          }} />
        </div>
      </div>

      {/* ── Tour Virtual 360° global ──────────────────────────────── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: 'rgba(13,27,46,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${globalTourUrl ? GOLD_BM : GOLD_B}`,
          borderLeft: `3px solid ${globalTourUrl ? GOLD : 'rgba(200,164,74,0.25)'}`,
          borderRadius: 14,
          padding: '16px',
          boxShadow: globalTourUrl
            ? '0 4px 24px rgba(200,164,74,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          transition: 'border-color .25s, box-shadow .25s',
        }}>
          <label style={LABEL_S}>
            <Globe size={12} /> Tour Virtual 360° do Empreendimento
          </label>
          <input
            value={globalTourUrl}
            onChange={e => setGlobalTourUrl(e.target.value)}
            placeholder="https://kuula.co/share/collection/…"
            style={{ ...INPUT_S, fontFamily: FM, fontSize: 12 }}
          />
          {globalTourUrl && (
            <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', position: 'relative', paddingTop: '50%', background: '#000' }}>
              <iframe
                src={globalTourUrl}
                title="Tour virtual 360°"
                allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen; autoplay"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          )}
          <p style={{ fontSize: 11, color: T3, marginTop: 9, lineHeight: 1.5 }}>
            Aparece no mapa público e como fallback nas áreas sem tour específico.
          </p>
        </div>
      </div>

      {/* ── Area cards ────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 120px' }}>
        {AREA_META.map(({ id: aId, label, Icon }, index) => {
          const a = areas[aId] ?? { id: aId }
          const isUploading = uploadingFor === aId
          const photoCount = a.photos?.length ?? 0
          const hasSomeData = !!(a.title || a.subtitle || a.description || a.video || a.tour360 || photoCount)

          return (
            <div
              key={aId}
              style={{
                background: 'rgba(13,27,46,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${hasSomeData ? GOLD_BM : GOLD_B}`,
                borderLeft: `3px solid ${hasSomeData ? GOLD : 'rgba(200,164,74,0.22)'}`,
                borderRadius: 14,
                marginBottom: 12,
                overflow: 'hidden',
                boxShadow: hasSomeData
                  ? '0 4px 20px rgba(200,164,74,0.07), inset 0 1px 0 rgba(255,255,255,0.04)'
                  : '0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
                transition: 'border-color .25s, box-shadow .25s',
              }}
            >
              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: hasSomeData ? 'rgba(200,164,74,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hasSomeData ? GOLD_B : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all .25s',
                }}>
                  <Icon size={17} style={{ color: hasSomeData ? GOLD : T3, strokeWidth: 1.5 }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T1, letterSpacing: '-0.15px', lineHeight: 1.3 }}>
                    {a.title || label}
                  </div>
                  {a.subtitle && (
                    <div style={{ fontSize: 12, color: T2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.subtitle}
                    </div>
                  )}
                </div>

                <div style={{
                  fontSize: 10, fontFamily: FM, color: hasSomeData ? GOLD : T3,
                  background: hasSomeData ? 'rgba(200,164,74,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${hasSomeData ? GOLD_B : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 6, padding: '3px 8px', letterSpacing: '0.5px',
                  flexShrink: 0, transition: 'all .25s',
                }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Form body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Título + Subtítulo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={LABEL_S}>Título</label>
                    <input
                      value={a.title ?? ''}
                      onChange={e => update(aId, { title: e.target.value })}
                      placeholder="ex.: Área de Lazer"
                      style={INPUT_S}
                    />
                  </div>
                  <div>
                    <label style={LABEL_S}>Subtítulo</label>
                    <input
                      value={a.subtitle ?? ''}
                      onChange={e => update(aId, { subtitle: e.target.value })}
                      placeholder="ex.: Convivência e bem-estar"
                      style={INPUT_S}
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label style={LABEL_S}>Descrição</label>
                  <textarea
                    value={a.description ?? ''}
                    onChange={e => update(aId, { description: e.target.value })}
                    placeholder="Descreva esta área do condomínio…"
                    rows={2}
                    style={TEXTAREA_S}
                  />
                </div>

                {/* Vídeo + Tour 360 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={LABEL_S}><Video size={11} /> Vídeo</label>
                    <input
                      value={a.video ?? ''}
                      onChange={e => update(aId, { video: e.target.value })}
                      placeholder="youtube.com/embed/…"
                      style={{ ...INPUT_S, fontFamily: FM, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={LABEL_S}><Globe size={11} /> Tour 360°</label>
                    <input
                      value={a.tour360 ?? ''}
                      onChange={e => update(aId, { tour360: e.target.value })}
                      placeholder="kuula.co/share/…"
                      style={{ ...INPUT_S, fontFamily: FM, fontSize: 12 }}
                    />
                  </div>
                </div>

                {/* Fotos */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label style={{ ...LABEL_S, marginBottom: 0 }}>
                      <ImageIcon size={11} /> Fotos
                      {photoCount > 0 && (
                        <span style={{
                          fontSize: 10, color: T2, fontFamily: FM,
                          background: 'rgba(255,255,255,0.06)',
                          padding: '1px 6px', borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                          {photoCount}
                        </span>
                      )}
                    </label>
                    <button
                      onClick={() => fileRefs.current[aId]?.click()}
                      disabled={isUploading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        height: 30, padding: '0 12px', borderRadius: 8,
                        background: 'rgba(200,164,74,0.10)',
                        border: `1px solid ${GOLD_B}`,
                        color: GOLD, fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.8px', textTransform: 'uppercase',
                        cursor: isUploading ? 'wait' : 'pointer',
                        opacity: isUploading ? 0.6 : 1,
                        transition: 'all .18s', fontFamily: FS,
                      }}
                    >
                      <Upload size={11} />
                      {isUploading ? 'Enviando…' : 'Enviar foto'}
                    </button>
                    <input
                      ref={el => { fileRefs.current[aId] = el }}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) uploadPhoto(aId, f)
                        e.target.value = ''
                      }}
                    />
                  </div>

                  {photoCount === 0 ? (
                    <button
                      onClick={() => fileRefs.current[aId]?.click()}
                      style={{
                        width: '100%', padding: '22px 0',
                        border: '1px dashed rgba(200,164,74,0.20)',
                        borderRadius: 10,
                        background: 'rgba(200,164,74,0.025)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        cursor: 'pointer', transition: 'all .18s',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(200,164,74,0.08)',
                        border: `1px solid rgba(200,164,74,0.15)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Upload size={16} style={{ color: T3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: T2 }}>Nenhuma foto adicionada</span>
                      <span style={{ fontSize: 10, color: GOLD, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Toque para enviar
                      </span>
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
                              height: 76, width: 108, objectFit: 'cover',
                              borderRadius: 10,
                              border: '1px solid rgba(255,255,255,0.08)',
                              display: 'block',
                            }}
                          />
                          <button
                            onClick={() => removePhoto(aId, i)}
                            aria-label="Remover foto"
                            style={{
                              position: 'absolute', top: -6, right: -6,
                              width: 22, height: 22, borderRadius: '50%',
                              background: '#F87171',
                              border: `2px solid ${BG}`,
                              color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(248,113,113,0.4)',
                            }}
                          >
                            <X size={10} strokeWidth={2.5} />
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
        background: 'rgba(5,8,15,0.97)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: `1px solid ${GOLD_B}`,
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        boxShadow: '0 -1px 0 rgba(200,164,74,0.05)',
      }}>
        <div>
          {msg
            ? <span style={{ fontSize: 12, fontFamily: FM, color: saved ? '#4ADE80' : '#F87171', letterSpacing: '0.3px' }}>{msg}</span>
            : <span style={{ fontSize: 12, color: T3 }}>
                <span style={{ color: T2, fontWeight: 600 }}>{filledCount}</span>
                {' '}de {totalCount} áreas preenchidas
              </span>
          }
        </div>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 44, padding: '0 22px', borderRadius: 12,
            background: saved
              ? 'rgba(74,222,128,0.12)'
              : 'linear-gradient(135deg, #162840 0%, #0F2035 100%)',
            border: `1.5px solid ${saved ? 'rgba(74,222,128,0.4)' : GOLD_BM}`,
            color: saved ? '#4ADE80' : T1,
            fontSize: 12, fontWeight: 700,
            letterSpacing: '1.2px', textTransform: 'uppercase',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all .25s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: saved
              ? '0 0 20px rgba(74,222,128,0.15)'
              : '0 2px 16px rgba(200,164,74,0.14), inset 0 1px 0 rgba(255,255,255,0.06)',
            fontFamily: FS,
          }}
        >
          {saved ? <Check size={15} strokeWidth={2.5} /> : <Save size={14} />}
          {saving ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar áreas comuns'}
        </button>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #4A5568; }
        input:focus, textarea:focus {
          border-color: rgba(200,164,74,0.55) !important;
          box-shadow: 0 0 0 3px rgba(200,164,74,0.09) !important;
        }
        input:hover:not(:focus), textarea:hover:not(:focus) {
          border-color: rgba(200,164,74,0.35) !important;
        }
      `}</style>
    </div>
  )
}
