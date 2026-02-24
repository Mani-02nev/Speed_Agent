import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Architecture from '../components/landing/Architecture';
import Pricing from '../components/landing/Pricing';
import Footer from '../components/landing/Footer';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white min-h-screen selection:bg-[#00E0B8]/30 overflow-x-hidden">
            <Navbar />
            <Hero />
            <Features />
            <Architecture />

            {/* CTA Section */}
            <section className="py-24 px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto bg-[#0F172A] rounded-3xl p-12 md:p-20 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00E0B8]/10 blur-[100px] rounded-full" />

                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-6 relative z-10">
                        Ready to Build Faster?
                    </h2>
                    <p className="text-slate-400 text-lg font-medium mb-10 max-w-xl mx-auto relative z-10">
                        Join the next generation of engineers building production-ready systems with AI precision.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-10 py-5 bg-[#00E0B8] text-black rounded-xl text-sm font-black uppercase tracking-widest hover:brightness-110 shadow-2xl shadow-[#00E0B8]/20 relative z-10 transition-all flex items-center gap-2 mx-auto"
                    >
                        Launch Agent K <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </section>

            <Pricing />
            <Footer />
        </div>
    );
};

export default LandingPage;
