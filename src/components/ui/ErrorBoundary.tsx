import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('Section error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
          <p className="font-medium">Section unavailable</p>
          <p className="mt-1 text-sm text-white/40">
            {this.props.label ?? 'Something went wrong rendering this section.'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
