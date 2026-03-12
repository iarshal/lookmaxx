"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, ChatMessage } from "@/store/useStore";
import {
  ChevronLeft,
  Sparkles,
  Trash2,
  Send,
  ShieldCheck,
  ScanFace,
  Activity,
  User,
  Zap,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";

export default function AdvancedResultsPage() {
  const router = useRouter();
  const { biometric, addBioChatMessage, clearBiometric } = useStore();
  const { captures: biometricCaptures, analysisResult: biometricAnalysis, chatHistory: bioChatHistory } = biometric;

  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If no data, redirect to scan
    if (!biometricCaptures.length || !biometricAnalysis) {
      router.push("/scan?mode=biometric");
      return;
    }
  }, [biometricCaptures, biometricAnalysis, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bioChatHistory]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // User message
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: chatInput.trim(), timestamp: Date.now() };
    addBioChatMessage(userMsg);
    setChatInput("");

    // Simulate AI response aware of the Biometric Profile
    setTimeout(() => {
      const overallScore = biometricAnalysis?.overallScore || 0;
      const metricsList = biometricAnalysis?.detailedTraits.map(t => `${t.name}: ${t.value}`).join(", ");
      const promptContext = `Based on your advanced bio-scan (Overall Score: ${overallScore}/10 | ${metricsList})...`;

      let aiResp = "I see your facial structure points here. ";
      
      const lowerReq = userMsg.content.toLowerCase();
      if (lowerReq.includes("improve") || lowerReq.includes("advice")) {
        aiResp += `With a ${biometricAnalysis?.detailedTraits[0]?.name} score of ${biometricAnalysis?.detailedTraits[0]?.value}, you have strong foundational geometry. We recommend continuing your current lookmaxxing routine.`;
      } else if (lowerReq.includes("score")) {
        aiResp += `Your overall aesthetic dimorphism score is an impressive ${overallScore}/10.`;
      } else {
        aiResp += `My memory banks hold your 3 liveness captures. ${promptContext} How can I assist further?`;
      }

      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: aiResp, timestamp: Date.now() };
      addBioChatMessage(aiMsg);
    }, 1000);
  };

  const handleDeleteData = () => {
    clearBiometric();
    setTimeout(() => {
      router.push("/scan?mode=biometric");
    }, 100);
  };

  if (!biometricCaptures.length || !biometricAnalysis) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Loading...</div>;
  }

  // Radar Data Map
  const radarData = biometricAnalysis.radarData.map((m: { trait: string; current: number }) => ({
    subject: m.trait,
    A: m.current,
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans selection:bg-[#FF1493] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/profile")} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft size={20} />
            <span className="font-semibold">Dashboard</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF1493] to-[#FF69B4] flex items-center justify-center shadow-lg shadow-pink-500/20">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">Biometric <span className="text-[#FF1493]">Report</span></span>
          </div>

          <button onClick={handleDeleteData} className="px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-sm flex items-center gap-2">
            <Trash2 size={16} /> <span className="hidden sm:inline">Delete Data</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Bento Box Stats */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Top Stat Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Overall Score */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Activity size={100} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Aesthetic Dimorphism</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">{biometricAnalysis.overallScore.toFixed(1)}</span>
                  <span className="text-xl font-bold text-slate-400">/ 10</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">Verified Liveness</span>
                </div>
              </motion.div>

              {/* Radar Chart */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-slate-400 self-start uppercase tracking-widest mb-2">Structure Map</p>
                <div className="w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#F1F5F9" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="User" dataKey="A" stroke="#FF1493" fill="#FF69B4" fillOpacity={0.3} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Middle Row: Captured Frames */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <ScanFace size={18} className="text-[#FF1493]" />
                <h3 className="font-bold text-slate-900">Encrypted Liveness Captures</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {biometricCaptures.slice(0, 3).map((cap: string, i: number) => (
                  <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-50">
                    <img src={cap} alt={`Capture ${i+1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-3">
                      <p className="text-white text-xs font-bold">Phase {i+1}</p>
                      <p className="text-pink-300 text-[10px] font-medium">{["Neutral", "Blink", "Mouth-Open"][i]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bottom Row: Detailed Metrics List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Zap size={18} className="text-orange-500" /> Granular Analysis</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {biometricAnalysis.detailedTraits.map((t, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-slate-700">{t.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.detail}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900">{t.value}</span>
                      <span className="text-xs font-bold text-slate-400">/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: Memory AI Coach */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="lg:col-span-5 flex flex-col h-[800px] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 bg-[#FAFAFA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF1493] to-[#FF69B4] flex items-center justify-center shadow-md">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-lg">Memory AI Coach</h2>
                  <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online & Aware
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                I have full access to your biometric memory map. I can analyze your specific facial vectors, recommend looksmaxxing routines, and explain your exact score breakdown.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/50">
              {bioChatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center mb-4 border border-pink-100">
                    <User size={24} className="text-[#FF1493]" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Ask me anything</h3>
                  <p className="text-sm text-slate-500 max-w-[250px]">
                    "Why is my jawline score 85?" or "How can I improve my facial symmetry based on the scan?"
                  </p>
                </div>
              )}
              {bioChatHistory.map((msg: ChatMessage) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl ${
                    msg.role === "user" 
                      ? "bg-slate-900 text-white rounded-br-sm" 
                      : "bg-[#FAFAFA] border border-slate-100 text-slate-800 rounded-bl-sm"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="relative">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your AI Coach..."
                  className="w-full bg-[#FAFAFA] border border-slate-200 rounded-2xl py-4 pl-4 pr-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF1493]/20 focus:border-[#FF1493]/30 transition-all placeholder-slate-400"
                />
                <button type="submit" disabled={!chatInput.trim()}
                  className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-[#FF1493] text-white flex items-center justify-center shadow-md disabled:bg-slate-200 disabled:shadow-none transition-colors">
                  <Send size={16} className="ml-0.5" />
                </button>
              </form>
            </div>

          </motion.div>

        </div>
      </main>
    </div>
  );
}
