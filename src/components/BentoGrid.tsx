"use client";

import { motion } from "framer-motion";
import {
  ScanFace,
  Brain,
  BarChart3,
  Sparkles,
  Target,
  Ruler,
  Palette,
  TrendingUp,
} from "lucide-react";

const BENTO_ITEMS = [
  {
    title: "68-Point Landmark Detection",
    desc: "Maps every contour of your face with surgical precision — eyes, jawline, cheekbones, and more.",
    icon: <ScanFace size={22} />,
    span: "md:col-span-2",
    iconGradient: "from-[#FF1493] to-[#FF69B4]",
    bgAccent: "#FFF0F6",
    accentColor: "#FF1493",
    image: (
      <svg viewBox="0 0 240 120" className="w-full h-28 mt-2">
        <defs>
          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF1493" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFB6C1" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="58" rx="42" ry="52" fill="url(#faceGrad)" stroke="#FF1493" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        {/* Eyes */}
        <ellipse cx="105" cy="44" rx="8" ry="4.5" fill="none" stroke="#FF69B4" strokeWidth="1.2" opacity="0.7" />
        <ellipse cx="135" cy="44" rx="8" ry="4.5" fill="none" stroke="#FF69B4" strokeWidth="1.2" opacity="0.7" />
        <circle cx="105" cy="44" r="2" fill="#FF1493" opacity="0.5" />
        <circle cx="135" cy="44" r="2" fill="#FF1493" opacity="0.5" />
        {/* Nose */}
        <path d="M120 50 L116 64 L124 64" fill="none" stroke="#FFB6C1" strokeWidth="1" opacity="0.6" />
        {/* Mouth */}
        <path d="M110 74 Q120 80 130 74" fill="none" stroke="#FF69B4" strokeWidth="1.2" opacity="0.5" />
        {/* Landmarks dots */}
        {[
          [78,58],[82,70],[88,80],[96,86],[104,90],[112,92],[120,93],[128,92],[136,90],[144,86],[152,80],[158,70],[162,58],
          [96,36],[102,34],[108,33],[114,35],[126,35],[132,33],[138,34],[144,36],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2" fill="#FF1493" opacity={0.3 + (i % 3) * 0.15} />
        ))}
        {/* Connection lines */}
        <path d="M78,58 Q88,80 120,93 Q152,80 162,58" fill="none" stroke="#FFB6C1" strokeWidth="0.7" opacity="0.3" />
      </svg>
    ),
  },
  {
    title: "Symmetry Analysis",
    desc: "Bilateral comparison of facial features for harmonic balance.",
    icon: <Ruler size={22} />,
    span: "",
    iconGradient: "from-blue-500 to-cyan-400",
    bgAccent: "#E6F4FF",
    accentColor: "#3B82F6",
    image: (
      <svg viewBox="0 0 120 90" className="w-full h-20 mt-2">
        <defs>
          <linearGradient id="symGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect x="10" y="5" width="100" height="80" rx="12" fill="url(#symGrad)" />
        <line x1="60" y1="10" x2="60" y2="80" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
        <circle cx="42" cy="35" r="6" fill="none" stroke="#3B82F6" strokeWidth="1.2" opacity="0.6" />
        <circle cx="78" cy="35" r="6" fill="none" stroke="#06B6D4" strokeWidth="1.2" opacity="0.6" />
        <path d="M35 60 Q60 68 85 60" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.4" />
        <circle cx="42" cy="35" r="2" fill="#3B82F6" opacity="0.4" />
        <circle cx="78" cy="35" r="2" fill="#06B6D4" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: "Skin Texture",
    desc: "Pixel-level variance analysis of skin smoothness and clarity.",
    icon: <Palette size={22} />,
    span: "",
    iconGradient: "from-amber-400 to-orange-400",
    bgAccent: "#FFF7ED",
    accentColor: "#F59E0B",
    image: (
      <div className="flex items-end gap-1 h-14 mt-3 px-2">
        {[3, 5, 4, 7, 6, 8, 5, 7, 9, 6, 4, 8].map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${v * 10}%`,
              background: `linear-gradient(to top, rgba(245,158,11,${0.15 + i * 0.03}), rgba(251,191,36,${0.08 + i * 0.02}))`,
              minHeight: "4px",
            }}
          />
        ))}
      </div>
    ),
  },
  {
    title: "AI Scoring Engine",
    desc: "Weighted multi-factor algorithm combines symmetry, bone structure, skin quality, and proportions into a single score.",
    icon: <Brain size={22} />,
    span: "md:col-span-2",
    iconGradient: "from-violet-500 to-purple-400",
    bgAccent: "#F3E8FF",
    accentColor: "#8B5CF6",
    image: (
      <div className="flex items-end gap-1.5 h-16 mt-3 px-1">
        {[55, 68, 62, 78, 72, 85, 80, 92, 88, 95].map((v, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${v}%` }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            className="flex-1 rounded-lg"
            style={{
              background: `linear-gradient(to top, rgba(139,92,246,${0.2 + i * 0.06}), rgba(167,139,250,${0.1 + i * 0.04}))`,
              minHeight: "4px",
            }}
          />
        ))}
      </div>
    ),
  },
  {
    title: "Canthal Tilt",
    desc: "Measures the angle of the eye axis — a key attractiveness indicator.",
    icon: <Target size={22} />,
    span: "",
    iconGradient: "from-emerald-500 to-teal-400",
    bgAccent: "#ECFDF5",
    accentColor: "#10B981",
    image: (
      <svg viewBox="0 0 120 60" className="w-full h-14 mt-3">
        <defs>
          <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <ellipse cx="35" cy="30" rx="20" ry="10" fill="url(#eyeGrad)" stroke="#10B981" strokeWidth="1" opacity="0.6" />
        <ellipse cx="85" cy="28" rx="20" ry="10" fill="url(#eyeGrad)" stroke="#14B8A6" strokeWidth="1" opacity="0.6" />
        <line x1="15" y1="32" x2="55" y2="28" stroke="#10B981" strokeWidth="1.5" opacity="0.4" />
        <line x1="65" y1="30" x2="105" y2="26" stroke="#14B8A6" strokeWidth="1.5" opacity="0.4" />
        <circle cx="35" cy="30" r="3" fill="#10B981" opacity="0.4" />
        <circle cx="85" cy="28" r="3" fill="#14B8A6" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: "Jawline Definition",
    desc: "Mandibular angle and forward growth assessment.",
    icon: <BarChart3 size={22} />,
    span: "",
    iconGradient: "from-rose-500 to-pink-400",
    bgAccent: "#FFF1F2",
    accentColor: "#F43F5E",
    image: (
      <svg viewBox="0 0 120 60" className="w-full h-14 mt-3">
        <path d="M20,15 Q25,10 40,12 Q60,15 60,15 Q60,15 80,12 Q95,10 100,15 L95,40 Q80,55 60,55 Q40,55 25,40 Z"
          fill="none" stroke="#F43F5E" strokeWidth="1.2" opacity="0.3" strokeDasharray="3 2" />
        <path d="M25,40 Q40,55 60,55 Q80,55 95,40"
          fill="none" stroke="#F43F5E" strokeWidth="2" opacity="0.5" />
        {[[25,40],[42,52],[60,55],[78,52],[95,40]].map(([cx,cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="#F43F5E" opacity={0.3 + i * 0.1} />
        ))}
      </svg>
    ),
  },
  {
    title: "Personalized Blueprint",
    desc: "Your results generate a custom action plan — skincare, mewing, jaw training, and lifestyle changes tailored to you.",
    icon: <Sparkles size={22} />,
    span: "md:col-span-2",
    iconGradient: "from-[#FF1493] to-[#FF69B4]",
    bgAccent: "#FFF0F6",
    accentColor: "#FF1493",
    image: (
      <div className="flex gap-2 mt-3">
        {[
          { label: "Skincare", color: "#FF1493" },
          { label: "Mewing", color: "#8B5CF6" },
          { label: "Exercise", color: "#10B981" },
          { label: "Nutrition", color: "#F59E0B" },
        ].map((tag) => (
          <div
            key={tag.label}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: `${tag.color}10`,
              color: tag.color,
              border: `1px solid ${tag.color}20`,
            }}
          >
            {tag.label}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Progress Tracking",
    desc: "Re-scan monthly to watch your score climb over time.",
    icon: <TrendingUp size={22} />,
    span: "",
    iconGradient: "from-sky-500 to-blue-400",
    bgAccent: "#EFF6FF",
    accentColor: "#3B82F6",
    image: (
      <svg viewBox="0 0 120 50" className="w-full h-12 mt-3">
        <defs>
          <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M10,40 Q30,35 45,28 Q60,22 75,18 Q90,14 110,8" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M10,40 Q30,35 45,28 Q60,22 75,18 Q90,14 110,8 L110,48 L10,48 Z" fill="url(#chartFill)" />
        {[[10,40],[30,34],[50,26],[70,20],[90,14],[110,8]].map(([cx,cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="#3B82F6" opacity={0.4 + i * 0.1} />
        ))}
      </svg>
    ),
  },
];

export default function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {BENTO_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: i * 0.06, duration: 0.5 }}
          whileHover={{ y: -4, transition: { duration: 0.25 } }}
          className={`group relative overflow-hidden rounded-[1.25rem] p-6 ${item.span}`}
          style={{
            background: `linear-gradient(135deg, ${item.bgAccent} 0%, rgba(255,255,255,0.9) 60%, white 100%)`,
            border: `0.5px solid ${item.accentColor}15`,
            boxShadow: `0 1px 4px rgba(0,0,0,0.02), 0 0.5px 0 rgba(0,0,0,0.01), inset 0 0.5px 0 rgba(255,255,255,0.9)`,
          }}
        >
          {/* Soft accent orb on hover */}
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
            style={{ background: `${item.accentColor}15` }}
          />

          <div className="relative z-10">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.iconGradient} flex items-center justify-center text-white mb-4`}
              style={{ boxShadow: `0 3px 10px ${item.accentColor}30` }}
            >
              {item.icon}
            </div>
            <h3 className="text-[1.05rem] font-bold text-gray-900 mb-1.5 leading-snug">{item.title}</h3>
            <p className="text-[0.82rem] text-gray-500 leading-relaxed">{item.desc}</p>
          </div>

          {item.image && (
            <div className="relative z-10">{item.image}</div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
