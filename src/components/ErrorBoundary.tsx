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
  public state: State = {
    hasError: false,
    errorMsg: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex w-full flex-col items-center justify-center rounded-[24px] border border-red-200 bg-red-50/50 p-8 text-center shadow-inner backdrop-blur-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-md">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black tracking-tight text-red-900">Anomalía Detectada en este Sector</h2>
          <p className="mt-2 max-w-md text-sm text-red-700">
            El escudo de contención ha aislado un fallo para proteger el resto del ecosistema.
          </p>
          <div className="mt-4 rounded-xl bg-red-950 px-4 py-2 font-mono text-xs text-red-200 shadow-inner">
            {this.state.errorMsg || "Error desconocido en el renderizado."}
          </div>
          <button
            type="button"
            className="mt-6 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-red-500 active:scale-95"
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
