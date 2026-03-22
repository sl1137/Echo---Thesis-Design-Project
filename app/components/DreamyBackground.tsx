/**
 * DreamyBackground — CSS-only dreamy island atmosphere
 * Used on Enter and Login screens to match the Figma pastel cloud/island visual.
 */
export default function DreamyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #F5D6E8 0%, #FADED0 12%, #F7E8B8 22%, #DDEBFA 45%, #E9E2F8 65%, #DDEBFA 80%, #F6DDE9 100%)",
        }}
      />

      {/* Cloud layers */}
      <div
        className="absolute top-[2%] left-[-10%] w-[70%] h-[18%] rounded-full opacity-60 animate-drift"
        style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-[5%] right-[-5%] w-[50%] h-[14%] rounded-full opacity-50"
        style={{
          background: "radial-gradient(ellipse, rgba(246,221,233,0.7) 0%, transparent 70%)",
          animationDelay: "5s",
        }}
      />
      <div
        className="absolute top-[10%] left-[20%] w-[40%] h-[10%] rounded-full opacity-40 animate-drift"
        style={{
          background: "radial-gradient(ellipse, rgba(247,232,184,0.6) 0%, transparent 70%)",
          animationDelay: "10s",
        }}
      />

      {/* Floating island-like shapes - moved up for text clearance */}
      <div
        className="absolute bottom-[45%] left-[5%] w-[45%] h-[22%] opacity-30"
        style={{
          background: "linear-gradient(160deg, #B8D8BA 0%, #8BC99A 40%, #7BB98A 100%)",
          borderRadius: "40% 60% 55% 45% / 50% 40% 60% 50%",
        }}
      />
      <div
        className="absolute bottom-[38%] right-[0%] w-[55%] h-[28%] opacity-25"
        style={{
          background: "linear-gradient(140deg, #A8D5AA 0%, #7EC98E 50%, #6DB97D 100%)",
          borderRadius: "55% 45% 50% 50% / 45% 55% 45% 55%",
        }}
      />

      {/* Waterfall shimmer - moved up */}
      <div
        className="absolute bottom-[40%] right-[20%] w-[3px] h-[12%] opacity-20"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(221,235,250,0.4))",
          borderRadius: "2px",
        }}
      />

      {/* Lower mist layer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[25%] opacity-50"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(233,226,248,0.6) 40%, rgba(221,235,250,0.8) 100%)",
        }}
      />

      {/* Soft warm glow at center */}
      <div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] rounded-full opacity-20"
        style={{
          background: "radial-gradient(ellipse, rgba(247,232,184,0.8) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
