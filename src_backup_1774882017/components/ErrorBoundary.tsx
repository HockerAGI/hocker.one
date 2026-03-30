"use client";

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
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex w-full flex-col items-center justify-center rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-8 text-center shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 text-rose-200">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white">
            Anomalía Detectada en este Sector
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            El escudo de contención aisló un fallo para proteger el resto del ecosistema.
          </p>

          <div className="mt-4 max-w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-xs text-sky-200">
            {this.state.errorMsg || "Error desconocido en el renderizado."}
          </div>

          <button
            type="button"
            className="mt-6 rounded-2xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
            onClick={() => this.setState({ hasError: false, errorMsg: "" })}
          >
            Intentar restaurar conexión
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}