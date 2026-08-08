import React from "react";
import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";

export default function PRAlert({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none w-max max-w-[90vw]"
    >
      <div className="relative bg-gradient-to-r from-yellow-500/25 via-amber-400/30 to-yellow-500/25 border border-yellow-500/50 rounded-2xl px-5 py-4 shadow-2xl shadow-yellow-500/30 backdrop-blur-sm overflow-hidden">
        {/* shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
        />
        <div className="flex items-center gap-3 relative">
          <motion.div
            className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shrink-0"
            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Trophy className="w-6 h-6 text-yellow-400" />
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <p className="text-yellow-400 font-heading font-bold text-xs uppercase tracking-widest">Novo Recorde!</p>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-foreground font-heading font-bold text-base leading-tight">{message}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
