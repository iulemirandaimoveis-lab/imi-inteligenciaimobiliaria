'use client'

import { useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, useAnimation, PanInfo } from 'framer-motion'

// Pages in swipe order — matches MobileBottomNav BOTTOM_ITEMS
const SWIPE_PAGES = [
  '/backoffice/hoje',
  '/backoffice/imoveis',
  '/backoffice/leads',
  '/backoffice/connect',
]

const SWIPE_THRESHOLD = 80
const VELOCITY_THRESHOLD = 300

export function SwipeablePageWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const controls = useAnimation()
  const isNavigating = useRef(false)

  const currentIndex = SWIPE_PAGES.findIndex((p) => pathname.startsWith(p))
  const canSwipe = currentIndex !== -1

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    if (!canSwipe || isNavigating.current) return

    const { offset, velocity } = info
    const swipedLeft = offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD
    const swipedRight = offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD

    let targetIndex = currentIndex

    if (swipedLeft && currentIndex < SWIPE_PAGES.length - 1) {
      targetIndex = currentIndex + 1
    } else if (swipedRight && currentIndex > 0) {
      targetIndex = currentIndex - 1
    }

    if (targetIndex !== currentIndex) {
      isNavigating.current = true
      const direction = targetIndex > currentIndex ? -1 : 1
      await controls.start({
        x: direction * window.innerWidth,
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeIn' },
      })
      router.push(SWIPE_PAGES[targetIndex])
      // Reset position for new page
      controls.set({ x: -direction * window.innerWidth * 0.3, opacity: 0 })
      await controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0.25, ease: 'easeOut' },
      })
      isNavigating.current = false
    } else {
      // Snap back
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } })
    }
  }

  // Only enable swipe on mobile (touch devices) and on swipeable pages
  if (!canSwipe) {
    return <>{children}</>
  }

  return (
    <motion.div
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      style={{
        touchAction: 'pan-y',
        overscrollBehaviorX: 'contain',
        minHeight: '100%',
      }}
    >
      {children}
    </motion.div>
  )
}
