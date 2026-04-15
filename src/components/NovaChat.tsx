"use client";

import React, { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "nova" | "system";
  content: string;
};

export default function NovaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll táctico para mantener el enfoque en la interacción reciente
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Limpieza absoluta de memoria en desmontaje
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput("");
    
    const newMessage: Message = { id: Date.now().toString(), role: "user", content: userText };
    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);

    // Cortamos conexiones huérfanas antes de iniciar una nueva
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/nova/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, mode: "auto" }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Anomalía detectada en el enlace neuronal.");

      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-nova", role: "nova", content: data.reply || "Recepción vacía." }
      ]);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "-sys", role: "system", content: "Conexión interrumpida con el núcleo central." }
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent font-sans">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex justify-center items-center h-full text-blue-400/40 text-sm tracking-widest">
            SISTEMAS EN LÍNEA. LISTA PARA RECIBIR INSTRUCCIONES.
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full animate-fade-in`}>
            <div className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed shadow-lg backdrop-blur-md ${
              msg.role === "user" 
                ? "bg-blue-900/30 text-blue-50 border border-blue-500/40 rounded-tr-sm" 
                : msg.role === "nova" 
                  ? "bg-slate-900/60 text-slate-200 border border-slate-700/50 rounded-tl-sm shadow-blue-900/10"
                  : "bg-red-950/40 text-red-300 border border-red-800/50 rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start w-full animate-fade-in">
            <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-xl rounded-tl-sm text-blue-400/80 text-xs tracking-widest uppercase">
              Procesando matriz...
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800/40 bg-slate-950/20 backdrop-blur-sm">
        <div className="flex relative items-center group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmite tu orden..."
            className="w-full bg-slate-900/40 border border-slate-700/60 rounded-lg py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
            disabled={isTyping}
            autoComplete="off"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 text-blue-500 hover:text-blue-300 disabled:opacity-30 disabled:hover:text-blue-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}