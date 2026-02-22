import os

def replace_in_file(path, replacements):
    with open(path, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(path, 'w') as f:
        f.write(content)


# --- 1. DesktopHeader.tsx ---
dh_path = 'src/app/(backoffice)/components/DesktopHeader.tsx'
dh_replacements = [
    (
        '''const S = {
    surface: '#13161E',
    elevated: '#1A1E2A',
    border: 'rgba(255,255,255,0.08)',
    borderGold: 'rgba(196,157,91,0.22)',
    text: '#F0F2F5',
    textMuted: '#8B93A7',
    gold: '#C49D5B',
}''',
        '''const S = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    gold: '#C49D5B',
}'''
    ),
    (
        '''style={{ background: '#C49D5B', boxShadow: `0 0 0 2px #0D0F14` }}''',
        '''style={{ background: '#C49D5B', boxShadow: `0 0 0 2px var(--bo-surface)` }}'''
    ),
    (
        '''style={{ color: '#4E5669' }}''',
        '''style={{ color: 'var(--bo-text-muted)' }}'''
    ),
    (
        '''style={{ borderTop: `1px solid ${S.border}` }}''',
        '''style={{ borderTop: `1px solid var(--bo-border)` }}'''
    ),
    (
        '''<div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />''',
        '''<div className="w-px h-5 mx-1" style={{ background: 'var(--bo-border)' }} />'''
    ),
    (
        '''style={{ background: 'rgba(196,157,91,0.12)' }}''',
        '''style={{ background: 'var(--bo-active-bg)' }}'''
    )
]
replace_in_file(dh_path, dh_replacements)


# --- 2. DesktopSidebar.tsx ---
ds_path = 'src/app/(backoffice)/components/DesktopSidebar.tsx'
ds_replacements = [
    (
        '''style={{
                        color: isParentActive || open ? '#C49D5B' : '#8B93A7',
                        background: isParentActive || open ? 'rgba(196,157,91,0.08)' : 'transparent',
                        fontWeight: isParentActive ? 600 : 500,
                    }}''',
        '''style={{
                        color: isParentActive || open ? '#C49D5B' : 'var(--bo-text-muted)',
                        background: isParentActive || open ? 'var(--bo-active-bg)' : 'transparent',
                        fontWeight: isParentActive ? 600 : 500,
                    }}'''
    ),
    (
        '''borderLeft: '1px solid rgba(255,255,255,0.06)' ''',
        '''borderLeft: '1px solid var(--bo-border-light)' '''
    ),
    (
        '''color: isActive ? '#0D0F14' : '#8B93A7',''',
        '''color: isActive ? 'var(--bo-surface)' : 'var(--bo-text-muted)','''
    ),
    (
        '''onMouseEnter={e => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                        ; (e.currentTarget as HTMLElement).style.color = '#F0F2F5'
                }
            }}
            onMouseLeave={e => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ; (e.currentTarget as HTMLElement).style.color = '#8B93A7'
                }
            }}''',
        '''onMouseEnter={e => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bo-hover)'
                        ; (e.currentTarget as HTMLElement).style.color = 'var(--bo-text)'
                }
            }}
            onMouseLeave={e => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ; (e.currentTarget as HTMLElement).style.color = 'var(--bo-text-muted)'
                }
            }}'''
    ),
    (
        '''style={{ background: '#13161E', borderTop: '1px solid rgba(255,255,255,0.06)' }}''',
        '''style={{ background: 'var(--bo-drawer-bg)', borderTop: '1px solid var(--bo-border)' }}'''
    ),
    (
        '''style={{ background: 'rgba(255,255,255,0.03)' }}''',
        '''style={{ background: 'var(--bo-icon-bg)' }}'''
    ),
    (
        '''style={{ color: '#F0F2F5' }}''',
        '''style={{ color: 'var(--bo-text)' }}'''
    ),
    (
        '''style={{ color: '#4E5669' }}''',
        '''style={{ color: 'var(--bo-text-muted)' }}'''
    ),
    (
        '''background: '#13161E',''',
        '''background: 'var(--bo-drawer-bg)','''
    )
]
replace_in_file(ds_path, ds_replacements)


# --- 3. MobileBottomNav.tsx ---
mb_path = 'src/app/(backoffice)/components/MobileBottomNav.tsx'
with open(mb_path, 'r') as f:
    mb_content = f.read()

# We revert the isLight logic.
mb_content = mb_content.replace('''    const { theme } = useTheme()
    const isLight = theme === 'light'
    const [open, setOpen] = useState(false)

    const SURFACE = isLight ? 'rgba(255,255,255,0.96)' : 'rgba(19,22,30,0.96)'
    const DIM = isLight ? '#6b7280' : '#4E5669'

    const SHEET_BG = isLight ? '#ffffff' : '#13161E'
    const BORDER = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
    const TEXT = isLight ? '#111827' : '#F0F2F5'
    const DIM_TEXT = isLight ? '#6b7280' : '#8B93A7'
    const HOVER_BG = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'
    const ICON_BG = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'

''', '''    const [open, setOpen] = useState(false)
    const SURFACE = 'var(--bo-surface)'
    const DIM = 'var(--bo-text-muted)'
    
    const SHEET_BG = 'var(--bo-drawer-bg)'
    const BORDER = 'var(--bo-border)'
    const TEXT = 'var(--bo-text)'
    const DIM_TEXT = 'var(--bo-text-muted)'
    const HOVER_BG = 'var(--bo-hover)'
    const ICON_BG = 'var(--bo-icon-bg)'

''')

mb_content = mb_content.replace(
'''border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(196,157,91,0.18)',
                        boxShadow: isLight ? '0 -4px 24px rgba(0,0,0,0.06)' : '0 -4px 24px rgba(0,0,0,0.40), 0 2px 0 rgba(196,157,91,0.08) inset',''', 
'''border: `1px solid ${BORDER}`,
                        boxShadow: 'var(--bo-shadow)','''
)
mb_content = mb_content.replace('''style={{ background: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(7,9,13,0.75)', backdropFilter: 'blur(6px)' }}''', '''style={{ background: 'rgba(7,9,13,0.75)', backdropFilter: 'blur(6px)' }}''')
mb_content = mb_content.replace('''boxShadow: isLight ? '0 -16px 48px rgba(0,0,0,0.1)' : '0 -16px 48px rgba(0,0,0,0.6)',''', '''boxShadow: 'var(--bo-shadow-elevated)',''')

with open(mb_path, 'w') as f:
    f.write(mb_content)

print("Theme sync successful.")
