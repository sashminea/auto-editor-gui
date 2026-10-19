import React from "react";
import { Button } from "@/components/ui/button";

interface State { error: Error | null }

// Shows a recoverable message instead of a blank window if a component crashes
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UI crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="max-w-md break-words text-sm text-muted-foreground">{this.state.error.message}</p>
        <Button onClick={() => window.location.reload()}>Reload the app</Button>
      </div>
    );
  }
}

export default ErrorBoundary;