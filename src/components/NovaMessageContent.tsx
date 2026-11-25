"use client";
import { useState } from "react";

function Inline({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).map((part,i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2,-2)}</strong> :
    part.startsWith("`") && part.endsWith("`") ? <code key={i} className="rounded bg-white/10 px-1 break-all">{part.slice(1,-1)}</code> : part)}</>;
}
function Code({ code, language }: { code: string; language: string }) {
  const [notice,setNotice] = useState("");
  return <div className="my-3 overflow-hidden rounded-xl border border-slate-700 bg-[#0a1220]">
    <div className="flex items-center justify-between border-b border-slate-700 px-3 text-xs text-slate-300"><span>{language || "Código"}</span><button type="button" className="min-h-10 px-2 underline" onClick={async()=>{try{await navigator.clipboard.writeText(code);setNotice("Copiado");}catch{setNotice("No se pudo copiar");}}}>Copiar código</button><span role="status">{notice}</span></div>
    <pre tabIndex={0} className="overflow-auto p-3 text-sm leading-6"><code>{code}</code></pre>
  </div>;
}
// Deliberately limited Markdown: React escapes all content; no raw HTML or executable links.
export default function NovaMessageContent({content}:{content:string}) {
  return <div className="min-w-0 break-words">{content.split(/(```[^\n]*\n[\s\S]*?(?:```|$))/g).map((part,i)=>{
    if(part.startsWith("```")){const first=part.indexOf("\n");return <Code key={i} language={part.slice(3,first).slice(0,40)} code={part.slice(first+1).replace(/```$/,"")}/>;}
    return <div key={i}>{part.split("\n").map((line,j)=>{
      const heading=line.match(/^(#{1,6})\s+(.+)$/);
      if(heading) return <p key={j} className="mt-3 text-lg font-semibold"><Inline text={heading[2]}/></p>;
      const bullet=line.match(/^\s*[-*]\s+(.+)$/);
      if(bullet) return <p key={j} className="pl-4">• <Inline text={bullet[1]}/></p>;
      return <p key={j} className="whitespace-pre-wrap min-h-2"><Inline text={line}/></p>;
    })}</div>;
  })}</div>;
}
