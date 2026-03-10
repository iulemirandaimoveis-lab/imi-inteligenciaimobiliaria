/**
 * PropertyShowcase — Composição Remotion
 * Formato: 9:16 (TikTok / Instagram Reels / YouTube Shorts)
 * Duração: 15s @30fps = 450 frames
 */
import {
    AbsoluteFill, Img, Sequence, spring, useCurrentFrame, useVideoConfig,
    interpolate, Audio, staticFile,
} from 'remotion'

export interface PropertyShowcaseProps {
    // Property data
    title: string
    subtitle: string
    price: string
    pricePerSqm?: string
    neighborhood: string
    city: string
    area: string
    bedrooms?: number
    bathrooms?: number
    parking?: number
    // Media
    images: string[]           // Array of image URLs
    logoUrl?: string
    // Branding
    brokerName?: string
    brokerPhone?: string
    brokerCreci?: string
    // Style
    accentColor?: string       // default #2C7BE5
    theme?: 'dark' | 'light'
}

const DEFAULT_ACCENT = '#2C7BE5'
const FPS = 30
const DURATION = 450 // 15s

// ─── Utility ──────────────────────────────────────────────────────
function springIn(frame: number, delay = 0, stiffness = 180, damping = 20) {
    return spring({ fps: FPS, frame: frame - delay, config: { stiffness, damping }, durationInFrames: 30 })
}

// ─── Animated Text ─────────────────────────────────────────────────
function AnimatedText({
    children,
    delay = 0,
    style,
    className = '',
}: {
    children: React.ReactNode
    delay?: number
    style?: React.CSSProperties
    className?: string
}) {
    const frame = useCurrentFrame()
    const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const y = interpolate(frame - delay, [0, 18], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    return (
        <div className={className} style={{ opacity, transform: `translateY(${y}px)`, ...style }}>
            {children}
        </div>
    )
}

// ─── Animated Bar ──────────────────────────────────────────────────
function AnimatedBar({ delay = 0, color = DEFAULT_ACCENT }: { delay?: number; color?: string }) {
    const frame = useCurrentFrame()
    const width = interpolate(frame - delay, [0, 20], [0, 100], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    })
    return (
        <div style={{
            height: 3,
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            borderRadius: 2,
            marginBottom: 12,
        }} />
    )
}

// ─── Image Slide ───────────────────────────────────────────────────
function ImageSlide({ src, index, totalSlides, accentColor = DEFAULT_ACCENT }: {
    src: string
    index: number
    totalSlides: number
    accentColor?: string
}) {
    const frame = useCurrentFrame()
    const { durationInFrames } = useVideoConfig()

    // Ken Burns: slow zoom
    const scale = interpolate(frame, [0, durationInFrames], [1, 1.07], { extrapolateRight: 'clamp' })
    const panX = interpolate(frame, [0, durationInFrames], [index % 2 === 0 ? -1 : 1, index % 2 === 0 ? 1 : -1])

    return (
        <AbsoluteFill>
            <div style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
            }}>
                <Img
                    src={src}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${scale}) translateX(${panX}px)`,
                        transformOrigin: 'center center',
                    }}
                />
                {/* Dark gradient overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.1) 100%)',
                }} />
                {/* Top gradient */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '30%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
                }} />
            </div>
        </AbsoluteFill>
    )
}

// ─── Spec Pill ─────────────────────────────────────────────────────
function Spec({ icon, value, delay }: { icon: string; value: string; delay: number }) {
    const frame = useCurrentFrame()
    const opacity = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const scale = spring({ fps: FPS, frame: frame - delay, config: { stiffness: 220, damping: 22 } })
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            borderRadius: 20,
            padding: '6px 14px',
            border: '1px solid rgba(255,255,255,0.18)',
            opacity,
            transform: `scale(${scale})`,
        }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>{value}</span>
        </div>
    )
}

// ─── Main Composition ─────────────────────────────────────────────
export const PropertyShowcase: React.FC<PropertyShowcaseProps> = ({
    title,
    subtitle,
    price,
    pricePerSqm,
    neighborhood,
    city,
    area,
    bedrooms,
    bathrooms,
    parking,
    images = [],
    logoUrl,
    brokerName,
    brokerPhone,
    brokerCreci,
    accentColor = DEFAULT_ACCENT,
    theme = 'dark',
}) => {
    const frame = useCurrentFrame()
    const { fps, durationInFrames } = useVideoConfig()

    // Image slideshow: switch every 5s (150 frames)
    const SLIDE_DURATION = 150
    const totalSlides = Math.max(images.length, 1)
    const currentSlide = Math.min(Math.floor(frame / SLIDE_DURATION), totalSlides - 1)
    const slideProgress = (frame % SLIDE_DURATION) / SLIDE_DURATION

    // Slide transition opacity
    const slideOpacity = interpolate(
        frame % SLIDE_DURATION,
        [0, 15, SLIDE_DURATION - 15, SLIDE_DURATION],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )

    // CTA pulsing opacity at the end
    const ctaOpacity = interpolate(frame, [DURATION - 90, DURATION - 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const ctaPulse = 0.95 + 0.05 * Math.sin((frame / fps) * Math.PI * 2)

    // Progress bar
    const progress = (frame / durationInFrames) * 100

    const src = images[currentSlide] || `https://placehold.co/1080x1920/0d1117/2C7BE5?text=${encodeURIComponent(title)}`

    return (
        <AbsoluteFill style={{ backgroundColor: '#0d1117', fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* Background image with Ken Burns */}
            <Sequence from={0} durationInFrames={durationInFrames}>
                <div style={{ position: 'absolute', inset: 0, opacity: slideOpacity }}>
                    <ImageSlide
                        src={src}
                        index={currentSlide}
                        totalSlides={totalSlides}
                        accentColor={accentColor}
                    />
                </div>
            </Sequence>

            {/* ── TOP BAR ── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '48px 40px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                {/* Logo / Brand */}
                <AnimatedText delay={5}>
                    {logoUrl ? (
                        <Img src={logoUrl} style={{ height: 36, objectFit: 'contain' }} />
                    ) : (
                        <div style={{
                            background: accentColor,
                            borderRadius: 10,
                            padding: '8px 16px',
                            fontWeight: 800,
                            fontSize: 18,
                            color: 'white',
                            letterSpacing: '-0.5px',
                        }}>
                            IMI
                        </div>
                    )}
                </AnimatedText>

                {/* Slide counter */}
                <AnimatedText delay={8}>
                    <div style={{
                        display: 'flex', gap: 6, alignItems: 'center',
                    }}>
                        {images.slice(0, 5).map((_, i) => (
                            <div key={i} style={{
                                width: i === currentSlide ? 20 : 6,
                                height: 6,
                                borderRadius: 3,
                                background: i === currentSlide ? accentColor : 'rgba(255,255,255,0.3)',
                                transition: 'width 0.3s',
                            }} />
                        ))}
                    </div>
                </AnimatedText>
            </div>

            {/* ── BOTTOM CONTENT ── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0 40px 80px',
            }}>

                {/* Location */}
                <AnimatedText delay={10} style={{ marginBottom: 8 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 16,
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                    }}>
                        <span style={{ fontSize: 14 }}>📍</span>
                        {neighborhood} · {city}
                    </div>
                </AnimatedText>

                {/* Accent bar */}
                <AnimatedBar delay={12} color={accentColor} />

                {/* Title */}
                <AnimatedText delay={15} style={{ marginBottom: 8 }}>
                    <div style={{
                        fontSize: 38,
                        fontWeight: 800,
                        color: 'white',
                        lineHeight: 1.1,
                        letterSpacing: '-1px',
                    }}>
                        {title}
                    </div>
                </AnimatedText>

                {/* Subtitle */}
                {subtitle && (
                    <AnimatedText delay={18} style={{ marginBottom: 24 }}>
                        <div style={{
                            fontSize: 18,
                            fontWeight: 400,
                            color: 'rgba(255,255,255,0.65)',
                            lineHeight: 1.4,
                        }}>
                            {subtitle}
                        </div>
                    </AnimatedText>
                )}

                {/* Specs row */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                    {area && <Spec icon="📐" value={area} delay={20} />}
                    {bedrooms && <Spec icon="🛏" value={`${bedrooms} qts`} delay={23} />}
                    {bathrooms && <Spec icon="🚿" value={`${bathrooms} bhs`} delay={26} />}
                    {parking && <Spec icon="🚗" value={`${parking} vagas`} delay={29} />}
                </div>

                {/* Price */}
                <AnimatedText delay={25} style={{ marginBottom: 28 }}>
                    <div>
                        <div style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.5)',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                        }}>
                            A partir de
                        </div>
                        <div style={{
                            fontSize: 48,
                            fontWeight: 900,
                            color: accentColor,
                            letterSpacing: '-2px',
                            lineHeight: 1,
                        }}>
                            {price}
                        </div>
                        {pricePerSqm && (
                            <div style={{
                                fontSize: 14,
                                color: 'rgba(255,255,255,0.45)',
                                marginTop: 6,
                            }}>
                                {pricePerSqm}
                            </div>
                        )}
                    </div>
                </AnimatedText>

                {/* CTA Button */}
                <div style={{ opacity: ctaOpacity, transform: `scale(${ctaPulse})` }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        background: accentColor,
                        borderRadius: 16,
                        padding: '16px 32px',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 18,
                        letterSpacing: '-0.3px',
                    }}>
                        <span>Saiba Mais</span>
                        <span>→</span>
                    </div>
                </div>

                {/* Broker info */}
                {brokerName && (
                    <AnimatedText delay={30} style={{ marginTop: 20 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 13,
                        }}>
                            <div style={{
                                width: 32, height: 32,
                                borderRadius: '50%',
                                background: accentColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14,
                            }}>
                                👤
                            </div>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 14 }}>{brokerName}</div>
                                {brokerPhone && <div>{brokerPhone}{brokerCreci ? ` · CRECI ${brokerCreci}` : ''}</div>}
                            </div>
                        </div>
                    </AnimatedText>
                )}
            </div>

            {/* ── PROGRESS BAR ── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 4,
                background: 'rgba(255,255,255,0.1)',
            }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})`,
                }} />
            </div>
        </AbsoluteFill>
    )
}

export const propertyShowcaseDefaultProps: PropertyShowcaseProps = {
    title: 'Apartamento Premium',
    subtitle: 'Vista para o mar, acabamento de alto padrão',
    price: 'R$ 890k',
    pricePerSqm: 'R$ 12.500/m²',
    neighborhood: 'Boa Viagem',
    city: 'Recife, PE',
    area: '72m²',
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    images: ['https://placehold.co/1080x1920/0d1117/2C7BE5?text=Foto+1'],
    accentColor: '#2C7BE5',
}
