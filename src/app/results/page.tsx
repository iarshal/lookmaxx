"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";
import {
  ChevronLeft,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Info,
  User,
  AlertCircle,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import PDFDownloadButton from "@/components/PDFDownloadButton";

/* ─── Shared card style ─── */
const cardStyle = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "saturate(150%) blur(30px)",
  WebkitBackdropFilter: "saturate(150%) blur(30px)",
  border: "0.5px solid rgba(0,0,0,0.06)",
  borderRadius: "1rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0.5px 0 rgba(0,0,0,0.02)",
};

/* ─── Score Ring (SVG animated stroke-dashoffset) ─── */
function ScoreRing({
  score,
  potential,
  tier,
}: {
  score: number;
  potential: number;
  tier: string;
}) {
  const [animated, setAnimated] = useState(false);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 10) * circumference;
  const potentialOffset = circumference - (potential / 10) * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-52 h-52 mx-auto md:mx-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="8"
        />
        {/* Potential ring (light pink) */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#FFB6C1"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? potentialOffset : circumference}
          style={{ transition: "stroke-dashoffset 1.5s ease-out 0.2s" }}
        />
        {/* Current score ring (gradient) */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? scoreOffset : circumference}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF1493" />
            <stop offset="100%" stopColor="#FF69B4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="text-5xl font-black text-gradient-pink"
        >
          {score}
        </motion.p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{tier}</p>
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp size={10} className="text-emerald-400" />
          <p className="text-xs text-emerald-500 font-semibold">
            &rarr; {potential}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Radar Chart wrapper ─── */
function AnimatedRadar({
  data,
}: {
  data: Array<{ trait: string; current: number; potential: number }>;
}) {
  const [animatedData, setAnimatedData] = useState(
    data.map((d) => ({ ...d, current: 0, potential: 0 }))
  );

  useEffect(() => {
    const t = setTimeout(() => setAnimatedData(data), 400);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <div className="w-full max-w-md mx-auto h-72 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={animatedData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis
            dataKey="trait"
            tick={{ fill: "#6B7280", fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Potential"
            dataKey="potential"
            stroke="#FFB6C1"
            fill="#FFB6C1"
            fillOpacity={0.25}
            animationDuration={1200}
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#FF1493"
            fill="#FF1493"
            fillOpacity={0.35}
            animationDuration={1200}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Status badge colours ─── */
function statusBadgeClasses(status: string) {
  if (status === "Excellent")
    return {
      text: "text-emerald-600",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
    };
  if (status === "Good")
    return {
      text: "text-blue-600",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
    };
  return {
    text: "text-orange-600",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.2)",
  };
}

/* ══════════════════════════════════════════════════════════════
   Main Results Page
   ══════════════════════════════════════════════════════════════ */
export default function ResultsPage() {
  const router = useRouter();
  const analysis = useStore((s) => s.latestAnalysis);
  const profile = useStore((s) => s.profile);

  /* ─── Empty state ─── */
  if (!analysis) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: "#F2F2F7" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center px-6"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-inner">
            <AlertCircle size={36} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            No analysis found
          </h2>
          <p className="text-gray-500 max-w-sm leading-relaxed">
            You haven&apos;t completed a facial analysis yet. Scan your face to
            get your personalized results and improvement roadmap.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/scan")}
            className="mt-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white font-bold text-lg shadow-lg"
            style={{ boxShadow: "0 4px 14px rgba(255,20,147,0.3)" }}
          >
            Go to Scan
          </motion.button>
        </motion.div>
      </div>
    );
  }

  /* ─── Full results dashboard ─── */
  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-5 sticky top-0 z-50"
        style={{ background: "rgba(249,249,249,0.78)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left — Back */}
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/scan")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back</span>
          </motion.button>

          {/* Center — Title */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF1493] to-[#FFB6C1] flex items-center justify-center shadow-sm">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-black text-lg">Your Analysis</span>
          </div>

          {/* Right — PDF (compact) + Profile */}
          <div className="flex items-center gap-2">
            <PDFDownloadButton
              analysis={analysis}
              profile={profile}
              variant="compact"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/profile")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              style={{ background: "#F3F4F6" }}
            >
              <User size={16} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Report container (captured by html2canvas for PDF) ── */}
      <div id="report-container">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-6">
          {/* ── Score overview card ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 flex flex-col sm:flex-row items-center gap-8"
            style={cardStyle}
          >
            <div className="flex-shrink-0">
              <ScoreRing
                score={analysis.overallScore}
                potential={analysis.potentialScore}
                tier={analysis.tier}
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-[#FF1493] text-xs font-bold"
                  style={{
                    background: "rgba(255,20,147,0.06)",
                    border: "1px solid rgba(255,20,147,0.15)",
                  }}
                >
                  Current: {analysis.tier}
                </span>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white text-xs font-bold shadow-sm">
                  Potential: {analysis.potentialTier}
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">
                Your Aesthetic Blueprint
              </h2>
              <p className="text-gray-500 leading-relaxed">
                You have strong foundational features. With consistent effort on
                the identified areas, you can realistically reach the{" "}
                <strong className="text-gray-800">
                  {analysis.potentialTier} tier
                </strong>{" "}
                within 6-12 months.
              </p>
              <motion.button
                whileHover={{ scale: 1.03, x: 3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/routine")}
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white font-bold text-sm shadow-md"
                style={{ boxShadow: "0 4px 14px rgba(255,20,147,0.3)" }}
              >
                View My Action Plan <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>

          {/* ── Radar chart card ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8"
            style={cardStyle}
          >
            <h3 className="text-xl font-black mb-1">Feature Breakdown</h3>
            <p className="text-gray-400 text-sm mb-6">
              Pink = Current &middot; Light pink = Potential
            </p>
            <AnimatedRadar data={analysis.radarData} />
          </motion.div>

          {/* ── Detailed trait cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-black mb-4">Detailed Traits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.detailedTraits.map((trait, i) => {
                const badge = statusBadgeClasses(trait.status);
                return (
                  <motion.div
                    key={trait.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i + 0.3 }}
                    whileHover={{
                      y: -2,
                      boxShadow:
                        "0 4px 16px rgba(255,20,147,0.08), 0 1px 3px rgba(0,0,0,0.06)",
                    }}
                    className="p-5 transition-all duration-300"
                    style={{ ...cardStyle, cursor: "default" }}
                  >
                    {/* Top row: name + value + badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{trait.name}</p>
                        <p className="text-2xl font-black text-gradient-pink mt-0.5">
                          {trait.value}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.text}`}
                        style={{
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        {trait.status}
                      </span>
                    </div>

                    {/* Detail text */}
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <Info
                        size={14}
                        className="flex-shrink-0 mt-0.5 text-gray-300"
                      />
                      <p>{trait.detail}</p>
                    </div>

                    {/* Improvement link for improvable traits */}
                    {trait.improvable && (
                      <div
                        className="mt-3 pt-3"
                        style={{ borderTop: "1px solid #F3F4F6" }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push("/routine")}
                          className="text-xs font-bold text-[#FF1493] flex items-center gap-1"
                        >
                          See improvement routine <ArrowRight size={12} />
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Standalone PDF Download button ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <PDFDownloadButton analysis={analysis} profile={profile} />
          </motion.div>

          {/* ── CTA section — pink gradient ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-[#FF1493] to-[#FF69B4] rounded-3xl p-8 md:p-10 text-white text-center shadow-xl"
          >
            <h3 className="text-2xl font-black mb-2">
              Your personalized routine is ready
            </h3>
            <p className="text-pink-100 mb-6">
              Skincare, jawline training, and styling — all tailored to your
              analysis.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/routine")}
              className="px-8 py-3.5 rounded-2xl bg-white text-[#FF1493] font-bold text-lg transition-all duration-300 shadow-lg"
            >
              Start My Routine &rarr;
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
