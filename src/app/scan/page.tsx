"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  Camera,
  ChevronLeft,
  Sparkles,
  X,
  AlertTriangle,
  User,
  ScanFace,
  Check,
  Loader2,
  CameraOff,
} from "lucide-react";
import Webcam from "react-webcam";
import { loadModels, analyzeFace } from "@/lib/faceAnalysis";
import {
  initLivenessModels,
  detectLivenessFrame,
  captureFrame,
  BiometricBaseline,
  EAR_BLINK_THRESHOLD,
  MAR_OPEN_THRESHOLD,
} from "@/lib/livenessDetection";
import { useStore } from "@/store/useStore";
import FaceMeshOverlay from "@/components/FaceMeshOverlay";

/* ───────────────────────── Types ───────────────────────── */
type ScanMode =
  | "idle"
  | "webcam"
  | "analyzing"
  | "bio-live"
  | "bio-loading"
  | "error"
  | "camera-error"
  | "done";

type LivePhase = "init" | "neutral" | "turn_left" | "turn_right" | "mouth" | "flash" | "complete";

/* ───────────────────── Analysis Steps ──────────────────── */
const ANALYSIS_STEPS = [
  { id: 0, text: "Initializing neural engine", pct: 0 },
  { id: 1, text: "Loading face detection models", pct: 9 },
  { id: 2, text: "Detecting face boundaries", pct: 18 },
  { id: 3, text: "Extracting 68 facial landmarks", pct: 28 },
  { id: 4, text: "Mapping jawline structure", pct: 38 },
  { id: 5, text: "Scanning eye geometry", pct: 48 },
  { id: 6, text: "Analyzing nasal bridge", pct: 57 },
  { id: 7, text: "Evaluating mouth symmetry", pct: 65 },
  { id: 8, text: "Computing bilateral symmetry", pct: 74 },
  { id: 9, text: "Measuring canthal tilt", pct: 82 },
  { id: 10, text: "Calculating facial dimorphism", pct: 90 },
  { id: 11, text: "Generating aesthetic blueprint", pct: 97 },
];

/* ──────────────── Background Flash Colors ──────────────── */
const BG_FLASH_SEQ = [
  "#1446FF", "#00CC66", "#FF2244", "#FFCC00", "#FFFFFF",
  "#1446FF", "#00CC66", "#FF2244",
];
const FLASH_MS = 160;

const PHASE_INFO: Record<LivePhase, { title: string; sub: string }> = {
  init: { title: "Initializing Scanner", sub: "Loading biometric models..." },
  neutral: { title: "Look straight at the camera", sub: "Keep your face centered and still" },
  turn_left: { title: "Turn head slightly Left", sub: "Analyzing side profile geometry..." },
  turn_right: { title: "Turn head slightly Right", sub: "Analyzing nasal bridge depth..." },
  mouth: { title: "Open your mouth slightly", sub: "Waiting for jawline tracking..." },
  flash: { title: "Hold still — Deep Mapping", sub: "Photometric stereo analysis" },
  complete: { title: "Verification Complete", sub: "Biometric data captured successfully" },
};

const LOADING_TEXTS = [
  "Extracting 468 Landmarks...",
  "Analyzing Subcutaneous Fat Distribution...",
  "Generating Advanced Tensor Matrices...",
  "Computing Jawline Curvature Field...",
  "Mapping Bilateral Symmetry Vectors...",
  "Building Biometric Profile...",
];

/* ──────────────── SVG Progress Ring ──────────────── */
function ProgressRing({ progress, size, stroke, done }: { progress: number; size: number; stroke: number; done: boolean }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} className="absolute inset-0 z-20 -rotate-90"
      style={{ filter: done ? "drop-shadow(0 0 14px rgba(255,20,147,0.5))" : "drop-shadow(0 0 6px rgba(255,20,147,0.2))" }}>
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF1493" /><stop offset="50%" stopColor="#FF69B4" /><stop offset="100%" stopColor="#FF1493" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ring-grad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (progress / 100) * circ }}
          transition={{ duration: 1.5, ease: "easeInOut" }} />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   Inner component that uses useSearchParams
   ══════════════════════════════════════════════════ */
function ScanPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAnalysis = useStore((s) => s.setAnalysis);
  const setBiometricCaptures = useStore((s) => s.setBiometricCaptures);
  const setBiometricAnalysis = useStore((s) => s.setBiometricAnalysis);
  const biometricConsent = useStore((s) => s.biometric.consentGiven);

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bioVideoRef = useRef<HTMLVideoElement | null>(null);
  const bioStreamRef = useRef<MediaStream | null>(null);
  const cancelRef = useRef(false);

  const [mode, setMode] = useState<ScanMode>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Particle analysis state
  const [progress, setProgress] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(-1);
  const [detectedLandmarks, setDetectedLandmarks] = useState<{ x: number; y: number }[] | null>(null);
  const [detectedImageSize, setDetectedImageSize] = useState<{ w: number; h: number } | null>(null);

  // Biometric state
  const [livePhase, setLivePhase] = useState<LivePhase>("init");
  const [ringProgress, setRingProgress] = useState(0);
  const [bgFlash, setBgFlash] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [faceMissing, setFaceMissing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isCameraReadyRef = useRef(false);
  const [checkDone, setCheckDone] = useState(false);
  const [bioCaptures, setBioCaptures] = useState<string[]>([]);
  const [earVal, setEarVal] = useState(0.3);
  const [marVal, setMarVal] = useState(0.1);

  // Loading state
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [loadingPct, setLoadingPct] = useState(0);

  // Architectural State Machine Refs (Stale Closure Fix)
  const phaseRef = useRef<LivePhase>("init");
  const blinkStateRef = useRef<"wait_open" | "wait_closed" | "wait_reopen">("wait_open");
  const blinkFramesRef = useRef(0);
  const blinkTimeRef = useRef(0);
  const faceStableRef = useRef(0);
  const capturesRef = useRef<string[]>([]);
  const requestRef = useRef<number | null>(null);

  // Auto-start biometric if coming from consent — just set mode, don't run liveness yet
  useEffect(() => {
    if (searchParams.get("mode") === "biometric" && biometricConsent) {
      cancelRef.current = false;
      setLivePhase("init"); phaseRef.current = "init";
      setRingProgress(0); setBgFlash(null);
      setCheckDone(false); setBioCaptures([]);
      setIsCameraReady(false); isCameraReadyRef.current = false;
      setMode("bio-live");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analysis step tracker
  useEffect(() => {
    const active = ANALYSIS_STEPS.findLastIndex((s) => progress >= s.pct);
    setActiveStep(active);
    setVisibleSteps(ANALYSIS_STEPS.filter((s) => progress >= s.pct - 2).map((s) => s.id));
  }, [progress]);

  /* ═══════════════════════════════════════════════════════
     BIOMETRIC LIVENESS ENGINE
     Runs as a useEffect when mode === "bio-live" — this ensures
     the <video> DOM element is mounted BEFORE we try to access it.
     ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    if (mode !== "bio-live") return;

    let cancelled = false;
    cancelRef.current = false;

    const runLiveness = async () => {
      // 1) Wait for Webcam component to initialize & user to grant permissions
      let vid: HTMLVideoElement | null = null;
      while (!cancelled) {
        vid = webcamRef.current?.video || null;
        if (vid && isCameraReadyRef.current && vid.readyState >= 2) break;
        await new Promise((r) => setTimeout(r, 200));
      }
      if (cancelled || !vid) return;

      // 2) Model Loading Lock
      setLoadingText("Loading AI Models...");
      await initLivenessModels();
      if (cancelled) return;

      const tracker = new BiometricBaseline();
      phaseRef.current = "neutral";
      setLivePhase("neutral");
      faceStableRef.current = 0;
      blinkStateRef.current = "wait_open";
      blinkFramesRef.current = 0;
      blinkTimeRef.current = 0;
      capturesRef.current = [];

      const triggerFlashSequence = async () => {
        phaseRef.current = "flash";
        setLivePhase("flash");
        setFaceMissing(false);
        setFlashActive(true);
        // Wait 4 seconds for the CSS animation to complete while ramping progress
        for (let i = 0; i < 40; i++) {
          if (cancelled) return;
          setRingProgress(72 + Math.round(((i + 1) / 40) * 23));
          await new Promise((r) => setTimeout(r, 100));
        }
        setFlashActive(false);

        // ── Phase 5: COMPLETE ──
        phaseRef.current = "complete";
        setLivePhase("complete");
        for (let i = 95; i <= 100; i++) {
          setRingProgress(i); await new Promise((r) => setTimeout(r, 40));
        }
        setCheckDone(true);
        setBioCaptures(capturesRef.current);
        setBiometricCaptures(capturesRef.current);

        await new Promise((r) => setTimeout(r, 800));
        if (cancelled) return;

        setMode("bio-loading"); setLoadingPct(0);
      };

      // 3) RequestAnimationFrame Loop (State Machine Enforcement)
      const detectLoop = async () => {
        if (cancelled || !vid) return;

        const frame = await detectLivenessFrame(vid);
        setEarVal(frame.ear); setMarVal(frame.mar);

        if (frame.faceDetected) {
          setFaceMissing(false);
          tracker.addFrame(frame.ear, frame.mar);

          // Phase 1: Neutral Stable
          if (phaseRef.current === "neutral") {
            faceStableRef.current++;
            setRingProgress(Math.min(25, faceStableRef.current * 3));
            if (faceStableRef.current >= 8) {
              capturesRef.current.push(captureFrame(vid));
              setRingProgress(25);
              phaseRef.current = "turn_left";
              setLivePhase("turn_left"); // UI Sync
              faceStableRef.current = 0;
            }
          }
          // Phase 2: Turn Left
          else if (phaseRef.current === "turn_left") {
            // Require Yaw < 0.35
            if (frame.yaw < 0.35) {
              faceStableRef.current++;
              if (faceStableRef.current >= 5) {
                capturesRef.current.push(captureFrame(vid)); // Capture Photo 2
                setRingProgress(50);
                phaseRef.current = "turn_right";
                setLivePhase("turn_right");
                faceStableRef.current = 0;
              }
            } else {
              faceStableRef.current = 0;
            }
          } 
          // Phase 3: Turn Right
          else if (phaseRef.current === "turn_right") {
            // Require Yaw > 0.65
            if (frame.yaw > 0.65) {
              faceStableRef.current++;
              if (faceStableRef.current >= 5) {
                capturesRef.current.push(captureFrame(vid)); // Capture Photo 3
                setRingProgress(75);
                phaseRef.current = "mouth";
                setLivePhase("mouth");
                faceStableRef.current = 0;
              }
            } else {
              faceStableRef.current = 0;
            }
          }
          // Phase 4: Mouth
          else if (phaseRef.current === "mouth") {
            // Require MAR > 0.45
            if (frame.mar > 0.45) {
              faceStableRef.current++;
              if (faceStableRef.current >= 3) {
                capturesRef.current.push(captureFrame(vid)); // Capture Photo 4
                setRingProgress(90);
                triggerFlashSequence();
                return; 
              }
            } else {
              faceStableRef.current = 0;
            }
          }
        } else {
          // Face Missing State Freeze & Exploit Reset
          setFaceMissing(true);
          faceStableRef.current = 0;
        }

        requestRef.current = requestAnimationFrame(detectLoop);
      };

      // Start the loop
      detectLoop();
    };

    runLiveness();

    return () => { 
      cancelled = true; 
      cancelRef.current = true; 
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ═══════════════════════════════════════════════════════
     BIOMETRIC LOADING ENGINE
     Watches for "bio-loading" mode to run the 6s cinematic sequence
     ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    if (mode !== "bio-loading") return;

    let cancelled = false;

    const runLoading = async () => {
      const bestCapture = bioCaptures[0];
      if (!bestCapture) { if (!cancelled) setMode("error"); return; }
      setCapturedImage(bestCapture);

      let analysisResult: Awaited<ReturnType<typeof analyzeFace>> = null;
      let analysisError = false;
      const analysisPromise = (async () => {
        try {
          await loadModels(() => {});
          analysisResult = await analyzeFace(bestCapture, () => {});
        } catch { analysisError = true; }
      })();

      // Cinematic loading: 6 seconds
      const LOAD_DUR = 6000;
      const textInterval = LOAD_DUR / LOADING_TEXTS.length;
      for (let i = 0; i < LOADING_TEXTS.length; i++) {
        if (cancelled) return;
        setLoadingText(LOADING_TEXTS[i]);
        setLoadingPct(Math.round(((i + 1) / LOADING_TEXTS.length) * 95));
        await new Promise((r) => setTimeout(r, textInterval));
      }
      await analysisPromise;
      if (cancelled) return;
      setLoadingPct(100);

      if (analysisError || !analysisResult) { setMode("error"); return; }
      setBiometricAnalysis(analysisResult);
      await new Promise((r) => setTimeout(r, 500));
      if (!cancelled) router.push("/biometric-results");
    };

    runLoading();

    return () => { cancelled = true; };
  }, [mode, bioCaptures, router, setBiometricAnalysis]);

  /* ═══════════════════ ORIGINAL FLOW ═══════════════════ */
  const startParticleAnalysis = useCallback(async (imgSrc: string) => {
    setCapturedImage(imgSrc); setMode("analyzing");
    setProgress(0); setVisibleSteps([]); setActiveStep(-1); setFadingOut(false);
    const startTime = Date.now(); const MIN = 10000;
    let result: Awaited<ReturnType<typeof analyzeFace>> = null;
    let err = false; let done = false; let rp = 0;
    const ap = (async () => {
      try {
        await loadModels((s: string) => { void s; rp = Math.min(rp + 4, 15); });
        const r = await analyzeFace(imgSrc, (_s: string, p: number) => { rp = Math.max(rp, p); });
        result = r;
        if (r?.rawLandmarks) { setDetectedLandmarks(r.rawLandmarks); setDetectedImageSize({ w: r.imageWidth ?? 640, h: r.imageHeight ?? 480 }); }
        done = true;
      } catch { err = true; done = true; }
    })();
    const cnt = ANALYSIS_STEPS.length;
    for (let i = 0; i < cnt; i++) {
      const v = ((i + 1) / cnt) * 92;
      setProgress(Math.min(95, done ? Math.max(v, rp) : Math.max(v * 0.75, rp, v * 0.6)));
      await new Promise((r) => setTimeout(r, MIN / cnt));
    }
    await ap;
    const el = Date.now() - startTime; if (el < MIN) await new Promise((r) => setTimeout(r, MIN - el));
    setProgress(100);
    if (err || !result) { setMode("error"); return; }
    setAnalysis(result); setMode("done"); setFadingOut(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push("/results");
  }, [router, setAnalysis]);

  /* ═══════════════════ START BIOMETRIC (just set mode) ═══════════════════ */
  const startBiometricLiveness = useCallback(() => {
    cancelRef.current = false;
    setLivePhase("init"); setRingProgress(0); setBgFlash(null);
    setCheckDone(false); setBioCaptures([]);
    setMode("bio-live");
  }, []);

  const captureWebcam = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (src) startParticleAnalysis(src);
  }, [webcamRef, startParticleAnalysis]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => { startParticleAnalysis(e.target?.result as string); };
    reader.readAsDataURL(file);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileUpload(file);
  };
  const handleTryAgain = () => {
    cancelRef.current = true;
    bioStreamRef.current?.getTracks().forEach((t) => t.stop());
    setCapturedImage(null); setProgress(0); setVisibleSteps([]); setActiveStep(-1);
    setFadingOut(false); setDetectedLandmarks(null); setDetectedImageSize(null);
    setRingProgress(0); setLivePhase("init"); setBgFlash(null); setCheckDone(false);
    setBioCaptures([]); setLoadingPct(0); setMode("idle");
  };

  const RING_SIZE = 380;

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "#F2F2F7" }}>
      {/* Douyin Stark Flash CSS Animation Layer */}
      {flashActive && mode === "bio-live" && <div className="fixed inset-0 z-0 animate-douyin-flash opacity-100 pointer-events-none" style={{ mixBlendMode: 'normal' }} />}

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 px-6 py-5"
        style={{
          background: "rgba(255,255,255,0.82)", backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => mode === "webcam" ? setMode("idle") : handleTryAgain()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={20} /><span className="font-medium">Back</span>
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0096FF] to-[#00C8FF] flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-black text-lg">Scanner</span>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push("/profile")}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <User size={18} className="text-gray-600" />
          </motion.button>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-30">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
          <AnimatePresence mode="wait">

            {/* ═══════════ IDLE ═══════════ */}
            {mode === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                className="w-full max-w-xl">
                <div className="text-center mb-10">
                  <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="text-5xl font-black tracking-tight mb-3">Scan Your Face</motion.h1>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-gray-500 text-lg">Choose your preferred scanning method.</motion.p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setMode("webcam")}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-[#0096FF] to-[#00C8FF] text-white font-bold shadow-lg"
                    style={{ boxShadow: "0 6px 20px rgba(0,150,255,0.3)" }}>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><Camera size={24} /></div>
                    <p className="font-bold text-sm">Camera</p><p className="text-blue-200 text-[10px] font-normal">Quick scan</p>
                  </motion.button>
                  <motion.div whileHover={{ scale: 1.03, y: -2 }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl cursor-pointer"
                    style={{ border: dragOver ? "2px solid #0096FF" : "2px solid #E5E7EB", background: dragOver ? "rgba(0,150,255,0.04)" : "white" }}>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center"><Upload size={24} className="text-[#0096FF]" /></div>
                    <p className="font-bold text-gray-800 text-sm">Upload</p><p className="text-gray-400 text-[10px]">JPG, PNG</p>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  </motion.div>
                  <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/biometric-terms")}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl font-bold shadow-lg text-white"
                    style={{ background: "linear-gradient(135deg, #FF1493, #FF69B4)", boxShadow: "0 6px 20px rgba(255,20,147,0.3)" }}>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center"><ScanFace size={24} /></div>
                    <p className="font-bold text-sm">Biometric</p><p className="text-pink-200 text-[10px] font-normal">Liveness scan</p>
                  </motion.button>
                </div>
                <div className="p-5 rounded-2xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <p className="text-sm font-bold text-gray-700 mb-3">Tips for best results</p>
                  {["Face the camera straight on", "Ensure good, even lighting", "Remove glasses and hair from face"].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-500 py-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0096FF] to-[#00C8FF] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">{i + 1}</span></div>{t}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ═══════════ WEBCAM ═══════════ */}
            {mode === "webcam" && (
              <motion.div key="webcam" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-lg">
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-[3/4]">
                  <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-full object-cover" mirrored />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 rounded-full border-2 border-[#0096FF] opacity-60" style={{ boxShadow: "0 0 20px rgba(0,150,255,0.3)" }} />
                  </div>
                  <div className="absolute top-4 left-4">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMode("idle")}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"><X size={18} /></motion.button>
                  </div>
                </div>
                <div className="flex justify-center mt-6">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={captureWebcam}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0096FF] to-[#00C8FF] flex items-center justify-center"
                    style={{ boxShadow: "0 0 20px rgba(0,150,255,0.4)" }}>
                    <div className="w-14 h-14 rounded-full border-4 border-white/50"><div className="w-full h-full rounded-full bg-white" /></div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ═══════════ ANALYZING (Particles) ═══════════ */}
            {(mode === "analyzing" || (mode === "done" && fadingOut)) && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: fadingOut ? 0 : 1 }}
                transition={{ duration: fadingOut ? 0.6 : 0.3 }} exit={{ opacity: 0 }} className="w-full max-w-lg flex flex-col gap-4">
                <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-black"
                  style={{ boxShadow: "0 0 60px rgba(0,180,255,0.18), 0 20px 60px rgba(0,0,0,0.3)" }}>
                  {capturedImage && <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.45) 100%)" }} />
                  <FaceMeshOverlay progress={progress} landmarks={detectedLandmarks} imageWidth={detectedImageSize?.w} imageHeight={detectedImageSize?.h} />
                </div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(6,12,30,0.92)", backdropFilter: "blur(24px)", border: "1px solid rgba(0,200,255,0.18)" }}>
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,200,255,0.1)" }}>
                    <div className="flex items-center gap-2.5">
                      <motion.div className="w-2 h-2 rounded-full bg-[#00C8FF]" animate={{ opacity: [1, .3, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
                      <span className="text-[10px] font-bold tracking-[0.14em] text-[#00C8FF]">ANALYZING</span>
                    </div>
                    <span className="font-mono text-base font-black tabular-nums" style={{ color: "#00E5FF" }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-[3px] overflow-hidden" style={{ background: "rgba(0,180,255,0.1)" }}>
                    <motion.div className="absolute inset-y-0 left-0" style={{ background: "linear-gradient(90deg,#0050EE,#0096FF,#00D0FF)" }}
                      animate={{ width: `${progress}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
                  </div>
                  <div className="px-5 py-3 flex flex-col gap-[5px]">
                    {ANALYSIS_STEPS.map((step) => {
                      if (!visibleSteps.includes(step.id)) return null;
                      const isDone = activeStep > step.id; const isActive = activeStep === step.id;
                      return (
                        <motion.div key={step.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                          <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                            {isDone ? <div className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: "rgba(0,200,255,0.15)", border: "1px solid rgba(0,200,255,0.5)" }}>
                              <span className="text-[8px] font-bold" style={{ color: "#00C8FF" }}>✓</span></div>
                              : isActive ? <motion.div className="w-4 h-4 rounded-full border-2"
                                style={{ borderColor: "#00C8FF", borderTopColor: "transparent" }}
                                animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                                : <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(0,120,180,0.25)" }} />}
                          </div>
                          <span className="text-[11px] font-medium flex-1" style={{ color: isDone ? "#2A5570" : isActive ? "#E8F8FF" : "#0E2035" }}>
                            {step.text}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ═══════════ BIOMETRIC LIVENESS (Live Webcam) ═══════════ */}
            {mode === "bio-live" && (
              <motion.div key="bio-live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full max-w-md flex flex-col items-center">
                <AnimatePresence mode="wait">
                  <motion.div key={livePhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="text-center mb-6 relative z-50">
                    <h2 className="text-lg font-bold text-gray-900 mb-1" style={{ textShadow: bgFlash ? "0 0 10px rgba(0,0,0,0.4)" : "none" }}>
                      {PHASE_INFO[livePhase].title}
                    </h2>
                    <p className="text-xs text-gray-400">{PHASE_INFO[livePhase].sub}</p>
                  </motion.div>
                </AnimatePresence>
                {/* Circular viewfinder with STRICT constraints */}
                <div className="relative w-80 h-80 z-10 mx-auto mt-4">
                  {/* Progress Ring wrapping the video */}
                  <div className="absolute inset-[-16px]">
                    <div className="absolute inset-0 rounded-full" style={{ border: "2px dashed rgba(255,20,147,0.1)", animation: "spin 25s linear infinite" }} />
                    <ProgressRing progress={ringProgress} size={352} stroke={6} done={checkDone} />
                  </div>
                  
                  {/* Strict w-80 h-80 rounded-full overflow-hidden z-10 Video Feed */}
                  <div className="relative w-80 h-80 rounded-full overflow-hidden bg-black z-10 shadow-2xl"
                    style={{ border: "2px solid rgba(255,255,255,0.8)" }}>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      width={640}
                      height={480}
                      videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
                      playsInline
                      autoPlay
                      onUserMedia={() => {
                        setIsCameraReady(true);
                        isCameraReadyRef.current = true;
                      }}
                      onUserMediaError={(err) => {
                        console.error("Camera access denied or unavailable", err);
                        setMode("camera-error");
                      }}
                      className="w-full h-full object-cover"
                      style={{ transform: "scaleX(-1) scale(1.1)" }}
                    />

                    {!isCameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-30 bg-black/80 backdrop-blur-sm">
                        <p className="text-white text-sm font-medium">Please allow camera access in your browser settings to proceed.</p>
                      </div>
                    )}
                    
                    {/* Pink Scanning Overlay (Internal) */}
                    {livePhase !== "complete" && !faceMissing && (
                      <motion.div className="absolute left-0 right-0 h-[2px] z-10"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,20,147,0.5), transparent)", boxShadow: "0 0 10px rgba(255,20,147,0.8)" }}
                        animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                    )}

                    {/* Face Missing Overlay */}
                    <AnimatePresence>
                      {faceMissing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                          <AlertTriangle size={32} className="text-[#FF1493] mb-2" />
                          <p className="text-white text-sm font-bold text-center px-6">
                            Face not detected.<br/>Please position your face in the circle.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Completion Checkmark */}
                  {checkDone && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#FF1493,#FF69B4)", boxShadow: "0 4px 24px rgba(255,20,147,0.5)" }}>
                        <Check size={40} strokeWidth={3} className="text-white" />
                      </div>
                    </motion.div>
                  )}
                </div>
                {/* Live metrics */}
                <div className="flex items-center gap-6 mt-5 relative z-50">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-medium mb-0.5">EAR</p>
                    <p className="text-sm font-mono font-bold" style={{ color: earVal < EAR_BLINK_THRESHOLD ? "#FF1493" : "#333" }}>
                      {earVal.toFixed(3)}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-black" style={{ color: "#FF1493" }}>{ringProgress}%</span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-medium mb-0.5">MAR</p>
                    <p className="text-sm font-mono font-bold" style={{ color: marVal > MAR_OPEN_THRESHOLD ? "#FF1493" : "#333" }}>
                      {marVal.toFixed(3)}
                    </p>
                  </div>
                </div>
                {/* Phase dots */}
                <div className="flex items-center gap-2 mt-4 relative z-50">
                  {(["neutral", "turn_left", "turn_right", "mouth", "flash", "complete"] as LivePhase[]).map((ph, i) => {
                    const phases: LivePhase[] = ["neutral", "turn_left", "turn_right", "mouth", "flash", "complete"];
                    const ci = phases.indexOf(livePhase);
                    return <motion.div key={ph} className="rounded-full"
                      animate={{ width: i === ci ? 20 : 6, height: 6, background: i < ci ? "#FF1493" : i === ci ? "#FF1493" : "#DDD" }}
                      transition={{ duration: 0.3 }} />;
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══════════ CINEMATIC LOADING ═══════════ */}
            {mode === "bio-loading" && (
              <motion.div key="bio-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full max-w-md flex flex-col items-center py-12">
                {/* Apple-style spinner */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="mb-10">
                  <Loader2 size={40} strokeWidth={1.5} className="text-gray-300" />
                </motion.div>
                {/* Loading text */}
                <AnimatePresence mode="wait">
                  <motion.p key={loadingText} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="text-sm font-medium text-gray-500 mb-8 text-center h-5">{loadingText}</motion.p>
                </AnimatePresence>
                {/* 3 captured photos */}
                {bioCaptures.length > 0 && (
                  <div className="flex items-center gap-4 mb-8">
                    {bioCaptures.map((cap, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.15 }}
                        className="relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2"
                          style={{ borderColor: "#FF1493", boxShadow: "0 4px 16px rgba(255,20,147,0.15)" }}>
                          <img src={cap} alt={`Capture ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                          style={{ background: "#FF1493" }}>
                          {["Neutral", "Blink", "Open"][i]}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {/* Progress bar */}
                <div className="w-full max-w-xs">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #FF1493, #FF69B4)" }}
                      animate={{ width: `${loadingPct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                  </div>
                  <p className="text-center text-xs text-gray-300 font-mono mt-2">{loadingPct}%</p>
                </div>
              </motion.div>
            )}

            {/* ═══════════ ERROR ═══════════ */}
            {mode === "error" && (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-lg">
                <div className="rounded-3xl p-8 text-center" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                    className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle size={32} className="text-red-500" />
                  </motion.div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Scan Failed</h2>
                  <p className="text-gray-500 mb-8">Please ensure your face is clearly visible and well-lit.</p>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleTryAgain}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-br from-[#0096FF] to-[#00C8FF] text-white font-bold shadow-lg">
                    Try Again
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes douyinFlash {
          0% { background-color: #0055FF; }
          25% { background-color: #00D000; }
          50% { background-color: #FFFFFF; }
          75% { background-color: #FF1493; }
          100% { background-color: transparent; }
        }
        .douyin-flash-bg {
          animation: douyinFlash 4s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

/* Wrap in Suspense for useSearchParams */
export default function ScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={32} /></div>}>
      <ScanPageInner />
    </Suspense>
  );
}
