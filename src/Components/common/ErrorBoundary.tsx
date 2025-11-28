import React, { Component, type ReactNode } from "react";
import { ErrorPageContent } from "../../pages/ErrorPage";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🧨 Uncaught error:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorPageContent
            error={this.state.error}
            onRefresh={this.handleRefresh}
          />
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
