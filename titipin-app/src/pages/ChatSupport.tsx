import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send, Sparkles, Bot } from 'lucide-react'
import { useStore } from '../store/useStore'
import { askGeminiCustomerSupport, type ChatMessage, type UserContext } from '../lib/geminiChatService'

function getTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function ChatSupport() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    userName,
    userEmail,
    hasActiveLocker,
    lockerNumber,
    lockerLocation,
    remainingSeconds,
    hasMonthlyPlan,
    language,
    triggerUnlock,
  } = useStore()

  const topic = (location.state as { topic?: string })?.topic ?? 'General'
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [agentTyping, setAgentTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userContext: UserContext = {
    userName,
    userEmail,
    hasActiveLocker,
    lockerNumber,
    lockerLocation,
    remainingSeconds,
    hasMonthlyPlan,
    language,
    topic,
  }

  // Initial greeting from AI
  useEffect(() => {
    const greetingText =
      language === 'en'
        ? `Hello ${userName || 'there'}! I'm Titi, Titipin's 24/7 AI Customer Support. How can I assist you today with topic: "${topic}"?`
        : `Halo ${userName || 'Kak'}! Saya Titi, AI Customer Support Titipin 24/7. Ada yang bisa saya bantu terkait "${topic}"?`

    setMessages([
      {
        id: Date.now(),
        from: 'agent',
        text: greetingText,
        time: getTime(),
      },
    ])
  }, [language, topic, userName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, agentTyping])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || agentTyping) return

    const userMsg: ChatMessage = {
      id: Date.now(),
      from: 'user',
      text: trimmed,
      time: getTime(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setAgentTyping(true)

    try {
      const aiReply = await askGeminiCustomerSupport(updatedMessages, trimmed, userContext)

      // If AI recommends opening or remote unlocking, trigger lock override
      if (
        aiReply.toLowerCase().includes('remote unlock signal') ||
        aiReply.toLowerCase().includes('membuka pintu loker darurat')
      ) {
        triggerUnlock('Customer Support CS_OVERRIDE', 'CS_OVERRIDE' as any)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'agent',
          text: aiReply,
          time: getTime(),
        },
      ])
    } catch (err) {
      console.warn('Chat response error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'agent',
          text:
            language === 'en'
              ? 'Sorry, I am having trouble connecting right now. Please try again or visit our FAQ.'
              : 'Mohon maaf, saat ini koneksi sedang terganggu. Silakan coba sesaat lagi atau cek menu FAQ.',
          time: getTime(),
        },
      ])
    } finally {
      setAgentTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-green-800 to-emerald-900 px-4 pt-12 pb-4 flex-shrink-0 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-500 border border-white/30 flex items-center justify-center text-white font-black text-sm shadow-sm">
                  <Bot size={20} />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-300 rounded-full border-2 border-green-800 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-sm font-bold tracking-tight">Titi • Titipin Support</p>
                  <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5">
                    <Sparkles size={8} /> AI 24/7
                  </span>
                </div>
                <p className="text-green-200 text-[11px] font-medium">
                  {topic} • Online
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.from === 'user' ? '' : 'flex items-end gap-2'}`}>
              {msg.from === 'agent' && (
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mb-1 shadow-2xs">
                  <Bot size={14} />
                </div>
              )}
              <div>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.from === 'user'
                      ? 'bg-green-700 text-white rounded-br-xs shadow-xs'
                      : 'bg-white text-gray-800 border border-gray-200/90 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 px-1 ${msg.from === 'user' ? 'text-right' : ''}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {agentTyping && (
          <div className="flex items-end gap-2 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
                <span className="text-[10px] text-gray-400 font-medium ml-1">Titi sedang mengetik...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0 pb-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={language === 'en' ? 'Ask anything to AI Support...' : 'Tanyakan apa saja ke AI Support...'}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-xs sm:text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || agentTyping}
            className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0 shadow-xs"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
