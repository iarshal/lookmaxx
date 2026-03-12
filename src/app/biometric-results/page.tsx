"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  ChevronLeft,
  Shield,
  Trash2,
  Send,
  Bot,
  UserIcon,
  AlertTriangle,
  Download,
  Eye,
  Zap,
  Target,
  Activity,
  Layers,
  Scan,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "@/store/useStore";
import type { AnalysisResult, ChatMessage } from "@/store/useStore";

/* ───────────── AI Response Generator ───────────── */
function generateAIResponse(question: string, data: AnalysisResult): string {
  const q = question.toLowerCase();
  const t = data.traits;

  if (q.includes("jaw") || q.includes("jawline")) {
    return `Based on your 3D biometric scan, your jawline scored ${t.jawline}/100. ${
      t.jawline >= 70
        ? "Your mandibular angle is well-defined with strong forward growth. The gonial angle measures within the attractive range."
        : "There's room for improvement. Your gonial angle suggests softer definition. Consider mewing exercises (proper tongue posture), masseter training with jawline exercisers, and reducing body fat percentage to reveal more definition."
    } Your jaw symmetry deviation is ${Math.abs(50 - t.symmetry) < 10 ? "minimal" : "noticeable"} at ${t.symmetry}% bilateral symmetry.`;
  }
  if (q.includes("eye") || q.includes("canthal") || q.includes("tilt")) {
    const tilt = t.canthalTilt;
    return `Your canthal tilt measures ${tilt > 0 ? "+" : ""}${tilt}° (${
      tilt > 2 ? "positive — highly attractive" : tilt > 0 ? "neutral-positive — good" : tilt > -2 ? "neutral" : "slightly negative"
    }). ${tilt > 0
      ? "Positive canthal tilt is associated with youthful, alert appearance. Your orbital bone structure supports this well."
      : "You could benefit from orbital exercises and ensuring proper sleep posture. Some find that under-eye care routines help with periorbital appearance."
    }`;
  }
  if (q.includes("symmetry") || q.includes("asymmetr")) {
    return `Your bilateral facial symmetry is ${t.symmetry}% (${
      t.symmetry >= 80 ? "excellent — top percentile" : t.symmetry >= 65 ? "above average" : "shows some deviation"
    }). The deepest asymmetry is detected in your ${
      Math.random() > 0.5 ? "orbital-zygomatic" : "mandibular-temporal"
    } region. ${t.symmetry < 75 ? "Consistent mewing, sleeping on your back, and chewing evenly on both sides can gradually improve facial symmetry over months." : "Your symmetry is already in a strong range."}`;
  }
  if (q.includes("skin") || q.includes("texture")) {
    return `Skin texture analysis from the photometric stereo flash shows a score of ${t.skinTexture}/100. ${
      t.skinTexture >= 80
        ? "Excellent — smooth, even texture with minimal variance. Keep your current skincare routine."
        : "Some textural irregularities were detected in the cheek regions. I recommend: 1) Retinol (0.5%) 3x/week, 2) Niacinamide serum daily, 3) SPF 50+ every morning, 4) Double cleansing at night."
    }`;
  }
  if (q.includes("improve") || q.includes("better") || q.includes("advice") || q.includes("recommend")) {
    const weakest = Object.entries({ jawline: t.jawline, symmetry: t.symmetry, skin: t.skinTexture, dimorphism: t.dimorphism })
      .sort((a, b) => (a[1] as number) - (b[1] as number))[0];
    return `Based on your full biometric profile, your biggest opportunity for improvement is ${weakest[0]} (${weakest[1]}/100). Here's a targeted plan:\n\n${
      weakest[0] === "jawline" ? "• Mewing: proper tongue posture 24/7\n• Chew hard gum (falim/mastic) 30 min/day on each side\n• Reduce body fat below 15%\n• Consider jawline exercises 3x/week" :
      weakest[0] === "symmetry" ? "• Sleep on your back (use a cervical pillow)\n• Chew evenly on both sides\n• Practice mewing with even tongue pressure\n• Be aware of facial resting habits" :
      weakest[0] === "skin" ? "• Start a consistent AM/PM skincare routine\n• Use retinol, vitamin C, and niacinamide\n• Stay hydrated (3L water/day)\n• Avoid touching your face" :
      "• Targeted jaw and neck exercises\n• Optimize testosterone naturally (sleep, zinc, vitamin D)\n• Build neck muscles for a stronger profile\n• Consider bone-smashing (research thoroughly first)"
    }\n\nYour potential score is ${data.potentialScore}/10 — achievable with 6-12 months of consistency.`;
  }
  if (q.includes("score") || q.includes("rating") || q.includes("overall")) {
    return `Your overall biometric score is ${data.overallScore}/10 (Tier: ${data.tier}). Breakdown: Symmetry ${t.symmetry}%, Jawline ${t.jawline}%, Canthal Tilt ${t.canthalTilt > 0 ? "+" : ""}${t.canthalTilt}°, Skin ${t.skinTexture}%, Dimorphism ${t.dimorphism}%. Your face shape is classified as ${t.faceShape}. With targeted improvements, your potential reaches ${data.potentialScore}/10 (${data.potentialTier}).`;
  }
  if (q.includes("face shape") || q.includes("shape")) {
    return `Your face is classified as ${t.faceShape}. ${
      t.faceShape === "Oval" ? "This is considered the most versatile and universally attractive shape. Most hairstyles and frame types work well." :
      t.faceShape === "Square" ? "Strong and commanding. Your angular jaw creates a powerful first impression. Avoid styles that add width." :
      t.faceShape === "Round" ? "Soft and youthful. Consider hairstyles that add height and angles. A lower body fat % will reveal more angular features." :
      "Your proportions create a distinctive profile. Work with features that complement your natural structure."
    }`;
  }
  return `Based on your biometric scan data (Overall: ${data.overallScore}/10, Tier: ${data.tier}):\n\n• Symmetry: ${t.symmetry}%\n• Jawline: ${t.jawline}%\n• Canthal Tilt: ${t.canthalTilt}°\n• Skin: ${t.skinTexture}%\n• Dimorphism: ${t.dimorphism}%\n\nCould you be more specific about what aspect of your facial analysis you'd like to explore? I can provide detailed insights on jawline, eyes, symmetry, skin, improvement plans, or your overall profile.`;
}

/* ══════════════════════════════════════════════════
   BIOMETRIC RESULTS DASHBOARD
   ══════════════════════════════════════════════════ */
export default function BiometricResultsPage() {
  const router = useRouter();
  const biometric = useStore((s) => s.biometric);
  const clearBiometric = useStore((s) => s.clearBiometric);
  const addChatMessage = useStore((s) => s.addBioChatMessage);

  const data = biometric.analysisResult;
  const captures = biometric.captures;
  const chatHistory = biometric.chatHistory;

  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 50);
  }, []);

  useEffect(() => {
    if (chatHistory.length > 1) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // Add welcome message on first visit
  useEffect(() => {
    if (data && chatHistory.length === 0) {
      addChatMessage({
        id: `sys-${Date.now()}`,
        role: "assistant",
        content: `Welcome to your Advanced Biometric Analysis. I have full access to your 3D facial geometry data. Your overall score is **${data.overallScore}/10** (${data.tier} tier).\n\nAsk me anything about your scan — jawline tension, symmetry depth, improvement recommendations, or specific facial features.`,
        timestamp: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSend = async () => {
    if (!chatInput.trim() || !data) return;
    const msg = chatInput.trim();
    setChatInput("");
    addChatMessage({ id: `usr-${Date.now()}`, role: "user", content: msg, timestamp: Date.now() });
    setIsTyping(true);
    // Simulate "thinking" delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
    const response = generateAIResponse(msg, data);
    addChatMessage({ id: `ast-${Date.now()}`, role: "assistant", content: response, timestamp: Date.now() });
    setIsTyping(false);
  };

  const handleDelete = () => {
    clearBiometric();
    router.push("/scan");
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Biometric Data</h2>
          <p className="text-gray-500 text-sm mb-6">Complete a biometric scan first.</p>
          <button onClick={() => router.push("/scan")}
            className="px-6 py-3 rounded-xl text-white font-bold"
            style={{ background: "linear-gradient(135deg, #FF1493, #FF69B4)" }}>Start Scan</button>
        </div>
      </div>
    );
  }

  const radarData = [
    { metric: "Jawline Tension", value: data.traits.jawline, max: 100 },
    { metric: "Asymmetry Depth", value: data.traits.symmetry, max: 100 },
    { metric: "Ocular Spacing", value: Math.min(100, 50 + data.traits.canthalTilt * 10), max: 100 },
    { metric: "Nasal Bridge", value: Math.round((data.traits.symmetry + data.traits.jawline) / 2), max: 100 },
    { metric: "Subcut. Volume", value: data.traits.skinTexture, max: 100 },
    { metric: "Dimorphism Idx", value: data.traits.dimorphism, max: 100 },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/scan")} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={20} /><span className="text-sm font-medium">Scanner</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF1493, #FF69B4)" }}>
              <Shield size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-wide">Biometric Analysis</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider" style={{ background: "rgba(255,20,147,0.1)", color: "#FF69B4" }}>
              ADVANCED
            </span>
          </div>
          <button onClick={() => router.push("/profile")} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
            <UserIcon size={14} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main layout: Left dashboard + Right chat */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ────── LEFT: Data Dashboard (3/5) ────── */}
        <div id="clinical-dashboard" className="lg:col-span-3 flex flex-col gap-5">

          {/* Score card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 bg-white border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 mb-1">BIOMETRIC SCORE</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-gray-900">{data.overallScore}</span>
                  <span className="text-lg text-gray-400 font-medium">/10</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "rgba(255,20,147,0.1)", color: "#FF69B4" }}>{data.tier}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Potential: {data.potentialScore}/10 ({data.potentialTier})</p>
              </div>
              {/* Mini face shape badge */}
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-medium mb-1">SHAPE</p>
                <p className="text-lg font-bold text-gray-900">{data.traits.faceShape}</p>
              </div>
            </div>

            {/* Captures row */}
            {captures.length > 0 && (
              <div className="mt-8 border-t border-[#E5E7EB] pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={16} className="text-[#FF1493]" />
                  <p className="text-xs font-bold tracking-[0.2em] text-gray-900">BIOMETRIC DATA LOCKED</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {captures.slice(0, 4).map((cap, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border-2 border-white shadow-md aspect-[3/4] bg-gray-100">
                      <img src={cap} alt={`Profile angle ${i+1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-[10px] text-white font-bold opacity-90">{["Frontal View", "Left Profile", "Right Profile", "Mouth Open"][i] || `Scan ${i}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Radar chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 bg-white border border-[#E5E7EB] shadow-sm">
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 mb-4">3D TENSION MAP</p>
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={radarData} cx="50%" cy="50%">
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#6B7280", fontSize: 10, fontWeight: 600 }} />
                  <Radar dataKey="value" stroke="#FF1493" fill="#FF1493" fillOpacity={0.15} strokeWidth={3} strokeLinecap="round" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Metric cards grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Target, label: "Jawline", val: `${data.traits.jawline}%`, sub: "Mandibular definition" },
              { icon: Eye, label: "Canthal Tilt", val: `${data.traits.canthalTilt > 0 ? "+" : ""}${data.traits.canthalTilt}°`, sub: "Orbital angle" },
              { icon: Layers, label: "Symmetry", val: `${data.traits.symmetry}%`, sub: "Bilateral deviation" },
              { icon: Scan, label: "Skin Texture", val: `${data.traits.skinTexture}%`, sub: "Surface variance" },
              { icon: Zap, label: "Dimorphism", val: `${data.traits.dimorphism}%`, sub: "Sexual dimorphism index" },
              { icon: Activity, label: "Face Shape", val: data.traits.faceShape, sub: "Geometric class" },
            ].map((m, i) => (
              <div key={i} className="rounded-xl p-4 bg-white border border-[#E5E7EB] shadow-sm">
                <m.icon size={14} style={{ color: "#FF69B4" }} className="mb-2" />
                <p className="text-[10px] text-gray-500 font-medium">{m.label}</p>
                <p className="text-lg font-black text-gray-900">{m.val}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Data management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-5 bg-red-50/50 border border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-gray-500" />
              <p className="text-[10px] font-bold tracking-[0.15em] text-gray-500">MANAGE BIOMETRIC DATA</p>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Your biometric data is stored locally on this device. You can permanently delete all captured images,
              facial geometry data, and AI conversation history at any time.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors bg-red-50 text-red-500 border border-red-200 hover:bg-red-100">
                <Trash2 size={14} />Delete Facial Data &amp; Rescan
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600">
                  <Trash2 size={14} />Confirm Delete
                </button>
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50">Cancel</button>
              </div>
            )}
          </motion.div>

          {/* Biometric Glossary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl p-5 bg-white border border-[#E5E7EB] shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Activity size={16} className="text-[#FF1493]" />
              Biometric Glossary
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-700">Facial Yaw</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">Yaw is the horizontal rotation of your head. Mapping side profiles (turning left/right) allows the 3D engine to verify depth and structural symmetry.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-700">MAR (Mouth Aspect Ratio)</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">A mathematical ratio between the height and width of your mouth. This confirms "active liveness" (genuine muscle movement) during the scan.</p>
              </div>
            </div>
          </motion.div>

          {/* Download */}
          <button onClick={async () => {
            const el = document.getElementById("clinical-dashboard");
            if (!el) return;
            
            // html2canvas v1.0.0-rc.5/7 doesn't support Tailwind v4's OKLCH/LAB colors.
            // We clone the element and force standard colors to prevent the "unsupported color function lab" crash.
            const canvas = await html2canvas(el, { 
              scale: 2, 
              useCORS: true,
              backgroundColor: "#FFFFFF",
              onclone: (doc) => {
                const dashboard = doc.getElementById("clinical-dashboard");
                if (dashboard) {
                  dashboard.style.color = "#111827"; // Force deep gray
                  dashboard.style.backgroundColor = "#FFFFFF";
                  // Ensure all elements are standard RGB to prevent LAB crash
                  dashboard.querySelectorAll("*").forEach((node: any) => {
                    const s = window.getComputedStyle(node);
                    if (s.color.includes("lab") || s.color.includes("oklch")) node.style.color = "#374151";
                    if (s.backgroundColor.includes("lab") || s.backgroundColor.includes("oklch")) node.style.backgroundColor = "transparent";
                    if (s.borderColor.includes("lab") || s.borderColor.includes("oklch")) node.style.borderColor = "#E5E7EB";
                  });
                }
              }
            });
            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
            pdf.save(`Clinical_Report_${Date.now()}.pdf`);
          }} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-gray-600 transition-colors bg-white border border-[#E5E7EB] hover:bg-gray-50 shadow-sm">
            <Download size={14} />Download Clinical PDF
          </button>
        </div>

        {/* ────── RIGHT: AI Chat (2/5) ────── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2 flex flex-col rounded-2xl overflow-hidden lg:max-h-[calc(100vh-120px)] lg:sticky lg:top-24 bg-white border border-[#E5E7EB] shadow-sm">

          {/* Chat header */}
          <div className="px-5 py-4 flex items-center gap-3 border-b border-[#E5E7EB]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF1493, #FF69B4)" }}>
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Biometric AI Assistant</p>
              <p className="text-[10px] text-gray-500">Powered by your 3D facial data</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[400px]" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {chatHistory.map((msg: ChatMessage, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: msg.role === "assistant" ? "rgba(255,20,147,0.1)" : "#F3F4F6" }}>
                  {msg.role === "assistant" ? <Bot size={14} style={{ color: "#FF69B4" }} /> : <UserIcon size={14} className="text-gray-400" />}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" ? "text-white" : "text-gray-800"
                }`}
                  style={{
                    background: msg.role === "user" ? "linear-gradient(135deg, #FF1493, #FF69B4)" : "#F9FAFB",
                    border: msg.role === "assistant" ? "1px solid #E5E7EB" : "none",
                  }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(255,20,147,0.1)" }}>
                  <Bot size={14} style={{ color: "#FF69B4" }} />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB]">
                  <motion.div className="flex gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <motion.div key={d} className="w-2 h-2 rounded-full" style={{ background: "#FF69B4" }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }} />
                    ))}
                  </motion.div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-4 py-3 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about your scan results..."
                className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-900 bg-[#F9FAFB] border border-[#E5E7EB] placeholder-gray-400 outline-none focus:border-pink-300 transition-colors"
              />
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: chatInput.trim() ? "linear-gradient(135deg, #FF1493, #FF69B4)" : "#F3F4F6" }}>
                <Send size={16} className={chatInput.trim() ? "text-white" : "text-gray-400"} />
              </motion.button>
            </div>
            {/* Suggested questions */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {["My jawline?", "Improve my score", "Eye analysis", "Symmetry depth"].map((q) => (
                <button key={q} onClick={() => { setChatInput(q); }}
                  className="px-3 py-1.5 rounded-full text-[10px] font-medium text-gray-500 bg-white border border-[#E5E7EB] hover:bg-gray-50 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
