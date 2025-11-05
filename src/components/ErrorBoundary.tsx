"use client";

import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: unknown };

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("Route rendering error:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      const message =
        this.state.error && typeof this.state.error === "object"
          ? (this.state.error as any).message || JSON.stringify(this.state.error)
          : String(this.state.error ?? "Erro desconhecido");

      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Ocorreu um erro</AlertTitle>
            <AlertDescription className="space-y-3">
              <div className="text-sm break-words">{message}</div>
              <Button variant="outline" size="sm" onClick={this.reset}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;