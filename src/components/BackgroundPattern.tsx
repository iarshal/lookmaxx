"use client";

export default function BackgroundPattern() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dot grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035]">
        <defs>
          <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1" fill="#FF1493" />
          </pattern>
          <pattern id="crossGrid" width="64" height="64" patternUnits="userSpaceOnUse">
            <line x1="32" y1="28" x2="32" y2="36" stroke="#FF1493" strokeWidth="0.5" />
            <line x1="28" y1="32" x2="36" y2="32" stroke="#FF1493" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)" />
        <rect width="100%" height="100%" fill="url(#crossGrid)" opacity="0.5" />
      </svg>

      {/* Gradient orbs */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-100/40 to-rose-50/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-pink-50/30 to-fuchsia-50/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-50/10 to-transparent blur-3xl" />
    </div>
  );
}
