import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const signIn = useAuthStore(state => state.signIn);
    const signUp = useAuthStore(state => state.signUp);
    const user = useAuthStore(state => state.user);
    const init = useAuthStore(state => state.init);
    const navigate = useNavigate();

    useEffect(() => {
        init();
        if (user) navigate('/dashboard');
    }, [user, navigate, init]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password, fullName);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#FFFFFF] overflow-hidden">
            {/* Left Side: Visual/Message */}
            <div className="hidden md:flex w-1/2 bg-[#0F172A] relative items-center justify-center p-20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00E0B8]/10 to-transparent pointer-events-none" />
                <div className="max-w-md relative z-10 text-center">
                    <div className="w-16 h-16 bg-[#00E0B8] rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-[0_0_30px_rgba(0,224,184,0.3)]">
                        <Zap className="w-8 h-8 text-black fill-current" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-6 leading-tight">Speed Agent IDE <br />V6 Enterprise</h2>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed">
                        Access the most advanced AI engineering environment with live patch approvals and multi-file intelligence.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-20 py-20 relative">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-10 left-6 md:left-20 flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition-colors text-[11px] font-black uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Site
                </button>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-md w-full mx-auto"
                >
                    <div className="md:hidden flex items-center gap-2 mb-10">
                        <div className="w-8 h-8 bg-[#00E0B8] rounded flex items-center justify-center">
                            <Zap className="w-5 h-5 text-black fill-current" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tighter text-[#0F172A]">Speed Agent</span>
                    </div>

                    <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Node Account'}
                    </h1>
                    <p className="text-[#64748B] font-medium mb-10">
                        {isLogin ? 'Identify yourself to access the IDE workspace.' : 'Register to begin your architectural journey.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Engineer Name"
                                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#00E0B8] focus:ring-4 focus:ring-[#00E0B8]/5 transition-all"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Email Interface</label>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#00E0B8] focus:ring-4 focus:ring-[#00E0B8]/5 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Access Protocol</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[14px] font-medium focus:outline-none focus:border-[#00E0B8] focus:ring-4 focus:ring-[#00E0B8]/5 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-lg border border-red-100 uppercase tracking-widest">
                                ERROR: {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#0F172A] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-[#1e293b] shadow-xl shadow-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Verifying Node...' : isLogin ? 'Access IDE' : 'Register Securely'}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-100 text-center">
                        <p className="text-[#64748B] text-sm font-medium">
                            {isLogin ? "Need a neural account?" : "Already have access?"}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 text-[#00E0B8] font-black uppercase tracking-widest hover:opacity-70"
                            >
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
