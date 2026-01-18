import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global Safety Checks
if (window.location.hash.includes('error=')) {
    window.location.hash = ''; // Clear Auth errors if present
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: 'white', background: 'black', height: '100vh', overflow: 'auto' }}>
                    <h1>Něco se pokazilo :(</h1>
                    <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <p style={{ marginTop: 20 }}>Refreshni stránku a zkus to znovu.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
