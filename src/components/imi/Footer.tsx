import Image from 'next/image'
import Link from 'next/link'

const NAV_COLS = [
    {
        title: 'Serviços',
        links: [
            { label: 'Avaliações', href: '/pt/avaliacoes' },
            { label: 'Imóveis', href: '/pt/imoveis' },
            { label: 'Consultoria', href: '/pt/consultoria' },
            { label: 'Crédito', href: '/pt/credito' },
            { label: 'Inteligência', href: '/pt/inteligencia' },
        ],
    },
    {
        title: 'Empresa',
        links: [
            { label: 'Sobre', href: '/pt/sobre' },
            { label: 'Construtoras', href: '/pt/construtoras' },
            { label: 'Biblioteca', href: '/pt/biblioteca' },
            { label: 'Contato', href: '/pt/contato' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Termos de Uso', href: '/pt/termos' },
            { label: 'Privacidade', href: '/pt/privacidade' },
        ],
    },
]

const LANGUAGES = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
]

/* ── Inline styles using DS tokens ── */
const S = {
    footer: { background: '#0D1B2A' } as React.CSSProperties,
    sectionTitle: {
        fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
        textTransform: 'uppercase' as const, color: '#C8A44A',
        marginBottom: 16, fontFamily: "var(--font-body, 'Outfit', sans-serif)",
    } as React.CSSProperties,
    link: {
        fontSize: 13, color: '#8E99AB', textDecoration: 'none',
        transition: 'color 0.2s', display: 'block', padding: '10px 0',
        minHeight: 44,
        fontFamily: "var(--font-body, 'Outfit', sans-serif)",
    } as React.CSSProperties,
    contactCard: {
        background: 'rgba(14,28,48,0.52)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(200,164,74,0.12)', borderRadius: 14,
        padding: '20px 24px', marginTop: 20,
    } as React.CSSProperties,
    contactRow: {
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
        minHeight: 44,
        fontSize: 13, color: '#8E99AB', textDecoration: 'none',
    } as React.CSSProperties,
    iconBox: {
        width: 36, height: 36, borderRadius: 8, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.12)',
    } as React.CSSProperties,
    langChip: {
        padding: '10px 14px', borderRadius: 4, fontSize: 11, fontWeight: 600,
        letterSpacing: '1px', color: '#8E99AB', textDecoration: 'none',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.2s', minHeight: 44, minWidth: 44,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    } as React.CSSProperties,
}

export default function Footer() {
    return (
        <footer style={S.footer}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

                {/* Main grid */}
                <div style={{ padding: '48px 0 32px', display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>

                    {/* Logo + Description */}
                    <div>
                        <div style={{ marginBottom: 20 }}>
                            <Image
                                src="/iule-miranda-badge.png"
                                alt="Brasão profissional Iule Miranda"
                                width={180}
                                height={180}
                                style={{ width: 'clamp(88px, 12vw, 132px)', height: 'auto' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <span style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: '2px',
                            }}>IMI</span>
                            <div style={{ width: 1, height: 28, background: '#C8A44A', flexShrink: 0 }} />
                            <span style={{
                                fontSize: 11, fontWeight: 600, letterSpacing: '2.5px',
                                textTransform: 'uppercase', color: '#C8A44A', lineHeight: 1.45,
                            }}>INTELIGÊNCIA<br />IMOBILIÁRIA</span>
                        </div>

                        <p style={{ fontSize: 13, color: '#8E99AB', lineHeight: 1.7, maxWidth: 420, marginBottom: 4 }}>
                            Decisões imobiliárias baseadas em inteligência, método e segurança.
                            Transformamos incerteza em capital protegido.
                        </p>
                    </div>

                    {/* Contact card — glass */}
                    <div style={S.contactCard}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>Iule Miranda</p>
                        <p style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
                            color: '#C8A44A', marginBottom: 16,
                            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        }}>CRECI 17933 | CNAI 53290</p>

                        <a href="mailto:iule.miranda.imoveis@gmail.com" style={{ ...S.contactRow, wordBreak: 'break-all' as const }}>
                            <div style={S.iconBox}>
                                <svg width="16" height="16" fill="none" stroke="#C8A44A" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9-4 9 4"/></svg>
                            </div>
                            <span style={{ wordBreak: 'break-all' }}>iule.miranda.imoveis@gmail.com</span>
                        </a>
                        <a href="https://wa.me/5581986141487" style={S.contactRow}>
                            <div style={S.iconBox}>
                                <svg width="16" height="16" fill="none" stroke="#C8A44A" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1zm0 0a5 5 0 0 0 5 5m0 0a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1h1z"/></svg>
                            </div>
                            +55 81 9 8614-1487
                        </a>
                        <a href="https://www.linkedin.com/in/iule-miranda" target="_blank" rel="noopener noreferrer" style={S.contactRow}>
                            <div style={S.iconBox}>
                                <svg width="16" height="16" fill="none" stroke="#C8A44A" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z"/></svg>
                            </div>
                            linkedin.com/in/iule-miranda
                        </a>
                    </div>

                    {/* Nav columns — responsive grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24 }}>
                        {NAV_COLS.map((col) => (
                            <div key={col.title}>
                                <p style={S.sectionTitle}>{col.title}</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {col.links.map((link) => (
                                        <Link key={link.href} href={link.href} style={S.link}>
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Languages */}
                        <div>
                            <p style={S.sectionTitle}>Idioma</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {LANGUAGES.map((lang) => (
                                    <Link key={lang.code} href={`/${lang.code}`} style={S.langChip}>
                                        {lang.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Credentials bar */}
                <div style={{
                    padding: '16px 0', borderTop: '1px solid rgba(200,164,74,0.08)',
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12,
                }}>
                    {['CRECI 17933', 'CNAI 53290', 'NBR 14653'].map(cred => (
                        <span key={cred} style={{
                            fontSize: 11, fontWeight: 600, letterSpacing: '1px',
                            color: '#C8A44A', padding: '4px 10px', borderRadius: 4,
                            background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.10)',
                            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        }}>{cred}</span>
                    ))}
                </div>

                {/* Bottom bar */}
                <div style={{
                    padding: '16px 0 24px', borderTop: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}>
                    <p style={{ fontSize: 11, color: '#4F5B6B' }}>
                        © 2026 IMI — Inteligência Imobiliária. Todos os direitos reservados.
                    </p>
                    <p style={{ fontSize: 11, color: '#4F5B6B' }}>
                        iulemirandaimoveis.com.br
                    </p>
                </div>

            </div>
        </footer>
    )
}
