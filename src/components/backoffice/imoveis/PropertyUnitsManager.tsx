// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Edit3, Save, X, LayoutGrid, Ruler, BedDouble, Bath, Car } from 'lucide-react'
import { usePropertyUnits, createUnit, updateUnit, deleteUnit } from '@/hooks/use-property-units'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface PropertyUnitsManagerProps {
    propertyId: string
}

export default function PropertyUnitsManager({ propertyId }: PropertyUnitsManagerProps) {
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
                await createUnit({
                    ...formData,
                    property_id: propertyId
                })
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
            type: 'T2',
            bedrooms: 2,
            bathrooms: 2,
            unit_number: '',
            floor: 1,
            area: 0,
            price: 0
        })
        setIsAdding(true)
    }

    if (isLoading) return <div className="p-12 text-center animate-pulse text-imi-400">Carregando mapa de unidades...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-imi-900 tracking-tight font-display">Mapa de Unidades</h2>
                    <p className="text-xs text-imi-400 font-black uppercase tracking-widest mt-1">Gestão de Disponibilidade e Tipologias</p>
                </div>
                {!isAdding && (
                    <Button onClick={startAdding} size="sm" className="bg-imi-900 text-white hover:bg-black uppercase tracking-wider font-bold text-xs h-10 px-4 rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Unidade
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-imi-100 shadow-soft overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-imi-50 border-b border-imi-100">
                            <th className="px-6 py-4 text-[10px] font-black text-imi-400 uppercase tracking-widest">Unidade</th>
                            <th className="px-6 py-4 text-[10px] font-black text-imi-400 uppercase tracking-widest">Tipologia</th>
                            <th className="px-6 py-4 text-[10px] font-black text-imi-400 uppercase tracking-widest text-center">Detalhes</th>
                            <th className="px-6 py-4 text-[10px] font-black text-imi-400 uppercase tracking-widest">Valor</th>
                            <th className="px-6 py-4 text-[10px] font-black text-imi-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-imi-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-imi-50">
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
                                <tr key={unit.id} className="hover:bg-imi-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-imi-900">Apt {unit.unit_number}</div>
                                        <div className="text-[10px] text-imi-400 font-bold uppercase tracking-wide">Andar: {unit.floor}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-imi-600">
                                            <LayoutGrid className="w-3.5 h-3.5 text-imi-400" />
                                            {unit.type}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-imi-400 mt-1 font-medium">
                                            <Ruler className="w-3 h-3" />
                                            {unit.area}m²
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-3 text-xs font-bold text-imi-500">
                                            <span className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5" /> {unit.bedrooms}</span>
                                            <span className="flex items-center gap-1.5"><Bath className="w-3.5 h-3.5" /> {unit.bathrooms}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-bold text-imi-900 text-sm font-mono">
                                        {formatCurrency(unit.price)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${unit.status === 'available' ? 'bg-green-50 text-green-600' :
                                                unit.status === 'reserved' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-imi-100 text-imi-500 line-through'
                                            }`}>
                                            {unit.status === 'available' ? 'Disponível' : unit.status === 'reserved' ? 'Reservado' : 'Vendido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => startEditing(unit)} className="p-2 text-imi-400 hover:text-imi-900 hover:bg-imi-50 rounded-lg transition-all">
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(unit.id)} className="p-2 text-imi-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
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
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-imi-50 rounded-full mb-4">
                            <LayoutGrid className="w-8 h-8 text-imi-200" />
                        </div>
                        <h4 className="text-imi-400 font-bold text-sm tracking-tight">Nenhuma unidade cadastrada neste ativo.</h4>
                    </div>
                )}
            </div>
        </div>
    )
}

function UnitRowForm({ data, onChange, onSave, onCancel }: { data: Record<string, unknown>; onChange: (field: string, value: string | number | boolean | null) => void; onSave: () => void; onCancel: () => void }) {
    return (
        <tr className="bg-imi-50">
            <td className="px-6 py-4 space-y-2">
                <input
                    className="w-full px-3 py-2 text-xs font-bold border border-imi-200 rounded-lg focus:ring-2 focus:ring-imi-500 outline-none"
                    placeholder="Número Apt"
                    value={data.unit_number || ''}
                    onChange={e => onChange({ ...data, unit_number: e.target.value })}
                />
                <input
                    className="w-full px-2 py-1 text-[10px] border border-imi-200 rounded outline-none"
                    type="number"
                    placeholder="Andar"
                    value={data.floor || ''}
                    onChange={e => onChange({ ...data, floor: Number(e.target.value) })}
                />
            </td>
            <td className="px-6 py-4 space-y-2">
                <input
                    className="w-full px-3 py-2 text-xs border border-imi-200 rounded-lg outline-none"
                    placeholder="Tipo (Ex: T2)"
                    value={data.type || ''}
                    onChange={e => onChange({ ...data, type: e.target.value })}
                />
                <input
                    className="w-full px-3 py-2 text-xs border border-imi-200 rounded-lg outline-none"
                    type="number"
                    placeholder="Área m²"
                    value={data.area || ''}
                    onChange={e => onChange({ ...data, area: Number(e.target.value) })}
                />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <input className="w-12 px-2 py-2 text-xs text-center border border-imi-200 rounded-lg outline-none" type="number" placeholder="Beds" value={data.bedrooms || 0} onChange={e => onChange({ ...data, bedrooms: Number(e.target.value) })} />
                    <input className="w-12 px-2 py-2 text-xs text-center border border-imi-200 rounded-lg outline-none" type="number" placeholder="Baths" value={data.bathrooms || 0} onChange={e => onChange({ ...data, bathrooms: Number(e.target.value) })} />
                </div>
            </td>
            <td className="px-6 py-4">
                <input
                    className="w-full px-3 py-2 text-xs font-bold border border-imi-200 rounded-lg outline-none"
                    type="number"
                    placeholder="Valor R$"
                    value={data.price || ''}
                    onChange={e => onChange({ ...data, price: Number(e.target.value) })}
                />
            </td>
            <td className="px-6 py-4">
                <select
                    className="w-full px-3 py-2 text-xs border border-imi-200 rounded-lg outline-none font-bold text-imi-600"
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
                    <button onClick={onSave} className="p-2 bg-imi-900 text-white rounded-lg hover:bg-black transition-all shadow-lg active:scale-95">
                        <Save className="w-4 h-4" />
                    </button>
                    <button onClick={onCancel} className="p-2 bg-white text-imi-400 border border-imi-200 rounded-lg hover:bg-imi-100 transition-all active:scale-95">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    )
}
