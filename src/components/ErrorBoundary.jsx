import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-5 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground mb-1">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground max-w-xs">
              {this.state.error?.message || 'Erro inesperado. Tente recarregar o app.'}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-heading font-semibold shadow-sm"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
