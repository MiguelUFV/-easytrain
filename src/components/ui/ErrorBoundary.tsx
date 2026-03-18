import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * ErrorBoundary — captura errores inesperados de React y muestra
 * una pantalla de recuperación amigable en lugar de un crash total.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        // En producción aquí iría un servicio de logging (Sentry, etc.)
        console.error('[EasyTrain] Error no capturado:', error, info.componentStack);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        if (this.props.fallback) return this.props.fallback;

        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertTriangle size={40} className="text-red-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-black text-white mb-2">Algo salió mal</h1>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            La aplicación encontró un error inesperado. Tus datos guardados están seguros.
                        </p>
                        {this.state.error && (
                            <pre className="mt-4 text-left text-[11px] text-red-400/60 bg-red-500/5 border border-red-500/10 rounded-xl p-4 overflow-auto max-h-32">
                                {this.state.error.message}
                            </pre>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: undefined });
                            window.location.reload();
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#c9973f] hover:bg-[#d4a853] text-[#0a0f1c] font-bold rounded-2xl transition-all"
                    >
                        <RefreshCw size={16} />
                        Recargar aplicación
                    </button>
                </div>
            </div>
        );
    }
}
