'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const INITIAL_MESSAGE: Message = {
    role: 'assistant',
    content: 'Olá! Sou a assistente da IMI. Posso ajudar com avaliações imobiliárias, consultoria patrimonial, informações sobre imóveis e muito mais. Como posso ajudar?',
}

const QUICK_ACTIONS = [
    'Preciso de uma avaliação',
    'Quero ver imóveis',
    'Consultoria patrimonial',
    'Crédito imobiliário',
]

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return
        setHasInteracted(true)

        const userMessage: Message = { role: 'user', content: text.trim() }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            })

            if (!res.ok) throw new Error('Failed')

            const data = await res.json()
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.message || 'Desculpe, tive um problema. Tente novamente ou fale conosco pelo WhatsApp: +55 81 9 9723-0455',
            }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Desculpe, estou temporariamente indisponível. Fale conosco pelo WhatsApp: +55 81 9 9723-0455',
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Chat Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-[#102A43] text-white shadow-lg hover:shadow-xl hover:bg-[#0a1c2e] transition-all duration-200 flex items-center justify-center group"
                    >
                        <MessageCircle size={22} className="group-hover:scale-110 transition-transform" />
                        {/* Pulse indicator */}
                        {!hasInteracted && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#C8A65A] rounded-full border-2 border-white animate-pulse" />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed bottom-6 right-6 z-[100] w-[380px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100dvh-100px)] bg-white rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-[#102A43] text-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <Sparkles size={16} className="text-[#C8A65A]" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Assistente IMI</p>
                                    <p className="text-[10px] text-white/50">Inteligência Imobiliária</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F8F9FA]">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                        ? 'bg-[#102A43] text-white'
                                        : 'bg-[#E9ECEF] text-[#495057]'
                                        }`}>
                                        {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    </div>
                                    <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-[#102A43] text-white rounded-br-md'
                                        : 'bg-white text-[#1A1A1A] border border-black/[0.06] rounded-bl-md shadow-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-2.5"
                                >
                                    <div className="w-7 h-7 rounded-full bg-[#E9ECEF] flex items-center justify-center">
                                        <Bot size={12} className="text-[#495057]" />
                                    </div>
                                    <div className="bg-white border border-black/[0.06] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                        <div className="flex gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#ADB5BD] animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#ADB5BD] animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#ADB5BD] animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions (only before first interaction) */}
                        {!hasInteracted && (
                            <div className="px-4 py-2 flex gap-1.5 flex-wrap border-t border-black/[0.06] bg-white">
                                {QUICK_ACTIONS.map(action => (
                                    <button
                                        key={action}
                                        onClick={() => sendMessage(action)}
                                        className="text-[11px] font-medium text-[#486581] bg-[#F4F6F8] hover:bg-[#E9ECEF] px-3 py-1.5 rounded-full transition-colors border border-black/[0.04]"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <form
                            onSubmit={e => { e.preventDefault(); sendMessage(input) }}
                            className="flex items-center gap-2 px-4 py-3 border-t border-black/[0.06] bg-white flex-shrink-0"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Digite sua mensagem..."
                                className="flex-1 text-sm bg-transparent outline-none text-[#1A1A1A] placeholder:text-[#ADB5BD]"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="w-9 h-9 rounded-xl bg-[#102A43] text-white flex items-center justify-center disabled:opacity-30 hover:bg-[#0a1c2e] transition-all active:scale-95"
                            >
                                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
