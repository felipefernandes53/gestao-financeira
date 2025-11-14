import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Componente de Segurança para capturar erros (ErrorBoundary)
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Erro capturado:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#b91c1c', backgroundColor: '#fef2f2', height: '100vh' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Ops! Ocorreu um erro fatal.</h1>
          <p style={{ fontWeight: 'bold' }}>Por favor, envie um print desta tela:</p>
          <pre style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #fca5a5', overflow: 'auto', marginTop: '10px' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
