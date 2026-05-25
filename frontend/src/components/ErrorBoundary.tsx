"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime exception caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center select-none space-y-6">
          <div className="p-5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
            <ShieldAlert className="w-16 h-16" />
          </div>
          
          <div className="max-w-md space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Oops! Render Exception</h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              CodeQuest caught an unexpected client-side crash while rendering this view. This can happen due to minor Monaco loader delays or dynamic resource load failures.
            </p>
            {this.state.error && (
              <pre className="bg-neutral-950/80 p-3 rounded-xl text-[10px] font-mono leading-relaxed text-rose-400 overflow-x-auto border border-white/5 mt-3 max-w-sm mx-auto text-left whitespace-pre-wrap">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Application
            </button>
            <Link 
              href="/dashboard"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-300 hover:text-white font-bold px-5 py-2.5 rounded-xl transition-all text-xs flex items-center gap-1.5 active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Overview Panel
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
