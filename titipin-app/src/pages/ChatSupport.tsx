import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'

interface Message {
  id: number
  from: 'user' | 'agent'
  text: string
  time: string
}

const AGENT_RESPONSES: Record<string, string[]> = {
  'Locker problem': [
    "Hi! I see you're having trouble with your locker. I can open it remotely for you right now — could you confirm your locker number?",
    "Got it! I'm sending the remote unlock signal now. The door should open within 5 seconds. Let me know if it works!",
    "Great! If it happens again, you can also try the 'Test open' button in My QR. Is there anything else I can help you with?",
  ],
  default: [
    "Hi! Welcome to Titipin support. How can I help you today?",
    "I understand. Let me look into this for you.",
    "Done! Is there anything else you need help with?",
  ],
}

function getTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function ChatSupport() {
  const navigate = useNavigate()
  const location = useLocation()
  const topic = (location.state as { topic?: string })?.topic ?? 'Other'
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [agentTyping, setAgentTyping] = useState(false)
  const agentResponseIndex = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initial agent message
  useEffect(() => {
    setTimeout(() => {
      const responses = AGENT_RESPONSES[topic] ?? AGENT_RESPONSES.default
      setMessages([{
        id: Date.now(),
        from: 'agent',
        text: responses[0],
        time: getTime(),
      }])
      agentResponseIndex.current = 1
    }, 800)
  }, [topic])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, agentTyping])

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: Date.now(), from: 'user', text: input.trim(), time: getTime() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setAgentTyping(true)

    setTimeout(() => {
      setAgentTyping(false)
      const responses = AGENT_RESPONSES[topic] ?? AGENT_RESPONSES.default
      const idx = agentResponseIndex.current
      const response = responses[idx < responses.length ? idx : responses.length - 1]
      agentResponseIndex.current = idx + 1
      setMessages((prev) => [...prev, { id: Date.now(), from: 'agent', text: response, time: getTime() }])
    }, 1200 + Math.random() * 800)
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                CS
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-green-700" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Titipin Support</p>
              <p className="text-green-200 text-[11px]">{topic} • Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.from === 'user' ? '' : 'flex items-end gap-2'}`}>
              {msg.from === 'agent' && (
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-1">
                  CS
                </div>
              )}
              <div>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.from === 'user'
                      ? 'bg-green-700 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-0.5 ${msg.from === 'user' ? 'text-right' : ''}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {agentTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              CS
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0 pb-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-300 focus:bg-white transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
