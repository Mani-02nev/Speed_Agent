import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Terminal from '../editor/Terminal';

const TerminalPanel = ({ isTerminalOpen, setIsTerminalOpen, id }) => {
    return (
        <AnimatePresence>
            {isTerminalOpen && (
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 280 }}
                    exit={{ height: 0 }}
                    className="border-t border-[#1F2430] relative bg-[#0B0D11] z-30 overflow-hidden"
                >
                    <Terminal projectId={id} />
                    <button
                        className="absolute top-3 right-5 text-[#57606A] hover:text-white transition-colors p-1"
                        onClick={() => setIsTerminalOpen(false)}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TerminalPanel;
