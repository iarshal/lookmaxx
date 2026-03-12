"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Diamond,
  Sparkles,
  Eye,
  Flame,
  Sprout,
  Zap,
  Trophy,
  ChevronRight,
  ChevronDown,
  Target,
  TrendingUp,
  User,
  Shield,
  Brain,
  Camera,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import BentoGrid from "@/components/BentoGrid";

/* ─── Onboarding Data ─── */

const GOALS = [
  {
    id: "jawline",
    label: "Sharp Jawline",
    icon: <Diamond size={24} />,
    color: "from-[#FF1493]/10 to-[#FFB6C1]/10",
    iconColor: "text-[#FF1493]",
    desc: "Define your facial structure",
  },
  {
    id: "skin",
    label: "Clear Skin",
    icon: <Sparkles size={24} />,
    color: "from-amber-500/10 to-yellow-400/10",
    iconColor: "text-amber-500",
    desc: "Achieve a flawless complexion",
  },
  {
    id: "eyes",
    label: "Hunter Eyes",
    icon: <Eye size={24} />,
    color: "from-blue-500/10 to-cyan-400/10",
    iconColor: "text-blue-500",
    desc: "Maximize periorbital appeal",
  },
  {
    id: "overall",
    label: "Overall Glow-Up",
    icon: <Flame size={24} />,
    color: "from-orange-500/10 to-red-400/10",
    iconColor: "text-orange-500",
    desc: "Full aesthetic transformation",
  },
];

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "What's your primary goal?",
    subtitle: "We'll personalize your entire analysis around this.",
  },
  {
    id: "commitment",
    title: "How committed are you?",
    subtitle: "Consistency is everything in looksmaxxing.",
  },
];

const COMMITMENT_LEVELS = [
  {
    id: "casual",
    label: "Casual",
    desc: "15 min/day",
    icon: <Sprout size={24} />,
    color: "from-emerald-500/10 to-green-400/10",
    iconColor: "text-emerald-500",
  },
  {
    id: "serious",
    label: "Serious",
    desc: "30 min/day",
    icon: <Zap size={24} />,
    color: "from-yellow-500/10 to-amber-400/10",
    iconColor: "text-yellow-500",
  },
  {
    id: "elite",
    label: "Elite Mode",
    desc: "1+ hour/day",
    icon: <Trophy size={24} />,
    color: "from-[#FF1493]/10 to-[#FFB6C1]/10",
    iconColor: "text-[#FF1493]",
  },
];

/* ─── FAQ Data ─── */

const FAQ_ITEMS = [
  {
    q: "How accurate is the AI facial analysis?",
    a: "Our AI uses 68-point landmark detection trained on over 2 million faces. It measures symmetry, proportions, bone structure, and skin quality with clinical-grade precision. Accuracy improves with good lighting and a straight-on photo.",
  },
  {
    q: "Is my photo stored or shared?",
    a: "Absolutely not. Your photo is processed entirely on-device and is never uploaded to any server. We take privacy seriously — your biometric data stays on your phone and is deleted after analysis.",
  },
  {
    q: "What kind of improvements can I realistically expect?",
    a: "Most users see noticeable improvements within 30-90 days by following their personalized routine. This includes better skin texture, improved jawline definition through mewing, and enhanced facial harmony through targeted exercises.",
  },
  {
    q: "How is this different from a simple 1-10 rating?",
    a: "We don't just give you a number. LooksMax AI provides a full breakdown of 30+ facial traits, identifies your strongest features, highlights areas of improvement, and generates a personalized daily action plan — skincare, exercises, and lifestyle changes.",
  },
  {
    q: "Do I need to pay for a full analysis?",
    a: "Your first full analysis is completely free, including the personalized routine and progress tracking. Premium features like advanced comparisons and weekly AI coaching are available for subscribers.",
  },
];

/* ─── FAQ Accordion Item ─── */

function FAQItem({ item, isOpen, onToggle }: { item: (typeof FAQ_ITEMS)[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-white/30 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-lg font-semibold text-gray-900 pr-8 group-hover:text-[#0A84FF] transition-colors">
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-gray-500 leading-relaxed pb-6 pr-12">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ─── */

export default function LandingPage() {
  const router = useRouter();
  const { setProfile, completeOnboarding } = useStore();
  const [onboarding, setOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedCommitment, setSelectedCommitment] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  /* Sticky navbar glass effect on scroll */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Smooth scroll for anchor links */
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleStart = () => setOnboarding(true);

  const handleGoalSelect = (id: string) => {
    setSelectedGoal(id);
    setProfile({ goal: id });
    setTimeout(() => setStep(1), 400);
  };

  const handleCommitmentSelect = (id: string) => {
    setSelectedCommitment(id);
    setProfile({ commitment: id });
    completeOnboarding();
    setTimeout(() => router.push("/scan"), 600);
  };

  /* ─── Onboarding Flow ─── */

  if (onboarding) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="min-h-screen flex flex-col items-center justify-center px-6"
          style={{ background: "#F2F2F7" }}
        >
          <div className="w-full max-w-lg">
            {/* Progress bar */}
            <div className="flex gap-3 mb-12">
              {ONBOARDING_STEPS.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-200/60">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF1493] to-[#FFB6C1]"
                    initial={{ width: "0%" }}
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              ))}
            </div>

            <motion.h1
              className="text-4xl font-black tracking-tight text-gray-900 mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {ONBOARDING_STEPS[step].title}
            </motion.h1>
            <motion.p
              className="text-gray-500 mb-10 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {ONBOARDING_STEPS[step].subtitle}
            </motion.p>

            {step === 0 && (
              <div className="grid grid-cols-2 gap-4">
                {GOALS.map((goal, i) => (
                  <motion.button
                    key={goal.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i + 0.2 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleGoalSelect(goal.id)}
                    className={`relative p-6 rounded-2xl text-left transition-all duration-200 ${
                      selectedGoal === goal.id
                        ? "border-[#FF1493] shadow-md"
                        : "hover:shadow-md"
                    }`}
                    style={{
                      background: selectedGoal === goal.id ? "rgba(255,20,147,0.04)" : "rgba(255,255,255,0.80)",
                      backdropFilter: "saturate(150%) blur(30px)",
                      WebkitBackdropFilter: "saturate(150%) blur(30px)",
                      border: selectedGoal === goal.id ? "2px solid #FF1493" : "0.5px solid rgba(0,0,0,0.06)",
                      boxShadow: selectedGoal === goal.id
                        ? "0 0 20px rgba(255,20,147,0.15), inset 0 0.5px 0 rgba(255,255,255,0.8)"
                        : "0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.8)",
                    }}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center ${goal.iconColor} mb-3`}>
                      {goal.icon}
                    </div>
                    <p className="font-bold text-gray-900">{goal.label}</p>
                    <p className="text-sm text-gray-500 mt-1">{goal.desc}</p>
                    {selectedGoal === goal.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-[#FF1493] to-[#FFB6C1] flex items-center justify-center shadow-md"
                      >
                        <span className="text-white text-xs">&#10003;</span>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4">
                {COMMITMENT_LEVELS.map((level, i) => (
                  <motion.button
                    key={level.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i + 0.2 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCommitmentSelect(level.id)}
                    className={`flex items-center gap-5 p-5 rounded-2xl text-left transition-all duration-200 ${
                      selectedCommitment === level.id
                        ? "shadow-md"
                        : "hover:shadow-md"
                    }`}
                    style={{
                      background: selectedCommitment === level.id ? "rgba(255,20,147,0.04)" : "rgba(255,255,255,0.80)",
                      backdropFilter: "saturate(150%) blur(30px)",
                      WebkitBackdropFilter: "saturate(150%) blur(30px)",
                      border: selectedCommitment === level.id ? "2px solid #FF1493" : "0.5px solid rgba(0,0,0,0.06)",
                      boxShadow: selectedCommitment === level.id
                        ? "0 0 20px rgba(255,20,147,0.15), inset 0 0.5px 0 rgba(255,255,255,0.8)"
                        : "0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.8)",
                    }}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center ${level.iconColor} flex-shrink-0`}>
                      {level.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{level.label}</p>
                      <p className="text-gray-500">{level.desc}</p>
                    </div>
                    <ChevronRight className="ml-auto text-gray-300" size={20} />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  /* ─── Landing Page ─── */

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7", scrollBehavior: "smooth" }}>
      {/* Ambient background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, rgba(255,182,193,0.5) 0%, rgba(255,20,147,0.08) 70%, transparent 100%)" }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl opacity-35"
          style={{ background: "radial-gradient(circle, rgba(255,105,180,0.4) 0%, rgba(255,182,193,0.1) 70%, transparent 100%)" }}
        />
        <div
          className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(175,130,255,0.3) 0%, rgba(200,170,255,0.05) 70%, transparent 100%)" }}
        />
      </div>

      {/* ─── iOS Glass Navbar ─── */}
      <motion.nav
        ref={navRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 w-full px-6 py-4 transition-all duration-500 ${
          scrolled ? "glass-nav" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF1493] to-[#FFB6C1] flex items-center justify-center shadow-md">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">LooksMax AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("how")} className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm font-medium">
              How It Works
            </button>
            <button onClick={() => scrollTo("features")} className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm font-medium">
              Features
            </button>
            <button onClick={() => scrollTo("faq")} className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm font-medium">
              FAQ
            </button>
            <Link href="/profile" className="text-gray-500 hover:text-[#0A84FF] transition-colors">
              <User size={20} />
            </Link>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white text-sm font-semibold shadow-md"
            style={{ boxShadow: "0 4px 14px rgba(255,20,147,0.3)" }}
          >
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      {/* ─── Hero Section ─── */}
      <section
        className="relative z-10 w-full px-6 pt-36 pb-32"
        style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F2F2F7 100%)" }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Glass badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[#FF1493] text-sm font-semibold mb-8"
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "saturate(150%) blur(24px)",
                WebkitBackdropFilter: "saturate(150%) blur(24px)",
                border: "0.5px solid rgba(255,20,147,0.2)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.8)",
              }}
            >
              <Zap size={14} />
              <span>AI-Powered Aesthetic Analysis</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.92] mb-8 text-gray-900">
              Unlock Your{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #FF1493 0%, #FF69B4 50%, #FFB6C1 100%)",
                }}
              >
                Aesthetic
              </span>
              <br />
              Potential
            </h1>

            {/* Glowing accent line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="w-24 h-1 mx-auto mb-8 rounded-full bg-gradient-to-r from-[#FF1493] to-[#FFB6C1]"
              style={{ boxShadow: "0 0 20px rgba(255,20,147,0.4), 0 0 60px rgba(255,20,147,0.15)" }}
            />

            <p className="text-lg md:text-xl text-gray-500 leading-relaxed mb-12 max-w-2xl mx-auto">
              Not a harsh rating. A personalized roadmap. Discover your unique features,
              understand your potential, and get a science-backed daily routine to get there.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(255,20,147,0.45)" }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStart}
                className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white font-bold text-lg transition-all duration-300"
                style={{ boxShadow: "0 6px 24px rgba(255,20,147,0.35)" }}
              >
                Start Your Journey
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/results")}
                className="w-full sm:w-auto px-10 py-4.5 rounded-2xl font-bold text-lg text-gray-700 transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.80)",
                  backdropFilter: "saturate(150%) blur(30px)",
                  WebkitBackdropFilter: "saturate(150%) blur(30px)",
                  border: "0.5px solid rgba(0,0,0,0.1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.8)",
                }}
              >
                See Example Report
              </motion.button>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-3 mt-12 text-sm text-gray-400">
              <div className="flex -space-x-2">
                {["#F9A8D4", "#C4B5FD", "#93C5FD", "#86EFAC", "#FDE68A"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white" style={{ background: c }} />
                ))}
              </div>
              <span><strong className="text-gray-700">12,400+</strong> analyses done this week</span>
            </div>
          </motion.div>

          {/* Hero visual card — glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-24 relative max-w-5xl mx-auto"
          >
            <div
              className="card-glass rounded-3xl p-6 md:p-8"
              style={{
                boxShadow: "0 8px 40px rgba(255,20,147,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Score card */}
                <div className="bg-gradient-to-br from-[#FF1493] to-[#FF69B4] rounded-2xl p-6 text-white shadow-lg">
                  <p className="text-pink-200 text-sm font-medium mb-1">Aesthetic Score</p>
                  <p className="text-5xl font-black">8.2</p>
                  <p className="text-pink-200 text-sm mt-2">&uarr; Potential: 9.1</p>
                  <div className="mt-5 space-y-3">
                    {[
                      { trait: "Symmetry", score: "8.4" },
                      { trait: "Jawline", score: "7.9" },
                      { trait: "Skin", score: "8.7" },
                    ].map((item) => (
                      <div key={item.trait}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-pink-200">{item.trait}</span>
                          <span className="text-white font-semibold">{item.score}</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{ width: `${parseFloat(item.score) * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center - face placeholder */}
                <div
                  className="flex flex-col items-center justify-center rounded-2xl p-6 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "saturate(150%) blur(24px)",
                    WebkitBackdropFilter: "saturate(150%) blur(24px)",
                    border: "0.5px solid rgba(0,0,0,0.06)",
                    boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, #E2E8F0, #F1F5F9)" }}>
                    <User size={40} className="text-gray-400" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-full h-full opacity-20" viewBox="0 0 200 200">
                      <ellipse cx="100" cy="90" rx="45" ry="60" fill="none" stroke="#FF1493" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1="100" y1="30" x2="100" y2="150" stroke="#FF1493" strokeWidth="0.5" strokeDasharray="2 4" />
                      <line x1="55" y1="90" x2="145" y2="90" stroke="#FF1493" strokeWidth="0.5" strokeDasharray="2 4" />
                      <circle cx="76" cy="80" r="3" fill="none" stroke="#FF1493" strokeWidth="1" />
                      <circle cx="124" cy="80" r="3" fill="none" stroke="#FF1493" strokeWidth="1" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 font-medium relative z-10">Biometric Analysis</p>
                </div>

                {/* Right - traits */}
                <div className="space-y-3">
                  {[
                    { trait: "Canthal Tilt", value: "Positive +2\u00B0", good: true },
                    { trait: "Face Shape", value: "Diamond", good: true },
                    { trait: "Skin Texture", value: "Good", good: true },
                    { trait: "Symmetry", value: "92%", good: true },
                  ].map((item) => (
                    <div
                      key={item.trait}
                      className="rounded-xl p-3.5"
                      style={{
                        background: "rgba(255,255,255,0.70)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "0.5px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.8)",
                      }}
                    >
                      <p className="text-xs text-gray-400 font-medium">{item.trait}</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${item.good ? "bg-emerald-400" : "bg-orange-400"}`} />
                        <span className="text-xs text-gray-400">{item.good ? "Strong" : "Improvable"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works — BentoGrid ─── */}
      <section id="how" className="relative z-10 w-full px-6 py-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block text-sm font-semibold text-[#FF1493] tracking-wide uppercase mb-4"
            >
              How It Works
            </motion.span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5">
              AI That Sees What
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)" }}
              >
                You Can&apos;t
              </span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Every pixel analyzed. Every proportion measured. Every recommendation backed by facial aesthetics research.
            </p>
          </motion.div>

          <BentoGrid />
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="relative z-10 w-full px-6 py-28" style={{ background: "linear-gradient(180deg, rgba(255,240,246,0.3) 0%, rgba(242,242,247,0.5) 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block text-sm font-semibold text-[#FF1493] tracking-wide uppercase mb-4"
            >
              Features
            </motion.span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5">
              Why LooksMax AI?
            </h2>
            <p className="text-xl text-gray-500">Science-backed. Actionable. Not just a number.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Camera size={26} />,
                title: "Precision Analysis",
                desc: "30+ facial landmarks analyzed using cutting-edge biometric algorithms. Every angle, ratio, and proportion mapped with clinical precision.",
                gradient: "from-[#FF1493] to-[#FF69B4]",
                bgAccent: "#FFF0F6",
                accentColor: "#FF1493",
                emoji: "🎯",
              },
              {
                icon: <Brain size={26} />,
                title: "Personalized Roadmap",
                desc: "Custom daily routines based on your unique face structure and goals. Skincare, exercises, and lifestyle changes tailored just for you.",
                gradient: "from-violet-500 to-purple-400",
                bgAccent: "#F3E8FF",
                accentColor: "#8B5CF6",
                emoji: "🧠",
              },
              {
                icon: <TrendingUp size={26} />,
                title: "Track Progress",
                desc: "Before & after comparisons to visualize your transformation journey. Watch your score climb as you follow your routine consistently.",
                gradient: "from-cyan-500 to-blue-400",
                bgAccent: "#E6F4FF",
                accentColor: "#3B82F6",
                emoji: "📈",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative rounded-[1.5rem] p-8 transition-all duration-300 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${feature.bgAccent} 0%, rgba(255,255,255,0.92) 60%, white 100%)`,
                  border: `0.5px solid ${feature.accentColor}12`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03), inset 0 0.5px 0 rgba(255,255,255,0.9)",
                }}
              >
                {/* Soft accent orb */}
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
                  style={{ background: `${feature.accentColor}12` }}
                />

                <div
                  className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-5`}
                  style={{ boxShadow: `0 4px 14px ${feature.accentColor}30`, width: "3.25rem", height: "3.25rem" }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2.5 text-gray-900">{feature.title}</h3>
                <p className="text-[0.9rem] text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="relative z-10 w-full px-6 py-28">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="inline-block text-sm font-semibold text-[#FF1493] tracking-wide uppercase mb-4"
              >
                FAQ
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
                Questions? Answered.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl p-2 sm:p-8"
              style={{
                background: "rgba(255,255,255,0.80)",
                backdropFilter: "saturate(150%) blur(30px)",
                WebkitBackdropFilter: "saturate(150%) blur(30px)",
                border: "0.5px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0.5px 0 rgba(0,0,0,0.02), inset 0 0.5px 0 rgba(255,255,255,0.8)",
              }}
            >
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem
                  key={i}
                  item={item}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Big CTA Section ─── */}
      <section className="relative z-10 w-full px-6 py-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#FF1493] to-[#FF69B4] rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl"
          >
            {/* Glassmorphism overlay elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute top-[-20%] right-[-10%] w-80 h-80 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(40px)",
                  WebkitBackdropFilter: "blur(40px)",
                }}
              />
              <div
                className="absolute bottom-[-20%] left-[-10%] w-64 h-64 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(30px)",
                  WebkitBackdropFilter: "blur(30px)",
                }}
              />
              <div
                className="absolute top-[50%] left-[50%] w-48 h-48 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                }}
              />
            </div>
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5">
                  Ready to see your potential?
                </h2>
                <p className="text-pink-100 text-xl mb-10 max-w-xl mx-auto">
                  Join thousands who&apos;ve discovered their roadmap to peak aesthetics.
                </p>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleStart}
                  className="px-12 py-5 rounded-2xl bg-white text-[#FF1493] font-bold text-lg transition-all duration-300 shadow-lg"
                >
                  Analyze My Face
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Professional Footer ─── */}
      <footer
        className="relative z-10 w-full px-6 pt-16 pb-8"
        style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF1493] to-[#FFB6C1] flex items-center justify-center shadow-md">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="font-black text-xl tracking-tight">LooksMax AI</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                AI-powered facial analysis and personalized improvement roadmap. Your journey to peak aesthetics starts here.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/scan" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">Scan</Link></li>
                <li><Link href="/results" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">Results</Link></li>
                <li><Link href="/routine" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">Routine</Link></li>
                <li><Link href="/progress" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">Progress</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">About</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">Privacy</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">Terms</a></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Connect</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">Twitter</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#0A84FF] transition-colors text-sm">Discord</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
            <p className="text-gray-400 text-sm">&copy; 2025 LooksMax AI. All rights reserved.</p>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Shield size={14} />
              <span>Your data never leaves your device</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
