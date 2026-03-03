import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="fixed flex items-center justify-center inset-0 z-50 bg-imi-50/50 backdrop-blur-md">
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-imi-100/50 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.05)] shadow-soft min-w-[300px] shadow-2xl">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-xl scale-150 animate-pulse" />
                    <Loader2 className="w-12 h-12 text-accent-500 animate-spin relative z-10 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-bold font-display text-imi-900 mb-2 tracking-tight">
                    Sincronizando
                </h3>
                <p className="text-imi-500 font-light text-sm text-center">
                    Obtendo dados atualizados...
                </p>
            </div>
        </div>
    )
}
