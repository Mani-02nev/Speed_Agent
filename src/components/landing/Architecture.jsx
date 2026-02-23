import React from 'react';
import { motion } from 'framer-motion';
import { Database, Files, GitBranch, Share2 } from 'lucide-react';

const Architecture = () => {
    return (
        <section id="architecture" className="py-24 bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6">
                            Secure Core
                        </div>
                        <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase mb-6 leading-tight">V6 Enterprise <br />Neural Infrastructure</h2>
                        <p className="text-[#64748B] text-lg font-medium leading-relaxed mb-10">
                            Our core architecture is built for speed and security. We leverage low-latency inference engines and a proprietary virtual file system bridge.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: Database, title: "Groq-Based Inference", text: "Locked LLM nodes with 3-key rotation for 100% uptime." },
                                { icon: Files, title: "Virtual File System", text: "Universal bridge between terminal, editor, and AI services." },
                                { icon: GitBranch, title: "Patch Approval Layer", text: "Deterministic state management prevents unauthorized code execution." },
                                { icon: Share2, title: "Real-Time Sync", text: "Instant model distribution across all workspace components." }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex gap-4"
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                                        <item.icon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0F172A] mb-1">{item.title}</h4>
                                        <p className="text-[#64748B] text-sm font-medium">{item.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl"
                        >
                            {/* Diagram Mockup */}
                            <div className="space-y-8">
                                <div className="flex justify-center">
                                    <div className="px-6 py-3 bg-[#0F172A] rounded-xl text-white text-[10px] font-black uppercase tracking-[0.2em]">Groq AI Engine</div>
                                </div>
                                <div className="flex justify-center gap-12 relative">
                                    <div className="absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-slate-200 -z-10" />
                                    <div className="p-4 bg-[#F1F5F9] rounded-xl border border-slate-200 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                                        <span className="text-[10px] font-black uppercase">VFS Bridge</span>
                                    </div>
                                    <div className="p-4 bg-[#F1F5F9] rounded-xl border border-slate-200 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#00E0B8]/20 flex items-center justify-center text-[#00E0B8] font-bold">2</div>
                                        <span className="text-[10px] font-black uppercase">Patch UI</span>
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <div className="px-6 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[#0F172A] text-[10px] font-black uppercase tracking-[0.2em]">Edge Project Workspace</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Architecture;
