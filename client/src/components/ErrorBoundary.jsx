import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button.jsx';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-danger-soft text-danger">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-fg">Something went wrong</h1>
            <p className="mt-1 text-sm text-fg-muted">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Reload app</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
