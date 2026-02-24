import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProjectEditor from './pages/ProjectEditor';
import Settings from './pages/Settings';
import About from './pages/About';
import { useAuthStore } from './store/authStore';

import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
    const init = useAuthStore(state => state.init);
    const loading = useAuthStore(state => state.loading);
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        init();
    }, [init]);

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-white text-[#0F172A]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#00E0B8] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initializing Agent K...</span>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
                    <Route path="/project/:id" element={user ? <ProjectEditor /> : <Navigate to="/login" replace />} />
                    <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" replace />} />
                    <Route path="/settings/about" element={user ? <About /> : <Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </ErrorBoundary>
    );
};

export default App;
