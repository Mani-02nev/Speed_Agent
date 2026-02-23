import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Neural Node Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-full bg-[#0D0F12] flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
                        <span className="text-red-500 text-2xl font-black">!</span>
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Neural Buffer Overflow</h1>
                    <p className="text-[#57606A] max-w-md mb-8 leading-relaxed">
                        The core engine encountered a critical architectural conflict.
                        All system nodes have been put into safe mode.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-[#00E0B8] text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 transition-all font-mono"
                    >
                        Re-Initialize System
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
