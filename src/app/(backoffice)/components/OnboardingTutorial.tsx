'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, ChevronRight, ChevronLeft, Sparkles, CheckCircle,
    BarChart3, Users, Building2, FileText, Calendar, Settings, Zap,
    GraduationCap,
} from 'lucide-react'

// ── Tutorial Steps ────────────────────────────────────────────
interface TutorialStep {
    id: string
    title: string
    description: string
    icon: React.ElementType
    targetPath?: string        // Route to navigate to for this step
    targetSelector?: string    // CSS selector to highlight
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao IMI Intelligence',
        description: 'Este é o seu painel de inteligência imobiliária. Vamos fazer um tour rápido pelas funcionalidades principais para você começar com tudo.',
        icon: Sparkles,
        position: 'center',
    },
    {
        id: 'dashboard',
        title: 'Dashboard Inteligente',
        description: 'Aqui você acompanha KPIs em tempo real: leads, vendas, receita e indicadores de mercado. Os dados são atualizados automaticamente.',
        icon: BarChart3,
        targetPath: '/backoffice/dashboard',
        position: 'center',
    },
    {
        id: 'leads',
        title: 'Gestão de Leads',
        description: 'Gerencie seus leads com pipeline visual (Kanban), scoring por IA, e automações de follow-up. Cada lead recebe uma pontuação inteligente.',
        icon: Users,
        targetPath: '/backoffice/leads/inbox',
        position: 'center',
    },
    {
        id: 'imoveis',
        title: 'Portfólio de Imóveis',
        description: 'Cadastre e gerencie empreendimentos com fotos, plantas, tabelas de preços e análise de mercado integrada com IA.',
        icon: Building2,
        targetPath: '/backoffice/imoveis',
        position: 'center',
    },
    {
        id: 'conteudo',
        title: 'Conteúdo & Automação',
        description: 'Crie conteúdo para redes sociais, blog e e-mail marketing. Configure pipelines de automação com IA para publicar automaticamente.',
        icon: FileText,
        targetPath: '/backoffice/conteudo',
        position: 'center',
    },
    {
        id: 'agenda',
        title: 'Agenda Inteligente',
        description: 'Organize vistorias, reuniões e visitas. A IA sugere horários baseados nos seus leads mais quentes.',
        icon: Calendar,
        targetPath: '/backoffice/agenda',
        position: 'center',
    },
    {
        id: 'automacoes',
        title: 'Automações & IA',
        description: 'Configure agentes de IA para follow-up automático, scoring de leads, geração de conteúdo e relatórios inteligentes.',
        icon: Zap,
        targetPath: '/backoffice/automacoes',
        position: 'center',
    },
    {
        id: 'settings',
        title: 'Configurações',
        description: 'Gerencie sua equipe, corretores, integrações e preferências do sistema. Tudo configurável para o seu fluxo de trabalho.',
        icon: Settings,
        targetPath: '/backoffice/settings',
        position: 'center',
    },
    {
        id: 'complete',
        title: 'Tudo Pronto!',
        description: 'Você completou o tour! Agora explore o sistema no seu ritmo. Pode acessar este tutorial novamente pelo menu de ajuda na barra superior.',
        icon: CheckCircle,
        targetPath: '/backoffice/dashboard',
        position: 'center',
    },
]

const STORAGE_KEY = 'imi_onboarding_completed'
const STORAGE_STEP_KEY = 'imi_onboarding_step'

// ── Hook: useOnboarding ──────────────────────────────────────
export function useOnboarding() {
    const [isActive, setIsActive] = useState(false)
    const [hasCompleted, setHasCompleted] = useState(true) // default true to prevent flash

    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY) === 'true'
        setHasCompleted(completed)
        if (!completed) {
            // Show onboarding after a brief delay for first-time users
            const timer = setTimeout(() => setIsActive(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const startTutorial = useCallback(() => setIsActive(true), [])
    const closeTutorial = useCallback(() => {
        setIsActive(false)
        localStorage.setItem(STORAGE_KEY, 'true')
        setHasCompleted(true)
    }, [])
    const resetTutorial = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_STEP_KEY)
        setHasCompleted(false)
        setIsActive(true)
    }, [])

    return { isActive, hasCompleted, startTutorial, closeTutorial, resetTutorial }
}

// ── Component: OnboardingTutorial ────────────────────────────
export default function OnboardingTutorial({
    isActive,
    onClose,
}: {
    isActive: boolean
    onClose: () => void
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [currentStep, setCurrentStep] = useState(0)
    const totalSteps = TUTORIAL_STEPS.length
    const step = TUTORIAL_STEPS[currentStep]
    const StepIcon = step.icon

    // Persist step progress
    useEffect(() => {
        if (isActive) {
            const saved = localStorage.getItem(STORAGE_STEP_KEY)
            if (saved) {
                const parsed = parseInt(saved)
                if (!isNaN(parsed) && parsed < totalSteps) setCurrentStep(parsed)
            }
        }
    }, [isActive, totalSteps])

    useEffect(() => {
        if (isActive) localStorage.setItem(STORAGE_STEP_KEY, String(currentStep))
    }, [currentStep, isActive])

    const goNext = useCallback(() => {
        if (currentStep < totalSteps - 1) {
            const nextStep = currentStep + 1
            setCurrentStep(nextStep)
            const next = TUTORIAL_STEPS[nextStep]
            if (next.targetPath && pathname !== next.targetPath) {
                router.push(next.targetPath)
            }
        } else {
            // Complete tutorial
            localStorage.setItem(STORAGE_KEY, 'true')
            localStorage.removeItem(STORAGE_STEP_KEY)
            onClose()
        }
    }, [currentStep, totalSteps, pathname, router, onClose])

    const goPrev = useCallback(() => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1
            setCurrentStep(prevStep)
            const prev = TUTORIAL_STEPS[prevStep]
            if (prev.targetPath && pathname !== prev.targetPath) {
                router.push(prev.targetPath)
            }
        }
    }, [currentStep, pathname, router])

    const skip = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, 'true')
        localStorage.removeItem(STORAGE_STEP_KEY)
        onClose()
    }, [onClose])

    // Handle keyboard
    useEffect(() => {
        if (!isActive) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') skip()
            if (e.key === 'ArrowRight' || e.key === 'Enter') goNext()
            if (e.key === 'ArrowLeft') goPrev()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isActive, goNext, goPrev, skip])

    if (!isActive) return null

    const progress = ((currentStep + 1) / totalSteps) * 100
    const isLast = currentStep === totalSteps - 1
    const isFirst = currentStep === 0

    return (
        <AnimatePresence>
            {isActive && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999]"
                        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
                        onClick={skip}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                        className="fixed z-[10000] w-[92vw] max-w-lg"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div
                            className="rounded-3xl overflow-hidden"
                            style={{
                                background: 'var(--bo-surface)',
                                border: '1px solid var(--bo-border)',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
                            }}
                        >
                            {/* Progress bar */}
                            <div className="h-1 w-full" style={{ background: 'var(--bo-elevated)' }}>
                                <motion.div
                                    className="h-full"
                                    style={{ background: 'var(--bo-accent)' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-5 pb-2">
                                <div className="flex items-center gap-2">
                                    <GraduationCap size={14} style={{ color: 'var(--bo-accent)' }} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--bo-text-muted)' }}>
                                        Tour Guiado · {currentStep + 1}/{totalSteps}
                                    </span>
                                </div>
                                <button
                                    onClick={skip}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                                    style={{ color: 'var(--bo-text-muted)' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="px-6 pb-6 pt-2">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {/* Icon */}
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                                            style={{
                                                background: `var(--bo-accent)`,
                                                boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                                            }}
                                        >
                                            <StepIcon size={28} color="#fff" />
                                        </div>

                                        {/* Text */}
                                        <h2 className="text-xl font-bold text-center mb-3" style={{ color: 'var(--bo-text)' }}>
                                            {step.title}
                                        </h2>
                                        <p className="text-sm text-center leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--bo-text-muted)' }}>
                                            {step.description}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Step dots */}
                                <div className="flex items-center justify-center gap-1.5 mt-6 mb-6">
                                    {TUTORIAL_STEPS.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setCurrentStep(i)
                                                const s = TUTORIAL_STEPS[i]
                                                if (s.targetPath && pathname !== s.targetPath) router.push(s.targetPath)
                                            }}
                                            className="transition-all"
                                            style={{
                                                width: i === currentStep ? 24 : 8,
                                                height: 8,
                                                borderRadius: 4,
                                                background: i === currentStep ? 'var(--bo-accent)' : i < currentStep ? 'var(--bo-accent)' : 'var(--bo-border)',
                                                opacity: i <= currentStep ? 1 : 0.4,
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between gap-3">
                                    {isFirst ? (
                                        <button
                                            onClick={skip}
                                            className="h-11 px-5 rounded-xl text-sm font-semibold transition-all"
                                            style={{ color: 'var(--bo-text-muted)', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)' }}
                                        >
                                            Pular Tour
                                        </button>
                                    ) : (
                                        <button
                                            onClick={goPrev}
                                            className="h-11 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
                                            style={{ color: 'var(--bo-text-muted)', background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)' }}
                                        >
                                            <ChevronLeft size={16} />
                                            Anterior
                                        </button>
                                    )}

                                    <button
                                        onClick={goNext}
                                        className="h-11 px-6 rounded-xl text-sm font-bold flex items-center gap-2 text-white transition-all hover:brightness-110 flex-1 justify-center"
                                        style={{ background: 'var(--bo-accent)', maxWidth: 200 }}
                                    >
                                        {isLast ? (
                                            <>
                                                <CheckCircle size={16} />
                                                Concluir
                                            </>
                                        ) : (
                                            <>
                                                Próximo
                                                <ChevronRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// ── Trigger Button (for navbar) ──────────────────────────────
export function OnboardingTrigger({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{
                background: 'var(--bo-elevated)',
                border: '1px solid var(--bo-border)',
                color: 'var(--bo-text-muted)',
            }}
            title="Tutorial Guiado"
        >
            <GraduationCap size={14} />
            <span className="hidden sm:inline">Tour</span>
        </button>
    )
}
