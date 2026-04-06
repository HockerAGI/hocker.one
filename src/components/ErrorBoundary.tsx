"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

function DefaultFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="hocker-panel-pro overflow-hidden border-rose-500/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">
            Error visual
          </p>
          <h2 className="mt-2 text-lg font-black text-white">
            Algo se salió del flujo
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            La interfaz siguió viva, pero esta sección no pudo renderizarse.
          </p>
        </div>

        <div className="rounded-[22px] border border-white/5 bg-slate-950/60 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            Detalle
          </p>
          <p className="mt-2 break-words font-mono text-xs leading-relaxed text-rose-200">
            {error.message || "Error no identificado."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-sky-300 transition-all hover:bg-sky-500/20 active:scale-95"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-white/10 active:scale-95"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  override render(): ReactNode {
    const { hasError, error } = this.state;

    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultFallback error={error ?? new Error("Error desconocido")} reset={this.reset} />;
    }

    return this.props.children;
  }
}