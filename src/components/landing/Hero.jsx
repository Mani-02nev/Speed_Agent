import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Terminal, Code2, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className="relative pt-32 pb-20 overflow-hidden bg-white">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-b from-[#00E0B8]/10 to-transparent blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-50 to-transparent blur-3xl -z-10" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E0B8]/10 border border-[#00E0B8]/20 text-[#00E0B8] text-[10px] font-black uppercase tracking-widest mb-8"
                    >
                        <Sparkles className="w-3 h-3" /> v6.0 Enterprise Architecture
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-[#0F172A] tracking-tighter leading-[0.95] max-w-4xl"
                    >
                        Build, Analyze, and Ship <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E0B8] to-[#2563EB]">Code with AI</span> Precision.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 text-xl text-[#64748B] max-w-2xl font-medium leading-relaxed"
                    >
                        Agent K is an enterprise AI-powered development environment with live patch control, multi-file intelligence, and integrated terminal execution.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-10 flex flex-col sm:flex-row items-center gap-4"
                    >
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-[#0F172A] text-white rounded-xl text-[14px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#1e293b] shadow-2xl transition-all"
                        >
                            Launch Workspace <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            className="px-8 py-4 bg-white text-[#0F172A] border border-slate-200 rounded-xl text-[14px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            View Architecture
                        </button>
                    </motion.div>

                    {/* IDE Mockup Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
                        className="mt-20 w-full relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#00E0B8] to-[#2563EB] rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
                        <div className="relative rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-[#0F1115]">
                            {/* Fake Editor Header */}
                            <div className="h-10 bg-[#1A1F29] flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className="px-3 py-1 bg-[#2D333B] rounded text-[10px] text-[#9DA5B4] font-mono">speed-agent-workspace/main.js</div>
                                </div>
                            </div>
                            {/* Mockup Image Placeholder - We'll just build a CSS mockup of the IDE */}
                            <div className="grid grid-cols-[200px_1fr_300px] h-[500px]">
                                <div className="border-r border-[#1F2430] bg-[#111317] p-4 flex flex-col gap-2">
                                    <div className="h-4 w-3/4 bg-[#1A1F29] rounded opacity-50" />
                                    <div className="h-4 w-1/2 bg-[#1A1F29] rounded opacity-50 mt-4" />
                                    <div className="h-4 w-2/3 bg-[#1A1F29] rounded opacity-50" />
                                    <div className="h-4 w-3/4 bg-[#1A1F29] rounded opacity-50" />
                                </div>
                                <div className="p-10 font-mono text-[13px] text-[#E6EDF3] flex flex-col gap-2">
                                    <div className="flex gap-2"><span className="text-purple-400">import</span> <span className="text-blue-400">{`{ createAgent }`}</span> <span className="text-purple-400">from</span> <span className="text-orange-300">'@speed-agent/core'</span>;</div>
                                    <div className="mt-4"><span className="text-[#57606A]">// Initialize V6 Neural Sequence</span></div>
                                    <div className="flex gap-2"><span className="text-purple-400">const</span> <span className="text-blue-400">agent</span> = <span className="text-yellow-400">createAgent</span>({`{`}</div>
                                    <div className="pl-4 flex gap-2">model: <span className="text-orange-300">'llama-3.1-8b'</span>,</div>
                                    <div className="pl-4 flex gap-2">provider: <span className="text-orange-300">'groq'</span>,</div>
                                    <div className="pl-4">temperature: <span className="text-blue-400">0.2</span></div>
                                    <div>{`});`}</div>
                                </div>
                                <div className="border-l border-[#1F2430] bg-[#151821] p-4 flex flex-col gap-4">
                                    <div className="h-8 bg-[#0D0F12] rounded-lg border border-[#1F2430] flex items-center px-3">
                                        <div className="w-2 h-2 rounded-full bg-[#00E0B8] mr-2" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-[#00E0B8]">AI ACTIVE</span>
                                    </div>
                                    <div className="flex-1 bg-[#0D0F12] rounded-lg border border-[#1F2430] p-4 space-y-3">
                                        <div className="h-2 w-3/4 bg-white/5 rounded" />
                                        <div className="h-2 w-1/2 bg-white/5 rounded" />
                                        <div className="h-8 bg-[#00E0B8] rounded w-full mt-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
