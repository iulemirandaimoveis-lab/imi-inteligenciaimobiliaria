// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Edit3, Save, X, LayoutGrid, Ruler, BedDouble, Bath, Car, Banknote } from 'lucide-react'
import { usePropertyUnits, createUnit, updateUnit, deleteUnit } from '../hooks/useDetails'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { formatCurrency } from '../utils/propertyHelpers'

interface PropertyUnitsProps {
    propertyId: string
}

export default function PropertyUnits({ propertyId }: PropertyUnitsProps) {
    const { units, isLoading, mutate } = usePropertyUnits(propertyId)
    const { showToast } = useToast()
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<Record<string, unknown>>({})

    async function handleSave(id?: string) {
        try {
            if (id) {
                await updateUnit(id, formData)
                showToast('Unidade atualizada com sucesso', 'success')
                setEditingId(null)
            } else {
                await createUnit({ ...formData, development_id: propertyId })
                showToast('Nova unidade integrada ao inventário', 'success')
                setIsAdding(false)
            }
            setFormData({})
            mutate()
        } catch (err: unknown) {
            showToast((err instanceof Error ? err.message : 'Erro desconhecido') || 'Erro ao processar unidade', 'error')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Deseja realmente remover esta unidade do inventário?')) return
        try {
            await deleteUnit(id)
            showToast('Unidade removida', 'success')
            mutate()
        } catch (err: unknown) {
            showToast((err instanceof Error ? err.message : 'Erro desconhecido') || 'Erro ao remover unidade', 'error')
        }
    }

    const startEditing = (unit: Record<string, unknown>) => {
        setEditingId(unit.id)
        setFormData(unit)
    }

    const startAdding = () => {
        setFormData({
            status: 'available',
            unit_type: 'apartment',
            bedrooms: 1,
            bathrooms: 1,
            parking_spots: 1,
            unit_name: ''
        })
        setIsAdding(true)
    }

    if (isLoading) return <div className="p-12 text-center animate-pulse text-slate-400">Carregando mapa de unidades...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-imi-900 tracking-tight">Mapa de Unidades</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Disponibilidade e Tipologias</p>
                </div>
                {!isAdding && (
                    <Button onClick={startAdding} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Unidade
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipologia</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Configuração</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isAdding && (
                            <UnitRowForm
                                data={formData}
                                onChange={setFormData}
                                onSave={() => handleSave()}
                                onCancel={() => setIsAdding(false)}
                            />
                        )}
                        {units.map((unit: Record<string, unknown>) => (
                            editingId === unit.id ? (
                                <UnitRowForm
                                    key={unit.id}
                                    data={formData}
                                    onChange={setFormData}
                                    onSave={() => handleSave(unit.id)}
                                    onCancel={() => setEditingId(null)}
                                />
                            ) : (
                                <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-imi-900">{unit.unit_name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">Torre: {unit.tower || '-'} • Andar: {unit.floor || '-'}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <LayoutGrid className="w-3.5 h-3.5 text-imi-400" />
                                            {unit.unit_type}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                            <Ruler className="w-3 h-3" />
                                            {unit.area}m²
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-500">
                                            <span className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5" /> {unit.bedrooms}</span>
                                            <span className="flex items-center gap-1.5"><Bath className="w-3.5 h-3.5" /> {unit.bathrooms}</span>
                                            <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> {unit.parking_spots}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-imi-900 text-sm">
                                        {formatCurrency(unit.total_price)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${unit.status === 'available' ? 'bg-green-50 text-green-600' :
                                                unit.status === 'reserved' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-slate-100 text-slate-400'
                                            }`}>
                                            {unit.status === 'available' ? 'Disponível' : unit.status === 'reserved' ? 'Reservado' : 'Vendido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => startEditing(unit)} className="p-2 text-slate-400 hover:text-imi-600 hover:bg-imi-50 rounded-lg transition-all">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(unit.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>
                {units.length === 0 && !isAdding && (
                    <div className="p-20 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                            <LayoutGrid className="w-8 h-8 text-slate-200" />
                        </div>
                        <h4 className="text-slate-400 font-bold text-sm tracking-tight">Nenhuma unidade cadastrada neste ativo.</h4>
                    </div>
                )}
            </div>
        </div>
    )
}

function UnitRowForm({ data, onChange, onSave, onCancel }: { data: Record<string, unknown>; onChange: (field: string, value: string | number | boolean | null) => void; onSave: () => void; onCancel: () => void }) {
    return (
        <tr className="bg-imi-50/30">
            <td className="px-6 py-4 space-y-2">
                <input
                    className="w-full px-3 py-2 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-imi-500"
                    placeholder="Nome/Número"
                    value={data.unit_name || ''}
                    onChange={e => onChange({ ...data, unit_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                    <input
                        className="w-full px-2 py-1 text-[10px] border rounded"
                        placeholder="Torre"
                        value={data.tower || ''}
                        onChange={e => onChange({ ...data, tower: e.target.value })}
                    />
                    <input
                        className="w-full px-2 py-1 text-[10px] border rounded"
                        type="number"
                        placeholder="Andar"
                        value={data.floor || ''}
                        onChange={e => onChange({ ...data, floor: Number(e.target.value) })}
                    />
                </div>
            </td>
            <td className="px-6 py-4 space-y-2">
                <select
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    value={data.unit_type || 'apartment'}
                    onChange={e => onChange({ ...data, unit_type: e.target.value })}
                >
                    <option value="apartment">Apartamento</option>
                    <option value="house">Casa</option>
                    <option value="studio">Studio</option>
                    <option value="penthouse">Cobertura</option>
                </select>
                <input
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    type="number"
                    placeholder="Área m²"
                    value={data.area || ''}
                    onChange={e => onChange({ ...data, area: Number(e.target.value) })}
                />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <input className="w-12 px-2 py-2 text-xs text-center border rounded-lg" type="number" value={data.bedrooms || 0} onChange={e => onChange({ ...data, bedrooms: Number(e.target.value) })} />
                    <input className="w-12 px-2 py-2 text-xs text-center border rounded-lg" type="number" value={data.bathrooms || 0} onChange={e => onChange({ ...data, bathrooms: Number(e.target.value) })} />
                    <input className="w-12 px-2 py-2 text-xs text-center border rounded-lg" type="number" value={data.parking_spots || 0} onChange={e => onChange({ ...data, parking_spots: Number(e.target.value) })} />
                </div>
            </td>
            <td className="px-6 py-4">
                <input
                    className="w-full px-3 py-2 text-xs font-bold border rounded-lg"
                    type="number"
                    placeholder="Valor R$"
                    value={data.total_price || ''}
                    onChange={e => onChange({ ...data, total_price: Number(e.target.value) })}
                />
            </td>
            <td className="px-6 py-4">
                <select
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    value={data.status || 'available'}
                    onChange={e => onChange({ ...data, status: e.target.value })}
                >
                    <option value="available">Disponível</option>
                    <option value="reserved">Reservado</option>
                    <option value="sold">Vendido</option>
                </select>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button onClick={onSave} className="p-2 bg-imi-900 text-white rounded-lg hover:bg-black transition-all">
                        <Save className="w-4 h-4" />
                    </button>
                    <button onClick={onCancel} className="p-2 bg-white text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    )
}
