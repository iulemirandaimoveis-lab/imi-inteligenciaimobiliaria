'use client'

import React, { useState, useEffect } from 'react' // Import React
import {
    Plus,
    Edit,
    Trash2,
    Home,
    CheckCircle,
    XCircle,
    X,
    Save
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

interface Unit {
    id: string
    development_id: string
    unit_number: string
    floor: number
    tower: string | null
    type: string // Ex: "2 Quartos", "3 Quartos + Suíte"
    bedrooms: number
    bathrooms: number
    parking_spaces: number
    area: number
    price: number
    status: 'available' | 'reserved' | 'sold'
    features: string[]
    floor_plan_url: string | null
    created_at: string
    updated_at: string
}

interface UnitsManagerProps {
    developmentId: string
    developmentName: string
}

export default function UnitsManager({ developmentId, developmentName }: UnitsManagerProps) {
    const [units, setUnits] = useState<Unit[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [formData, setFormData] = useState<Partial<Unit>>({
        unit_number: '',
        floor: 1,
        tower: null,
        type: '',
        bedrooms: 2,
        bathrooms: 2,
        parking_spaces: 1,
        area: 0,
        price: 0,
        status: 'available',
        features: [],
        floor_plan_url: null
    })

    useEffect(() => {
        loadUnits()
    }, [developmentId])

    const loadUnits = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('development_units')
            .select('*')
            .eq('development_id', developmentId)
            .order('tower', { ascending: true })
            .order('floor', { ascending: true })
            .order('unit_number', { ascending: true })

        if (error) {
            toast.error('Erro ao carregar unidades')
            console.error(error)
        } else {
            setUnits(data || [])
        }
        setLoading(false)
    }

    const handleOpenModal = (unit?: Unit) => {
        if (unit) {
            setEditingUnit(unit)
            setFormData(unit)
        } else {
            setEditingUnit(null)
            setFormData({
                unit_number: '',
                floor: 1,
                tower: null,
                type: '',
                bedrooms: 2,
                bathrooms: 2,
                parking_spaces: 1,
                area: 0,
                price: 0,
                status: 'available',
                features: [],
                floor_plan_url: null
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingUnit(null)
        setFormData({
            unit_number: '',
            floor: 1,
            tower: null,
            type: '',
            bedrooms: 2,
            bathrooms: 2,
            parking_spaces: 1,
            area: 0,
            price: 0,
            status: 'available',
            features: [],
            floor_plan_url: null
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.unit_number || !formData.type) {
            toast.error('Preencha os campos obrigatórios')
            return
        }

        const dataToSave = {
            ...formData,
            development_id: developmentId,
            updated_at: new Date().toISOString()
        }

        if (editingUnit) {
            // Atualizar
            const { error } = await supabase
                .from('development_units')
                .update(dataToSave)
                .eq('id', editingUnit.id)

            if (error) {
                toast.error('Erro ao atualizar unidade')
                console.error(error)
                return
            }

            toast.success('Unidade atualizada!')
        } else {
            // Criar
            const { error } = await supabase
                .from('development_units')
                .insert(dataToSave)

            if (error) {
                toast.error('Erro ao criar unidade')
                console.error(error)
                return
            }

            toast.success('Unidade criada!')
        }

        handleCloseModal()
        loadUnits()
    }

    const handleDelete = async (unitId: string) => {
        if (!confirm('Tem certeza que deseja deletar esta unidade?')) return

        const { error } = await supabase
            .from('development_units')
            .delete()
            .eq('id', unitId)

        if (error) {
            toast.error('Erro ao deletar unidade')
            console.error(error)
            return
        }

        toast.success('Unidade deletada!')
        loadUnits()
    }

    const handleBulkCreate = async () => {
        const quantity = prompt('Quantas unidades deseja criar?')
        if (!quantity) return

        const count = parseInt(quantity)
        if (isNaN(count) || count < 1 || count > 100) {
            toast.error('Quantidade inválida (máximo 100)')
            return
        }

        const startFloor = parseInt(prompt('Andar inicial?') || '1')
        const tower = prompt('Torre? (deixe em branco se não houver)')

        const unitsToCreate = []
        for (let i = 0; i < count; i++) {
            // Exemplo simples de numeração: 101, 102, 103, 104, 201...
            // 4 unidades por andar
            const unitsPerFloor = 4
            const currentFloor = startFloor + Math.floor(i / unitsPerFloor)
            const unitSuffix = (i % unitsPerFloor) + 1
            const unitNumber = `${currentFloor}0${unitSuffix}`

            unitsToCreate.push({
                development_id: developmentId,
                unit_number: unitNumber,
                floor: currentFloor,
                tower: tower || null,
                type: '2 Quartos',
                bedrooms: 2,
                bathrooms: 2,
                parking_spaces: 1,
                area: 65,
                price: 450000,
                status: 'available',
                features: [],
                floor_plan_url: null
            })
        }

        const { error } = await supabase
            .from('development_units')
            .insert(unitsToCreate)

        if (error) {
            toast.error('Erro ao criar unidades')
            console.error(error)
            return
        }

        toast.success(`${count} unidades criadas!`)
        loadUnits()
    }

    const stats = {
        total: units.length,
        available: units.filter(u => u.status === 'available').length,
        reserved: units.filter(u => u.status === 'reserved').length,
        sold: units.filter(u => u.status === 'sold').length
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando unidades...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Unidades</h2>
                    <p className="text-gray-500 mt-1">{developmentName}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleBulkCreate}
                        className="h-12 px-6 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        Criar em Lote
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="h-12 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Nova Unidade
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-soft">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                    <div className="text-sm text-gray-500 mt-1">Total</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-900/50 p-6">
                    <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.available}</div>
                    <div className="text-sm text-green-600 dark:text-green-500 mt-1">Disponíveis</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-900/50 p-6">
                    <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{stats.reserved}</div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">Reservadas</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-900/50 p-6">
                    <div className="text-3xl font-bold text-red-700 dark:text-red-400">{stats.sold}</div>
                    <div className="text-sm text-red-600 dark:text-red-500 mt-1">Vendidas</div>
                </div>
            </div>

            {/* Lista de Unidades */}
            {units.length === 0 ? (
                <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 p-16 text-center shadow-soft">
                    <Home size={48} className="text-gray-300 dark:text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma unidade cadastrada</h3>
                    <p className="text-gray-500 mb-6">Adicione unidades para este empreendimento.</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-2 h-12 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                    >
                        <Plus size={20} />
                        Adicionar Primeira Unidade
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-soft">
                    {/* Table Header - Desktop */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-2">Unidade</div>
                        <div className="col-span-2">Tipo</div>
                        <div className="col-span-1">Área</div>
                        <div className="col-span-2">Preço</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3">Ações</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {units.map((unit) => (
                            <div
                                key={unit.id}
                                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                {/* Desktop Layout */}
                                <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                                    {/* Unidade */}
                                    <div className="col-span-2">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {unit.tower && <span className="text-gray-500">Torre {unit.tower} - </span>}
                                            {unit.unit_number}
                                        </div>
                                        <div className="text-xs text-gray-500">Andar {unit.floor}</div>
                                    </div>

                                    {/* Tipo */}
                                    <div className="col-span-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">{unit.type}</div>
                                        <div className="text-xs text-gray-500">
                                            {unit.bedrooms} Q • {unit.bathrooms} B • {unit.parking_spaces} V
                                        </div>
                                    </div>

                                    {/* Área */}
                                    <div className="col-span-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{unit.area}m²</div>
                                    </div>

                                    {/* Preço */}
                                    <div className="col-span-2">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                                minimumFractionDigits: 0
                                            }).format(unit.price)}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        {unit.status === 'available' && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-900/50">
                                                <CheckCircle size={14} />
                                                Disponível
                                            </div>
                                        )}
                                        {unit.status === 'reserved' && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium border border-yellow-200 dark:border-yellow-900/50">
                                                Reservada
                                            </div>
                                        )}
                                        {unit.status === 'sold' && (
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-900/50">
                                                <XCircle size={14} />
                                                Vendida
                                            </div>
                                        )}
                                    </div>

                                    {/* Ações */}
                                    <div className="col-span-3 flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(unit)}
                                            className="h-8 px-4 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Edit size={14} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(unit.id)}
                                            className="h-8 px-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <Trash2 size={14} />
                                            Deletar
                                        </button>
                                    </div>
                                </div>

                                {/* Mobile Layout */}
                                <div className="md:hidden space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {unit.tower && <span className="text-gray-500">Torre {unit.tower} - </span>}
                                                Unidade {unit.unit_number}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{unit.type}</div>
                                        </div>
                                        {unit.status === 'available' && (
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                                                <CheckCircle size={12} />
                                                Disponível
                                            </div>
                                        )}
                                        {unit.status === 'reserved' && (
                                            <div className="inline-flex px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                                                Reservada
                                            </div>
                                        )}
                                        {unit.status === 'sold' && (
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium">
                                                <XCircle size={12} />
                                                Vendida
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span>{unit.area}m²</span>
                                        <span>•</span>
                                        <span>{unit.bedrooms}Q {unit.bathrooms}B {unit.parking_spaces}V</span>
                                    </div>

                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                            minimumFractionDigits: 0
                                        }).format(unit.price)}
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                        <button
                                            onClick={() => handleOpenModal(unit)}
                                            className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit size={16} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(unit.id)}
                                            className="flex-1 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Deletar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-card-dark rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="sticky top-0 bg-white dark:bg-card-dark border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between z-10">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Número da Unidade *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.unit_number}
                                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        placeholder="101"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Andar
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Torre (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tower || ''}
                                        onChange={(e) => setFormData({ ...formData, tower: e.target.value || null })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        placeholder="A"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Tipo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        placeholder="2 Quartos + Suíte"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Quartos
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.bedrooms}
                                        onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Banheiros
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.bathrooms}
                                        onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Vagas
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.parking_spaces}
                                        onChange={(e) => setFormData({ ...formData, parking_spaces: parseInt(e.target.value) })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Área (m²)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        Preço (R$)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                        className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full h-12 px-4 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:bg-input-dark dark:text-white"
                                >
                                    <option value="available">Disponível</option>
                                    <option value="reserved">Reservada</option>
                                    <option value="sold">Vendida</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                                <div className="flex-1 flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-1 h-12 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} />
                                        {editingUnit ? 'Atualizar' : 'Criar'} Unidade
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="h-12 px-6 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
