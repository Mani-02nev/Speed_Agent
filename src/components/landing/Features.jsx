import React from 'react';
import { motion } from 'framer-motion';
import { Files, ShieldCheck, Zap, Code2, Terminal, Cpu } from 'lucide-react';

const features = [
    {
        icon: Files,
        title: "Multi-File AI Generation",
        description: "Generate and synchronize changes across your entire project architecture simultaneously with one-shot intelligence."
    },
    {
        icon: ShieldCheck,
        title: "Controlled Patch Approval",
        description: "The AI proposes changes. You review the delta and approve with one click. Security is deterministic."
    },
    {
        icon: Zap,
        title: "Groq Fast Inference",
        description: "Zero-latency development powered by Llama 3.1 on Groq LPUs. Experience the fastest AI coding cycle on the planet."
    },
    {
        icon: Code2,
        title: "Monaco-Based Live Editor",
        description: "The industry standard editor integrated with real-time neural streaming and live typing simulation."
    },
    {
        icon: Terminal,
        title: "Integrated Project Terminal",
        description: "Execute builds, run tests, and manage your virtual file system directly within the neural environment."
    },
    {
        icon: Cpu,
        title: "Enterprise Security",
        description: "Isolated project containers, secure key rotation, and strict single-user architecture for maximum data privacy."
    }
];

const Features = () => {
    return (
        <section id="features" className="py-24 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col items-center text-center mb-16">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase mb-4">Product Capabilities</h2>
                    <p className="text-[#64748B] text-lg font-medium max-w-2xl">Agent K provides a complete architectural stack for next-gen AI software engineering.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-[#00E0B8]/40 hover:shadow-2xl hover:shadow-[#00E0B8]/5 transition-all group"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#00E0B8]/10 group-hover:text-[#00E0B8] transition-colors">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-[#0F172A] mb-3">{feature.title}</h3>
                            <p className="text-[#64748B] font-medium leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
