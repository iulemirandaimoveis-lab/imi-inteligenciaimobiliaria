'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronRight, ChevronLeft, Sparkles, Globe, FileText,
    User, Building2, Settings, Send, CheckCircle, Loader2,
    AlertCircle, Copy, Download, Mail, MessageSquare,
    FileSignature, Lock, Shield, Eye, X, Plus
} from 'lucide-react'
import { MODELOS_CONTRATOS, CATEGORIAS_LABEL, IDIOMAS_LABEL, getModeloById } from '@/lib/modelos-contratos'

const T = {
    bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textMuted: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
    accent: 'var(--bo-accent)',
}
const ICONES_CAT: Record<string, string> = {
    locacao: '🏠', venda: '📋', captacao: '🎯', avaliacao: '⚖️', credito: '💳',
    consultoria: '💼', prestacao_servicos: '⚙️', parceria: '🤝',
    gestao_patrimonial: '📈', fundo_investimento: '🏛️', internacional: '🌐', outros: '🔒',
}
const STEPS = [
    { id: 'modelo', label: 'Modelo', icon: FileText },
    { id: 'idioma', label: 'Idioma & Assinatura', icon: Globe },
    { id: 'contratante', label: 'Contratante', icon: User },
    { id: 'contratado', label: 'Contratado', icon: Building2 },
    { id: 'dados', label: 'Dados', icon: Settings },
    { id: 'gerar', label: 'Gerar', icon: Sparkles },
]
const PLATAFORMAS = [
    { id: 'sem_assinatura', label: 'Sem assinatura digital', sub: 'Gera e baixa — assine fisicamente ou via outro meio', icon: FileText, cor: '#4E5669', gratuito: true, env: '' },
    { id: 'clicksign', label: 'ClickSign', sub: 'Juridicamente válido BR · WhatsApp integrado · ~R$99/mês', icon: FileSignature, cor: 'var(--bo-accent)', gratuito: false, env: 'CLICKSIGN_ACCESS_TOKEN' },
    { id: 'docusign', label: 'DocuSign', sub: 'Aceito globalmente · maior plataforma de assinatura do mundo', icon: Shield, cor: '#7B9EC4', gratuito: false, env: 'DOCUSIGN_ACCESS_TOKEN' },
    { id: 'govbr', label: 'Gov.br Assinatura', sub: 'Gratuito · válido no Brasil · exige CPF autenticado via Gov.br', icon: Lock, cor: '#6BB87B', gratuito: true, env: 'GOVBR_CLIENT_ID' },
]
const SEC_LABELS: Record<string, string> = {
    objeto: '📦 Objeto', valores: '💰 Valores', prazos: '📅 Prazos',
    condicoes: '📋 Condições', garantias: '🛡️ Garantias',
}
const st = (extra?: any): React.CSSProperties => ({
    width: '100%', background: T.elevated, border: `1px solid ${T.border}`,
    borderRadius: 12, color: T.text, fontSize: 13, padding: '10px 14px', outline: 'none', ...extra
})
const onF = (e: any) => (e.target.style.border = `1px solid ${T.borderGold}`)
const onB = (e: any) => (e.target.style.border = `1px solid ${T.border}`)

function Campo({ campo, value, onChange }: any) {
    if (campo.tipo === 'textarea')
        return <textarea value={value || ''} onChange={e => onChange(e.target.value)}
            placeholder={campo.placeholder || campo.label} rows={3} onFocus={onF} onBlur={onB}
            style={{ ...st(), resize: 'vertical', minHeight: 72 }} />
    if (campo.tipo === 'select')
        return <select value={value || ''} onChange={e => onChange(e.target.value)} onFocus={onF} onBlur={onB} style={st()}>
            <option value=''>Selecione...</option>
            {campo.opcoes?.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
    if (campo.tipo === 'currency')
        return <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: T.accent }}>R$</span>
            <input type="number" value={value || ''} onChange={e => onChange(parseFloat(e.target.value) || '')}
                placeholder="0,00" onFocus={onF} onBlur={onB} style={st({ paddingLeft: 36 })} />
        </div>
    return <input type={campo.tipo === 'date' ? 'date' : campo.tipo === 'number' ? 'number' : 'text'}
        value={value || ''} onChange={e => onChange(campo.tipo === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
        placeholder={campo.placeholder || campo.label} onFocus={onF} onBlur={onB} style={st()} />
}

function FormParte({ titulo, parte, onChange }: { titulo: string; parte: any; onChange: (p: any) => void }) {
    const set = (k: string) => (v: any) => onChange({ ...parte, [k]: v })
    const LB = ({ ch }: { ch: string }) => <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: T.textDim }}>{ch}</label>
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--bo-active-bg)' }}><User size={15} style={{ color: T.accent }} /></div>
                <h3 className="text-sm font-bold" style={{ color: T.text }}>{titulo}</h3>
            </div>
            <div className="flex gap-2">
                {['pessoa_fisica', 'pessoa_juridica'].map(t => (
                    <button key={t} onClick={() => onChange({ ...parte, tipo: t })}
                        className="flex-1 h-10 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: parte.tipo === t ? 'var(--bo-accent)' : T.elevated, color: parte.tipo === t ? 'white' : T.textDim, border: `1px solid ${parte.tipo === t ? T.borderGold : T.border}` }}>
                        {t === 'pessoa_fisica' ? '👤 Pessoa Física' : '🏢 Pessoa Jurídica'}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parte.tipo === 'pessoa_juridica' && <>
                    <div className="sm:col-span-2"><LB ch="Razão Social *" /><input value={parte.razao_social || ''} onChange={e => set('razao_social')(e.target.value)} placeholder="Nome da empresa" style={st()} onFocus={onF} onBlur={onB} /></div>
                    <div><LB ch="CNPJ *" /><input value={parte.cpf_cnpj || ''} onChange={e => set('cpf_cnpj')(e.target.value)} placeholder="00.000.000/0001-00" style={st()} onFocus={onF} onBlur={onB} /></div>
                    <div><LB ch="Representante Legal *" /><input value={parte.representante || ''} onChange={e => set('representante')(e.target.value)} placeholder="Nome completo" style={st()} onFocus={onF} onBlur={onB} /></div>
                    <div><LB ch="Cargo" /><input value={parte.cargo_representante || ''} onChange={e => set('cargo_representante')(e.target.value)} placeholder="Diretor, Sócio..." style={st()} onFocus={onF} onBlur={onB} /></div>
                </>}
                {parte.tipo === 'pessoa_fisica' && <>
                    <div><LB ch="CPF *" /><input value={parte.cpf_cnpj || ''} onChange={e => set('cpf_cnpj')(e.target.value)} placeholder="000.000.000-00" style={st()} onFocus={onF} onBlur={onB} /></div>
                    <div><LB ch="Estado Civil" />
                        <select value={parte.estado_civil || ''} onChange={e => set('estado_civil')(e.target.value)} style={st()} onFocus={onF} onBlur={onB}>
                            <option value=''>Selecione</option>
                            {['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div><LB ch="Profissão" /><input value={parte.profissao || ''} onChange={e => set('profissao')(e.target.value)} placeholder="Profissão" style={st()} onFocus={onF} onBlur={onB} /></div>
                    <div><LB ch="Nacionalidade" /><input value={parte.nacionalidade || ''} onChange={e => set('nacionalidade')(e.target.value)} placeholder="Brasileiro(a)" style={st()} onFocus={onF} onBlur={onB} /></div>
                </>}
                <div className="sm:col-span-2"><LB ch={parte.tipo === 'pessoa_juridica' ? 'Nome do contato' : 'Nome completo *'} />
                    <input value={parte.nome || ''} onChange={e => set('nome')(e.target.value)} placeholder="Nome completo" style={st()} onFocus={onF} onBlur={onB} />
                </div>
                <div><LB ch="Email *" /><input type="email" value={parte.email || ''} onChange={e => set('email')(e.target.value)} placeholder="email@exemplo.com" style={st()} onFocus={onF} onBlur={onB} /></div>
                <div><LB ch="Telefone / WhatsApp" /><input value={parte.telefone || ''} onChange={e => set('telefone')(e.target.value)} placeholder="+55 (81) 99999-9999" style={st()} onFocus={onF} onBlur={onB} /></div>
                <div className="sm:col-span-2"><LB ch="Endereço completo" />
                    <input value={parte.endereco || ''} onChange={e => set('endereco')(e.target.value)} placeholder="Rua, nº, bairro, cidade/UF, CEP" style={st()} onFocus={onF} onBlur={onB} />
                </div>
            </div>
        </div>
    )
}

function NovoContratoInner() {
    const router = useRouter()
    const sp = useSearchParams()
    const pm = sp.get('modelo')

    const [step, setStep] = useState(pm ? 1 : 0)
    const [modelo, setModelo] = useState<any>(pm ? getModeloById(pm) || null : null)
    const [catF, setCatF] = useState('todos')
    const [busca, setBusca] = useState('')
    const [idiomasSel, setIdiomasSel] = useState<string[]>(['pt'])
    const [idiomaPrim, setIdiomaPrim] = useState('pt')
    const [plat, setPlat] = useState('sem_assinatura')
    const [contratante, setContratante] = useState<any>({ tipo: 'pessoa_fisica' })
    const [contratado, setContratado] = useState<any>({
        tipo: 'pessoa_juridica', nome: 'Iule Miranda', razao_social: 'IMI — Iule Miranda Imóveis',
        cpf_cnpj: '00.000.000/0001-00', email: 'iulemirandaimoveis@gmail.com',
        telefone: '+55 (81) 99999-9999', representante: 'Iule Miranda',
        cargo_representante: 'CRECI 17933 — Corretor de Imóveis', endereco: 'Recife, PE',
    })
    const [dados, setDados] = useState<any>({})
    const [notas, setNotas] = useState('')
    const [gerando, setGerando] = useState(false)
    const [gerado, setGerado] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [resultado, setResultado] = useState<any>(null)
    const [enviando, setEnviando] = useState(false)
    const [envioOk, setEnvioOk] = useState(false)
    const [canal, setCanal] = useState<'email' | 'whatsapp' | 'ambos'>('email')
    const [preview, setPreview] = useState(false)

    const mFiltrados = MODELOS_CONTRATOS.filter(m => {
        const mc = catF === 'todos' || m.categoria === catF
        const mb = !busca || m.nome.toLowerCase().includes(busca.toLowerCase()) || m.tags.some(t => t.includes(busca.toLowerCase()))
        return mc && mb
    })

    const ok = () => {
        if (step === 0) return !!modelo
        if (step === 1) return idiomasSel.length > 0
        if (step === 2) return !!(contratante.nome && contratante.email)
        if (step === 3) return !!(contratado.nome && contratado.email)
        if (step === 4) return (modelo?.campos.filter((c: any) => c.required) || []).every((c: any) => dados[c.key])
        return true
    }

    const gerar = async (lang: string) => {
        setGerando(true); setErro(null)
        try {
            const r = await fetch('/api/contratos/gerar', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelo_id: modelo?.id, idioma: lang, contratante, contratado, dados_contrato: dados, criado_por_nome: 'Iule Miranda', notas_adicionais: notas }),
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error)
            setResultado(d); setGerado(true)
            fetch('/api/contratos/salvar', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...d, modelo_id: modelo?.id, modelo_nome: modelo?.nome, categoria: modelo?.categoria, idioma: lang, contratante, contratado, dados_contrato: dados, criado_por: 'iule@imi.imb.br', criado_por_nome: 'Iule Miranda', notas }),
            })
        } catch (e: any) { setErro(e.message) }
        finally { setGerando(false) }
    }

    const enviar = async () => {
        if (!resultado) return; setEnviando(true)
        try {
            await fetch('/api/contratos/enviar', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ canal, destinatario_email: contratante.email, destinatario_telefone: contratante.telefone, contrato_numero: resultado.numero, contrato_tipo: modelo?.nome, contrato_url: resultado.pdf_url || window.location.href, criado_por_nome: 'Iule Miranda', idioma: idiomaPrim }),
            })
            setEnvioOk(true)
        } catch { } finally { setEnviando(false) }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <ChevronLeft size={16} style={{ color: T.textMuted }} />
                </button>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>{gerado ? `✓ ${resultado?.numero}` : 'Novo Contrato'}</h1>
                    <p className="text-xs mt-0.5" style={{ color: T.textDim }}>{modelo ? modelo.nome : 'Selecione um modelo'}</p>
                </div>
            </motion.div>

            {!gerado && (
                <div className="flex items-center gap-0 overflow-x-auto pb-1">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center flex-shrink-0">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ background: i < step ? '#6BB87B' : i === step ? 'var(--bo-accent)' : T.surface, color: i <= step ? 'white' : T.textDim, border: i > step ? `1px solid ${T.border}` : 'none' }}>
                                    {i < step ? '✓' : i + 1}
                                </div>
                                <span className="text-[10px] mt-1 hidden sm:block" style={{ color: i === step ? T.accent : T.textDim }}>{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className="w-6 sm:w-8 h-px mx-1" style={{ background: i < step ? '#6BB87B' : T.border }} />}
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {!gerado && step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                        <div className="rounded-2xl p-4 space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <input placeholder="🔍 Buscar modelo..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full h-10 px-4 rounded-xl text-sm outline-none" style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }} onFocus={onF} onBlur={onB} />
                            <div className="flex gap-2 overflow-x-auto pb-0.5">
                                {['todos', ...Object.keys(CATEGORIAS_LABEL)].map(cat => (
                                    <button key={cat} onClick={() => setCatF(cat)} className="px-3 h-8 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                                        style={{ background: catF === cat ? 'var(--bo-accent)' : T.elevated, color: catF === cat ? 'white' : T.textDim, border: `1px solid ${catF === cat ? T.borderGold : T.border}` }}>
                                        {cat === 'todos' ? 'Todos' : `${ICONES_CAT[cat] || ''} ${(CATEGORIAS_LABEL as any)[cat]}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto">
                            {mFiltrados.map((m, i) => {
                                const sel = modelo?.id === m.id
                                return (
                                    <motion.button key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                        onClick={() => setModelo(m)} className="text-left rounded-2xl p-4 transition-all"
                                        style={{ background: sel ? 'var(--bo-active-bg)' : T.surface, border: `1px solid ${sel ? T.borderGold : T.border}` }}>
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl w-10 h-10 flex items-center justify-center flex-shrink-0">{ICONES_CAT[m.categoria]}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                    <p className="text-xs font-semibold" style={{ color: sel ? T.accent : T.text }}>{m.nome}</p>
                                                    {m.popular && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bo-hover)', color: T.accent }}>★</span>}
                                                    {m.internacional && <span className="text-[9px]" style={{ color: '#E8A87C' }}>🌐</span>}
                                                </div>
                                                <p className="text-[10px] line-clamp-2" style={{ color: T.textDim }}>{m.descricao}</p>
                                                <div className="flex gap-1 mt-1.5">{m.idiomas.map((l: string) => <span key={l} className="text-[10px]">{(IDIOMAS_LABEL as any)[l]?.flag}</span>)}</div>
                                            </div>
                                        </div>
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {!gerado && step === 1 && modelo && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>Idioma(s) do contrato</h3>
                            <p className="text-xs mb-4" style={{ color: T.textDim }}>PT-BR obrigatório. Selecione os idiomas adicionais disponíveis neste modelo.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Object.entries(IDIOMAS_LABEL).map(([lang, cfg]: any) => {
                                    const disp = modelo.idiomas.includes(lang)
                                    const sel = idiomasSel.includes(lang)
                                    const obrig = lang === 'pt'
                                    return (
                                        <button key={lang} disabled={!disp || obrig}
                                            onClick={() => { if (obrig) return; setIdiomasSel(p => p.includes(lang) ? p.filter(l => l !== lang) : [...p, lang]) }}
                                            className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                                            style={{ background: sel ? 'var(--bo-active-bg)' : T.elevated, border: `1px solid ${sel ? T.borderGold : T.border}`, opacity: disp ? 1 : 0.3, cursor: disp && !obrig ? 'pointer' : 'default' }}>
                                            <span className="text-xl">{cfg.flag}</span>
                                            <div>
                                                <p className="text-xs font-semibold" style={{ color: sel ? T.accent : T.text }}>{cfg.label}</p>
                                                <p className="text-[9px]" style={{ color: T.textDim }}>{obrig ? 'Obrigatório' : disp ? (sel ? '✓ Selecionado' : 'Disponível') : 'Indisponível'}</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                            {idiomasSel.length > 1 && (
                                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                                    <p className="text-xs font-semibold mb-2" style={{ color: T.textMuted }}>Idioma principal:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {idiomasSel.map(l => (
                                            <button key={l} onClick={() => setIdiomaPrim(l)} className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-all"
                                                style={{ background: idiomaPrim === l ? 'var(--bo-accent)' : T.elevated, color: idiomaPrim === l ? 'white' : T.textDim, border: `1px solid ${idiomaPrim === l ? T.borderGold : T.border}` }}>
                                                {(IDIOMAS_LABEL as any)[l]?.flag} {(IDIOMAS_LABEL as any)[l]?.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>Assinatura Digital</h3>
                            <p className="text-xs mb-4" style={{ color: T.textDim }}>Todas as plataformas são suportadas. Configure em .env.local. O sistema funciona sem assinatura digital.</p>
                            <div className="space-y-2">
                                {PLATAFORMAS.map(p => {
                                    const sel = plat === p.id
                                    return (
                                        <button key={p.id} onClick={() => setPlat(p.id)} className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                                            style={{ background: sel ? `${p.cor}12` : T.elevated, border: `1px solid ${sel ? p.cor + '40' : T.border}` }}>
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${p.cor}18` }}>
                                                <p.icon size={16} style={{ color: p.cor }} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold" style={{ color: sel ? p.cor : T.text }}>{p.label}</p>
                                                    {p.gratuito && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(107,184,123,0.15)', color: '#6BB87B' }}>GRATUITO</span>}
                                                </div>
                                                <p className="text-[10px] mt-0.5" style={{ color: T.textDim }}>{p.sub}</p>
                                                {p.env && <p className="text-[9px] mt-0.5 font-mono" style={{ color: T.textDim }}>{p.env}</p>}
                                            </div>
                                            {sel && <CheckCircle size={16} style={{ color: p.cor }} />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {!gerado && step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <FormParte titulo="Contratante (Parte A)" parte={contratante} onChange={setContratante} />
                    </motion.div>
                )}
                {!gerado && step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <FormParte titulo="Contratado / IMI (Parte B)" parte={contratado} onChange={setContratado} />
                    </motion.div>
                )}

                {!gerado && step === 4 && modelo && (
                    <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-2xl p-5 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        {(['objeto', 'valores', 'prazos', 'condicoes', 'garantias'] as const).map(sec => {
                            const campos = modelo.campos.filter((c: any) => c.section === sec)
                            if (!campos.length) return null
                            return (
                                <div key={sec}>
                                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.textDim }}>{SEC_LABELS[sec]}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {campos.map((c: any) => (
                                            <div key={c.key} className={c.width === 'full' ? 'sm:col-span-2' : ''}>
                                                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: T.textDim }}>
                                                    {c.label}{c.required && <span style={{ color: '#E57373' }}> *</span>}
                                                </label>
                                                <Campo campo={c} value={dados[c.key]} onChange={(v: any) => setDados((p: any) => ({ ...p, [c.key]: v }))} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                        <div>
                            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: T.textDim }}>✍️ Cláusulas especiais / Instruções para a IA</label>
                            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={4}
                                placeholder="Descreva condições específicas não previstas no modelo, cláusulas especiais, contexto importante..."
                                className="w-full rounded-xl text-sm outline-none"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', resize: 'vertical' }}
                                onFocus={onF} onBlur={onB} />
                        </div>
                    </motion.div>
                )}

                {!gerado && step === 5 && (
                    <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold mb-4" style={{ color: T.text }}>Resumo</h3>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                                <div><p style={{ color: T.textDim }}>Modelo</p><p className="font-semibold mt-0.5 truncate" style={{ color: T.text }}>{modelo?.nome}</p></div>
                                <div><p style={{ color: T.textDim }}>Idiomas</p><p className="font-semibold mt-0.5" style={{ color: T.text }}>{idiomasSel.map(l => (IDIOMAS_LABEL as any)[l]?.flag).join(' ')}</p></div>
                                <div><p style={{ color: T.textDim }}>Contratante</p><p className="font-semibold mt-0.5 truncate" style={{ color: T.text }}>{contratante.nome || '—'}</p></div>
                                <div><p style={{ color: T.textDim }}>Contratado</p><p className="font-semibold mt-0.5 truncate" style={{ color: T.text }}>{contratado.nome || '—'}</p></div>
                                <div className="col-span-2"><p style={{ color: T.textDim }}>Assinatura</p><p className="font-semibold mt-0.5" style={{ color: T.accent }}>{PLATAFORMAS.find(p => p.id === plat)?.label}</p></div>
                            </div>
                        </div>
                        {erro && <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.20)' }}>
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#E57373' }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold mb-1" style={{ color: '#E57373' }}>Erro ao gerar contrato</p>
                                <p className="text-xs" style={{ color: '#E57373' }}>{erro}</p>
                                <button onClick={() => setErro(null)} className="text-[11px] font-semibold mt-2 underline" style={{ color: '#E57373' }}>Tentar novamente</button>
                            </div>
                        </div>}
                        <div className="space-y-2">
                            {idiomasSel.map(lang => (
                                <motion.button key={lang} whileTap={{ scale: 0.97 }} onClick={() => gerar(lang)} disabled={gerando}
                                    className="w-full flex items-center justify-between h-14 px-6 rounded-2xl font-semibold text-sm text-white"
                                    style={{ background: gerando ? 'var(--bo-hover)' : 'var(--bo-accent)', boxShadow: gerando ? 'none' : '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    <div className="flex items-center gap-3">
                                        {gerando ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                        <span>Gerar em {(IDIOMAS_LABEL as any)[lang]?.flag} {(IDIOMAS_LABEL as any)[lang]?.label}</span>
                                    </div>
                                    {!gerando && <ChevronRight size={16} />}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {gerado && resultado && (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(107,184,123,0.08)', border: '1px solid rgba(107,184,123,0.22)' }}>
                            <CheckCircle size={20} style={{ color: '#6BB87B' }} />
                            <div><p className="text-sm font-bold" style={{ color: '#6BB87B' }}>Contrato gerado com sucesso!</p><p className="text-xs mt-0.5" style={{ color: T.textDim }}>{resultado.numero} · salvo automaticamente</p></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { label: 'Copiar', icon: Copy, action: () => navigator.clipboard.writeText(resultado.conteudo_markdown) },
                                { label: 'Download .md', icon: Download, action: () => { const b = new Blob([resultado.conteudo_markdown], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${resultado.numero}.md`; a.click(); URL.revokeObjectURL(u) } },
                                { label: 'Visualizar', icon: Eye, action: () => setPreview(true) },
                                { label: 'Novo', icon: Plus, action: () => { setGerado(false); setResultado(null); setStep(0); setModelo(null) } },
                            ].map(a => (
                                <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all"
                                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                                    >
                                    <a.icon size={18} style={{ color: T.accent }} />
                                    <span className="text-[10px] font-semibold" style={{ color: T.textMuted }}>{a.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="rounded-2xl p-5 space-y-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <h3 className="text-sm font-bold" style={{ color: T.text }}>Enviar para {contratante.nome?.split(' ')[0] || 'o contratante'}</h3>
                            <div className="flex gap-2">
                                {(['email', 'whatsapp', 'ambos'] as const).map(c => (
                                    <button key={c} onClick={() => setCanal(c)} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold transition-all"
                                        style={{ background: canal === c ? 'var(--bo-accent)' : T.elevated, color: canal === c ? 'white' : T.textDim, border: `1px solid ${canal === c ? T.borderGold : T.border}` }}>
                                        {c === 'email' ? <><Mail size={12} />Email</> : c === 'whatsapp' ? <><MessageSquare size={12} />WhatsApp</> : '📤 Ambos'}
                                    </button>
                                ))}
                            </div>
                            {envioOk
                                ? <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(107,184,123,0.10)' }}><CheckCircle size={14} style={{ color: '#6BB87B' }} /><p className="text-xs font-semibold" style={{ color: '#6BB87B' }}>Enviado com sucesso!</p></div>
                                : <button onClick={enviar} disabled={enviando} className="w-full h-12 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: 'var(--bo-accent)', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    {enviando ? 'Enviando...' : `Enviar via ${canal}`}
                                </button>
                            }
                        </div>
                        {plat !== 'sem_assinatura' && (
                            <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.borderGold}` }}>
                                <div className="flex items-center gap-2 mb-2"><FileSignature size={16} style={{ color: T.accent }} /><h3 className="text-sm font-bold" style={{ color: T.text }}>{PLATAFORMAS.find(p => p.id === plat)?.label}</h3></div>
                                <p className="text-xs mb-3" style={{ color: T.textDim }}>Envie para assinatura digital juridicamente válida. Configure a variável de ambiente antes de ativar.</p>
                                <button className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'var(--bo-active-bg)', border: `1px solid ${T.borderGold}`, color: T.accent }}>
                                    <Shield size={15} /> Enviar para Assinatura Digital
                                </button>
                                <p className="text-[9px] text-center mt-2 font-mono" style={{ color: T.textDim }}>{PLATAFORMAS.find(p => p.id === plat)?.env}</p>
                            </div>
                        )}
                        <AnimatePresence>
                            {preview && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--backdrop-bg, rgba(0,0,0,0.4))', backdropFilter: 'blur(8px)' }}>
                                    <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="relative w-full max-w-3xl max-h-[88vh] rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                                            <p className="text-sm font-bold" style={{ color: T.text }}>{resultado.numero}</p>
                                            <button onClick={() => setPreview(false)}><X size={18} style={{ color: T.textDim }} /></button>
                                        </div>
                                        <div className="overflow-y-auto p-6 max-h-[75vh]">
                                            <pre className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: T.textMuted, fontFamily: 'monospace' }}>{resultado.conteudo_markdown}</pre>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {!gerado && (
                <div className="flex justify-between pt-2">
                    <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: step === 0 ? 'transparent' : T.surface, color: step === 0 ? T.textDim : T.textMuted, border: `1px solid ${step === 0 ? 'transparent' : T.border}` }}>
                        <ChevronLeft size={16} /> Voltar
                    </button>
                    {step < STEPS.length - 1 && (
                        <button onClick={() => setStep(s => s + 1)} disabled={!ok()} className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white transition-all"
                            style={{ background: ok() ? 'var(--bo-accent)' : 'var(--bo-hover)', opacity: ok() ? 1 : 0.5, boxShadow: ok() ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
                            Avançar <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default function NovoContratoPage() {
    return (
        <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--bo-accent)' }} /></div>}>
            <NovoContratoInner />
        </Suspense>
    )
}
