'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Share2, QrCode, Mail, Phone, Globe, Linkedin, Loader2 } from 'lucide-react'
import QRCodeLib from 'qrcode'
import { BRAND } from '@/lib/design-tokens'

export default function CartaoDigitalPage() {
    const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const load = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get broker data
            const { data: broker } = await supabase
                .from('brokers')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()

            const profileData = {
                name: broker?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Corretor IMI',
                email: broker?.email || user.email || '',
                phone: broker?.phone || '+55 81 9 8614-1487',
                creci: broker?.creci || '17933',
                role: 'Founder & CEO',
                avatar_url: broker?.avatar_url || null,
                website: 'www.iulemirandaimoveis.com.br',
                linkedin: 'linkedin.com/in/iule-miranda',
            }
            setProfile(profileData)

            // Generate QR code with vCard
            const vcard = `BEGIN:VCARD
VERSION:3.0
N:${(profileData.name as string).split(' ').reverse().join(';')}
FN:${profileData.name}
ORG:IMI - Inteligência Imobiliária
TITLE:${profileData.role}
TEL;TYPE=CELL:${profileData.phone}
EMAIL:${profileData.email}
URL:https://${profileData.website}
NOTE:CRECI ${profileData.creci} | CNAI 53290
END:VCARD`

            const qr = await QRCodeLib.toDataURL(vcard, {
                width: 400,
                margin: 2,
                color: { dark: '#0D1B2A', light: '#FFFFFF' },
                errorCorrectionLevel: 'M',
            })
            setQrDataUrl(qr)
            setLoading(false)
        }
        load()
    }, [])

    const handleDownload = () => {
        if (!cardRef.current) return
        // Open print dialog which allows saving as PDF
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const name = (profile?.name as string) || 'IMI'
        const email = (profile?.email as string) || ''
        const phone = (profile?.phone as string) || ''
        const creci = (profile?.creci as string) || ''
        const website = (profile?.website as string) || ''

        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Cartão Digital - ${name}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
@page { size: 90mm 55mm; margin: 0; }
body { margin: 0; font-family: 'Outfit', sans-serif; }
.card {
    width: 340px; height: 200px; background: #0D1B2A;
    border-radius: 12px; padding: 24px; position: relative;
    overflow: hidden; color: #EBE7E0;
}
.card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 3px; background: linear-gradient(90deg, #C8A44A, #D4B86A, #C8A44A);
}
.logo { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.logo-imi { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 2px; }
.logo-bar { width: 1px; height: 20px; background: #C8A44A; }
.logo-text { font-size: 7px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #C8A44A; line-height: 1.4; }
.name { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 2px; }
.role { font-size: 9px; color: #C8A44A; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px; }
.info { font-size: 10px; color: #8E99AB; margin-bottom: 4px; }
.info strong { color: #EBE7E0; }
.creci { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: #5C6B7D; position: absolute; bottom: 16px; left: 24px; }
.qr { position: absolute; bottom: 16px; right: 16px; width: 56px; height: 56px; background: #fff; border-radius: 6px; padding: 3px; }
.qr img { width: 100%; height: 100%; }
.watermark { position: absolute; right: -20px; top: 50%; transform: translateY(-50%); font-family: 'Playfair Display', serif; font-size: 80px; font-weight: 700; color: rgba(200,164,74,0.04); letter-spacing: 8px; }
</style></head><body>
<div class="card">
    <div class="watermark">IMI</div>
    <div class="logo">
        <span class="logo-imi">IMI</span>
        <div class="logo-bar"></div>
        <span class="logo-text">INTELIGÊNCIA<br>IMOBILIÁRIA</span>
    </div>
    <div class="name">${name}</div>
    <div class="role">Founder & CEO</div>
    <div class="info">${phone}</div>
    <div class="info">${email}</div>
    <div class="info">${website}</div>
    <div class="creci">CRECI ${creci} | CNAI 53290</div>
    <div class="qr"><img src="${qrDataUrl}" alt="QR Code"></div>
</div>
<script>setTimeout(() => window.print(), 500)</script>
</body></html>`)
        printWindow.document.close()
    }

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: `${profile?.name} - IMI Inteligência Imobiliária`,
                text: `Contato: ${profile?.name}\nCRECI: ${profile?.creci}\nTel: ${profile?.phone}\nEmail: ${profile?.email}`,
                url: `https://${profile?.website}`,
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={24} className="animate-spin" style={{ color: BRAND.gold }} />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-32">
            {/* Header */}
            <div>
                <p style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: BRAND.text3, fontWeight: 600 }}>
                    PERFIL · CARTÃO DIGITAL
                </p>
                <h1 style={{ fontFamily: BRAND.fontDisplay, fontSize: 22, fontWeight: 600, color: BRAND.text1, marginTop: 4 }}>
                    Cartão Digital
                </h1>
                <p style={{ fontSize: 13, color: BRAND.text2, marginTop: 4 }}>
                    Compartilhe seus dados profissionais com um toque
                </p>
            </div>

            {/* Card Preview */}
            <div ref={cardRef} style={{
                background: '#0D1B2A',
                borderRadius: 16,
                padding: 28,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(200,164,74,0.15)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            }}>
                {/* Gold top bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #C8A44A, #D4B86A, #C8A44A)' }} />

                {/* Watermark */}
                <div style={{
                    position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                    fontFamily: BRAND.fontDisplay, fontSize: 100, fontWeight: 700,
                    color: 'rgba(200,164,74,0.03)', letterSpacing: 8, pointerEvents: 'none',
                }}>IMI</div>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <span style={{ fontFamily: BRAND.fontDisplay, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '2px' }}>IMI</span>
                    <div style={{ width: 1, height: 24, background: '#C8A44A' }} />
                    <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2.2px', textTransform: 'uppercase', color: '#C8A44A', lineHeight: 1.4 }}>
                        INTELIGÊNCIA<br />IMOBILIÁRIA
                    </span>
                </div>

                {/* Name + Role */}
                <div style={{ fontFamily: BRAND.fontDisplay, fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                    {profile?.name as string}
                </div>
                <div style={{ fontSize: 10, color: '#C8A44A', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 20 }}>
                    {profile?.role as string}
                </div>

                {/* Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Phone size={14} style={{ color: '#C8A44A', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#EBE7E0' }}>{profile?.phone as string}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Mail size={14} style={{ color: '#C8A44A', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#EBE7E0' }}>{profile?.email as string}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Globe size={14} style={{ color: '#C8A44A', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#EBE7E0' }}>{profile?.website as string}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Linkedin size={14} style={{ color: '#C8A44A', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#EBE7E0' }}>{profile?.linkedin as string}</span>
                    </div>
                </div>

                {/* CRECI */}
                <div style={{
                    fontFamily: BRAND.fontData, fontSize: 10, color: '#5C6B7D',
                    marginTop: 20, letterSpacing: '0.5px',
                }}>
                    CRECI {profile?.creci as string} · CNAI 53290 · NBR 14653
                </div>

                {/* QR Code */}
                {qrDataUrl && (
                    <div style={{
                        position: 'absolute', bottom: 20, right: 20,
                        width: 80, height: 80, background: '#fff',
                        borderRadius: 10, padding: 4,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    }}>
                        <img src={qrDataUrl} alt="QR Code vCard" style={{ width: '100%', height: '100%', borderRadius: 6 }} />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    onClick={handleDownload}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        height: 48, background: BRAND.navySurface,
                        border: `1px solid ${BRAND.goldBorder}`,
                        borderRadius: 10, color: BRAND.text1,
                        fontFamily: BRAND.fontUI, fontSize: 12, fontWeight: 600,
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                        cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    }}
                >
                    <Download size={16} style={{ color: BRAND.gold }} />
                    Baixar PDF
                    <span style={{
                        position: 'absolute', bottom: 0, left: '12%', right: '12%',
                        height: 2, background: `linear-gradient(90deg, transparent, ${BRAND.gold}, transparent)`,
                        opacity: 0.6,
                    }} />
                </button>
                <button
                    onClick={handleShare}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        height: 48, background: 'transparent',
                        border: `1px solid ${BRAND.goldBorder}`,
                        borderRadius: 10, color: BRAND.gold,
                        fontFamily: BRAND.fontUI, fontSize: 12, fontWeight: 600,
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                        cursor: 'pointer',
                    }}
                >
                    <Share2 size={16} />
                    Compartilhar
                </button>
            </div>

            {/* QR Code Section */}
            {qrDataUrl && (
                <div style={{
                    background: BRAND.navyCard, border: `1px solid ${BRAND.goldBorder}`,
                    borderRadius: 14, padding: 24, textAlign: 'center',
                }}>
                    <QrCode size={20} style={{ color: BRAND.gold, margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: BRAND.text1, marginBottom: 4 }}>
                        QR Code com vCard
                    </p>
                    <p style={{ fontSize: 12, color: BRAND.text2, marginBottom: 16 }}>
                        Aponte a câmera para salvar o contato automaticamente
                    </p>
                    <img
                        src={qrDataUrl} alt="QR Code"
                        style={{ width: 200, height: 200, margin: '0 auto', borderRadius: 12, background: '#fff', padding: 8 }}
                    />
                </div>
            )}

            {/* Tip */}
            <div style={{
                background: BRAND.goldGlow, border: `1px solid ${BRAND.goldBorder}`,
                borderRadius: 10, padding: 16,
                fontSize: 12, color: BRAND.text2, lineHeight: 1.6,
            }}>
                <strong style={{ color: BRAND.gold }}>Dica:</strong> Compartilhe seu cartão digital com leads e parceiros.
                O QR Code contém seus dados no formato vCard — ao escanear, o contato é salvo automaticamente no celular.
            </div>
        </div>
    )
}
