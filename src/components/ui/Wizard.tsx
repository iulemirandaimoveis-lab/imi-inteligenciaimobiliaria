import { twMerge } from 'tailwind-merge'
import { Check } from 'lucide-react'

interface WizardStep {
    id: string
    title: string
    description?: string
    isCompleted?: boolean
    isCurrent?: boolean
}

interface WizardProps {
    steps: WizardStep[]
    currentStep: number
    onStepClick?: (stepIndex: number) => void
}

export default function Wizard({ steps, currentStep, onStepClick }: WizardProps) {
    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between relative px-2">
                {/* Progress Bar background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-white/5 rounded-full -z-10 transform -translate-y-1/2" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-primary rounded-full -z-10 transform -translate-y-1/2 transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep

                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center group cursor-pointer"
                            onClick={() => onStepClick && onStepClick(index)}
                        >
                            <div
                                className={twMerge(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-4 border-background-light dark:border-background-dark transition-all duration-300 relative z-10",
                                    isCompleted ? "bg-primary text-background-dark scale-110 shadow-glow" :
                                        isCurrent ? "bg-background-dark border-primary text-primary scale-125 shadow-glow" :
                                            "bg-gray-200 dark:bg-card-dark text-gray-400 border-transparent scale-100"
                                )}
                            >
                                {isCompleted ? (
                                    <Check size={18} strokeWidth={3} />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}

                                {isCurrent && (
                                    <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-slow -z-10 scale-150" />
                                )}
                            </div>

                            <div className="mt-3 text-center absolute top-12 w-32 transform -translate-x-1/2 left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none md:opacity-100 md:static md:w-auto md:translate-x-0 md:transform-none">
                                <p className={twMerge(
                                    "text-xs font-bold uppercase tracking-wider mb-0.5 whitespace-nowrap",
                                    isCurrent ? "text-primary" : "text-gray-500 dark:text-gray-400"
                                )}>
                                    {step.title}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
