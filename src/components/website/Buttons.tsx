interface ButtonProps {
    children: React.ReactNode
    full?: boolean
}

export function PrimaryButton({ children, full }: ButtonProps) {
    return (
        <button
            className={`${full ? "w-full" : ""
                } bg-[#1e1e2f] text-white py-4 px-8 rounded-xl font-bold shadow-lg hover:bg-black transition-all active:scale-[0.98]`}
        >
            {children}
        </button>
    )
}

export function SecondaryButton({ children }: ButtonProps) {
    return (
        <button className="border-2 border-white text-white py-4 px-8 rounded-xl font-bold hover:bg-white hover:text-black transition-all active:scale-[0.98]">
            {children}
        </button>
    )
}
