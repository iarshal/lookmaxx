"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Flame,
  Check,
  Star,
  Droplets,
  Droplet,
  SunMedium,
  Snowflake,
  Moon,
  FlaskConical,
  Hand,
  Eye,
  Heart,
  Dumbbell,
  Activity,
  Scissors,
  Sunrise,
  CalendarDays,
  Clock,
  User,
  Citrus,
  Scan,
  Beaker,
  ListChecks,
  Timer,
  MessageCircle,
  Send,
  X,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/store/useStore";

/* ═══════════════════════════════════════════════════════════
   SCIENTIFIC PROTOCOL DATA MODEL
   ═══════════════════════════════════════════════════════════ */
type Tab = "morning" | "night" | "weekly";

interface ProtocolStep {
  step: number;
  action: string;
}

interface ProtocolItem {
  id: string;
  title: string;
  duration: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  schedule?: string;
  science: string;
  steps: ProtocolStep[];
  reps: string;
}

const MORNING_PROTOCOLS: ProtocolItem[] = [
  {
    id: "m1",
    title: "Double Cleanse",
    duration: "2 min",
    icon: Droplets,
    iconBg: "bg-pink-50",
    iconColor: "text-[#FF1493]",
    science: "Oil-based cleansers dissolve sebum and SPF residue at a molecular level. The follow-up water-based wash removes sweat and particulate pollution (PM2.5), preventing oxidative damage to the skin barrier.",
    steps: [
      { step: 1, action: "Apply a pea-sized amount of micellar cleansing oil to dry skin." },
      { step: 2, action: "Massage in circular motions for 30 seconds, focusing on the T-zone and jawline." },
      { step: 3, action: "Rinse with lukewarm water (never hot — it strips the acid mantle)." },
      { step: 4, action: "Follow with a gentle low-pH gel cleanser (pH 5.0–5.5). Lather for 20 seconds." },
      { step: 5, action: "Pat dry with a clean microfiber towel — never rub." },
    ],
    reps: "2 min total — 60s oil, 20s gel, 40s rinse/dry",
  },
  {
    id: "m2",
    title: "Vitamin C Serum (L-Ascorbic Acid)",
    duration: "1 min",
    icon: Citrus,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    science: "L-Ascorbic acid (15-20%) neutralizes free radicals from UV and pollution. It inhibits tyrosinase to fade hyperpigmentation and boosts Type I collagen synthesis by 8x. Use lightweight formulations — heavy creams trap humidity and cause breakouts in tropical climates.",
    steps: [
      { step: 1, action: "Dispense 4-5 drops onto fingertips (not the palm — minimizes oxidation)." },
      { step: 2, action: "Press into slightly damp skin — water enhances absorption by 3x." },
      { step: 3, action: "Apply to forehead, both cheeks, nose, and chin. Pat gently." },
      { step: 4, action: "Wait 90 seconds before layering next product to prevent pilling." },
    ],
    reps: "4-5 drops, 90s wait time",
  },
  {
    id: "m3",
    title: "Lightweight Moisturizer",
    duration: "1 min",
    icon: Droplet,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    science: "Humectants (hyaluronic acid, glycerin) draw moisture into the epidermis. In high-humidity environments, avoid heavy occlusives (petroleum, shea butter) which trap sweat and cause miliaria. Opt for gel-cream textures with ceramides for barrier repair without clogging.",
    steps: [
      { step: 1, action: "Use a nickel-sized amount of gel-cream moisturizer." },
      { step: 2, action: "Warm between palms for 5 seconds to activate ingredients." },
      { step: 3, action: "Press into skin using upward patting motions — never drag downward." },
      { step: 4, action: "Extend to neck and behind ears (often neglected, first to show aging)." },
    ],
    reps: "Nickel-sized amount, 30s application",
  },
  {
    id: "m4",
    title: "SPF 50+ Sunscreen",
    duration: "1 min",
    icon: SunMedium,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-500",
    science: "UV radiation causes 80% of visible facial aging (photoaging). SPF 50 blocks 98% of UVB. In pollution-heavy environments, look for formulas with antioxidant boosters (Vitamin E, ferulic acid) for dual UV + free-radical defense. Reapply every 2 hours if outdoors.",
    steps: [
      { step: 1, action: "Squeeze a two-finger-length strip (1/4 tsp for face alone)." },
      { step: 2, action: "Apply to 5 zones: forehead, nose, left cheek, right cheek, chin." },
      { step: 3, action: "Blend outward with gentle strokes — do not rub vigorously." },
      { step: 4, action: "Don't forget the earlobe crease, hairline, and under-eye area." },
      { step: 5, action: "Wait 10 minutes before sun exposure for full film formation." },
    ],
    reps: "2 finger-lengths, reapply every 2 hours outdoors",
  },
  {
    id: "m5",
    title: "Mewing Posture Hold",
    duration: "5 min",
    icon: Scan,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    science: "Proper tongue posture (mewing) exerts consistent upward force on the maxilla, promoting forward facial growth over time. It also engages the posterior third of the tongue, which strengthens the hyoid muscles and improves jawline definition from the inside out.",
    steps: [
      { step: 1, action: "Close your mouth. Teeth should be lightly touching or 1-2mm apart." },
      { step: 2, action: "Place the TIP of your tongue behind your front teeth (on the incisive papilla)." },
      { step: 3, action: "Press the MIDDLE of your tongue flat against the hard palate." },
      { step: 4, action: "Engage the BACK third of your tongue — push it up against the soft palate." },
      { step: 5, action: "Breathe through your nose. Hold this position. The goal is to make it subconscious." },
    ],
    reps: "5 min focused hold, then maintain throughout the day",
  },
  {
    id: "m6",
    title: "Cold Water Splash / Ice Roller",
    duration: "1 min",
    icon: Snowflake,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-500",
    science: "Cold exposure triggers vasoconstriction, rapidly reducing morning facial edema (puffiness). It also tightens pores temporarily and boosts norepinephrine, giving skin a firmer, more alert appearance. Especially effective in humid climates where overnight swelling is common.",
    steps: [
      { step: 1, action: "Fill a bowl with ice water, or grab your ice roller from the freezer." },
      { step: 2, action: "Splash face 10x with ice water, or roll from center of face outward." },
      { step: 3, action: "Focus on under-eyes and jawline — highest puffiness zones." },
      { step: 4, action: "Pat dry. Do NOT rub — capillaries are constricted and fragile." },
    ],
    reps: "10 splashes or 60s rolling per zone",
  },
];

const NIGHT_PROTOCOLS: ProtocolItem[] = [
  {
    id: "n1",
    title: "Oil Cleanse (PM)",
    duration: "2 min",
    icon: Moon,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    science: "The evening double cleanse is critical — it removes the day's accumulated pollution particles, oxidized sebum, and SPF film. Leaving these on skin overnight accelerates collagen breakdown and causes inflammatory acne, especially in high-pollution urban environments.",
    steps: [
      { step: 1, action: "Apply cleansing oil/balm to DRY hands and DRY face." },
      { step: 2, action: "Massage for 60 seconds — spend extra time on nose and chin (blackhead zones)." },
      { step: 3, action: "Emulsify by adding a splash of water — it should turn milky white." },
      { step: 4, action: "Rinse thoroughly. Follow with gel cleanser for 20 seconds." },
    ],
    reps: "60s massage, 20s gel wash",
  },
  {
    id: "n2",
    title: "Retinol / Retinoid",
    duration: "1 min",
    icon: FlaskConical,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    science: "Retinoids accelerate cell turnover from 28 days to ~14 days, pushing fresh cells to the surface faster. They stimulate fibroblast activity, increasing collagen and elastin production. Start low (0.025%) to avoid retinization (peeling/redness) — your skin adapts in 4-6 weeks.",
    steps: [
      { step: 1, action: "Wait until skin is FULLY dry (10 min post-cleanse). Moisture amplifies irritation." },
      { step: 2, action: "Dispense a pea-sized amount for the entire face." },
      { step: 3, action: "Apply in dots to forehead, cheeks, chin. Blend outward — AVOID the eye area." },
      { step: 4, action: "Beginners: buffer by applying moisturizer first, then retinol on top." },
    ],
    reps: "Pea-sized amount. Start 2x/week, build to nightly over 8 weeks",
  },
  {
    id: "n3",
    title: "Eye Cream Application",
    duration: "1 min",
    icon: Eye,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    science: "Periorbital skin is 0.5mm thin — 4x thinner than the rest of the face. It has fewer oil glands and collagen fibers, making it the first area to show aging. Peptide-rich eye creams stimulate micro-collagen production and reduce dark circle pigmentation via caffeine vasoconstrictors.",
    steps: [
      { step: 1, action: "Scoop a grain-of-rice amount with your RING FINGER (weakest = gentlest pressure)." },
      { step: 2, action: "Dot product along the orbital bone — NOT on the eyelid itself." },
      { step: 3, action: "Tap gently inward from the outer corner to inner corner. Never drag." },
      { step: 4, action: "Apply to brow bone as well for complete orbital care." },
    ],
    reps: "Rice-grain amount per eye, 10 gentle taps each",
  },
  {
    id: "n4",
    title: "Gua Sha Lymphatic Massage",
    duration: "5 min",
    icon: Hand,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    science: "Gua sha stimulates lymphatic drainage, flushing interstitial fluid that causes mid-face edema and jowling. Consistent use improves microcirculation by 400%, bringing nutrients to fibroblasts and visibly sculpting the jawline and cheekbones over 4-6 weeks.",
    steps: [
      { step: 1, action: "Apply 4-5 drops of facial oil for slip (jojoba or rosehip). NEVER drag on dry skin." },
      { step: 2, action: "Hold the gua sha tool at a 15-degree angle against skin (nearly flat)." },
      { step: 3, action: "JAWLINE: Sweep from chin to earlobe. 5 strokes per side. Firm but not painful." },
      { step: 4, action: "CHEEKBONES: Sweep from nose to hairline along the cheekbone. 5 strokes per side." },
      { step: 5, action: "FOREHEAD: Sweep from center outward to temples. 5 strokes." },
      { step: 6, action: "NECK: Sweep downward from jaw to collarbone to drain lymph. 5 strokes per side." },
    ],
    reps: "5 strokes per zone, 5 min total. Always stroke toward lymph nodes.",
  },
  {
    id: "n5",
    title: "Lip Treatment",
    duration: "30 sec",
    icon: Heart,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
    science: "Lip skin has no sebaceous glands and only 3-5 cell layers (vs. 16 on the face). It loses moisture 10x faster. Overnight occlusive treatments create a moisture barrier, allowing ceramides and peptides to penetrate and repair the vermilion border.",
    steps: [
      { step: 1, action: "If lips are flaky: gently exfoliate with a damp washcloth in circular motions." },
      { step: 2, action: "Apply a thick layer of peptide lip mask or lanolin-based balm." },
      { step: 3, action: "Extend slightly beyond the lip line to treat the often-neglected border." },
    ],
    reps: "Thick layer nightly. Exfoliate 2x/week only.",
  },
];

const WEEKLY_PROTOCOLS: ProtocolItem[] = [
  {
    id: "w1",
    title: "Masseter / Jaw Training",
    duration: "10 min",
    icon: Dumbbell,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    schedule: "3x per week",
    science: "The masseter is the strongest muscle by weight in the body. Resistance training hypertrophies the muscle fibers, visually widening the jaw angle and creating a more defined mandibular contour. Mastic gum provides 10x the resistance of regular gum, targeting the deep masseter heads.",
    steps: [
      { step: 1, action: "Warm up: Open and close jaw slowly 10 times." },
      { step: 2, action: "Place mastic gum (or jaw trainer) on one side. Chew with controlled force." },
      { step: 3, action: "Do 50 deliberate chews on the left side. Focus on full range of motion." },
      { step: 4, action: "Switch to right side. 50 deliberate chews." },
      { step: 5, action: "Finish with 30 bilateral (both sides) chews." },
      { step: 6, action: "Cool down: Massage the masseter muscle with knuckles for 30 seconds per side." },
    ],
    reps: "50 reps/side + 30 bilateral = 130 total reps. 3x/week.",
  },
  {
    id: "w2",
    title: "Face Yoga & Muscle Toning",
    duration: "10 min",
    icon: Activity,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    schedule: "Daily",
    science: "Facial muscles are unique — they insert directly into skin rather than bone. Targeted resistance exercises hypertrophy these muscles, lifting the mid-face and reducing nasolabial fold depth. Studies show 20 weeks of consistent face yoga visually reduces perceived age by 3 years.",
    steps: [
      { step: 1, action: "CHEEK LIFTER: Open mouth into O, lift cheek muscles toward eyes. Hold 10 seconds. Repeat 5x." },
      { step: 2, action: "JAWLINE SCULPTOR: Tilt head back 45°, push lower jaw forward. Hold 10s. Repeat 5x." },
      { step: 3, action: "FOREHEAD SMOOTHER: Place fingertips on forehead, apply light resistance, try to raise eyebrows. Hold 10s, 5x." },
      { step: 4, action: "EYE FIRMER: Place index fingers under brows, try to close eyes against resistance. Hold 5s, 10x." },
      { step: 5, action: "NECK TONER: Tilt head back, press tongue to roof of mouth, swallow. Repeat 10x." },
    ],
    reps: "5 exercises, 5-10 reps each, 10 min total",
  },
  {
    id: "w3",
    title: "Hair Care Protocol",
    duration: "20 min",
    icon: Scissors,
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    schedule: "Weekly",
    science: "Hair frames the face and alters perceived facial proportions by up to 30%. The right cut can elongate a round face or soften a square jaw. Scalp health (pH 4.5-5.5) is the foundation — sebum buildup and hard water minerals cause thinning and dullness.",
    steps: [
      { step: 1, action: "Scalp detox: Apply salicylic acid scalp treatment to dry scalp. Massage 2 min." },
      { step: 2, action: "Wash with sulfate-free shampoo. Focus on SCALP only — let suds run through lengths." },
      { step: 3, action: "Condition MID-LENGTH to ENDS only. Leave 3 minutes. Rinse with cool water." },
      { step: 4, action: "Apply lightweight hair oil (argan/jojoba) to damp ends. 2-3 drops." },
      { step: 5, action: "Style according to face shape — consult your barber about angular vs. soft cuts." },
    ],
    reps: "Full protocol 1x/week. Quick wash 2-3x/week.",
  },
  {
    id: "w4",
    title: "Chemical Exfoliation",
    duration: "5 min",
    icon: Beaker,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    schedule: "2x per week",
    science: "AHAs (glycolic acid) dissolve the desmosome bonds between dead corneocytes, revealing brighter skin underneath. BHAs (salicylic acid) are oil-soluble, penetrating into pores to dissolve sebaceous plugs. In humid climates, prioritize BHA to prevent sweat-triggered congestion.",
    steps: [
      { step: 1, action: "Cleanse and dry face completely. Acids need dry skin for even penetration." },
      { step: 2, action: "Apply BHA (salicylic acid 2%) to T-zone and congested areas with a cotton pad." },
      { step: 3, action: "Apply AHA (glycolic acid 8%) to cheeks and forehead. AVOID broken skin." },
      { step: 4, action: "Wait 15-20 minutes. You may feel mild tingling — that's normal." },
      { step: 5, action: "Follow with moisturizer. NEVER use on the same night as retinol." },
    ],
    reps: "2x/week max. Never combine with retinol night.",
  },
];

const PROTOCOLS: Record<Tab, ProtocolItem[]> = {
  morning: MORNING_PROTOCOLS,
  night: NIGHT_PROTOCOLS,
  weekly: WEEKLY_PROTOCOLS,
};

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "morning", label: "Morning", icon: Sunrise },
  { id: "night", label: "Night", icon: Moon },
  { id: "weekly", label: "Weekly", icon: CalendarDays },
];

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.80)",
  backdropFilter: "saturate(150%) blur(30px)",
  WebkitBackdropFilter: "saturate(150%) blur(30px)",
  border: "0.5px solid rgba(0,0,0,0.06)",
  borderRadius: "1rem",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0.5px 0 rgba(0,0,0,0.02)",
};

/* ═══════════════════════════════════════════════════════════
   AI COACH MOCK RESPONSES
   ═══════════════════════════════════════════════════════════ */
const COACH_RESPONSES: Record<string, string> = {
  mewing: "For proper mewing: your entire tongue (including the back third) should suction-cup to the roof of your mouth. The tip rests just behind the front teeth on the incisive papilla. Your lips are sealed, teeth lightly touching. Breathe through your nose. The key mistake most people make is forgetting the BACK third — that's where 70% of the force comes from.",
  serum: "Serum layering order (thinnest → thickest): 1) Toner/Essence 2) Vitamin C (AM only) 3) Niacinamide 4) Hyaluronic Acid 5) Retinol (PM only) 6) Moisturizer 7) SPF (AM only). Wait 60-90 seconds between active serums to prevent pilling.",
  jawline: "For jawline definition: combine mastic gum training (3x/week, 100 reps) with consistent mewing and body fat reduction below 15%. Gua sha along the mandible helps with lymphatic drainage. Visible results typically appear at 8-12 weeks. Don't overtrain — rest days allow the masseter to recover and grow.",
  retinol: "Start retinol at 0.025% concentration, 2 nights per week. Buffer it by applying moisturizer first, then retinol on top. Build tolerance over 6-8 weeks before increasing frequency. NEVER use with AHA/BHA on the same night. Some peeling is normal in weeks 2-4 (retinization) — it means it's working.",
  default: "I'm your AI looksmaxing coach! I can help with specific execution questions about mewing technique, skincare layering order, jawline training, retinol usage, gua sha technique, and more. What would you like to know?",
};

function getCoachResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("tongue") || lower.includes("mew")) return COACH_RESPONSES.mewing;
  if (lower.includes("serum") || lower.includes("order") || lower.includes("layer") || lower.includes("first")) return COACH_RESPONSES.serum;
  if (lower.includes("jaw") || lower.includes("chew") || lower.includes("masseter")) return COACH_RESPONSES.jawline;
  if (lower.includes("retinol") || lower.includes("retinoid") || lower.includes("peel")) return COACH_RESPONSES.retinol;
  return COACH_RESPONSES.default;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function RoutinePage() {
  const router = useRouter();
  const toggleRoutineCheck = useStore((s) => s.toggleRoutineCheck);
  const completeDailyStreak = useStore((s) => s.completeDailyStreak);
  const checked = useStore((s) => s.routine.checked);
  const streak = useStore((s) => s.routine.streak);
  const weekHistory = useStore((s) => s.routine.weekHistory ?? []);

  const [activeTab, setActiveTab] = useState<Tab>("morning");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [celebratingItemId, setCelebratingItemId] = useState<string | null>(null);
  const [confettiDone, setConfettiDone] = useState(false);

  // AI Coach state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "coach"; text: string }[]>([
    { role: "coach", text: "Hey! I'm your AI looksmaxing coach. Ask me anything about mewing, skincare layering, jawline training, or your routine." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const items = PROTOCOLS[activeTab];
  const allTabIds = useMemo(
    () => [...MORNING_PROTOCOLS, ...NIGHT_PROTOCOLS].map((i) => i.id),
    []
  );
  const completedCount = useMemo(
    () => items.filter((item) => checked[item.id]).length,
    [items, checked]
  );
  const totalCount = items.length;
  const allTabComplete = completedCount === totalCount && totalCount > 0;

  // Check if ALL morning + night tasks are done (daily completion)
  const allDailyComplete = useMemo(
    () => allTabIds.every((id) => checked[id]),
    [allTabIds, checked]
  );

  // Confetti explosion when all daily tasks complete
  useEffect(() => {
    if (allDailyComplete && !confettiDone) {
      setConfettiDone(true);
      completeDailyStreak();

      import("canvas-confetti").then((mod) => {
        const confetti = mod.default;
        // Big burst
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ["#FF1493", "#FF69B4", "#FFB6C1", "#0096FF", "#00C8FF"] });
        // Side cannons
        setTimeout(() => {
          confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.65 }, colors: ["#FF1493", "#FF69B4", "#FFB6C1"] });
          confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.65 }, colors: ["#FF1493", "#FF69B4", "#FFB6C1"] });
        }, 300);
      });
    }
  }, [allDailyComplete, confettiDone, completeDailyStreak]);

  // Reset confetti flag if tasks get unchecked
  useEffect(() => {
    if (!allDailyComplete) setConfettiDone(false);
  }, [allDailyComplete]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleCheck = useCallback(
    (id: string) => {
      const wasChecked = !!checked[id];
      toggleRoutineCheck(id);
      if (!wasChecked) {
        setCelebratingItemId(id);
        setTimeout(() => setCelebratingItemId(null), 800);
      }
    },
    [checked, toggleRoutineCheck]
  );

  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    // Simulate typing delay
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: "coach", text: getCoachResponse(userMsg) }]);
    }, 600);
  }, [chatInput]);

  // Build streak timeline (last 7 days)
  const streakDays = useMemo(() => {
    const days: { label: string; completed: boolean; isToday: boolean }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      days.push({
        label: dayNames[d.getDay()],
        completed: weekHistory.includes(iso),
        isToday: i === 0,
      });
    }
    return days;
  }, [weekHistory]);

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
            onClick={() => router.push("/results")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back</span>
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF1493] to-[#FFB6C1] flex items-center justify-center shadow-sm">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-black text-lg">Protocol Lab</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/profile")}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
          >
            <User size={16} />
          </motion.button>
        </div>
      </motion.header>

      {/* ─── Body ─── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ─── Left Sidebar ─── */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-4 lg:sticky lg:top-24">
            {/* Streak Timeline Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#FF1493] to-[#FF69B4] rounded-2xl p-5 text-white shadow-lg"
              style={{ boxShadow: "0 6px 20px rgba(255,20,147,0.25)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-pink-200 text-xs font-medium uppercase tracking-wider">Daily Streak</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Flame size={22} className="text-yellow-300" />
                    <span className="text-3xl font-black">{streak}</span>
                    <span className="text-pink-200 text-sm font-medium">days</span>
                  </div>
                </div>
                {allDailyComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm"
                  >
                    Today done!
                  </motion.div>
                )}
              </div>

              {/* 7-Day Timeline */}
              <div className="flex gap-1.5">
                {streakDays.map((day, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.04 + 0.15, type: "spring", stiffness: 300 }}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-[10px] text-pink-200 font-medium">{day.label}</span>
                    <div
                      className={`w-full h-8 rounded-lg flex items-center justify-center transition-all ${
                        day.completed
                          ? "bg-white/30 shadow-inner"
                          : day.isToday
                          ? "bg-white/15 border border-white/30"
                          : "bg-white/10"
                      }`}
                    >
                      {day.completed ? (
                        <Flame size={14} className="text-yellow-300" />
                      ) : day.isToday ? (
                        <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5"
              style={cardStyle}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-900">
                  {activeTab === "morning" ? "Morning" : activeTab === "night" ? "Night" : "Weekly"} Progress
                </p>
                <p className="text-sm font-bold text-[#FF1493]">
                  {completedCount}/{totalCount}
                </p>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FF1493] to-[#FFB6C1] rounded-full"
                  initial={false}
                  animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <AnimatePresence>
                {allTabComplete && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-center text-sm font-bold text-[#FF1493] mt-3 flex items-center justify-center gap-2"
                  >
                    <Star size={14} /> All protocols complete!
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative flex lg:flex-col gap-1 p-1.5"
              style={cardStyle}
            >
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setExpandedId(null);
                    }}
                    className="relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors duration-200 z-10"
                    style={{ color: isActive ? "white" : "#6B7280" }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#FF69B4]"
                        style={{ boxShadow: "0 4px 12px rgba(255,20,147,0.25)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <TabIcon size={16} />
                      {tab.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* ─── Right Main Area — Protocol Accordions ─── */}
          <div className="flex-1 min-w-0 space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {items.map((item, i) => {
                  const IconComponent = item.icon;
                  const isChecked = !!checked[item.id];
                  const isExpanded = expandedId === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="overflow-hidden transition-all duration-200"
                      style={{
                        ...cardStyle,
                        borderColor: isChecked ? "rgba(255,20,147,0.2)" : "rgba(0,0,0,0.06)",
                        background: isChecked
                          ? "linear-gradient(135deg, rgba(255,245,248,0.9) 0%, rgba(240,253,244,0.9) 100%)"
                          : "rgba(255,255,255,0.85)",
                      }}
                    >
                      {/* ── Top Row ── */}
                      <div className="flex items-center gap-4 p-5">
                        {/* Checkbox */}
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleCheck(item.id)}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                              isChecked
                                ? "bg-gradient-to-br from-[#FF1493] to-[#FF69B4] border-transparent shadow-md"
                                : "border-gray-300 hover:border-[#FF1493]"
                            }`}
                            style={isChecked ? { boxShadow: "0 2px 8px rgba(255,20,147,0.3)" } : undefined}
                          >
                            {isChecked && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                                <Check size={16} className="text-white" strokeWidth={3} />
                              </motion.div>
                            )}
                          </motion.button>
                          {celebratingItemId === item.id && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              {[Star, Sparkles].map((CIcon, j) => (
                                <motion.span
                                  key={j}
                                  initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                  animate={{ opacity: 0, scale: 0.5, x: (j - 0.5) * 40, y: -35 }}
                                  transition={{ duration: 0.7, delay: j * 0.08 }}
                                  className="absolute text-[#FF1493]"
                                >
                                  <CIcon size={14} />
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconColor} flex-shrink-0`}>
                          <IconComponent size={20} />
                        </div>

                        {/* Title + Duration */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-bold ${isChecked ? "line-through text-gray-400" : "text-gray-900"}`}>
                              {item.title}
                            </p>
                            {item.schedule && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "rgba(59,130,246,0.06)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.15)" }}
                              >
                                {item.schedule}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock size={11} /> {item.duration}
                          </p>
                        </div>

                        {/* Expand */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "#F3F4F6" }}
                        >
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={16} className="text-gray-500" />
                          </motion.div>
                        </motion.button>
                      </div>

                      {/* ── Expandable Scientific Protocol ── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                              {/* The Science */}
                              <div className="pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                                    <FlaskConical size={13} className="text-violet-500" />
                                  </div>
                                  <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">The Science</p>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed pl-8">{item.science}</p>
                              </div>

                              {/* Step-by-Step */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <ListChecks size={13} className="text-blue-500" />
                                  </div>
                                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Step-by-Step</p>
                                </div>
                                <div className="pl-8 space-y-2">
                                  {item.steps.map((s) => (
                                    <div key={s.step} className="flex gap-3 items-start">
                                      <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black text-white"
                                        style={{ background: "linear-gradient(135deg, #FF1493, #FF69B4)" }}
                                      >
                                        {s.step}
                                      </div>
                                      <p className="text-sm text-gray-700 leading-relaxed">{s.action}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Duration / Reps */}
                              <div
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ background: "rgba(255,20,147,0.04)", border: "1px solid rgba(255,20,147,0.1)" }}
                              >
                                <div className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center">
                                  <Timer size={13} className="text-[#FF1493]" />
                                </div>
                                <p className="text-xs font-semibold text-[#FF1493]">{item.reps}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 text-center"
              style={cardStyle}
            >
              <p className="font-bold text-gray-800 mb-1">Track your transformation</p>
              <p className="text-sm text-gray-500 mb-4">Upload comparison photos to visualize your progress over time.</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/progress")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white font-bold text-sm shadow-md"
                style={{ boxShadow: "0 4px 14px rgba(255,20,147,0.25)" }}
              >
                Go to Progress Tracker &rarr;
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
         AI COACH FLOATING ACTION BUTTON + CHAT DRAWER
         ═══════════════════════════════════════════════════════ */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#FF1493] to-[#FF69B4] text-white flex items-center justify-center shadow-xl z-40"
        style={{ boxShadow: "0 6px 24px rgba(255,20,147,0.4)" }}
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {chatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
              style={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "saturate(180%) blur(30px)",
                WebkitBackdropFilter: "saturate(180%) blur(30px)",
                borderLeft: "0.5px solid rgba(0,0,0,0.08)",
                boxShadow: "-8px 0 30px rgba(0,0,0,0.1)",
              }}
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF1493] to-[#FF69B4] flex items-center justify-center shadow-sm">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900">AI Coach</p>
                    <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X size={16} className="text-gray-500" />
                </motion.button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-[#FF1493] to-[#FF69B4] text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestions */}
              <div className="px-5 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {["Am I mewing right?", "Serum order?", "Jawline tips", "Retinol help"].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setChatInput(q);
                      setTimeout(() => {
                        setChatMessages((prev) => [...prev, { role: "user", text: q }]);
                        setTimeout(() => {
                          setChatMessages((prev) => [...prev, { role: "coach", text: getCoachResponse(q) }]);
                        }, 600);
                      }, 100);
                    }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-[#FF1493] transition-colors hover:bg-pink-100"
                    style={{ background: "rgba(255,20,147,0.06)", border: "1px solid rgba(255,20,147,0.15)" }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-5 py-4" style={{ borderTop: "0.5px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="Ask about your routine..."
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#FF1493]/20 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={sendChat}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF1493] to-[#FF69B4] flex items-center justify-center text-white flex-shrink-0"
                  >
                    <Send size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
