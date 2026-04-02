"use client";
import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import VoiceInput from "@/components/VoiceInput";

export default function NovaChat() {
  type Message = {
  role: "user" | "assistant";
  content: string;
};

const [msgs, setMsgs] = useState<Message[]>([]);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  async function send() {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setMsgs(prev => [...prev, { role: "user", content: userMsg }]);
    setText("");
    setLoading(true);
    try {
      const res = await fetch("/api/nova/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, message: userMsg }),
      });
      const data: { ok: boolean; response: string } = await res.json();
      setMsgs(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: "⚠️ Error de conexión con el Núcleo." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-white/5 bg-slate-950/40 backdrop-blur-2xl">
      <div className="border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
        <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Nova Core</span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-sky-500 text-white" : "bg-slate-900 border border-white/10 text-slate-200"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sky-500 text-[10px] animate-pulse">NOVA PENSANDO...</div>}
      </div>
      <div className="border-t border-white/5 p-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="flex-1 bg-white/5 px-4 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-sky-500/50" placeholder="Escribe una orden..." />
        <VoiceInput onText={setText} disabled={loading} />
        <button onClick={send} disabled={loading} className="px-4 bg-sky-500 text-white rounded-xl hover:bg-sky-400 transition-all">→</button>
      </div>
    </div>
  );
}
