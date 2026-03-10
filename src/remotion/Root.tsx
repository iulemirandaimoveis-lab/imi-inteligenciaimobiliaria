/**
 * Remotion Root — IMI Video System
 * Registra todas as composições de vídeo para preview e render
 */
import { Composition } from 'remotion'
import { PropertyShowcase, propertyShowcaseDefaultProps } from './compositions/PropertyShowcase'
import { MarketReport, marketReportDefaultProps } from './compositions/MarketReport'

export const RemotionRoot: React.FC = () => {
    return (
        <>
            {/* 9:16 — TikTok / Instagram Reels / YouTube Shorts */}
            <Composition
                id="PropertyShowcase"
                component={PropertyShowcase}
                durationInFrames={450}   // 15s
                fps={30}
                width={1080}
                height={1920}
                defaultProps={propertyShowcaseDefaultProps}
            />

            {/* 1:1 — Instagram / Facebook */}
            <Composition
                id="MarketReport"
                component={MarketReport}
                durationInFrames={300}   // 10s
                fps={30}
                width={1080}
                height={1080}
                defaultProps={marketReportDefaultProps}
            />
        </>
    )
}
