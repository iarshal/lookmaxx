"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileDown, Loader2, Check } from "lucide-react";
import type { AnalysisResult, UserProfile } from "@/store/useStore";

interface Props {
  analysis: AnalysisResult;
  profile: UserProfile;
  variant?: "primary" | "compact";
}

export default function PDFDownloadButton({ analysis, profile, variant = "primary" }: Props) {
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");

  const handleDownload = useCallback(async () => {
    setStatus("generating");

    try {
      const { generateReport } = await import("@/lib/pdfReport");
      generateReport(analysis, profile);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      setStatus("idle");
    }
  }, [analysis, profile]);

  if (variant === "compact") {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownload}
        disabled={status === "generating"}
        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
        style={{ background: "#F3F4F6" }}
      >
        {status === "generating" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === "done" ? (
          <Check size={16} className="text-emerald-500" />
        ) : (
          <FileDown size={16} />
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleDownload}
      disabled={status === "generating"}
      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-60"
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        color: status === "done" ? "#10B981" : "#374151",
      }}
    >
      {status === "generating" ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Generating PDF...
        </>
      ) : status === "done" ? (
        <>
          <Check size={16} />
          Downloaded!
        </>
      ) : (
        <>
          <FileDown size={16} />
          Download Full Blueprint PDF
        </>
      )}
    </motion.button>
  );
}
