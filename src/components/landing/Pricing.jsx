import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
    {
        name: "Starter",
        price: "$0",
        description: "Perfect for exploring AI-powered dev.",
        features: ["1 Project Workspace", "5 AI Neural Requests / day", "Standard Patch Hub", "Integrated Terminal", "Virtual File System"],
        button: "Get Started",
        popular: false
    },
    {
        name: "Pro",
        price: "$19",
        description: "For serious engineers building fast.",
        features: ["Unlimited Projects", "Daily Groq Quota Boost", "Priority Neural Routing", "Advanced File Support", "Priority Support"],
        button: "Launch Pro",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Dedicated infrastructure for teams.",
        features: ["Private AI Nodes", "Custom VFS Rules", "SSO & SAML Auth", "White-glove Inboarding", "SLA Guarantee"],
        button: "Contact Sales",
        popular: false
    }
];

const Pricing = () => {
    const navigate = useNavigate();

    return (
        <section id="pricing" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col items-center text-center mb-16">
                    <h2 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase mb-4">Scalable Infrastructure</h2>
                    <p className="text-[#64748B] text-lg font-medium max-w-2xl">Choose the tier that matches your engineering velocity.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-8 rounded-3xl border ${plan.popular ? 'border-[#00E0B8] shadow-2xl shadow-[#00E0B8]/10' : 'border-slate-200 shadow-xl shadow-slate-200/50'
                                } flex flex-col relative overflow-hidden`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 px-4 py-1 bg-[#00E0B8] text-black text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-2xl font-black text-[#0F172A] mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-black text-[#0F172A]">{plan.price}</span>
                                {plan.price !== 'Custom' && <span className="text-[#64748B] font-bold">/mo</span>}
                            </div>
                            <p className="text-[#64748B] text-sm font-medium mb-8 leading-relaxed">{plan.description}</p>

                            <div className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, fidx) => (
                                    <div key={fidx} className="flex gap-3 items-center">
                                        <div className="w-5 h-5 rounded-full bg-[#00E0B8]/10 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-[#00E0B8]" />
                                        </div>
                                        <span className="text-[13px] font-bold text-[#475569]">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => navigate('/login')}
                                className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${plan.popular ? 'bg-[#00E0B8] text-black hover:brightness-110 shadow-lg shadow-[#00E0B8]/20' : 'bg-white text-[#0F172A] border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {plan.button}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
