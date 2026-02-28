import { Variants, type Transition } from 'framer-motion'

/* ────────────────────────────────────────────────────────────────
   IMI ANIMATIONS SYSTEM — Cinematic Motion Design
   Spring physics for premium feel, stagger for hierarchy
   ──────────────────────────────────────────────────────────────── */

// ── Spring presets ──────────────────────────────────────────────
const springSmooth: Transition = { type: 'spring', stiffness: 120, damping: 20 }
const springSnappy: Transition = { type: 'spring', stiffness: 300, damping: 25 }
const springGentle: Transition = { type: 'spring', stiffness: 80, damping: 18 }

// ── Page transitions ────────────────────────────────────────────
export const pageTransition: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            ...springSmooth,
            staggerChildren: 0.05,
            delayChildren: 0.08,
        },
    },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

// ── Fade variants ───────────────────────────────────────────────
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: springSmooth },
}

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -16 },
    visible: { opacity: 1, y: 0, transition: springSmooth },
}

export const fadeInScale: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: springSmooth },
}

// ── Slide variants ──────────────────────────────────────────────
export const slideUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: springSmooth },
}

export const slideDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: springSmooth },
}

export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -24 },
    visible: { opacity: 1, x: 0, transition: springSmooth },
}

export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0, transition: springSmooth },
}

// ── Container / Stagger ─────────────────────────────────────────
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
}

export const staggerContainerSlow: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.15,
        },
    },
}

// ── Card variants ───────────────────────────────────────────────
export const cardVariant: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: springSmooth },
}

export const cardHover = {
    rest: {
        scale: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: { duration: 0.2 },
    },
    hover: {
        scale: 1.02,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        transition: springSnappy,
    },
    tap: {
        scale: 0.98,
        transition: { duration: 0.1 },
    },
}

// ── Button micro-interactions ───────────────────────────────────
export const buttonVariant = {
    rest: { scale: 1 },
    hover: { scale: 1.02, transition: springSnappy },
    tap: { scale: 0.97, transition: { duration: 0.1 } },
}

// ── Modal / Dialog ──────────────────────────────────────────────
export const modalOverlay: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContent: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: springSmooth },
    exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
}

// ── Sidebar ─────────────────────────────────────────────────────
export const sidebarSlide: Variants = {
    hidden: { x: -280, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: springGentle },
    exit: { x: -280, opacity: 0, transition: { duration: 0.2 } },
}

// ── KPI / Number counter ────────────────────────────────────────
export const numberReveal: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { ...springSmooth, delay: 0.15 },
    },
}

// ── List item (for Kanban, table rows, etc.) ────────────────────
export const listItem: Variants = {
    hidden: { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: springSmooth },
    exit: { opacity: 0, x: 8, transition: { duration: 0.15 } },
}

// ── Skeleton shimmer (for loading states) ───────────────────────
export const shimmer: Variants = {
    hidden: { opacity: 0.5 },
    visible: {
        opacity: [0.5, 0.8, 0.5],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
}

// ── Scale on hover (legacy compat) ──────────────────────────────
export const scaleOnHover = {
    rest: { scale: 1 },
    hover: { scale: 1.02, transition: springSnappy },
}

// ── Utility: reduce motion on mobile ────────────────────────────
export const mobileReducedMotion = {
    ...springSmooth,
    duration: 0.3,
}
