'use client'

import { useState, useCallback } from 'react'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import { T } from '@/app/(backoffice)/lib/theme'
import { toast } from 'sonner'
import { Copy, Check, Camera, Film, Sparkles } from 'lucide-react'

/* ═══ CHARACTER ANCHOR ═══ */
const CHARACTER_ANCHOR = {
    flux: `Man, early-to-mid 30s, South Asian/Mediterranean mixed ethnicity appearance. Medium-length wavy dark brown hair swept back with natural volume, slight widow's peak. Well-groomed short beard with subtle salt-and-pepper undertones at jawline. Strong defined jawline, straight nose with slight aquiline bridge, deep-set dark brown eyes with visible under-eye texture, natural skin pores and micro-imperfections. Medium-warm olive skin tone with subtle redness on cheeks and nose bridge. Athletic-lean build. Expression: composed, contemplative, quietly confident — never smiling broadly, always with a restrained subtle expression.`,
    dalle: `A man in his early-to-mid thirties with a South Asian/Mediterranean mixed ethnicity appearance. He has medium-length wavy dark brown hair swept back with natural volume and a slight widow's peak. His beard is short, well-groomed, with subtle salt-and-pepper undertones along the jawline. He has a strong, defined jawline, a straight nose with a slight aquiline bridge, and deep-set dark brown eyes with visible under-eye texture. His skin is a medium-warm olive tone with natural pores, subtle redness on cheeks and nose bridge, and realistic micro-imperfections. He has an athletic-lean build. His expression is always composed, contemplative, and quietly confident — never broadly smiling.`,
    kling: `Man, early-to-mid 30s, South Asian/Mediterranean mixed ethnicity. Medium-length wavy dark brown hair swept back naturally, short well-groomed beard with subtle salt-and-pepper at jawline. Strong jawline, straight nose with slight aquiline bridge, deep-set dark brown eyes. Medium-warm olive skin with natural texture. Athletic-lean build. Expression: composed and contemplative.`,
    veo: `A man in his early-to-mid thirties with South Asian/Mediterranean mixed ethnicity. He has medium-length wavy dark brown hair swept back with natural volume and a slight widow's peak. His short beard is well-groomed with subtle salt-and-pepper undertones along the jawline. He has a strong, defined jawline, a straight nose with a slight aquiline bridge, and deep-set dark brown eyes with visible under-eye texture. His skin is medium-warm olive with natural pores and micro-imperfections. Athletic-lean build. His expression is composed, contemplative, and quietly authoritative.`,
}

const WARDROBES: Record<string, string> = {
    executive_night: 'Navy blue tailored slim-fit blazer, white dress shirt with spread collar unbuttoned at top, no tie. Visible shirt cuff extending 1cm beyond blazer sleeve. Premium wool texture visible on blazer.',
    boardroom: 'Same navy blazer, white shirt fully buttoned with no tie. Standing posture, hands clasped or resting on table surface.',
    editorial_casual: 'Dark charcoal crew-neck cashmere sweater over white collared shirt, collar visible at neckline.',
    formal: 'Dark navy three-piece suit, white shirt, matte silk navy tie, pocket square with subtle fold.',
}

const ENVIRONMENTS: Record<string, string> = {
    office_night: 'High-rise corner office, floor-to-ceiling glass windows, nighttime city skyline visible with warm amber and cool blue bokeh lights. Dark walnut executive desk, minimal objects on surface. Warm tungsten desk lamp as practical light source.',
    boardroom: 'Long walnut conference table, 10-12 leather executive chairs, floor-to-ceiling glass walls with city night view. Two-three industrial pendant lamps casting warm pools of light. Clean, minimal, no clutter.',
    lobby_dusk: 'Modern building lobby with double-height ceilings, travertine flooring, golden hour light streaming through entry glass. Minimal furniture, architectural columns.',
    rooftop: 'Urban rooftop at blue hour/dusk, city skyline in background, concrete parapet, atmospheric haze. Wind subtly moving hair.',
    car_interior: 'Back seat of luxury sedan, black leather interior, city lights passing through windows creating moving light patterns on face.',
}

const LIGHTING: Record<string, string> = {
    noir_executive: 'Key light from practical desk lamp (3200K tungsten) at 45° camera-left, creating Rembrandt pattern on face. Fill from city ambient through glass (5500K) at 8:1 ratio. Deep shadows, controlled highlights.',
    golden_hour: 'Warm directional sunlight (4500K) at low angle through window, casting long shadows. Soft ambient fill from reflected surfaces. Skin glow with subsurface scattering visible.',
    cool_corporate: 'Overhead cool white (5600K) mixed with warm practicals (3200K). Neutral fill, slight under-eye shadow. Clean, editorial, Vanity Fair-style.',
    dramatic_rim: 'Strong backlight/rim light from window creating edge separation on hair and shoulders. Face lit by reflected ambient only — moody, low-key, cinematic.',
}

const LENSES: Record<string, string> = {
    portrait_85: 'Canon EF 85mm f/1.4L IS USM, full-frame, f/1.4, creamy background bokeh, medium close-up to bust shot.',
    environmental_35: 'Canon EF 35mm f/1.4L II, full-frame, f/2.0, subject-in-environment context, slight wide perspective.',
    detail_100: 'Canon EF 100mm f/2.8L Macro, full-frame, f/2.8, extreme close-up detail shot. Razor-thin focus plane.',
    anamorphic_50: 'Arri/Zeiss Master Anamorphic 50mm T1.9, 2x squeeze, horizontal lens flares, oval bokeh, widescreen cinematic.',
}

const ASPECTS: Record<string, string> = {
    '16:9': 'Landscape 16:9 — Hero banners, website headers, vídeo',
    '9:16': 'Vertical 9:16 — Stories, Reels, vertical video',
    '1:1': 'Square 1:1 — Feed posts',
    '4:5': 'Portrait 4:5 — Instagram feed optimal',
}

const NEGATIVE_FLUX = 'plastic skin, airbrushed, smooth skin, wax figure, CGI, cartoon, anime, illustration, painting, drawing, doll-like, perfect symmetry, uncanny valley, overexposed, flat lighting, stock photo, generic corporate, watermark, text overlay, deformed hands, extra fingers, merged fingers, blurry eyes, cropped head'

const LABEL_MAP: Record<string, string> = {
    executive_night: 'Executive Night', boardroom: 'Boardroom', editorial_casual: 'Editorial Casual', formal: 'Formal',
    office_night: 'Office Night', lobby_dusk: 'Lobby Dusk', rooftop: 'Rooftop Blue Hour', car_interior: 'Car Interior',
    noir_executive: 'Noir Executive', golden_hour: 'Golden Hour', cool_corporate: 'Cool Corporate', dramatic_rim: 'Dramatic Rim',
    portrait_85: '85mm Portrait', environmental_35: '35mm Environmental', detail_100: '100mm Detail/Macro', anamorphic_50: '50mm Anamorphic',
}

type Platform = 'flux' | 'dalle' | 'kling' | 'veo'
interface PromptResult { prompt: string; negative?: string; settings?: string; mode?: string; duration?: string; aspect?: string; reference?: string; safety?: string }

function buildPrompt(platform: Platform, wardrobe: string, environment: string, lighting: string, lens: string, aspect: string, customAction: string, cameraMove: string): PromptResult {
    const anchor = CHARACTER_ANCHOR[platform]
    const w = WARDROBES[wardrobe] || ''
    const e = ENVIRONMENTS[environment] || ''
    const l = LIGHTING[lighting] || ''
    const le = LENSES[lens] || ''
    const action = customAction ? customAction + '.' : ''

    if (platform === 'flux') {
        return {
            prompt: `Ultrarealistic cinematic photograph. ${anchor} ${w} ${action} ${e} ${l} Shot on Arri Alexa Mini with ${le} Film emulation: Kodak Vision3 500T 5219 with subtle grain structure. Natural subsurface scattering on skin, visible fabric texture on clothing, realistic material surfaces. 2K resolution, photorealistic, editorial photography quality.`,
            negative: NEGATIVE_FLUX,
            settings: `Aspect ratio: ${aspect} | Steps: 30-40 | Guidance: 7.0-7.5 | Sampler: DPM++ 2M Karras`,
        }
    }
    if (platform === 'dalle') {
        const fmt = aspect === '16:9' ? 'Wide landscape format 16:9.' : aspect === '9:16' ? 'Vertical portrait format 9:16.' : aspect === '1:1' ? 'Square format 1:1.' : 'Portrait format 4:5.'
        return {
            prompt: `Ultra-realistic editorial photograph, shot for a luxury business magazine feature. ${anchor} He is wearing ${w.toLowerCase()} ${customAction ? 'He is ' + customAction.toLowerCase() + '.' : ''} The scene is set in ${e.toLowerCase()} The lighting is ${l.toLowerCase()} Photographed with ${le} Shot on Arri Alexa Mini. Cinematic color grading with deep shadows and controlled highlights. Kodak Vision3 500T film emulation with subtle grain. Natural skin texture with visible pores and micro-imperfections, subsurface scattering. Professional studio-grade quality, 2K resolution. ${fmt}`,
            settings: `Size: ${aspect} | Style: natural | Quality: hd`,
        }
    }
    if (platform === 'kling') {
        return {
            prompt: `Cinematic ultra-realistic footage. ${anchor} Wearing ${w.toLowerCase()} ${customAction || 'Standing with composed stillness.'} ${e} ${l} ${cameraMove || 'Very slow push-in camera movement, almost imperceptible, creating a sense of closing gravity.'} City lights in background gently shift as bokeh orbs float subtly. Shot on Arri Alexa 35 with ${le} Cinematic color grading with deep blacks and controlled warm highlights.`,
            mode: 'Professional',
            duration: '10s',
            aspect: aspect === '9:16' ? '9:16' : '16:9',
            safety: 'Do NOT have the subject move hands expressively, turn head rapidly, or change expression. Static/minimal subject + moving camera = best results.',
        }
    }
    // veo
    return {
        prompt: `Cinematic footage in the style of David Fincher and Roger Deakins — controlled, meticulous, atmospheric. ${anchor} He wears ${w.toLowerCase()} ${customAction || 'He stands with quiet authority, barely moving.'} The setting: ${e.toLowerCase()} Lighting: ${l.toLowerCase()} Camera: ${cameraMove || 'Slow, deliberate tracking shot moving laterally, revealing the environment.'} Atmospheric haze catches light beams subtly. Shot on 35mm film, anamorphic bokeh, shallow depth of field, cinematic color grading, ultra-realistic, 2K resolution, professional filmmaking quality.`,
        duration: '8-10s',
        aspect: aspect === '9:16' ? '9:16' : '16:9',
        reference: 'Fincher/Deakins — controlled darkness, motivated lighting, architectural framing',
    }
}

const PLATFORMS = [
    { id: 'flux' as Platform, label: 'Flux', sub: 'Nano / Banana', icon: Camera },
    { id: 'dalle' as Platform, label: 'DALL-E', sub: 'GPT Image', icon: Sparkles },
    { id: 'kling' as Platform, label: 'Kling', sub: 'Vídeo', icon: Film },
    { id: 'veo' as Platform, label: 'Veo', sub: 'Vídeo', icon: Film },
]

export default function PromptAgentPage() {
    const [platform, setPlatform] = useState<Platform>('flux')
    const [wardrobe, setWardrobe] = useState('executive_night')
    const [environment, setEnvironment] = useState('office_night')
    const [lighting, setLighting] = useState('noir_executive')
    const [lens, setLens] = useState('portrait_85')
    const [aspect, setAspect] = useState('16:9')
    const [customAction, setCustomAction] = useState('')
    const [cameraMove, setCameraMove] = useState('')
    const [result, setResult] = useState<PromptResult | null>(null)
    const [copied, setCopied] = useState('')

    const isVideo = platform === 'kling' || platform === 'veo'

    const generate = useCallback(() => {
        const output = buildPrompt(platform, wardrobe, environment, lighting, lens, aspect, customAction, cameraMove)
        setResult(output)
        setCopied('')
    }, [platform, wardrobe, environment, lighting, lens, aspect, customAction, cameraMove])

    const copyField = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(label)
            toast.success(`${label} copiado!`)
            setTimeout(() => setCopied(''), 2000)
        })
    }

    const copyAll = () => {
        if (!result) return
        const full = Object.entries(result).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('\n\n')
        copyField(full, 'all')
    }

    const selectStyle = (active: boolean): React.CSSProperties => ({
        width: '100%', padding: '8px 12px',
        background: active ? 'var(--g10, rgba(200,164,74,.10))' : 'rgba(20,36,64,.5)',
        border: `1px solid ${active ? 'var(--gold, #C8A44A)' : 'var(--bdg, rgba(200,164,74,.14))'}`,
        borderRadius: 6, color: 'var(--t1, #E8E4DC)',
        fontFamily: "var(--fu, 'Outfit', sans-serif)", fontSize: 10,
        cursor: 'pointer', outline: 'none',
    })

    return (
        <div className="space-y-5">
            <PageIntelHeader
                moduleLabel="CONTEÚDO · IA"
                title="Prompt Agent"
                subtitle="Cinematic Visual Identity Generator — Flux, DALL-E, Kling, Veo"
                live
            />

            {/* Platform selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.map(p => {
                    const active = platform === p.id
                    const Icon = p.icon
                    return (
                        <button key={p.id} onClick={() => { setPlatform(p.id); setResult(null) }}
                            style={{
                                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
                                background: active ? 'var(--g10)' : 'rgba(14,28,48,.52)',
                                border: `1px solid ${active ? 'var(--gold)' : 'rgba(200,164,74,.12)'}`,
                                borderRadius: 14, cursor: 'pointer', transition: 'all .25s',
                                backdropFilter: 'blur(20px)',
                            }}>
                            <Icon size={16} style={{ color: active ? 'var(--gold)' : 'var(--t3)' }} />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--gold)' : 'var(--t1)' }}>{p.label}</div>
                                <div style={{ fontSize: 8, color: 'var(--t3)' }}>{p.sub}</div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Controls grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                    { label: 'VESTUÁRIO', value: wardrobe, set: setWardrobe, opts: Object.keys(WARDROBES) },
                    { label: 'AMBIENTE', value: environment, set: setEnvironment, opts: Object.keys(ENVIRONMENTS) },
                    { label: 'ILUMINAÇÃO', value: lighting, set: setLighting, opts: Object.keys(LIGHTING) },
                    { label: 'LENTE', value: lens, set: setLens, opts: Object.keys(LENSES) },
                    { label: 'ASPECTO', value: aspect, set: setAspect, opts: Object.keys(ASPECTS) },
                ].map(f => (
                    <div key={f.label}>
                        <label style={{ display: 'block', fontSize: 7, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 600, marginBottom: 4 }}>{f.label}</label>
                        <select value={f.value} onChange={e => f.set(e.target.value)} style={selectStyle(false)}>
                            {f.opts.map(o => <option key={o} value={o} style={{ background: 'var(--n)' }}>{LABEL_MAP[o] || ASPECTS[o] || o}</option>)}
                        </select>
                    </div>
                ))}
            </div>

            {/* Custom inputs */}
            <div>
                <label style={{ display: 'block', fontSize: 7, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 600, marginBottom: 4 }}>AÇÃO / POSE CUSTOMIZADA</label>
                <textarea value={customAction} onChange={e => setCustomAction(e.target.value)}
                    placeholder="Ex: Standing beside window, one hand in pocket, looking outward..."
                    rows={2} style={{ ...selectStyle(false), resize: 'vertical', lineHeight: 1.6 }} />
            </div>
            {isVideo && (
                <div>
                    <label style={{ display: 'block', fontSize: 7, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 600, marginBottom: 4 }}>MOVIMENTO DE CÂMERA</label>
                    <textarea value={cameraMove} onChange={e => setCameraMove(e.target.value)}
                        placeholder="Ex: Very slow dolly push-in from medium-wide to medium close-up..."
                        rows={2} style={{ ...selectStyle(false), resize: 'vertical', lineHeight: 1.6 }} />
                </div>
            )}

            {/* Generate */}
            <button onClick={generate} style={{
                position: 'relative', overflow: 'hidden', width: '100%', padding: '14px 24px',
                background: 'var(--n, #0A1624)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                fontFamily: "var(--fu)", fontWeight: 600, fontSize: 11, letterSpacing: '1px',
                textTransform: 'uppercase', cursor: 'pointer',
            }}>
                GERAR PROMPT
                <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
            </button>

            {/* Result */}
            {result && (
                <div style={{ background: 'rgba(14,28,48,.52)', backdropFilter: 'blur(20px)', border: '1px solid rgba(200,164,74,.12)', borderRadius: 16, padding: 22, boxShadow: '0 8px 32px rgba(0,0,0,.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 7, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>OUTPUT — {platform.toUpperCase()}</span>
                        <button onClick={copyAll} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'transparent', border: '1px solid rgba(200,164,74,.14)', borderRadius: 4, color: copied === 'all' ? 'var(--grn)' : 'var(--t3)', fontSize: 8, cursor: 'pointer' }}>
                            {copied === 'all' ? <Check size={10} /> : <Copy size={10} />}
                            {copied === 'all' ? 'COPIADO' : 'COPIAR TUDO'}
                        </button>
                    </div>

                    {/* Prompt */}
                    <OutputBlock label="PROMPT" text={result.prompt} onCopy={() => copyField(result.prompt, 'prompt')} copied={copied === 'prompt'} />
                    {result.negative && <OutputBlock label="NEGATIVE" text={result.negative} onCopy={() => copyField(result.negative!, 'negative')} copied={copied === 'negative'} />}
                    {result.settings && <OutputBlock label="SETTINGS" text={result.settings} onCopy={() => copyField(result.settings!, 'settings')} copied={copied === 'settings'} />}

                    {/* Video meta */}
                    {result.mode && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <MetaField label="MODE" value={result.mode} />
                            <MetaField label="DURATION" value={result.duration || ''} />
                            <MetaField label="ASPECT" value={result.aspect || ''} />
                        </div>
                    )}
                    {result.reference && <div className="mt-3"><MetaField label="STYLE REFERENCE" value={result.reference} /></div>}
                    {result.safety && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.12)', borderRadius: 8, fontSize: 9, color: 'var(--t2)', lineHeight: 1.6 }}>
                            <span style={{ color: 'var(--red)', fontWeight: 600, fontSize: 7, letterSpacing: '1.5px' }}>MOTION SAFETY</span><br />
                            {result.safety}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function OutputBlock({ label, text, onCopy, copied }: { label: string; text: string; onCopy: () => void; copied: boolean }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 7, letterSpacing: '2px', color: 'var(--t3)', fontWeight: 600 }}>{label}</span>
                <button onClick={onCopy} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: 'transparent', border: '1px solid var(--bdr)', borderRadius: 4, color: copied ? 'var(--grn)' : 'var(--t3)', fontSize: 8, cursor: 'pointer' }}>
                    {copied ? <Check size={9} /> : <Copy size={9} />}
                    {copied ? 'COPIADO' : 'COPIAR'}
                </button>
            </div>
            <div style={{ padding: 14, background: 'rgba(0,0,0,.25)', border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 10, lineHeight: 1.8, color: 'var(--t2)', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {text}
            </div>
        </div>
    )
}

function MetaField({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: '8px 12px', background: 'rgba(20,36,64,.3)', border: '1px solid var(--bdr)', borderRadius: 6 }}>
            <span style={{ fontSize: 7, letterSpacing: '2px', color: 'var(--t3)', fontWeight: 600, display: 'block', marginBottom: 2 }}>{label}</span>
            <span style={{ fontSize: 10, color: 'var(--t1)', fontFamily: "var(--fm)" }}>{value}</span>
        </div>
    )
}
