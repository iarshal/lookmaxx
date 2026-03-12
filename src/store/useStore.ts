"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ─── Types ─── */
export interface TraitDetail {
  name: string;
  value: string;
  status: "Excellent" | "Good" | "Improvable";
  detail: string;
  improvable: boolean;
}

export interface AnalysisResult {
  overallScore: number;
  potentialScore: number;
  traits: {
    symmetry: number;
    jawline: number;
    canthalTilt: number;
    skinTexture: number;
    dimorphism: number;
    faceShape: string;
  };
  radarData: Array<{ trait: string; current: number; potential: number }>;
  detailedTraits: TraitDetail[];
  tier: string;
  potentialTier: string;
  capturedImage: string | null;
  timestamp: number;
  rawLandmarks?: { x: number; y: number }[];
  imageWidth?: number;
  imageHeight?: number;
}

export interface UserProfile {
  name: string;
  goal: string | null;
  commitment: string | null;
  age: string;
  gender: string;
}

export interface RoutineState {
  checked: Record<string, boolean>;
  streak: number;
  lastCompletedDate: string | null;
  weekHistory: string[]; // ISO date strings of completed days (last 7)
}

export interface HistoryEntry {
  score: number;
  date: string;
  tier: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface BiometricData {
  captures: string[];
  analysisResult: AnalysisResult | null;
  chatHistory: ChatMessage[];
  consentGiven: boolean;
  scanTimestamp: number | null;
}

/* ─── Store Shape ─── */
interface AppStore {
  // Profile
  profile: UserProfile;
  setProfile: (updates: Partial<UserProfile>) => void;

  // Analysis
  latestAnalysis: AnalysisResult | null;
  analysisHistory: HistoryEntry[];
  setAnalysis: (analysis: AnalysisResult) => void;

  // Routine
  routine: RoutineState;
  toggleRoutineCheck: (id: string) => void;
  resetRoutineChecks: () => void;
  completeDailyStreak: () => void;

  // Biometric
  biometric: BiometricData;
  setBiometricConsent: (v: boolean) => void;
  setBiometricCaptures: (captures: string[]) => void;
  setBiometricAnalysis: (result: AnalysisResult) => void;
  addBioChatMessage: (msg: ChatMessage) => void;
  clearBiometric: () => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;

  // Reset
  clearAllData: () => void;
}

function getTier(score: number): string {
  if (score >= 9) return "Apex";
  if (score >= 8) return "Elite";
  if (score >= 7) return "Advanced";
  if (score >= 6) return "Rising Star";
  if (score >= 5) return "Foundation";
  return "Starting Out";
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      /* ─ Profile ─ */
      profile: { name: "", goal: null, commitment: null, age: "", gender: "" },
      setProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      /* ─ Analysis ─ */
      latestAnalysis: null,
      analysisHistory: [],
      setAnalysis: (analysis) =>
        set((s) => ({
          latestAnalysis: { ...analysis, capturedImage: null },
          analysisHistory: [
            ...s.analysisHistory,
            { score: analysis.overallScore, date: new Date().toISOString(), tier: getTier(analysis.overallScore) },
          ].slice(-20),
        })),

      /* ─ Routine ─ */
      routine: { checked: {}, streak: 0, lastCompletedDate: null, weekHistory: [] },
      toggleRoutineCheck: (id) =>
        set((s) => ({
          routine: {
            ...s.routine,
            checked: { ...s.routine.checked, [id]: !s.routine.checked[id] },
          },
        })),
      resetRoutineChecks: () =>
        set((s) => ({ routine: { ...s.routine, checked: {} } })),
      completeDailyStreak: () =>
        set((s) => {
          const today = todayISO();
          if (s.routine.lastCompletedDate === today) return s; // already completed today

          const yesterday = yesterdayISO();
          const isConsecutive = s.routine.lastCompletedDate === yesterday;
          const newStreak = isConsecutive ? s.routine.streak + 1 : 1;

          return {
            routine: {
              ...s.routine,
              streak: newStreak,
              lastCompletedDate: today,
              weekHistory: [...s.routine.weekHistory, today].slice(-7),
            },
          };
        }),

      /* ─ Biometric ─ */
      biometric: { captures: [], analysisResult: null, chatHistory: [], consentGiven: false, scanTimestamp: null },
      setBiometricConsent: (v) => set((s) => ({ biometric: { ...s.biometric, consentGiven: v } })),
      setBiometricCaptures: (captures) => set((s) => ({ biometric: { ...s.biometric, captures, scanTimestamp: Date.now() } })),
      setBiometricAnalysis: (result) => set((s) => ({ biometric: { ...s.biometric, analysisResult: { ...result, capturedImage: null } } })),
      addBioChatMessage: (msg) => set((s) => ({ biometric: { ...s.biometric, chatHistory: [...s.biometric.chatHistory, msg] } })),
      clearBiometric: () => set({ biometric: { captures: [], analysisResult: null, chatHistory: [], consentGiven: false, scanTimestamp: null } }),

      /* ─ Onboarding ─ */
      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      /* ─ Reset ─ */
      clearAllData: () =>
        set({
          profile: { name: "", goal: null, commitment: null, age: "", gender: "" },
          latestAnalysis: null,
          analysisHistory: [],
          routine: { checked: {}, streak: 0, lastCompletedDate: null, weekHistory: [] },
          hasCompletedOnboarding: false,
        }),
    }),
    {
      name: "looksmax-store",
      version: 1,
      partialize: (state) => ({
        profile: state.profile,
        latestAnalysis: state.latestAnalysis,
        analysisHistory: state.analysisHistory,
        routine: state.routine,
        biometric: state.biometric,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>;
        // Ensure routine has weekHistory (added in v1)
        if (state.routine && typeof state.routine === "object") {
          const routine = state.routine as Record<string, unknown>;
          if (!Array.isArray(routine.weekHistory)) {
            routine.weekHistory = [];
          }
        }
        return state;
      },
    }
  )
);
