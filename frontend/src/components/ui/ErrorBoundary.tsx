import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime exception in React tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6 font-body text-slate-800">
          <div className="max-w-md w-full p-8 bg-white border border-slate-200 rounded-2xl shadow-xl text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 font-bold text-xl font-heading">
              !
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                An unexpected interface error occurred. You can reload the application to restore your session.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer font-heading"
            >
              Reload CargoGo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
