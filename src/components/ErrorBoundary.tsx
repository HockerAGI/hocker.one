"use client";
import { getErrorMessage } from "@/lib/errors";
import React, { Component, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMsg: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: getErrorMessage(error) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[NOVA INFRA] Anomalía de contención:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[32px] border border-rose-500/30 bg-slate-950/80 p-8 text-center shadow-[0_0_40px_rgba(225,29,72,0.1)] backdrop-blur-3xl animate-in zoom-in duration-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyMjUsIC8gMjIsIC8gNzIsIDAuMikiLz48L3N2Zz4=')] opacity-50" />
          
          <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)] animate-pulse">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="relative z-10 text-2xl font-black tracking-tighter text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Anomalía Detectada
          </h2>
          <p className="relative z-10 mt-3 max-w-lg text-[11px] font-bold uppercase tracking-widest text-rose-300/80">
            El escudo de contención aisló un fallo para proteger la integridad del ecosistema.
          </p>

          <div className="relative z-10 mt-6 w-full max-w-xl rounded-2xl border border-rose-500/20 bg-slate-950/90 p-5 text-left shadow-inner">
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Traza de Error:</div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-rose-200 custom-scrollbar">
              {this.state.errorMsg}
            </pre>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="relative z-10 mt-8 rounded-2xl bg-rose-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-500 active:scale-95"
          >
            Reiniciar Nodo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
