"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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
}

export interface AppState {
  profile: UserProfile;
  latestAnalysis: AnalysisResult | null;
  analysisHistory: Array<{ score: number; date: string }>;
  routine: RoutineState;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  goal: null,
  commitment: null,
  age: "",
  gender: "",
};

const DEFAULT_ROUTINE: RoutineState = {
  checked: {},
  streak: 0,
  lastCompletedDate: null,
};

const DEFAULT_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  latestAnalysis: null,
  analysisHistory: [],
  routine: DEFAULT_ROUTINE,
};

interface AppContextType {
  state: AppState;
  setProfile: (profile: Partial<UserProfile>) => void;
  setAnalysis: (analysis: AnalysisResult) => void;
  toggleRoutineCheck: (id: string) => void;
  resetRoutineChecks: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem("looksmax-state");
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {}
  return DEFAULT_STATE;
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    // Don't persist the captured image to save localStorage space
    const toSave = {
      ...state,
      latestAnalysis: state.latestAnalysis
        ? { ...state.latestAnalysis, capturedImage: null }
        : null,
    };
    localStorage.setItem("looksmax-state", JSON.stringify(toSave));
  } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const setProfile = useCallback((updates: Partial<UserProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  }, []);

  const setAnalysis = useCallback((analysis: AnalysisResult) => {
    setState((prev) => ({
      ...prev,
      latestAnalysis: analysis,
      analysisHistory: [
        ...prev.analysisHistory,
        { score: analysis.overallScore, date: new Date().toISOString() },
      ].slice(-20),
    }));
  }, []);

  const toggleRoutineCheck = useCallback((id: string) => {
    setState((prev) => {
      const newChecked = { ...prev.routine.checked, [id]: !prev.routine.checked[id] };
      return {
        ...prev,
        routine: { ...prev.routine, checked: newChecked },
      };
    });
  }, []);

  const resetRoutineChecks = useCallback(() => {
    setState((prev) => ({
      ...prev,
      routine: { ...prev.routine, checked: {} },
    }));
  }, []);

  const clearAllData = useCallback(() => {
    setState(DEFAULT_STATE);
    localStorage.removeItem("looksmax-state");
  }, []);

  return (
    <AppContext.Provider
      value={{ state, setProfile, setAnalysis, toggleRoutineCheck, resetRoutineChecks, clearAllData }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
