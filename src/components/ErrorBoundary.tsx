import { Component, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: unknown };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const message =
        this.state.error && typeof this.state.error === "object"
          ? (this.state.error as any).message || JSON.stringify(this.state.error)
          : String(this.state.error ?? "Erro desconhecido");

      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Algo deu errado</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-sm">{message}</p>
              <Button variant="outline" onClick={this.reset}>
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