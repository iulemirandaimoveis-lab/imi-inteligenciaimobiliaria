export default function OfflinePage() {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#050B14', color: '#E8E4DC', textAlign: 'center', padding: 32,
        }}>
            <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: 'rgba(200,164,74,0.1)', marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#C8A44A',
            }}>IMI</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', serif" }}>Sem conexão</h1>
            <p style={{ fontSize: 14, color: '#8E99AB', marginTop: 8 }}>Verifique sua internet e tente novamente.</p>
            <button onClick={() => typeof window !== 'undefined' && window.location.reload()} style={{
                marginTop: 24, background: '#0A1624', color: '#E8E4DC',
                border: '1px solid rgba(200,164,74,0.3)', borderRadius: 6,
                padding: '10px 24px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Tentar novamente</button>
        </div>
    )
}
