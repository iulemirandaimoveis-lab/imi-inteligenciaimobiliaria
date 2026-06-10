'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Save, Image as ImageIcon, Video, Box } from 'lucide-react'

// Áreas comuns do mapa do Alto Bellevue (as posições/pinos vêm do mapa; aqui só a mídia/textos).
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

// Áreas padrão (seed) — o usuário preenche a mídia de cada uma.
const DEFAULT_AREAS: { id: string; label: string }[] = [
  { id: 'portaria', label: 'Portaria Principal' },
  { id: 'lazer', label: 'Área de Lazer / Clube' },
  { id: 'coworking', label: 'Coworking · Bloco Administrativo' },
  { id: 'recreativa-01', label: 'Área Recreativa 01' },
  { id: 'recreativa-02', label: 'Área Recreativa 02' },
  { id: 'recreativa-03', label: 'Área Recreativa 03' },
  { id: 'area-verde', label: 'Áreas Verdes' },
  { id: 'capela', label: 'Capela' },
]

export default function MapaAreasComunsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [areas, setAreas] = useState<Record<string, MapAmenity>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch(`/api/developments/${id}/map-amenities`)
      .then((r) => r.json())
      .then((d) => {
        const saved: MapAmenity[] = Array.isArray(d?.amenities) ? d.amenities : []
        const map: Record<string, MapAmenity> = {}
        for (const a of DEFAULT_AREAS) map[a.id] = { id: a.id }
        for (const a of saved) map[a.id] = { ...map[a.id], ...a }
        setAreas(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const update = (areaId: string, patch: Partial<MapAmenity>) =>
    setAreas((prev) => ({ ...prev, [areaId]: { ...prev[areaId], ...patch } }))

  const uploadPhoto = useCallback(async (areaId: string, file: File) => {
    setMsg('Enviando foto…')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload?bucket=media&folder=alto-bellevue-areas', { method: 'POST', body: fd })
      const data = await res.json()
      const url = data?.data?.url
      if (!res.ok || !url) { setMsg(data?.error || 'Falha no upload'); return }
      setAreas((prev) => {
        const a = prev[areaId] ?? { id: areaId }
        return { ...prev, [areaId]: { ...a, photos: [...(a.photos ?? []), url] } }
      })
      setMsg('Foto adicionada ✓')
    } catch {
      setMsg('Falha no upload')
    }
  }, [])

  const removePhoto = (areaId: string, idx: number) =>
    setAreas((prev) => {
      const a = prev[areaId]; const photos = [...(a.photos ?? [])]; photos.splice(idx, 1)
      return { ...prev, [areaId]: { ...a, photos } }
    })

  const save = useCallback(async () => {
    setSaving(true); setMsg(null)
    const payload = Object.values(areas).filter(
      (a) => a.description || a.title || a.subtitle || a.video || a.tour360 || (a.photos && a.photos.length),
    )
    try {
      const res = await fetch(`/api/developments/${id}/map-amenities`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenities: payload }),
      })
      const data = await res.json()
      setMsg(res.ok ? `Salvo ✓ (${data.count} áreas)` : data?.error || 'Erro ao salvar')
    } catch {
      setMsg('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }, [areas, id])

  if (loading) return <div className="p-8 text-sm text-gray-500">Carregando áreas comuns…</div>

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-28">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Voltar">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#0B1B2D]">Áreas comuns do mapa</h1>
          <p className="text-xs text-gray-500">Suba fotos, vídeo e tour 360° de cada área. Os pinos no mapa já estão posicionados.</p>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {DEFAULT_AREAS.map(({ id: aId, label }) => {
          const a = areas[aId] ?? { id: aId }
          return (
            <div key={aId} className="rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="font-bold text-[#0B1B2D] mb-3">{a.title || label}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={a.title ?? ''} onChange={(e) => update(aId, { title: e.target.value })}
                  placeholder="Título (ex.: Área de Lazer)" className="border rounded-lg px-3 py-2 text-sm" />
                <input value={a.subtitle ?? ''} onChange={(e) => update(aId, { subtitle: e.target.value })}
                  placeholder="Subtítulo (ex.: Convivência e bem-estar)" className="border rounded-lg px-3 py-2 text-sm" />
              </div>
              <textarea value={a.description ?? ''} onChange={(e) => update(aId, { description: e.target.value })}
                placeholder="Descrição da área…" rows={2} className="border rounded-lg px-3 py-2 text-sm w-full mt-3" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <label className="text-xs text-gray-500 flex flex-col gap-1">
                  <span className="flex items-center gap-1"><Video size={13} /> Vídeo (URL de embed)</span>
                  <input value={a.video ?? ''} onChange={(e) => update(aId, { video: e.target.value })}
                    placeholder="https://www.youtube.com/embed/…" className="border rounded-lg px-3 py-2 text-sm" />
                </label>
                <label className="text-xs text-gray-500 flex flex-col gap-1">
                  <span className="flex items-center gap-1"><Box size={13} /> Tour 360° (URL)</span>
                  <input value={a.tour360 ?? ''} onChange={(e) => update(aId, { tour360: e.target.value })}
                    placeholder="https://kuula.co/share/…" className="border rounded-lg px-3 py-2 text-sm" />
                </label>
              </div>

              {/* Fotos */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><ImageIcon size={13} /> Fotos</span>
                  <button onClick={() => fileRefs.current[aId]?.click()}
                    className="text-xs font-semibold text-[#0B1B2D] flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
                    <Upload size={13} /> Enviar foto
                  </button>
                  <input ref={(el) => { fileRefs.current[aId] = el }} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(aId, f); e.target.value = '' }} />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {(a.photos ?? []).map((url, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-20 w-28 object-cover rounded-lg border" />
                      <button onClick={() => removePhoto(aId, i)} aria-label="Remover"
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {(!a.photos || a.photos.length === 0) && <span className="text-xs text-gray-400 py-6">Nenhuma foto ainda.</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Barra fixa de salvar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex items-center justify-between gap-3 z-20">
        <span className="text-xs text-gray-500">{msg}</span>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-[#0B1B2D] text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
          <Save size={15} /> {saving ? 'Salvando…' : 'Salvar áreas comuns'}
        </button>
      </div>
    </div>
  )
}
