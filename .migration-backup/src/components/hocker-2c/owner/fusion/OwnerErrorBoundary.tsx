"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type OwnerErrorBoundaryProps = {
  children: ReactNode;
};

type OwnerErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class OwnerErrorBoundary extends Component<OwnerErrorBoundaryProps, OwnerErrorBoundaryState> {
  state: OwnerErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): OwnerErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Vista owner interrumpida.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[OwnerErrorBoundary]", error, errorInfo.componentStack);
  }

  reset = () => {
    this.setState({
      hasError: false,
      message: "",
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="hocker-card border-red-300/20 bg-red-500/[0.06] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-red-100/80">
              <AlertTriangle className="h-4 w-4" />
              Vista protegida
            </p>
            <h2 className="mt-3 text-xl font-semibold text-white">Esta sección se detuvo sin afectar el sistema</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-red-50/75">
              Guardé el error en consola para revisión técnica. Puedes reintentar esta vista sin ejecutar ninguna acción.
            </p>
            {this.state.message ? (
              <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-red-50/75">
                {this.state.message}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={this.reset}
            className="hocker-focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.11]"
          >
            <RotateCcw className="h-4 w-4" />
            Reintentar vista
          </button>
        </div>
      </section>
    );
  }
}
