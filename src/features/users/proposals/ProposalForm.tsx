'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, FileCheck2, AlertCircle, Building2 } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, Button } from '../ui/primitives'
import {
  MANO_IMOVEIS_COMPRA,
  type ProposalField,
  type ProposalGroup,
} from '@/lib/imi-proposals/template'

interface ProjectOption {
  id: string
  name: string
}

type FormData = Record<string, Record<string, any>>

export function ProposalForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter()
  const template = MANO_IMOVEIS_COMPRA
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [data, setData] = useState<FormData>({})
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<false | 'draft' | 'submit'>(false)
  const [error, setError] = useState('')

  function setField(groupKey: string, fieldKey: string, value: any) {
    setData((prev) => ({ ...prev, [groupKey]: { ...(prev[groupKey] ?? {}), [fieldKey]: value } }))
  }

  function getField(groupKey: string, fieldKey: string): any {
    return data[groupKey]?.[fieldKey] ?? ''
  }

  async function uploadAttachment(): Promise<{ url: string; path: string } | null> {
    if (!file) return null
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload?folder=proposals&bucket=media', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.error ?? 'Falha no upload do anexo.')
    return { url: json.data.url, path: json.data.fileName }
  }

  async function save(submit: boolean) {
    setError('')
    if (!projectId) {
      setError('Selecione um empreendimento.')
      return
    }
    if (!getField('comprador', 'nome')) {
      setError('Informe o nome do comprador.')
      return
    }
    setBusy(submit ? 'submit' : 'draft')
    try {
      let attachment: { url: string; path: string } | null = null
      try {
        attachment = await uploadAttachment()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha no upload.')
        setBusy(false)
        return
      }

      const res = await fetch('/api/users/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          template_key: template.key,
          form_data: data,
          attachment_url: attachment?.url ?? null,
          attachment_path: attachment?.path ?? null,
          submit,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Falha ao salvar a proposta.')
        setBusy(false)
        return
      }
      router.push(`/users/proposals/${json.id}`)
      router.refresh()
    } catch {
      setError('Erro técnico ao salvar.')
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 80px' }}>
      <button
        type="button"
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: T.t3, fontFamily: T.fSans, fontSize: 12.5, cursor: 'pointer', marginBottom: 14 }}
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      <Eyebrow style={{ color: T.gold }}>{template.name}</Eyebrow>
      <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 28, color: T.t1, margin: '8px 0 18px' }}>
        Nova proposta
      </h1>

      {/* Empreendimento */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Eyebrow style={{ marginBottom: 12 }}>Empreendimento</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building2 size={16} color={T.gold} />
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{
              flex: 1,
              height: 44,
              padding: '0 12px',
              borderRadius: T.rSm,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${T.glassBorder}`,
              color: T.t1,
              fontFamily: T.fSans,
              fontSize: 13.5,
              outline: 'none',
            }}
          >
            {projects.length === 0 && <option value="">Nenhum empreendimento disponível</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id} style={{ background: T.bgElevated }}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Grupos do template */}
      {template.schema.groups.map((group) => (
        <GroupCard
          key={group.key}
          group={group}
          getField={getField}
          setField={setField}
          data={data}
          setData={setData}
        />
      ))}

      {/* Anexo */}
      <GlassCard style={{ marginBottom: 16 }}>
        <Eyebrow style={{ marginBottom: 4 }}>Anexo da proposta</Eyebrow>
        <p style={{ fontFamily: T.fSans, fontSize: 12, color: T.t3, margin: '0 0 12px' }}>
          Opcional — anexe a proposta assinada (foto ou PDF) para registro.
        </p>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: T.rSm,
            border: `1px dashed ${file ? T.goldBorder : T.glassBorderStrong}`,
            background: file ? T.goldSoft : 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
            color: file ? T.gold : T.t2,
            fontFamily: T.fSans,
            fontSize: 13,
          }}
        >
          {file ? <FileCheck2 size={16} /> : <Upload size={16} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file ? file.name : 'Selecionar arquivo (JPG, PNG ou PDF)'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
          />
        </label>
      </GlassCard>

      {/* Observação (regra das 24h) */}
      <GlassCard style={{ marginBottom: 20, background: T.amberSoft, border: `1px solid rgba(251,191,36,0.22)` }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <AlertCircle size={16} color={T.amber} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontFamily: T.fSans, fontSize: 12, color: T.t2, margin: 0, lineHeight: 1.5 }}>
            {template.schema.observacao}
          </p>
        </div>
      </GlassCard>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: T.red, fontFamily: T.fSans, fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', gap: 12, position: 'sticky', bottom: 16 }}>
        <Button variant="secondary" loading={busy === 'draft'} disabled={!!busy} onClick={() => save(false)}>
          Salvar rascunho
        </Button>
        <Button variant="primary" loading={busy === 'submit'} disabled={!!busy} onClick={() => save(true)}>
          Enviar proposta
        </Button>
      </div>
    </div>
  )
}

function GroupCard({
  group,
  getField,
  setField,
  data,
  setData,
}: {
  group: ProposalGroup
  getField: (g: string, f: string) => any
  setField: (g: string, f: string, v: any) => void
  data: FormData
  setData: React.Dispatch<React.SetStateAction<FormData>>
}) {
  if (group.repeat && group.repeat > 1) {
    return (
      <GlassCard style={{ marginBottom: 16 }}>
        <Eyebrow style={{ marginBottom: 14 }}>{group.title}</Eyebrow>
        {Array.from({ length: group.repeat }).map((_, idx) => {
          const subKey = `${group.key}.${idx + 1}`
          return (
            <div key={subKey} style={{ marginBottom: idx === group.repeat! - 1 ? 0 : 16 }}>
              <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '0 0 8px', fontWeight: 600 }}>
                Referência {idx + 1}
              </p>
              <FieldGrid
                fields={group.fields}
                get={(fk) => data[subKey]?.[fk] ?? ''}
                set={(fk, v) => setData((prev) => ({ ...prev, [subKey]: { ...(prev[subKey] ?? {}), [fk]: v } }))}
              />
            </div>
          )
        })}
      </GlassCard>
    )
  }

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <Eyebrow style={{ marginBottom: 14 }}>{group.title}</Eyebrow>
      <FieldGrid
        fields={group.fields}
        get={(fk) => getField(group.key, fk)}
        set={(fk, v) => setField(group.key, fk, v)}
      />
    </GlassCard>
  )
}

function FieldGrid({
  fields,
  get,
  set,
}: {
  fields: ProposalField[]
  get: (fieldKey: string) => any
  set: (fieldKey: string, value: any) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
      {fields.map((f) => (
        <Field key={f.key} field={f} value={get(f.key)} onChange={(v) => set(f.key, v)} />
      ))}
    </div>
  )
}

function Field({ field, value, onChange }: { field: ProposalField; value: any; onChange: (v: any) => void }) {
  const inputType =
    field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : field.type === 'currency' || field.type === 'number' ? 'text' : 'text'
  const inputMode = field.type === 'currency' || field.type === 'number' ? 'decimal' : undefined

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, fontWeight: 500 }}>
        {field.label}
        {field.required && <span style={{ color: T.gold }}> *</span>}
      </span>
      <input
        type={inputType}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.type === 'currency' ? 'R$ 0,00' : ''}
        style={{
          height: 42,
          padding: '0 12px',
          borderRadius: T.rSm,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${T.glassBorder}`,
          color: T.t1,
          fontFamily: T.fSans,
          fontSize: 13.5,
          outline: 'none',
          colorScheme: 'dark',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = T.goldBorder)}
        onBlur={(e) => (e.currentTarget.style.borderColor = T.glassBorder)}
      />
    </label>
  )
}
