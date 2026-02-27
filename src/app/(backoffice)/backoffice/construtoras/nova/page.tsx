'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
} from 'lucide-react'

export default function NovaConstrutora() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Dados Empresa
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',

    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Recife',
    estado: 'PE',
    pais: 'Brasil',

    // Contatos
    telefone: '',
    celular: '',
    email: '',
    website: '',

    // Responsável
    nomeResponsavel: '',
    cargoResponsavel: '',
    emailResponsavel: '',
    telefoneResponsavel: '',

    // Outros
    observacoes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validações obrigatórias
    if (!formData.razaoSocial.trim()) newErrors.razaoSocial = 'Razão social é obrigatória'
    if (!formData.nomeFantasia.trim()) newErrors.nomeFantasia = 'Nome fantasia é obrigatório'
    if (!formData.cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório'
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório'
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório'
    if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório'
    if (!formData.logradouro.trim()) newErrors.logradouro = 'Logradouro é obrigatório'
    if (!formData.bairro.trim()) newErrors.bairro = 'Bairro é obrigatório'
    if (!formData.nomeResponsavel.trim()) newErrors.nomeResponsavel = 'Nome do responsável é obrigatório'
    if (!formData.telefoneResponsavel.trim()) newErrors.telefoneResponsavel = 'Telefone do responsável é obrigatório'

    // Validação formato email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    // Validação CNPJ (formato básico)
    if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao salvar')
      router.push('/backoffice/construtoras')
    } catch (error) {
      console.error('Erro ao salvar construtora:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Construtora</h1>
          <p className="text-sm text-gray-600 mt-1">Cadastre uma nova parceira</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da Empresa */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Building2 size={20} className="text-accent-600" />
            <h2 className="text-lg font-bold text-gray-900">Dados da Empresa</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Razão Social *
              </label>
              <input
                type="text"
                name="razaoSocial"
                value={formData.razaoSocial}
                onChange={handleChange}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.razaoSocial ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="Ex: Construtora Central LTDA"
              />
              {errors.razaoSocial && (
                <p className="text-xs text-red-600 mt-1">{errors.razaoSocial}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nome Fantasia *
              </label>
              <input
                type="text"
                name="nomeFantasia"
                value={formData.nomeFantasia}
                onChange={handleChange}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.nomeFantasia ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="Ex: Central Empreendimentos"
              />
              {errors.nomeFantasia && (
                <p className="text-xs text-red-600 mt-1">{errors.nomeFantasia}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                CNPJ *
              </label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={(e) => {
                  const formatted = formatCNPJ(e.target.value)
                  setFormData(prev => ({ ...prev, cnpj: formatted }))
                }}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.cnpj ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              {errors.cnpj && (
                <p className="text-xs text-red-600 mt-1">{errors.cnpj}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Inscrição Estadual
              </label>
              <input
                type="text"
                name="inscricaoEstadual"
                value={formData.inscricaoEstadual}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="000.000.000.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Inscrição Municipal
              </label>
              <input
                type="text"
                name="inscricaoMunicipal"
                value={formData.inscricaoMunicipal}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="000000-0"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={20} className="text-accent-600" />
            <h2 className="text-lg font-bold text-gray-900">Endereço</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                CEP *
              </label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={(e) => {
                  const formatted = formatCEP(e.target.value)
                  setFormData(prev => ({ ...prev, cep: formatted }))
                }}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.cep ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="00000-000"
                maxLength={9}
              />
              {errors.cep && (
                <p className="text-xs text-red-600 mt-1">{errors.cep}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Logradouro *
              </label>
              <input
                type="text"
                name="logradouro"
                value={formData.logradouro}
                onChange={handleChange}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.logradouro ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="Ex: Av. Boa Viagem"
              />
              {errors.logradouro && (
                <p className="text-xs text-red-600 mt-1">{errors.logradouro}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Número
              </label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="Ex: 4000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Complemento
              </label>
              <input
                type="text"
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="Ex: Sala 201"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Bairro *
              </label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.bairro ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="Ex: Boa Viagem"
              />
              {errors.bairro && (
                <p className="text-xs text-red-600 mt-1">{errors.bairro}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Estado *
              </label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                País *
              </label>
              <input
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>
        </div>

        {/* Contatos */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Phone size={20} className="text-accent-600" />
            <h2 className="text-lg font-bold text-gray-900">Contatos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Telefone *
              </label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData(prev => ({ ...prev, telefone: formatted }))
                }}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.telefone ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="(81) 3456-7890"
                maxLength={15}
              />
              {errors.telefone && (
                <p className="text-xs text-red-600 mt-1">{errors.telefone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Celular
              </label>
              <input
                type="text"
                name="celular"
                value={formData.celular}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData(prev => ({ ...prev, celular: formatted }))
                }}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="(81) 99876-5432"
                maxLength={15}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.email ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="contato@construtora.com.br"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="https://www.construtora.com.br"
              />
            </div>
          </div>
        </div>

        {/* Responsável */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <User size={20} className="text-accent-600" />
            <h2 className="text-lg font-bold text-gray-900">Responsável</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nomeResponsavel"
                value={formData.nomeResponsavel}
                onChange={handleChange}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.nomeResponsavel ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="Ex: Carlos Mendonça"
              />
              {errors.nomeResponsavel && (
                <p className="text-xs text-red-600 mt-1">{errors.nomeResponsavel}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Cargo
              </label>
              <input
                type="text"
                name="cargoResponsavel"
                value={formData.cargoResponsavel}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="Ex: Diretor Comercial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                name="emailResponsavel"
                value={formData.emailResponsavel}
                onChange={handleChange}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500"
                placeholder="carlos@construtora.com.br"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Telefone *
              </label>
              <input
                type="text"
                name="telefoneResponsavel"
                value={formData.telefoneResponsavel}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setFormData(prev => ({ ...prev, telefoneResponsavel: formatted }))
                }}
                className={`w-full h-11 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 ${errors.telefoneResponsavel ? 'border-red-500' : 'border-gray-200'
                  }`}
                placeholder="(81) 99876-5432"
                maxLength={15}
              />
              {errors.telefoneResponsavel && (
                <p className="text-xs text-red-600 mt-1">{errors.telefoneResponsavel}</p>
              )}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <FileText size={20} className="text-accent-600" />
            <h2 className="text-lg font-bold text-gray-900">Observações</h2>
          </div>

          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
            placeholder="Informações adicionais sobre a construtora..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-11 px-6 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 h-11 px-6 bg-accent-600 text-white rounded-xl font-medium hover:bg-accent-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Construtora
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
