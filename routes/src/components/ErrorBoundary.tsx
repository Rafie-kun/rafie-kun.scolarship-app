import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 🌠 global error boundary to prevent random white/black screen crashes.
 * Displays a friendly Minecraft/retro-themed fallback UI allowing immediate recovery.
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught exception inside ScholarPath sandbox:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#110f0d] flex items-center justify-center p-6 font-mono text-stone-200">
          <div className="w-full max-w-lg bg-[#2c2927] border-4 border-black p-6 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-red-950 border-4 border-black flex items-center justify-center text-red-505 animate-bounce">
                <AlertOctagon className="w-10 h-10 text-red-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="font-press text-[12px] text-[#ff5555] uppercase tracking-wider mc-text-shadow">
                🔥 CRITICAL PATH EXCEPTION 🔥
              </h2>
              <p className="text-xs text-stone-400 uppercase font-bold tracking-widest pt-1">
                A rendering conflict blocked your path!
              </p>
            </div>

            <div className="bg-[#141212] border-2 border-dashed border-red-900/60 p-4 text-left rounded-none overflow-x-auto text-xs font-mono text-red-300 max-h-[140px] select-all">
              <strong>Error Trace:</strong>
              <div className="mt-1 font-mono text-[10.5px] leading-relaxed">
                {this.state.error?.toString() || "Unknown error detected during inventory paint."}
              </div>
            </div>

            <p className="text-stone-300 text-xs font-sans leading-relaxed">
              Your session state has been secured in the persistent matrix ledger. You can safely trigger an emergency respawn.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full mc-btn py-3 text-[10px] font-press uppercase text-[#ffff55] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Respawn Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
