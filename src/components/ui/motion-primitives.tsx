'use client'

import { useRef, useState, ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

// ── Magnetic Button ─────────────────────────────────────────────────────────
// Premium button that subtly follows the cursor when hovered
export function MagneticButton({
    children,
    className = '',
    strength = 0.3,
    as: Component = 'button',
    ...props
}: {
    children: ReactNode
    className?: string
    strength?: number
    as?: any
    [key: string]: any
}) {
    const ref = useRef<HTMLElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const springX = useSpring(x, { stiffness: 300, damping: 20 })
    const springY = useSpring(y, { stiffness: 300, damping: 20 })

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        x.set((e.clientX - centerX) * strength)
        y.set((e.clientY - centerY) * strength)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            ref={ref as any}
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="inline-block"
        >
            <Component className={className} {...props}>
                {children}
            </Component>
        </motion.div>
    )
}

// ── Tilt Card ───────────────────────────────────────────────────────────────
// Card with 3D tilt effect on hover (like Apple product cards)
export function TiltCard({
    children,
    className = '',
    tiltDegree = 8,
    glare = true,
}: {
    children: ReactNode
    className?: string
    tiltDegree?: number
    glare?: boolean
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const rotateX = useMotionValue(0)
    const rotateY = useMotionValue(0)
    const glareX = useMotionValue(50)
    const glareY = useMotionValue(50)

    const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 })
    const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 })

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        rotateX.set((y - 0.5) * -tiltDegree)
        rotateY.set((x - 0.5) * tiltDegree)
        glareX.set(x * 100)
        glareY.set(y * 100)
    }

    const handleMouseLeave = () => {
        rotateX.set(0)
        rotateY.set(0)
        setIsHovered(false)
    }

    return (
        <motion.div
            ref={ref}
            style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformPerspective: 1000,
                transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className={`relative ${className}`}
        >
            {children}
            {glare && isHovered && (
                <div
                    className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-20 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.25), transparent 60%)`,
                    }}
                />
            )}
        </motion.div>
    )
}

// ── Scroll Reveal ───────────────────────────────────────────────────────────
// Wrapper for scroll-triggered animations with configurable variants
export function ScrollReveal({
    children,
    className = '',
    variant = 'fadeUp',
    delay = 0,
    duration = 0.6,
    once = true,
}: {
    children: ReactNode
    className?: string
    variant?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scaleUp' | 'blur'
    delay?: number
    duration?: number
    once?: boolean
}) {
    const variants = {
        fadeUp: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
        fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
        slideLeft: { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } },
        slideRight: { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } },
        scaleUp: { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
        blur: { hidden: { opacity: 0, filter: 'blur(10px)' }, visible: { opacity: 1, filter: 'blur(0px)' } },
    }

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: '-50px' }}
            variants={variants[variant]}
            transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ── Parallax Section ────────────────────────────────────────────────────────
// Creates depth with parallax scrolling
export function ParallaxLayer({
    children,
    speed = 0.3,
    className = '',
}: {
    children: ReactNode
    speed?: number
    className?: string
}) {
    const ref = useRef<HTMLDivElement>(null)
    const y = useMotionValue(0)

    return (
        <motion.div
            ref={ref}
            style={{ y }}
            className={className}
            onViewportEnter={() => {
                const handleScroll = () => {
                    if (!ref.current) return
                    const rect = ref.current.getBoundingClientRect()
                    const center = rect.top + rect.height / 2
                    const windowCenter = window.innerHeight / 2
                    y.set((center - windowCenter) * speed * -1)
                }
                window.addEventListener('scroll', handleScroll, { passive: true })
                return () => window.removeEventListener('scroll', handleScroll)
            }}
        >
            {children}
        </motion.div>
    )
}

// ── Animated Counter ────────────────────────────────────────────────────────
// Number that counts up when visible, with spring physics
export function AnimatedCounter({
    to,
    suffix = '',
    prefix = '',
    duration = 2000,
    className = '',
}: {
    to: number
    suffix?: string
    prefix?: string
    duration?: number
    className?: string
}) {
    const [count, setCount] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)

    return (
        <motion.span
            className={className}
            onViewportEnter={() => {
                if (hasAnimated) return
                setHasAnimated(true)
                const start = Date.now()
                const tick = () => {
                    const elapsed = Date.now() - start
                    const progress = Math.min(elapsed / duration, 1)
                    const ease = 1 - Math.pow(1 - progress, 4)
                    setCount(Math.round(to * ease))
                    if (progress < 1) requestAnimationFrame(tick)
                }
                requestAnimationFrame(tick)
            }}
            viewport={{ once: true }}
        >
            {prefix}{count.toLocaleString('pt-BR')}{suffix}
        </motion.span>
    )
}

// ── Stagger Container ───────────────────────────────────────────────────────
// Container that staggers children animations
export function StaggerContainer({
    children,
    className = '',
    staggerDelay = 0.08,
    once = true,
}: {
    children: ReactNode
    className?: string
    staggerDelay?: number
    once?: boolean
}) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: '-50px' }}
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggerDelay } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ── Stagger Item ────────────────────────────────────────────────────────────
export function StaggerItem({
    children,
    className = '',
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ── Text Reveal ─────────────────────────────────────────────────────────────
// Text that reveals character by character or word by word
export function TextReveal({
    text,
    className = '',
    mode = 'word',
}: {
    text: string
    className?: string
    mode?: 'word' | 'char'
}) {
    const units = mode === 'word' ? text.split(' ') : text.split('')

    return (
        <motion.span
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: mode === 'word' ? 0.06 : 0.02 } } }}
            className={className}
        >
            {units.map((unit, i) => (
                <motion.span
                    key={i}
                    variants={{
                        hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
                        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
                    }}
                    className="inline-block"
                >
                    {unit}{mode === 'word' && i < units.length - 1 ? '\u00A0' : ''}
                </motion.span>
            ))}
        </motion.span>
    )
}
