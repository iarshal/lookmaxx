"use client";

import { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Upload,
  Sparkles,
  TrendingUp,
  User,
  Target,
  Flame,
  Zap,
  Trophy,
  Check,
} from "lucide-react";
import { useStore } from "@/store/useStore";

/* ─── Mock fallback data ─── */
const MOCK_HISTORY = [
  { month: "Jan 2025", score: 6.2, label: "Start" },
  { month: "Feb 2025", score: 6.5, label: "+0.3" },
  { month: "Mar 2025", score: 6.8, label: "+0.3" },
  { month: "Apr 2025", score: 7.1, label: "+0.3" },
  { month: "May 2025", score: 7.4, label: "+0.3" },
  { month: "Jun 2025", score: 7.6, label: "+0.2" },
];

/* ─── Shared card style ─── */
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "saturate(150%) blur(30px)",
  WebkitBackdropFilter: "saturate(150%) blur(30px)",
  border: "0.5px solid rgba(0,0,0,0.06)",
  borderRadius: "1.5rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0.5px 0 rgba(0,0,0,0.02)",
};

/* ─── Before / After Slider ─── */
function BeforeAfterSlider({
  beforeScore,
  afterScore,
}: {
  beforeScore: number;
  afterScore: number;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(
      5,
      Math.min(95, ((clientX - rect.left) / rect.width) * 100)
    );
    setSliderPos(pos);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-col-resize select-none"
      style={{ background: "#F1F5F9" }}
      onMouseMove={(e) => {
        if (isDragging.current) handleMove(e.clientX);
      }}
      onMouseDown={() => {
        isDragging.current = true;
      }}
      onMouseUp={() => {
        isDragging.current = false;
      }}
      onMouseLeave={() => {
        isDragging.current = false;
      }}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchStart={() => {
        isDragging.current = true;
      }}
      onTouchEnd={() => {
        isDragging.current = false;
      }}
    >
      {/* Before side */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center">
          <User size={28} className="text-white" />
        </div>
      </div>

      {/* After side */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <div
          className="w-16 h-16 rounded-full bg-pink-300 flex items-center justify-center"
          style={{ boxShadow: "0 0 20px rgba(255,20,147,0.3)" }}
        >
          <Sparkles size={28} className="text-white" />
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
        style={{
          left: `${sliderPos}%`,
          boxShadow: "0 0 6px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center"
          style={{ boxShadow: "0 2px 10px rgba(255,20,147,0.35)" }}
        >
          <div className="flex items-center gap-0.5">
            <div className="w-1 h-4 bg-[#FF1493] rounded-full" />
            <div className="w-1 h-4 bg-[#FF1493] rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 text-center">
        <span
          className="px-3 py-1.5 rounded-full text-xs font-bold block"
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            color: "white",
          }}
        >
          BEFORE &middot; {beforeScore.toFixed(1)}
        </span>
      </div>
      <div className="absolute bottom-4 right-4 text-center">
        <span
          className="px-3 py-1.5 rounded-full text-xs font-bold block"
          style={{
            background: "rgba(255,20,147,0.75)",
            backdropFilter: "blur(4px)",
            color: "white",
          }}
        >
          AFTER &middot; {afterScore.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ProgressPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisHistory = useStore((s) => s.analysisHistory);
  const latestAnalysis = useStore((s) => s.latestAnalysis);

  /* ── Chart data (zustand history → chart entries, fallback to mock) ── */
  const chartData = useMemo(() => {
    if (analysisHistory.length > 0) {
      return analysisHistory.map((entry, i) => {
        const d = new Date(entry.date);
        const monthStr = d.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        const prev = i > 0 ? analysisHistory[i - 1].score : null;
        const label =
          i === 0
            ? "Start"
            : prev != null
              ? `+${(entry.score - prev).toFixed(1)}`
              : "";
        return { month: monthStr, score: entry.score, label };
      });
    }
    return MOCK_HISTORY;
  }, [analysisHistory]);

  const maxScore = Math.max(...chartData.map((h) => h.score));
  const minFloor = 5.5;

  /* ── Derived scores ── */
  const startingScore = chartData[0].score;
  const latestScore = chartData[chartData.length - 1].score;
  const growth = +(latestScore - startingScore).toFixed(1);

  /* ── Milestones (dynamically computed) ── */
  const milestones = useMemo(() => {
    const hasScans = analysisHistory.length > 0;
    return [
      {
        label: "First Scan",
        icon: "target" as const,
        done: hasScans,
      },
      {
        label: "7-Day Streak",
        icon: "flame" as const,
        done: false,
      },
      {
        label: "Score +0.5",
        icon: "trendingUp" as const,
        done: growth >= 0.5,
      },
      {
        label: "30-Day Streak",
        icon: "zap" as const,
        done: false,
      },
      {
        label: "Reach Score 8.0",
        icon: "trophy" as const,
        done: latestScore >= 8,
      },
    ];
  }, [analysisHistory.length, growth, latestScore]);

  const MILESTONE_ICON_MAP: Record<string, React.ReactNode> = {
    target: <Target size={18} />,
    flame: <Flame size={18} />,
    trendingUp: <TrendingUp size={18} />,
    zap: <Zap size={18} />,
    trophy: <Trophy size={18} />,
  };

  return (
    <div className="min-h-screen" style={{ background: "#F2F2F7" }}>
      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-5 sticky top-0 z-50"
        style={{ background: "rgba(249,249,249,0.78)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/routine")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back</span>
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF1493] to-[#FFB6C1] flex items-center justify-center shadow-sm">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-black text-lg">Progress</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/profile")}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
          >
            <User size={18} />
          </motion.button>
        </div>
      </motion.header>

      {/* ─── Body ─── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Left Column: Chart + Slider + Stats ── */}
          <div className="space-y-6">
            {/* Aesthetic Score Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6"
              style={cardStyle}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black">Aesthetic Score</h3>
                  <p className="text-gray-400 text-sm">
                    {chartData.length > 1
                      ? `Over ${chartData.length} entries`
                      : "Your journey begins"}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                  style={{
                    background:
                      growth >= 0
                        ? "rgba(16,185,129,0.06)"
                        : "rgba(239,68,68,0.06)",
                    border:
                      growth >= 0
                        ? "1px solid rgba(16,185,129,0.15)"
                        : "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <TrendingUp
                    size={14}
                    className={
                      growth >= 0 ? "text-emerald-600" : "text-red-500"
                    }
                  />
                  <span
                    className={`font-bold text-sm ${growth >= 0 ? "text-emerald-700" : "text-red-600"}`}
                  >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(1)} pts
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {chartData.map((entry, i) => {
                  const barHeight = Math.round(
                    ((entry.score - minFloor) / (maxScore - minFloor)) * 100
                  );
                  const isLast = i === chartData.length - 1;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      <p className="text-xs font-bold text-gray-600">
                        {entry.label}
                      </p>
                      <div className="w-full h-28 flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}%` }}
                          transition={{
                            delay: i * 0.08,
                            duration: 0.6,
                            ease: "easeOut",
                          }}
                          className="w-full rounded-lg"
                          style={{
                            background: isLast
                              ? "linear-gradient(to top, #FF1493, #FF69B4)"
                              : `linear-gradient(to top, rgba(255,20,147,${0.12 + i * 0.06}), rgba(255,105,180,${0.18 + i * 0.06}))`,
                            minHeight: "8px",
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {entry.month.split(" ")[0]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Before / After Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6"
              style={cardStyle}
            >
              <h3 className="text-xl font-black mb-1">Visual Comparison</h3>
              <p className="text-gray-400 text-sm mb-5">
                Drag the slider to compare your transformation
              </p>
              <BeforeAfterSlider
                beforeScore={startingScore}
                afterScore={latestScore}
              />

              {/* Stats row */}
              <div className="flex gap-3 mt-4">
                <div
                  className="flex-1 p-3 rounded-xl text-center"
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <p className="text-xs text-gray-400 font-medium">Starting</p>
                  <p className="text-2xl font-black text-gray-700">
                    {startingScore.toFixed(1)}
                  </p>
                </div>
                <div
                  className="flex-1 p-3 rounded-xl text-center"
                  style={{
                    background: "rgba(255,20,147,0.04)",
                    border: "1px solid rgba(255,20,147,0.15)",
                  }}
                >
                  <p className="text-xs text-[#FF1493] font-medium">Current</p>
                  <p className="text-2xl font-black bg-gradient-to-r from-[#FF1493] to-[#FF69B4] bg-clip-text text-transparent">
                    {latestScore.toFixed(1)}
                  </p>
                </div>
                <div
                  className="flex-1 p-3 rounded-xl text-center"
                  style={{
                    background:
                      growth >= 0
                        ? "rgba(16,185,129,0.04)"
                        : "rgba(239,68,68,0.04)",
                    border:
                      growth >= 0
                        ? "1px solid rgba(16,185,129,0.15)"
                        : "1px solid rgba(239,68,68,0.15)",
                  }}
                >
                  <p
                    className={`text-xs font-medium ${growth >= 0 ? "text-emerald-600" : "text-red-500"}`}
                  >
                    Growth
                  </p>
                  <p
                    className={`text-2xl font-black ${growth >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(1)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right Column: Upload + Milestones ── */}
          <div className="space-y-6">
            {/* Upload Progress Photo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6"
              style={cardStyle}
            >
              <h3 className="text-xl font-black mb-1">Upload Progress Photo</h3>
              <p className="text-gray-400 text-sm mb-5">
                Add a new photo to track your latest transformation.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl transition-all duration-300 hover:border-[#FF1493]"
                style={{
                  border: "2px dashed #D1D5DB",
                  background: "rgba(255,20,147,0.01)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,20,147,0.06)" }}
                >
                  <Upload size={22} className="text-[#FF1493]" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-800">
                    Add today&apos;s photo
                  </p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    JPG, PNG &middot; Max 10MB
                  </p>
                </div>
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
              />
            </motion.div>

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6"
              style={cardStyle}
            >
              <h3 className="text-xl font-black mb-5">Milestones</h3>
              <div className="space-y-4">
                {milestones.map((milestone, i) => (
                  <motion.div
                    key={milestone.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.3 }}
                    className="flex items-center gap-4"
                  >
                    {milestone.done ? (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, #FF1493, #FF69B4)",
                          color: "white",
                          boxShadow: "0 2px 8px rgba(255,20,147,0.25)",
                        }}
                      >
                        <Check size={16} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                        {MILESTONE_ICON_MAP[milestone.icon]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-bold ${milestone.done ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {milestone.label}
                      </p>
                    </div>
                    {!milestone.done && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}
                      >
                        Upcoming
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
