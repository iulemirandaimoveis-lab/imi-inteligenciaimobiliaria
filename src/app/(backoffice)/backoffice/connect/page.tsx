'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useChannels } from '@/features/connect/hooks/useChannels'
import { useChat } from '@/features/connect/hooks/useChat'
import { useSounds } from '@/features/connect/hooks/useSounds'
import { useVoiceRecorder } from '@/features/connect/hooks/useVoiceRecorder'
import { PresenceProvider, usePresenceContext } from '@/features/connect/components/PresenceProvider'
import type { ChatChannel, ChatMessage, Attachment, ContentType } from '@/features/connect/types'
import { T, cardStyle } from '@/app/(backoffice)/lib/theme'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageSquare, Plus, Send, Hash, Users, Building2,
    Briefcase, Search, MoreVertical, Smile, Paperclip,
    ArrowLeft, Bell, BellOff, Pin, Archive, UserPlus,
    Circle, CheckCheck, Loader2, Volume2, VolumeX, Handshake, Vibrate,
    Mic, MicOff, Play, Pause, X, FileText, Image as ImageIcon, Download, File,
    Trash2, ChevronUp, Info, Settings,
} from 'lucide-react'

// ── Channel Icon ─────────────────────────────────────────
function ChannelIcon({ type, size = 16 }: { type: string; size?: number }) {
    switch (type) {
        case 'deal_room': return <Briefcase size={size} />
        case 'team': return <Hash size={size} />
        case 'direct': return <Circle size={size} style={{ fill: 'var(--success)', color: 'var(--success)' }} />
        case 'group': return <Users size={size} />
        case 'property': return <Building2 size={size} />
        case 'partnership': return <Handshake size={size} />
        default: return <MessageSquare size={size} />
    }
}

// ── Time formatter ───────────────────────────────────────
function formatTime(dateStr: string | null) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'agora'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
    if (diff < 86_400_000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ── Avatar ───────────────────────────────────────────────
function ChatAvatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
    const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    const hue = name.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xff, 0) % 360

    if (url) {
        return (
            <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src={url} alt={name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        )
    }

    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: `hsl(${hue}, 40%, 20%)`,
            color: `hsl(${hue}, 60%, 70%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.36, fontWeight: 700, letterSpacing: '-0.02em',
        }}>
            {initials}
        </div>
    )
}

// ── Reaction Emoji Set ──────────────────────────────────
const REACTION_EMOJIS = ['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F525}']

// ── Message Bubble ───────────────────────────────────────
function MessageBubble({ msg, isOwn, hovered, onReaction, currentUserId }: {
    msg: ChatMessage; isOwn: boolean; hovered?: boolean;
    onReaction?: (messageId: string, emoji: string) => void; currentUserId?: string;
}) {
    if (msg.content_type === 'system') {
        return (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <span style={{
                    fontSize: 11, color: T.textDim,
                    background: T.subtle, padding: '4px 12px',
                    borderRadius: T.radius.full, fontStyle: 'italic',
                }}>
                    {msg.content}
                </span>
            </div>
        )
    }

    if (msg.content_type === 'nudge') {
        const senderName = isOwn ? 'Você' : (msg.sender?.name ?? msg.sender_name ?? 'Alguém')
        return (
            <motion.div
                initial={{ x: -8 }}
                animate={{ x: [0, -6, 6, -4, 4, -2, 2, 0] }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center', padding: '8px 0' }}
            >
                <span style={{
                    fontSize: 12, color: '#F59E0B',
                    background: 'rgba(245,158,11,0.1)', padding: '6px 14px',
                    borderRadius: T.radius.full, fontWeight: 600,
                    border: '1px solid rgba(245,158,11,0.25)',
                }}>
                    <Vibrate size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    {senderName} enviou um chacoalhão!
                </span>
            </motion.div>
        )
    }

    const bubbleBg = isOwn ? T.accent : T.surface
    const bubbleColor = isOwn ? T.textInverse : T.text
    const bubbleBorder = isOwn ? 'none' : `1px solid ${T.borderLight}`
    const attachments = (msg.attachments || []) as Attachment[]

    const renderContent = () => {
        // Voice message
        if (msg.content_type === 'voice') {
            const voiceUrl = attachments[0]?.url || msg.content
            return <VoicePlayer url={voiceUrl || ''} isOwn={isOwn} />
        }
        // Image message
        if (msg.content_type === 'image') {
            const imgUrl = attachments[0]?.url || msg.content
            return (
                <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl || ''} alt="Imagem" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4, display: 'block' }} />
                    {msg.content && msg.content !== imgUrl && <div style={{ marginTop: 6, fontSize: 14 }}>{msg.content}</div>}
                </div>
            )
        }
        // File message
        if (msg.content_type === 'file') {
            return (
                <div>
                    {attachments.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                            color: isOwn ? T.textInverse : T.gold, textDecoration: 'none', fontSize: 13,
                        }}>
                            <File size={16} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {att.name || 'Arquivo'}
                            </span>
                            <span style={{ fontSize: 11, opacity: 0.7 }}>
                                {att.size ? `${(att.size / 1024).toFixed(0)}KB` : ''}
                            </span>
                            <Download size={14} />
                        </a>
                    ))}
                    {msg.content && <div style={{ marginTop: 4, fontSize: 14 }}>{msg.content}</div>}
                </div>
            )
        }
        // Default text
        return <>{msg.content}</>
    }

    const reactions = msg.reactions || {}
    const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0)

    return (
        <div style={{
            display: 'flex', gap: 8, padding: '4px 0',
            flexDirection: isOwn ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
        }}>
            {!isOwn && <ChatAvatar name={msg.sender?.name ?? msg.sender_name ?? 'U'} url={msg.sender?.avatar_url ?? msg.sender_avatar} size={32} />}
            <div className="max-w-[85%] md:max-w-[70%]" style={{ minWidth: 0, position: 'relative' }}>
                {!isOwn && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 2 }}>
                        {msg.sender?.name ?? msg.sender_name}
                    </div>
                )}
                <div style={{
                    padding: '8px 12px', borderRadius: '6px',
                    background: bubbleBg, color: bubbleColor,
                    fontSize: 14, lineHeight: '20px',
                    border: bubbleBorder, wordBreak: 'break-word',
                }}>
                    {renderContent()}
                    {/* Inline attachments for text messages with files */}
                    {msg.content_type === 'text' && attachments.length > 0 && (
                        <div style={{ marginTop: 8, borderTop: `1px solid ${isOwn ? 'rgba(255,255,255,0.2)' : T.borderLight}`, paddingTop: 6 }}>
                            {attachments.map((att, i) => {
                                if (att.type?.startsWith('image/')) {
                                    return (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img key={i} src={att.url} alt={att.name} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, display: 'block', marginBottom: 4 }} />
                                    )
                                }
                                return (
                                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0',
                                        color: isOwn ? T.textInverse : T.gold, textDecoration: 'none', fontSize: 12,
                                    }}>
                                        <FileText size={14} /> {att.name} <Download size={12} />
                                    </a>
                                )
                            })}
                        </div>
                    )}
                </div>
                {/* Existing reactions */}
                {reactionEntries.length > 0 && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4,
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    }}>
                        {reactionEntries.map(([emoji, users]) => {
                            const iReacted = currentUserId ? users.includes(currentUserId) : false
                            return (
                                <button
                                    key={emoji}
                                    onClick={() => onReaction?.(msg.id, emoji)}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                        padding: '2px 6px', borderRadius: T.radius.full,
                                        background: iReacted ? 'rgba(212,175,55,0.15)' : T.subtle,
                                        border: iReacted ? `1px solid ${T.gold}` : `1px solid ${T.borderLight}`,
                                        cursor: 'pointer', fontSize: 13, lineHeight: '18px',
                                        color: T.text, transition: `all ${T.transition.fast}`,
                                    }}
                                    title={`${users.length} ${users.length === 1 ? 'pessoa' : 'pessoas'}`}
                                >
                                    <span>{emoji}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: T.font.mono }}>{users.length}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
                {/* Reaction picker on hover */}
                {hovered && onReaction && (
                    <div style={{
                        position: 'absolute', top: -4,
                        [isOwn ? 'left' : 'right']: -4,
                        transform: isOwn ? 'translateX(-100%)' : 'translateX(100%)',
                        display: 'flex', gap: 2, padding: '3px 6px',
                        background: T.surface, borderRadius: T.radius.full,
                        border: `1px solid ${T.borderLight}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        zIndex: 10,
                    }}>
                        {REACTION_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => onReaction(msg.id, emoji)}
                                style={{
                                    width: 36, height: 36, border: 'none', borderRadius: '50%',
                                    background: 'transparent', cursor: 'pointer', fontSize: 15,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: `all ${T.transition.fast}`,
                                }}
                                onMouseEnter={e => { (e.target as HTMLElement).style.background = T.subtle }}
                                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent' }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
                <div style={{
                    fontSize: 11, color: T.textDim, marginTop: 2,
                    textAlign: isOwn ? 'right' : 'left',
                    fontFamily: T.font.mono,
                }}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {isOwn && <CheckCheck size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                </div>
            </div>
        </div>
    )
}

// ── Voice Player Component ──────────────────────────────
function VoicePlayer({ url, isOwn }: { url: string; isOwn: boolean }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)

    const toggle = () => {
        if (!audioRef.current) return
        if (playing) { audioRef.current.pause() }
        else { audioRef.current.play() }
        setPlaying(!playing)
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 'min(180px, 60vw)' }}>
            <audio
                ref={audioRef}
                src={url}
                onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration) }}
                onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1) * 100) }}
                onEnded={() => { setPlaying(false); setProgress(0) }}
            />
            <button onClick={toggle} style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: isOwn ? 'rgba(255,255,255,0.2)' : T.gold,
                color: isOwn ? '#fff' : T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {playing ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
            </button>
            <div style={{ flex: 1 }}>
                <div style={{ height: 4, borderRadius: 2, background: isOwn ? 'rgba(255,255,255,0.2)' : T.borderLight, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: isOwn ? '#fff' : T.gold, borderRadius: 2, transition: 'width 0.1s' }} />
                </div>
            </div>
            <span style={{ fontSize: 11, fontFamily: T.font.mono, opacity: 0.7, minWidth: 32 }}>
                {duration > 0 ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '0:00'}
            </span>
        </div>
    )
}

// ── Main Connect Page (wrapper with PresenceProvider) ────
export default function ConnectPage() {
    const [user, setUser] = useState<{ id: string; name: string; avatar_url?: string } | null>(null)

    // Load current user
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                supabase.from('profiles').select('name, avatar_url').eq('id', data.user.id).single()
                    .then(({ data: profile }) => {
                        setUser({
                            id: data.user!.id,
                            name: profile?.name ?? data.user!.email ?? 'Usuário',
                            avatar_url: profile?.avatar_url,
                        })
                    })
            }
        })
    }, [])

    if (!user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: T.textDim }}>
                <Loader2 size={24} className="animate-spin" />
            </div>
        )
    }

    return (
        <PresenceProvider userId={user.id} userName={user.name} avatarUrl={user.avatar_url}>
            <ConnectInner user={user} />
        </PresenceProvider>
    )
}

// ── Inner Connect (has access to PresenceProvider context) ──
function ConnectInner({ user }: { user: { id: string; name: string; avatar_url?: string } }) {
    const isMobile = useIsMobile()
    const { play, enabled: soundEnabled, toggle: toggleSound } = useSounds()
    const { isOnline, onlineUsers } = usePresenceContext()
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [showNewChannel, setShowNewChannel] = useState(false)
    const [newChannelName, setNewChannelName] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [newChannelMode, setNewChannelMode] = useState<'team' | 'direct'>('direct')
    const [brokerSearch, setBrokerSearch] = useState('')
    const [availableBrokers, setAvailableBrokers] = useState<Array<{ id: string; name: string; email: string; avatar_url: string | null }>>([])
    const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null)
    const [loadingBrokers, setLoadingBrokers] = useState(false)
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const typingTimeout = useRef<NodeJS.Timeout>()

    const prevMsgCount = useRef(0)
    const { channels, loading: channelsLoading, totalUnread, createChannel, openDM, reload: reloadChannels } = useChannels({ userId: user.id })
    const { messages, loading: messagesLoading, typingUsers, hasMore, loadMore, sendMessage, deleteMessage, editMessage, toggleReaction, sendTyping, markAsRead } = useChat({
        channelId: activeChannelId ?? '',
        userId: user.id,
        userName: user.name,
    })

    const activeChannel = channels.find(c => c.id === activeChannelId)

    const [nudgeShake, setNudgeShake] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [showChannelInfo, setShowChannelInfo] = useState(false)
    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)

    // Play MSN sounds on new incoming messages
    useEffect(() => {
        if (messages.length > prevMsgCount.current && prevMsgCount.current > 0) {
            const lastMsg = messages[messages.length - 1]
            if (lastMsg && lastMsg.sender_id !== user.id) {
                if (lastMsg.content_type === 'nudge') {
                    play('nudge')
                    setNudgeShake(true)
                    setTimeout(() => setNudgeShake(false), 600)
                } else {
                    play('message')
                }
            }
        }
        prevMsgCount.current = messages.length
    }, [messages.length, user.id, play])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Mark as read when viewing
    useEffect(() => {
        if (activeChannelId && messages.length > 0) markAsRead()
    }, [activeChannelId, messages.length])

    // Filter channels
    const filteredChannels = channels.filter(ch => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        const displayName = ch.type === 'direct' && ch.other_user ? ch.other_user.name : ch.name
        return displayName?.toLowerCase().includes(q)
    })

    // Send message handler
    const handleSend = async () => {
        if (!newMessage.trim() || sending) return
        setSending(true)
        const result = await sendMessage(newMessage)
        if (result?.error) {
            console.error('[Chat] Send failed:', result.error)
            toast.error(`Erro ao enviar: ${result.error.message || 'Tente novamente'}`)
            setSending(false)
            return
        }
        play('message')
        setNewMessage('')
        setSending(false)
        inputRef.current?.focus()
    }

    // Send nudge ("chamar atenção")
    const handleNudge = async () => {
        if (sending || !activeChannelId) return
        setSending(true)
        const result = await sendMessage('🫨', 'nudge')
        if (result?.error) {
            toast.error('Erro ao enviar chacoalhão')
        } else {
            play('nudge')
            setNudgeShake(true)
            setTimeout(() => setNudgeShake(false), 600)
        }
        setSending(false)
    }

    // ── Voice Recording ──
    const voiceRecorder = useVoiceRecorder()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadingFile, setUploadingFile] = useState(false)

    const handleVoiceStart = () => { voiceRecorder.startRecording() }
    const handleVoiceCancel = () => { voiceRecorder.cancelRecording() }
    const handleVoiceSend = async () => {
        if (!activeChannelId) return
        setSending(true)
        try {
            const blob = await voiceRecorder.stopRecording()
            const supabase = createClient()
            const filename = `voice_${Date.now()}_${user.id.slice(0, 8)}.webm`
            const { data: upload, error: uploadErr } = await supabase.storage
                .from('media')
                .upload(`chat/voice/${filename}`, blob, { contentType: blob.type })
            if (uploadErr) throw uploadErr
            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(upload.path)
            await sendMessage('🎤 Mensagem de voz', 'voice', {
                attachments: [{ url: publicUrl, name: filename, size: blob.size, type: blob.type }],
            })
            play('message')
        } catch (err) {
            console.error('[Voice] Upload failed:', err)
            toast.error('Erro ao enviar áudio')
        }
        setSending(false)
    }

    // ── File Upload ──
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files?.length || !activeChannelId) return
        setUploadingFile(true)
        const supabase = createClient()
        try {
            const uploaded: Attachment[] = []
            for (const file of Array.from(files)) {
                const ext = file.name.split('.').pop()
                const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
                const { data: upload, error: uploadErr } = await supabase.storage
                    .from('media')
                    .upload(`chat/files/${filename}`, file, { contentType: file.type })
                if (uploadErr) throw uploadErr
                const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(upload.path)
                uploaded.push({ url: publicUrl, name: file.name, size: file.size, type: file.type })
            }
            const isImage = uploaded.every(a => a.type.startsWith('image/'))
            const contentType: ContentType = isImage ? 'image' : 'file'
            const preview = isImage ? '📷 Imagem' : `📎 ${uploaded.map(a => a.name).join(', ')}`
            await sendMessage(preview, contentType, { attachments: uploaded })
            play('message')
        } catch (err) {
            console.error('[File] Upload failed:', err)
            toast.error('Erro ao enviar arquivo')
        }
        setUploadingFile(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Load more messages
    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        await loadMore()
        setLoadingMore(false)
    }

    // Delete message handler
    const handleDeleteMessage = async (messageId: string) => {
        const confirmed = window.confirm('Deletar esta mensagem?')
        if (!confirmed) return
        const { error } = await deleteMessage(messageId)
        if (error) toast.error('Erro ao deletar mensagem')
        else toast.success('Mensagem deletada')
    }

    // Typing indicator
    const handleTyping = () => {
        if (typingTimeout.current) clearTimeout(typingTimeout.current)
        sendTyping()
        typingTimeout.current = setTimeout(() => {}, 3000)
    }

    // Fetch brokers when modal opens
    useEffect(() => {
        if (!showNewChannel || !user) return
        setLoadingBrokers(true)
        const supabase = createClient()
        // Fetch ALL profiles (not just is_active=true) since auto-created profiles may not have that flag
        supabase.from('profiles')
            .select('id, name, email, avatar_url')
            .neq('id', user.id)
            .order('name')
            .then(({ data }) => {
                // Filter out test accounts but include all real users
                const real = (data ?? []).filter(b => b.email && !b.email.includes('teste@') && !b.email.includes('testando@'))
                setAvailableBrokers(real)
                setLoadingBrokers(false)
            })
    }, [showNewChannel, user])

    const filteredBrokers = availableBrokers.filter(b =>
        !brokerSearch || b.name?.toLowerCase().includes(brokerSearch.toLowerCase()) || b.email?.toLowerCase().includes(brokerSearch.toLowerCase())
    )

    // Create channel (team or direct)
    const handleCreateChannel = async () => {
        if (newChannelMode === 'direct') {
            if (!selectedBrokerId) return
            const broker = availableBrokers.find(b => b.id === selectedBrokerId)
            if (!broker) return
            // Check if direct channel already exists via member IDs (not name)
            const existingDirect = channels.find(ch =>
                ch.type === 'direct' &&
                ch.members?.some(m => m.user_id === selectedBrokerId)
            )
            if (existingDirect) {
                setActiveChannelId(existingDirect.id)
                setShowNewChannel(false)
                setSelectedBrokerId(null)
                setBrokerSearch('')
                setMobileView('chat')
                return
            }
            const result = await openDM(selectedBrokerId)
            if (result?.error) {
                toast.error(`Erro ao iniciar conversa: ${result.error.message || 'Tente novamente'}`)
                return
            }
            if (result?.channelId) {
                setActiveChannelId(result.channelId)
                setShowNewChannel(false)
                setSelectedBrokerId(null)
                setBrokerSearch('')
                setMobileView('chat')
            }
        } else {
            if (!newChannelName.trim()) return
            const result = await createChannel('team', newChannelName.trim(), [])
            if (result?.error) {
                toast.error(`Erro ao criar canal: ${result.error.message || 'Tente novamente'}`)
                return
            }
            if (result?.data) {
                setActiveChannelId(result.data.id)
                setShowNewChannel(false)
                setNewChannelName('')
                setMobileView('chat')
            }
        }
    }

    // ── Channel List Sidebar ─────────────────────────────
    const channelList = (
        <div style={{
            width: '100%', height: '100%', minHeight: 0,
            display: 'flex', flexDirection: 'column',
            borderRight: `1px solid ${T.border}`,
            background: T.base,
        }}>
            {/* Header */}
            <div style={{
                padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={20} style={{ color: T.gold }} />
                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: T.font.serif, color: T.text }}>
                        Connect
                    </span>
                    {totalUnread > 0 && (
                        <span style={{
                            background: T.error, color: 'var(--text-inverse)',
                            fontSize: 11, fontWeight: 700, padding: '2px 6px',
                            borderRadius: T.radius.full, fontFamily: T.font.mono,
                        }}>
                            {totalUnread}
                        </span>
                    )}
                    {onlineUsers.size > 0 && (
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 11, color: '#4ADE80', fontWeight: 600,
                        }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 5px #4ADE80' }} />
                            {onlineUsers.size} online
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={toggleSound}
                        title={soundEnabled ? 'Sons MSN ativados' : 'Sons MSN desativados'}
                        style={{
                            width: 32, height: 32, borderRadius: 6,
                            background: soundEnabled ? 'rgba(200,164,74,0.12)' : 'transparent',
                            color: soundEnabled ? T.gold : T.textDim,
                            border: `1px solid ${soundEnabled ? 'rgba(200,164,74,0.25)' : T.borderLight}`,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: `all ${T.transition.fast}`,
                        }}
                    >
                        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                    <button
                        onClick={() => setShowNewChannel(true)}
                        style={{
                            position: 'relative', overflow: 'hidden',
                            width: 32, height: 32, borderRadius: 6,
                            background: '#0A1624', color: '#fff',
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <Plus size={16} />
                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 16px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: T.elevated, borderRadius: T.radius.md,
                    padding: '0 12px', height: 36,
                    border: `1px solid ${T.borderLight}`,
                }}>
                    <Search size={14} style={{ color: T.textDim, flexShrink: 0 }} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar conversas..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            fontSize: 13, color: T.text, fontFamily: T.font.sans,
                        }}
                    />
                </div>
            </div>

            {/* Channel list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {channelsLoading ? (
                    <div style={{ padding: 16 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse" style={{
                                height: 56, borderRadius: T.radius.lg, marginBottom: 4,
                                background: T.elevated,
                            }} />
                        ))}
                    </div>
                ) : filteredChannels.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                            background: T.activeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MessageSquare size={28} style={{ color: T.gold }} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                            Nenhuma conversa ainda
                        </p>
                        <p style={{ fontSize: 13, color: T.textDim, marginBottom: 20, maxWidth: 200, margin: '0 auto 20px' }}>
                            Inicie uma conversa com sua equipe ou crie um canal
                        </p>
                        <button
                            onClick={() => setShowNewChannel(true)}
                            style={{
                                position: 'relative', overflow: 'hidden',
                                background: 'var(--n, #0A1624)', color: '#fff',
                                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '12px 22px',
                                fontFamily: "var(--fu, 'Outfit', sans-serif)",
                                fontWeight: 600, fontSize: 11, letterSpacing: '1px',
                                textTransform: 'uppercase' as const, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                            }}
                        >
                            <Plus size={15} /> Iniciar Conversa
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
                        </button>
                    </div>
                ) : (
                    filteredChannels.map(ch => (
                        <div
                            key={ch.id}
                            onClick={() => { setActiveChannelId(ch.id); setMobileView('chat') }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 16px', cursor: 'pointer',
                                background: ch.id === activeChannelId ? T.activeBg : 'transparent',
                                borderLeft: ch.id === activeChannelId ? `3px solid ${T.gold}` : '3px solid transparent',
                                transition: `all ${T.transition.fast}`,
                            }}
                            onMouseEnter={e => { if (ch.id !== activeChannelId) e.currentTarget.style.background = T.hover }}
                            onMouseLeave={e => { if (ch.id !== activeChannelId) e.currentTarget.style.background = 'transparent' }}
                        >
                            {ch.type === 'direct' && ch.other_user ? (
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <ChatAvatar name={ch.other_user.name ?? 'U'} url={ch.other_user.avatar_url} size={40} />
                                    {(() => {
                                        const otherId = ch.members?.find(m => m.user_id !== user.id)?.user_id
                                        const online = otherId ? isOnline(otherId) : false
                                        return (
                                            <span style={{
                                                position: 'absolute', bottom: 0, right: 0,
                                                width: 10, height: 10, borderRadius: '50%',
                                                background: online ? '#4ADE80' : '#6B7280',
                                                border: '2px solid var(--bg-base, #0F1923)',
                                                boxShadow: online ? '0 0 6px rgba(74,222,128,0.5)' : 'none',
                                            }} />
                                        )
                                    })()}
                                </div>
                            ) : (
                                <div style={{
                                    width: 40, height: 40, borderRadius: T.radius.lg,
                                    background: T.elevated, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: ch.id === activeChannelId ? T.gold : T.textMuted,
                                    flexShrink: 0,
                                }}>
                                    <ChannelIcon type={ch.type} size={18} />
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{
                                        fontSize: 13, fontWeight: ch.total_unread > 0 ? 700 : 500,
                                        color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {ch.type === 'direct' && ch.other_user ? ch.other_user.name : (ch.name ?? 'Canal')}
                                    </span>
                                    <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.font.mono, flexShrink: 0 }}>
                                        {formatTime(ch.last_message_at)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                    <span style={{
                                        fontSize: 12, color: T.textDim,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        fontWeight: ch.total_unread > 0 ? 600 : 400,
                                    }}>
                                        {ch.last_message_preview ?? 'Sem mensagens'}
                                    </span>
                                    {ch.total_unread > 0 && (
                                        <span style={{
                                            background: T.gold, color: T.textInverse,
                                            fontSize: 11, fontWeight: 700, padding: '2px 8px',
                                            borderRadius: T.radius.full, fontFamily: T.font.mono,
                                            minWidth: 18, textAlign: 'center', flexShrink: 0,
                                        }}>
                                            {ch.total_unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )

    // ── Chat Area ────────────────────────────────────────
    const chatArea = (
        <motion.div
            animate={nudgeShake ? { x: [0, -4, 4, -3, 3, -1, 1, 0] } : {}}
            transition={{ duration: 0.4 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: T.base }}>
            {activeChannel ? (
                <>
                    {/* Chat Header */}
                    <div style={{
                        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                        borderBottom: `1px solid ${T.border}`, background: T.surface,
                    }}>
                        <button
                            className="md:hidden"
                            onClick={() => setMobileView('list')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text, padding: 4 }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        {activeChannel.type === 'direct' && activeChannel.other_user ? (
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <ChatAvatar name={activeChannel.other_user.name ?? 'U'} url={activeChannel.other_user.avatar_url} size={36} />
                                {(() => {
                                    const otherId = activeChannel.members?.find(m => m.user_id !== user.id)?.user_id
                                    const online = otherId ? isOnline(otherId) : false
                                    return (
                                        <span style={{
                                            position: 'absolute', bottom: -1, right: -1,
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: online ? '#4ADE80' : '#6B7280',
                                            border: '2px solid var(--surface, #1A2A3C)',
                                            boxShadow: online ? '0 0 6px rgba(74,222,128,0.5)' : 'none',
                                        }} />
                                    )
                                })()}
                            </div>
                        ) : (
                            <div style={{
                                width: 36, height: 36, borderRadius: T.radius.lg,
                                background: T.elevated, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', color: T.gold,
                            }}>
                                <ChannelIcon type={activeChannel.type} size={18} />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                                {activeChannel.type === 'direct' && activeChannel.other_user
                                    ? activeChannel.other_user.name
                                    : activeChannel.name}
                            </div>
                            <div style={{ fontSize: 11, color: T.textDim }}>
                                {(() => {
                                    if (activeChannel.type === 'direct') {
                                        const otherId = activeChannel.members?.find(m => m.user_id !== user.id)?.user_id
                                        if (otherId && isOnline(otherId)) return 'Online'
                                        const presence = otherId ? onlineUsers.get(otherId) : null
                                        if (presence?.online_at) {
                                            const ago = Date.now() - new Date(presence.online_at).getTime()
                                            if (ago < 3600000) return `Visto há ${Math.floor(ago / 60000)}min`
                                            return `Visto há ${Math.floor(ago / 3600000)}h`
                                        }
                                        return 'Offline'
                                    }
                                    return `${activeChannel.message_count} mensagens`
                                })()}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowChannelInfo(!showChannelInfo)}
                            style={{
                                background: showChannelInfo ? T.activeBg : 'none',
                                border: showChannelInfo ? `1px solid ${T.borderLight}` : 'none',
                                cursor: 'pointer', color: showChannelInfo ? T.gold : T.textMuted,
                                padding: 4, borderRadius: T.radius.md,
                                transition: `all ${T.transition.fast}`,
                            }}
                        >
                            <Info size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
                        {messagesLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Loader2 size={24} className="animate-spin" style={{ color: T.textDim }} />
                            </div>
                        ) : messages.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <MessageSquare size={48} style={{ color: T.gold, marginBottom: 16, opacity: 0.5 }} />
                                <p style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                                    Comece a conversa
                                </p>
                                <p style={{ fontSize: 13, color: T.textDim }}>
                                    Envie a primeira mensagem neste canal
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Load more button */}
                                {hasMore && (
                                    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            style={{
                                                background: T.elevated, border: `1px solid ${T.borderLight}`,
                                                borderRadius: T.radius.full, padding: '6px 16px',
                                                fontSize: 12, fontWeight: 600, color: T.textMuted,
                                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                                                transition: `all ${T.transition.fast}`,
                                            }}
                                        >
                                            {loadingMore ? (
                                                <><Loader2 size={12} className="animate-spin" /> Carregando...</>
                                            ) : (
                                                <><ChevronUp size={12} /> Carregar mensagens anteriores</>
                                            )}
                                        </button>
                                    </div>
                                )}
                                {messages.map(msg => {
                                    const isOwn = msg.sender_id === user.id
                                    return (
                                        <div
                                            key={msg.id}
                                            onMouseEnter={() => setHoveredMsgId(msg.id)}
                                            onMouseLeave={() => setHoveredMsgId(null)}
                                            style={{ position: 'relative' }}
                                        >
                                            <MessageBubble msg={msg} isOwn={isOwn} hovered={hoveredMsgId === msg.id} onReaction={toggleReaction} currentUserId={user.id} />
                                            {/* Delete button on hover (own messages only) */}
                                            {isOwn && hoveredMsgId === msg.id && msg.content_type !== 'system' && (
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    title="Deletar mensagem"
                                                    style={{
                                                        position: 'absolute', top: 4, right: isOwn ? undefined : 4, left: isOwn ? 4 : undefined,
                                                        width: 24, height: 24, borderRadius: T.radius.full,
                                                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                                        cursor: 'pointer', color: '#EF4444',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: `all ${T.transition.fast}`,
                                                    }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {typingUsers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 24 }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ padding: '0 20px', fontSize: 12, color: T.textDim, fontStyle: 'italic' }}
                            >
                                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'está' : 'estão'} digitando...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.txt,.csv,.zip"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />

                    {/* Composer */}
                    <div style={{
                        padding: '12px 20px', borderTop: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', gap: 8, background: T.surface,
                        paddingBottom: isMobile ? 76 : 12,
                    }}>
                        {voiceRecorder.isRecording ? (
                            /* ── Voice Recording UI ── */
                            <>
                                <button
                                    onClick={handleVoiceCancel}
                                    title="Cancelar gravação"
                                    style={{
                                        width: 36, height: 36, borderRadius: T.radius.full,
                                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                        cursor: 'pointer', color: '#EF4444',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <X size={16} />
                                </button>
                                <div style={{
                                    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                                    height: 40, padding: '0 16px',
                                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: T.radius.full,
                                }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%', background: '#EF4444',
                                        animation: 'pulse 1s ease infinite',
                                    }} />
                                    <span style={{ fontSize: 13, color: '#EF4444', fontFamily: T.font.mono, fontWeight: 600 }}>
                                        {Math.floor(voiceRecorder.duration / 60)}:{String(Math.floor(voiceRecorder.duration % 60)).padStart(2, '0')}
                                    </span>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, height: 20, overflow: 'hidden', minWidth: 0 }}>
                                        {voiceRecorder.waveformData.slice(isMobile ? -24 : -40).map((v, i) => (
                                            <div key={i} style={{
                                                width: 2, borderRadius: 1,
                                                height: Math.max(3, v * 20), background: '#EF4444', opacity: 0.6,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={handleVoiceSend}
                                    disabled={sending}
                                    style={{
                                        width: 40, height: 40, borderRadius: T.radius.full,
                                        background: T.accent, color: T.textInverse,
                                        border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </>
                        ) : (
                            /* ── Normal Composer ── */
                            <>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingFile}
                                    title="Enviar arquivo ou imagem"
                                    style={{
                                        width: 36, height: 36, borderRadius: T.radius.md,
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        color: uploadingFile ? T.gold : T.textMuted,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {uploadingFile ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                                </button>
                                <button
                                    onClick={handleNudge}
                                    disabled={sending}
                                    title="Chamar atenção (chacoalhão MSN)"
                                    style={{
                                        width: 36, height: 36, borderRadius: T.radius.md,
                                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                                        cursor: 'pointer', color: '#F59E0B',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: `all ${T.transition.fast}`,
                                    }}
                                >
                                    <Vibrate size={18} />
                                </button>
                                <input
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                                    placeholder="Mensagem..."
                                    style={{
                                        flex: 1, height: 40, padding: '0 16px',
                                        background: T.elevated, border: `1px solid ${T.borderLight}`,
                                        borderRadius: T.radius.full, color: T.text,
                                        fontSize: 14, fontFamily: T.font.sans, outline: 'none',
                                        transition: `all ${T.transition.fast}`,
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = T.borderGold}
                                    onBlur={e => e.currentTarget.style.borderColor = T.borderLight}
                                />
                                {newMessage.trim() ? (
                                    <button
                                        onClick={handleSend}
                                        disabled={sending}
                                        style={{
                                            width: 40, height: 40, borderRadius: T.radius.full,
                                            background: T.accent, color: T.textInverse,
                                            border: 'none', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: `all ${T.transition.fast}`,
                                        }}
                                    >
                                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleVoiceStart}
                                        title="Gravar mensagem de voz"
                                        style={{
                                            width: 40, height: 40, borderRadius: T.radius.full,
                                            background: T.elevated, color: T.textMuted,
                                            border: 'none', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: `all ${T.transition.fast}`,
                                        }}
                                    >
                                        <Mic size={18} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </>
            ) : (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', color: T.textDim,
                }}>
                    <MessageSquare size={48} style={{ color: T.gold, marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: 16, fontWeight: 600, color: T.text }}>IMI Connect</p>
                    <p style={{ fontSize: 13, color: T.textDim, marginTop: 4 }}>
                        Selecione uma conversa para começar
                    </p>
                </div>
            )}
        </motion.div>
    )

    return (
        <div style={{
            display: 'flex', overflow: 'hidden',
            borderRadius: 'var(--r-lg, 14px)',
            border: `1px solid ${T.border}`,
        }}
        className="h-[calc(100dvh-164px)] sm:h-[calc(100dvh-140px)] lg:h-[calc(100dvh-112px)]"
        >
            {/* New Channel / Direct Message Modal */}
            <AnimatePresence>
                {showNewChannel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setShowNewChannel(false); setNewChannelMode('direct'); setSelectedBrokerId(null); setBrokerSearch('') }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 50,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                ...cardStyle, padding: 24, width: 440, maxWidth: '90vw',
                                boxShadow: 'var(--shadow-lg)',
                            }}
                        >
                            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: T.font.serif, color: T.text, marginBottom: 16 }}>
                                Nova Conversa
                            </h3>

                            {/* Mode tabs */}
                            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: T.elevated, borderRadius: T.radius.md, padding: 3 }}>
                                {([['direct', 'Mensagem Direta'], ['team', 'Canal de Equipe']] as const).map(([mode, label]) => (
                                    <button
                                        key={mode}
                                        onClick={() => { setNewChannelMode(mode); setSelectedBrokerId(null); setBrokerSearch(''); setNewChannelName('') }}
                                        style={{
                                            flex: 1, height: 34, borderRadius: T.radius.sm,
                                            background: newChannelMode === mode ? T.accent : 'transparent',
                                            color: newChannelMode === mode ? T.textInverse : T.textMuted,
                                            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                            transition: `all ${T.transition.fast}`,
                                        }}
                                    >
                                        {mode === 'direct' ? <UserPlus size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> : <Hash size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />}
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {newChannelMode === 'direct' ? (
                                <>
                                    {/* Broker search */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        background: T.elevated, borderRadius: T.radius.md,
                                        padding: '0 12px', height: 40, marginBottom: 12,
                                        border: `1.5px solid ${T.border}`,
                                    }}>
                                        <Search size={14} style={{ color: T.textDim, flexShrink: 0 }} />
                                        <input
                                            value={brokerSearch}
                                            onChange={e => setBrokerSearch(e.target.value)}
                                            placeholder="Buscar corretor por nome ou email..."
                                            autoFocus
                                            style={{
                                                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                                fontSize: 13, color: T.text, fontFamily: T.font.sans,
                                            }}
                                        />
                                    </div>

                                    {/* Broker list */}
                                    <div style={{
                                        maxHeight: 240, overflowY: 'auto', marginBottom: 16,
                                        border: `1px solid ${T.borderLight}`, borderRadius: T.radius.md,
                                    }}>
                                        {loadingBrokers ? (
                                            <div style={{ padding: 16, textAlign: 'center', color: T.textDim, fontSize: 13 }}>
                                                <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: 6 }} />
                                                Carregando...
                                            </div>
                                        ) : filteredBrokers.length === 0 ? (
                                            <div style={{ padding: 16, textAlign: 'center', color: T.textDim, fontSize: 13 }}>
                                                Nenhum corretor encontrado
                                            </div>
                                        ) : filteredBrokers.map(broker => (
                                            <button
                                                key={broker.id}
                                                onClick={() => setSelectedBrokerId(broker.id === selectedBrokerId ? null : broker.id)}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '10px 12px', border: 'none', cursor: 'pointer',
                                                    background: broker.id === selectedBrokerId ? 'var(--bg-active)' : 'transparent',
                                                    borderBottom: `1px solid ${T.borderLight}`,
                                                    transition: `background ${T.transition.fast}`,
                                                }}
                                            >
                                                <ChatAvatar name={broker.name} url={broker.avatar_url} size={32} />
                                                <div style={{ flex: 1, textAlign: 'left' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{broker.name}</div>
                                                    <div style={{ fontSize: 11, color: T.textDim }}>{broker.email}</div>
                                                </div>
                                                {broker.id === selectedBrokerId && (
                                                    <CheckCheck size={16} style={{ color: T.success, flexShrink: 0 }} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <input
                                    value={newChannelName}
                                    onChange={e => setNewChannelName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateChannel() }}
                                    placeholder="Nome do canal..."
                                    autoFocus
                                    style={{
                                        width: '100%', height: 40, padding: '0 14px',
                                        background: T.elevated, border: `1.5px solid ${T.border}`,
                                        borderRadius: T.radius.md, color: T.text,
                                        fontSize: 14, fontFamily: T.font.sans, outline: 'none',
                                        marginBottom: 16,
                                    }}
                                />
                            )}

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => { setShowNewChannel(false); setNewChannelMode('direct'); setSelectedBrokerId(null); setBrokerSearch('') }}
                                    style={{
                                        height: 36, padding: '0 16px', borderRadius: T.radius.md,
                                        background: 'transparent', border: `1px solid ${T.border}`,
                                        color: T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateChannel}
                                    disabled={newChannelMode === 'direct' ? !selectedBrokerId : !newChannelName.trim()}
                                    style={{
                                        height: 36, padding: '0 16px', borderRadius: T.radius.md,
                                        background: T.accent, border: 'none',
                                        color: T.textInverse, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        opacity: (newChannelMode === 'direct' ? selectedBrokerId : newChannelName.trim()) ? 1 : 0.5,
                                    }}
                                >
                                    {newChannelMode === 'direct' ? 'Iniciar Conversa' : 'Criar Canal'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop layout: sidebar + chat + info panel */}
            <div className="hidden md:flex" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <div style={{ width: 320, flexShrink: 0, height: '100%', overflow: 'hidden' }}>{channelList}</div>
                <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>{chatArea}</div>
                {/* Channel info panel */}
                <AnimatePresence>
                    {showChannelInfo && activeChannel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 280, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                height: '100%', overflow: 'hidden', flexShrink: 0,
                                borderLeft: `1px solid ${T.border}`, background: T.base,
                            }}
                        >
                            <div style={{ width: 280, height: '100%', overflowY: 'auto', padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font.serif }}>
                                        Detalhes do Canal
                                    </span>
                                    <button
                                        onClick={() => setShowChannelInfo(false)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 2 }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                {/* Channel avatar/icon */}
                                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                    {activeChannel.type === 'direct' && activeChannel.other_user ? (
                                        <div style={{ display: 'inline-block' }}>
                                            <ChatAvatar name={activeChannel.other_user.name ?? 'U'} url={activeChannel.other_user.avatar_url} size={64} />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: 64, height: 64, borderRadius: 18, margin: '0 auto',
                                            background: T.elevated, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', color: T.gold,
                                        }}>
                                            <ChannelIcon type={activeChannel.type} size={28} />
                                        </div>
                                    )}
                                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 12 }}>
                                        {activeChannel.type === 'direct' && activeChannel.other_user
                                            ? activeChannel.other_user.name
                                            : activeChannel.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
                                        {activeChannel.type === 'direct' ? 'Conversa direta' : `Canal ${activeChannel.type}`}
                                    </div>
                                </div>
                                {/* Stats */}
                                <div style={{
                                    background: T.elevated, borderRadius: T.radius.lg, padding: 14,
                                    marginBottom: 16, border: `1px solid ${T.borderLight}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, color: T.textDim }}>Mensagens</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: T.font.mono }}>
                                            {activeChannel.message_count}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, color: T.textDim }}>Criado em</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                                            {activeChannel.created_at ? new Date(activeChannel.created_at).toLocaleDateString('pt-BR') : '—'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 12, color: T.textDim }}>Tipo</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: T.gold, textTransform: 'capitalize' }}>
                                            {activeChannel.type}
                                        </span>
                                    </div>
                                </div>
                                {/* Members */}
                                {activeChannel.members && activeChannel.members.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <Users size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                            Membros ({activeChannel.members.length})
                                        </div>
                                        {activeChannel.members.map((member: { user_id: string; role?: string; profile?: { id?: string; name?: string | null; email?: string | null; avatar_url?: string | null } | null }) => {
                                            const memberName = member.user_id === user.id ? 'Você' : (member.profile?.name || member.profile?.email || member.user_id.slice(0, 8))
                                            const memberOnline = isOnline(member.user_id)
                                            return (
                                                <div key={member.user_id} style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                                                    borderBottom: `1px solid ${T.borderLight}`,
                                                }}>
                                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                                        <ChatAvatar name={memberName} url={member.profile?.avatar_url} size={28} />
                                                        <span style={{
                                                            position: 'absolute', bottom: -1, right: -1,
                                                            width: 8, height: 8, borderRadius: '50%',
                                                            background: memberOnline ? '#4ADE80' : '#6B7280',
                                                            border: '2px solid var(--bg-base, #0F1923)',
                                                        }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {memberName}
                                                        </div>
                                                        {member.role && (
                                                            <div style={{ fontSize: 10, color: T.textDim, textTransform: 'capitalize' }}>{member.role}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile layout: list OR chat (full screen) */}
            <div className="flex md:hidden" style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {mobileView === 'list' ? channelList : chatArea}
            </div>
        </div>
    )
}
