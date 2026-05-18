"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff, Bot, Loader2, Volume2, VolumeX } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

function ChatContent() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiMuted, setIsAiMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  
  // Use ref for SpeechRecognition to avoid re-creating on every render
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Initialize speech recognition once
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }

    fetchHistory();
  }, [router, action]);

  const fetchHistory = async () => {
    try {
      const data: any = await api.get("/chat/");
      
      if (data.length === 0) {
        let initialText = "Hello! I am Prescripto AI. How can I help you understand your medicines today?";
        
        if (action === "symptoms") {
          initialText = "I see you'd like to check some symptoms. Please describe what you're feeling, and I'll help you understand what might be happening.";
        } else if (action === "appointments") {
          initialText = "I can help you prepare for your next medical appointment. What questions do you have for your doctor?";
        }
        
        setMessages([{ id: 0, text: initialText, sender: "ai" }]);
      } else {
        const history = [...data].reverse().map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender
        }));
        setMessages(history);
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setMessages([{ id: 0, text: "Welcome back! How can I assist you today?", sender: "ai" }]);
    }
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return alert("Speech recognition not supported in this browser.");
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const lang = localStorage.getItem("prescripto_lang") || "English";
    if (lang === "Spanish") utterance.lang = 'es-ES';
    else if (lang === "French") utterance.lang = 'fr-FR';
    else if (lang === "Hindi") utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), text: input, sender: "user" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const lang = localStorage.getItem("prescripto_lang") || "English";
      const data: any = await api.post("/chat/", {
        message: userMsg.text,
        language: lang
      });

      const aiResponseText = data.reply;
      
      setMessages(prev => [...prev, { id: Date.now() + 1, text: aiResponseText, sender: "ai" }]);
      if (!isAiMuted) {
        speakText(aiResponseText);
      }
    } catch (error: any) {
      console.error(error);
      const errorText = error.message || "Sorry, I am having trouble connecting to the server right now.";
      setMessages(prev => [...prev, { id: Date.now() + 1, text: errorText, sender: "ai" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[85vh]">
      <header className="flex items-center gap-3 py-4 mb-2">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold">Medical Assistant</h1>
          <p className="text-xs text-slate-400">Powered by AI</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl relative group ${msg.sender === "user" ? "bg-blue-600 rounded-br-none" : "glass-panel rounded-bl-none"}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              {msg.sender === "ai" && (
                <button 
                  onClick={() => speakText(msg.text)}
                  className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 p-1"
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass-panel p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
              <Loader2 className="animate-spin text-purple-400" size={16} />
              <span className="text-sm text-slate-400">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto glass-panel p-2 rounded-full flex items-center gap-2 border border-blue-500/30">
        <button 
          onClick={toggleListening}
          className={`p-3 transition-colors ${isListening ? 'text-rose-400 animate-pulse' : 'text-slate-400 hover:text-blue-400'}`}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          onClick={() => {
            if (!isAiMuted && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            setIsAiMuted(!isAiMuted);
          }}
          className={`p-3 transition-colors ${isAiMuted ? 'text-rose-400' : 'text-slate-400 hover:text-blue-400'}`}
          title={isAiMuted ? "Unmute AI Speech" : "Mute AI Speech"}
        >
          {isAiMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about medicines, symptoms..." 
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-500"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-3 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/40 transition-colors disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-400" size={40} />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
