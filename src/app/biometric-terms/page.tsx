"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Lock, Eye, Trash2, ChevronRight, CheckSquare, Square, X as CloseIcon } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function BiometricTermsPage() {
  const router = useRouter();
  const setBiometricConsent = useStore((s) => s.setBiometricConsent);

  const [agreed, setAgreed] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);

  const handleAgree = () => {
    if (!agreed) return;
    setBiometricConsent(true);
    router.push("/scan?mode=biometric");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FFFFFF" }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 18 }}
          className="w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #FF1493, #FF69B4)" }}
        >
          <Shield size={36} className="text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-black text-center text-gray-900 mb-2"
        >
          Facial Data &amp; Biometric Privacy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-gray-400 text-center mb-8 leading-relaxed"
        >
          Advanced biometric scanning requires your explicit consent.<br />
          Please review the following before proceeding.
        </motion.p>

        {/* Terms Agreement Checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6 mb-6 bg-[#FAFAFA] border border-[#F0F0F0]"
        >
          <div className="flex items-start gap-3 cursor-pointer select-none" onClick={() => setAgreed(!agreed)}>
            <div className="mt-0.5">
              {agreed ? (
                <CheckSquare size={20} className="text-[#FF1493]" />
              ) : (
                <Square size={20} className="text-gray-300" />
              )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              I agree to the{" "}
              <span 
                onClick={(e) => { e.stopPropagation(); setShowFullTerms(true); }}
                className="text-[#FF1493] font-bold underline decoration-pink-200 underline-offset-4 hover:decoration-pink-500 transition-all"
              >
                Terms and Conditions
              </span>{" "}
              for biometric data processing.
            </p>
          </div>
        </motion.div>

        {/* Full Terms Modal Overlay */}
        <AnimatePresence>
          {showFullTerms && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-lg rounded-3xl p-8 relative shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => setShowFullTerms(false)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <CloseIcon size={20} />
                </button>

                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Shield size={24} className="text-[#FF1493]" />
                  Biometric Privacy Policy
                </h2>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  {[
                    {
                      icon: Eye,
                      title: "Secure Verification",
                      desc: "Scanning involves real-time facial geometric analysis to verify identity and prevent system spoofing.",
                    },
                    {
                      icon: Lock,
                      title: "Local Storage Only",
                      desc: "Your 3D biometric data never leaves your device. All processing occurs locally within your secure browser sandbox.",
                    },
                    {
                      icon: Shield,
                      title: "Encrypted Session",
                      desc: "Facial landmarks are mathematically hashed and linked exclusively to your current device session.",
                    },
                    {
                      icon: Trash2,
                      title: "Right to Erasure",
                      desc: "You maintain 100% control. You can permanently wipe all biometric data from your profile at any time.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                        <item.icon size={18} className="text-[#FF1493]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">{item.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowFullTerms(false)}
                  className="w-full mt-8 py-4 rounded-2xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors"
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agreement text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[11px] text-gray-400 text-center mb-5 leading-relaxed"
        >
          By proceeding, you acknowledge that facial biometric data will be
          captured and processed on-device for advanced facial analysis.
          No data leaves your browser.
        </motion.p>

        {/* Agree button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: agreed ? 0.97 : 1 }}
          onClick={handleAgree}
          disabled={!agreed}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all ${
            agreed ? "opacity-100 shadow-[0_6px_24px_rgba(255,20,147,0.35)]" : "opacity-30 grayscale cursor-not-allowed"
          }`}
          style={{
            background: "linear-gradient(135deg, #FF1493, #FF69B4)",
          }}
        >
          Agree &amp; Proceed
          <ChevronRight size={18} />
        </motion.button>

        {/* Decline */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => router.push("/scan")}
          className="w-full py-3 mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
        >
          Decline — Return to Scanner
        </motion.button>
      </motion.div>
    </div>
  );
}
