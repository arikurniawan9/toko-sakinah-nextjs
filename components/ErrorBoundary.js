'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className={`p-4 rounded-lg ${this.props.darkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-100 text-red-800'}`}>
          <h2 className="text-lg font-bold mb-2">Terjadi Kesalahan</h2>
          <p className="mb-2">Terjadi kesalahan saat memuat komponen ini.</p>
          {process.env.NODE_ENV === 'development' && (
            <details className="whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className={`mt-3 px-4 py-2 rounded ${
              this.props.darkMode 
                ? 'bg-red-700 hover:bg-red-600 text-white' 
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;