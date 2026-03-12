"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import {
  User,
  ChevronLeft,
  Sparkles,
  Target,
  Zap,
  Trophy,
  Flame,
  Scan,
  BarChart3,
  Calendar,
  Trash2,
  ArrowRight,
  Settings,
  Diamond,
  Eye,
  Sprout,
  TrendingUp,
  TrendingDown,
  Minus,
  Sun,
} from "lucide-react";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "saturate(150%) blur(30px)",
  WebkitBackdropFilter: "saturate(150%) blur(30px)",
  border: "0.5px solid rgba(0,0,0,0.06)",
  borderRadius: "1.5rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0.5px 0 rgba(0,0,0,0.02)",
};

const GOALS_MAP: Record<string, { label: string; icon: React.ReactNode; emoji: string }> = {
  jawline: { label: "Sharp Jawline", icon: <Diamond size={16} />, emoji: "💎" },
  skin: { label: "Clear Skin", icon: <Sparkles size={16} />, emoji: "✨" },
  eyes: { label: "Hunter Eyes", icon: <Eye size={16} />, emoji: "👁️" },
  overall: { label: "Overall Glow-Up", icon: <Flame size={16} />, emoji: "🔥" },
};

const COMMITMENT_MAP: Record<string, { label: string; icon: React.ReactNode; emoji: string }> = {
  casual: { label: "Casual — 15 min/day", icon: <Sprout size={16} />, emoji: "🌱" },
  serious: { label: "Serious — 30 min/day", icon: <Zap size={16} />, emoji: "⚡" },
  elite: { label: "Elite Mode — 1+ hour/day", icon: <Trophy size={16} />, emoji: "🏆" },
};

function getTierFromScore(score: number): string {
  if (score >= 9) return "Apex";
  if (score >= 8) return "Elite";
  if (score >= 7) return "Advanced";
  if (score >= 6) return "Rising Star";
  if (score >= 5) return "Foundation";
  return "Starting Out";
}

function getTierColor(score: number): string {
  if (score >= 9) return "#7C3AED";
  if (score >= 8) return "#FF1493";
  if (score >= 7) return "#F59E0B";
  if (score >= 6) return "#3B82F6";
  if (score >= 5) return "#10B981";
  return "#6B7280";
}

function getTierGradient(score: number): string {
  if (score >= 9) return "linear-gradient(135deg, #7C3AED, #A78BFA)";
  if (score >= 8) return "linear-gradient(135deg, #FF1493, #FF69B4)";
  if (score >= 7) return "linear-gradient(135deg, #F59E0B, #FBBF24)";
  if (score >= 6) return "linear-gradient(135deg, #3B82F6, #60A5FA)";
  if (score >= 5) return "linear-gradient(135deg, #10B981, #34D399)";
  return "linear-gradient(135deg, #6B7280, #9CA3AF)";
}

export default function ProfilePage() {
  const router = useRouter();

  // Zustand selectors
  const profile = useStore((s) => s.profile);
  const latestAnalysis = useStore((s) => s.latestAnalysis);
  const analysisHistory = useStore((s) => s.analysisHistory);
  const setProfile = useStore((s) => s.setProfile);
  const clearAllData = useStore((s) => s.clearAllData);

  const [confirmClear, setConfirmClear] = useState(false);
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender);

  const handleNameChange = (val: string) => {
    setName(val);
    setProfile({ name: val });
  };

  const handleAgeChange = (val: string) => {
    setAge(val);
    setProfile({ age: val });
  };

  const handleGenderChange = (val: string) => {
    setGender(val);
    setProfile({ gender: val });
  };

  const handleClearData = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAllData();
    setName("");
    setAge("");
    setGender("");
    setConfirmClear(false);
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-[#FF1493] focus:ring-2 focus:ring-pink-100 outline-none transition-all text-gray-900 text-sm font-medium";

  // Derive last scan info from analysis
  const lastEntry = analysisHistory.length > 0 ? analysisHistory[analysisHistory.length - 1] : null;

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-5 sticky top-0 z-50"
        style={{ background: "rgba(249,249,249,0.78)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back</span>
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF1493] to-[#FFB6C1] flex items-center justify-center shadow-sm">
              <Settings size={14} className="text-white" />
            </div>
            <span className="font-black text-lg">Profile & Settings</span>
          </div>
          <div className="w-20" />
        </div>
      </motion.header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6"
          style={cardStyle}
        >
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #FF1493, #FF69B4)",
                boxShadow: "0 4px 16px rgba(255,20,147,0.3)",
              }}
            >
              <User size={32} className="text-white" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Your Profile</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  className={inputClass}
                  min="13"
                  max="99"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => handleGenderChange(e.target.value)}
                  className={`${inputClass} appearance-none bg-white cursor-pointer`}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Aesthetic Tier Card */}
        {latestAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 overflow-hidden relative"
            style={cardStyle}
          >
            {/* Background glow */}
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-3xl"
              style={{ background: getTierColor(latestAnalysis.overallScore) }}
            />

            <div className="flex items-center gap-2 mb-5">
              <Trophy size={18} className="text-[#FF1493]" />
              <h3 className="font-black text-lg text-gray-900">Aesthetic Tier</h3>
            </div>

            <div className="flex flex-col items-center text-center mb-6">
              {/* Tier Badge */}
              <div
                className="px-5 py-2 rounded-full text-white font-black text-sm uppercase tracking-wider mb-4 shadow-lg"
                style={{
                  background: getTierGradient(latestAnalysis.overallScore),
                  boxShadow: `0 4px 16px ${getTierColor(latestAnalysis.overallScore)}40`,
                }}
              >
                {getTierFromScore(latestAnalysis.overallScore)}
              </div>

              {/* Overall Score */}
              <div className="mb-2">
                <span
                  className="text-5xl font-black"
                  style={{ color: getTierColor(latestAnalysis.overallScore) }}
                >
                  {latestAnalysis.overallScore.toFixed(1)}
                </span>
                <span className="text-lg text-gray-400 font-bold ml-1">/10</span>
              </div>

              {/* Potential Score */}
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-sm text-gray-500 font-medium">
                  Potential:{" "}
                  <span className="font-bold text-amber-500">
                    {latestAnalysis.potentialScore.toFixed(1)}
                  </span>
                </span>
              </div>

              {/* Last Scan Date */}
              {lastEntry && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>
                    Last scan:{" "}
                    {new Date(lastEntry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/scan")}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm shadow-lg"
              style={{
                background: "linear-gradient(135deg, #FF1493, #FF69B4)",
                boxShadow: "0 4px 14px rgba(255,20,147,0.3)",
              }}
            >
              <Scan size={16} /> Rescan
            </motion.button>
          </motion.div>
        )}

        {/* Scan History */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-6"
          style={cardStyle}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={18} className="text-[#FF1493]" />
            <h3 className="font-black text-lg text-gray-900">Scan History</h3>
          </div>

          {analysisHistory.length === 0 ? (
            <div className="text-center py-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#F3F4F6" }}
              >
                <Scan size={24} className="text-gray-400" />
              </div>
              <p className="font-bold text-gray-700 mb-1">No analyses yet</p>
              <p className="text-sm text-gray-400 mb-4">Complete your first scan to start tracking.</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/scan")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white font-bold text-sm shadow-md"
                style={{ boxShadow: "0 4px 14px rgba(255,20,147,0.3)" }}
              >
                <Scan size={16} /> Start First Scan
              </motion.button>
            </div>
          ) : (
            <div className="space-y-2">
              {analysisHistory
                .slice()
                .reverse()
                .map((entry, i, reversed) => {
                  const date = new Date(entry.date);
                  const formattedDate = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const tier = getTierFromScore(entry.score);
                  const tierColor = getTierColor(entry.score);

                  // Trend: compare with the entry that came before this one chronologically
                  // reversed[i] is the current entry; reversed[i+1] is the previous one chronologically
                  const prevEntry = reversed[i + 1];
                  let trendIcon = <Minus size={14} className="text-gray-300" />;
                  if (prevEntry) {
                    if (entry.score > prevEntry.score) {
                      trendIcon = <TrendingUp size={14} className="text-emerald-500" />;
                    } else if (entry.score < prevEntry.score) {
                      trendIcon = <TrendingDown size={14} className="text-red-400" />;
                    }
                  }

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 hover:bg-gray-50"
                      style={{ border: "1px solid #F3F4F6" }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${tierColor}10` }}
                      >
                        <Calendar size={16} style={{ color: tierColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{formattedDate}</p>
                        <p className="text-xs font-semibold" style={{ color: tierColor }}>
                          {tier}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {trendIcon}
                        <p className="text-lg font-black" style={{ color: tierColor }}>
                          {entry.score.toFixed(1)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </motion.div>

        {/* Goals & Commitment Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-6"
          style={cardStyle}
        >
          <div className="flex items-center gap-2 mb-5">
            <Target size={18} className="text-[#FF1493]" />
            <h3 className="font-black text-lg text-gray-900">Goals & Commitment</h3>
          </div>

          <div className="space-y-3">
            {/* Current Goal */}
            <div
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: "#FFF5F8", border: "1px solid #FBCFE8" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,20,147,0.1)" }}
              >
                {profile.goal && GOALS_MAP[profile.goal] ? (
                  <span className="text-lg">{GOALS_MAP[profile.goal].emoji}</span>
                ) : (
                  <Target size={18} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Current Goal</p>
                <p className="font-bold text-gray-900">
                  {profile.goal && GOALS_MAP[profile.goal]
                    ? GOALS_MAP[profile.goal].label
                    : "Not set"}
                </p>
              </div>
            </div>

            {/* Current Commitment */}
            <div
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,20,147,0.06)" }}
              >
                {profile.commitment && COMMITMENT_MAP[profile.commitment] ? (
                  <span className="text-lg">{COMMITMENT_MAP[profile.commitment].emoji}</span>
                ) : (
                  <Zap size={18} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Commitment Level</p>
                <p className="font-bold text-gray-900">
                  {profile.commitment && COMMITMENT_MAP[profile.commitment]
                    ? COMMITMENT_MAP[profile.commitment].label
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/")}
            className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[#FF1493] font-bold text-sm transition-all duration-200"
            style={{ background: "rgba(255,20,147,0.06)", border: "1px solid rgba(255,20,147,0.15)" }}
          >
            Change Goal <ArrowRight size={14} />
          </motion.button>
        </motion.div>

        {/* App Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="p-6"
          style={cardStyle}
        >
          <div className="flex items-center gap-2 mb-5">
            <Settings size={18} className="text-[#FF1493]" />
            <h3 className="font-black text-lg text-gray-900">App Settings</h3>
          </div>

          <div className="space-y-4">
            {/* Theme Toggle (visual only) */}
            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,20,147,0.06)" }}
                >
                  <Sun size={16} className="text-[#FF1493]" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">Theme</p>
                  <p className="text-xs text-gray-400">Light Mode</p>
                </div>
              </div>
              <div
                className="w-12 h-7 rounded-full relative cursor-default"
                style={{ background: "linear-gradient(135deg, #FF1493, #FF69B4)" }}
              >
                <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            {/* Clear All Data */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleClearData}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                confirmClear
                  ? "bg-red-500 text-white shadow-md"
                  : "text-red-500 hover:bg-red-50"
              }`}
              style={
                confirmClear
                  ? { boxShadow: "0 4px 14px rgba(239,68,68,0.3)" }
                  : { background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }
              }
            >
              <Trash2 size={16} />
              {confirmClear ? "Are you sure? Tap again to confirm" : "Clear All Data"}
            </motion.button>
            {confirmClear && (
              <motion.button
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setConfirmClear(false)}
                className="w-full text-center text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
              >
                Cancel
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Quick Links Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="p-6"
          style={cardStyle}
        >
          <div className="flex items-center gap-2 mb-5">
            <Zap size={18} className="text-[#FF1493]" />
            <h3 className="font-black text-lg text-gray-900">Quick Links</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New Scan", href: "/scan", icon: <Scan size={20} />, gradient: true },
              { label: "View Results", href: "/results", icon: <BarChart3 size={20} />, gradient: false },
              { label: "My Routine", href: "/routine", icon: <Flame size={20} />, gradient: false },
              { label: "Progress", href: "/progress", icon: <Trophy size={20} />, gradient: false },
            ].map((link, i) => (
              <motion.button
                key={link.href}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(link.href)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  link.gradient
                    ? "bg-gradient-to-br from-[#FF1493] to-[#FF69B4] text-white shadow-lg"
                    : "text-gray-700 hover:shadow-md"
                }`}
                style={
                  link.gradient
                    ? { boxShadow: "0 4px 16px rgba(255,20,147,0.3)" }
                    : { background: "white", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
                }
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    link.gradient ? "bg-white/20" : ""
                  }`}
                  style={!link.gradient ? { background: "rgba(255,20,147,0.06)" } : undefined}
                >
                  <span className={link.gradient ? "text-white" : "text-[#FF1493]"}>{link.icon}</span>
                </div>
                {link.label}
                <ArrowRight size={14} className={link.gradient ? "text-pink-200" : "text-gray-300"} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
