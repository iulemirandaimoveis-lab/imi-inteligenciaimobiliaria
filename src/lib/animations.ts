import { Variants } from 'framer-motion'

/**
 * Fade in animation
 */
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.6,
            ease: 'easeInOut',
        },
    },
}

/**
 * Slide up animation
 */
export const slideUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: 'easeOut',
        },
    },
}

/**
 * Slide down animation
 */
export const slideDown: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: 'easeOut',
        },
    },
}

/**
 * Stagger children animation
 */
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
}

/**
 * Scale on hover (subtle)
 */
export const scaleOnHover = {
    rest: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    },
}
