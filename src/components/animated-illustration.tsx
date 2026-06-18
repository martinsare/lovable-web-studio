import { TrendingUp, Search } from "lucide-react";

// ─── Floating chat bubbles — community / feed empty state ───────────────────
export function EmptyFeedIllustration() {
  return (
    <div className="relative mx-auto h-36 w-52 select-none" aria-hidden="true">
      {/* Glow blob */}
      <div
        className="absolute left-8 top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
        style={{ animation: "pulse 3s ease-in-out infinite" }}
      />
      {/* Bubble 1 (large, left) */}
      <div
        className="absolute left-4 top-0"
        style={{ animation: "floatA 3s ease-in-out infinite" }}
      >
        <div className="flex h-14 w-24 flex-col justify-center gap-1.5 rounded-2xl rounded-bl-sm bg-primary/20 px-3">
          <div className="h-2 w-16 rounded-full bg-primary/50" />
          <div className="h-2 w-10 rounded-full bg-primary/35" />
        </div>
      </div>
      {/* Bubble 2 (small, right) */}
      <div
        className="absolute right-2 top-6"
        style={{ animation: "floatB 2.5s ease-in-out infinite" }}
      >
        <div className="flex h-11 w-20 flex-col justify-center gap-1.5 rounded-2xl rounded-br-sm bg-secondary px-3">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          <div className="h-1.5 w-7 rounded-full bg-muted-foreground/20" />
        </div>
      </div>
      {/* Bubble 3 (tiny, bottom) */}
      <div
        className="absolute bottom-2 left-12"
        style={{ animation: "floatA 4s ease-in-out infinite", animationDelay: "1s" }}
      >
        <div className="flex h-9 w-16 items-center justify-center rounded-2xl rounded-bl-sm bg-primary/15 px-2">
          <div className="h-1.5 w-10 rounded-full bg-primary/30" />
        </div>
      </div>
      {/* Floating dot accents */}
      <div
        className="absolute right-10 bottom-4 h-3 w-3 rounded-full bg-primary/30"
        style={{ animation: "floatB 2s ease-in-out infinite", animationDelay: "0.5s" }}
      />
      <div
        className="absolute left-2 bottom-8 h-2 w-2 rounded-full bg-primary/20"
        style={{ animation: "floatA 3.5s ease-in-out infinite", animationDelay: "1.5s" }}
      />
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

// ─── Bar chart — portfolio empty state ─────────────────────────────────────
export function EmptyPortfolioIllustration() {
  const bars = [
    { heightPct: 55, delay: "0s", dur: "2.2s" },
    { heightPct: 85, delay: "0.2s", dur: "2.8s" },
    { heightPct: 70, delay: "0.4s", dur: "2s" },
    { heightPct: 40, delay: "0.6s", dur: "3s" },
    { heightPct: 60, delay: "0.8s", dur: "2.5s" },
  ];
  return (
    <div className="relative mx-auto h-32 w-48 select-none" aria-hidden="true">
      {/* Baseline */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      {/* Bars */}
      <div className="absolute inset-x-4 bottom-0 flex items-end justify-between gap-2">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-primary/30"
            style={{
              height: `${b.heightPct}%`,
              animation: `barPulse ${b.dur} ease-in-out infinite`,
              animationDelay: b.delay,
            }}
          />
        ))}
      </div>
      {/* Trending arrow */}
      <div
        className="absolute right-2 top-0 text-primary"
        style={{ animation: "floatA 2.5s ease-in-out infinite" }}
      >
        <TrendingUp className="h-5 w-5" />
      </div>
      <style>{`
        @keyframes barPulse {
          0%, 100% { opacity: 0.6; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.08); }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

// ─── Magnifying glass — browse / search empty state ────────────────────────
export function EmptySearchIllustration() {
  return (
    <div className="relative mx-auto h-32 w-32 select-none" aria-hidden="true">
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-primary/20"
        style={{ animation: "ringPulse 2.5s ease-in-out infinite" }}
      />
      {/* Circle body */}
      <div className="absolute inset-5 rounded-full border-4 border-primary/30 bg-primary/8 flex items-center justify-center">
        <Search className="h-7 w-7 text-primary/50" style={{ animation: "floatA 3s ease-in-out infinite" }} />
      </div>
      {/* Handle */}
      <div
        className="absolute bottom-2 right-2 h-9 w-3 origin-top rotate-[45deg] rounded-full bg-primary/30"
      />
      {/* Dot accents */}
      <div
        className="absolute -top-1 right-8 h-3 w-3 rounded-full bg-primary/25"
        style={{ animation: "floatB 2s ease-in-out infinite" }}
      />
      <div
        className="absolute -left-2 top-10 h-2 w-2 rounded-full bg-primary/20"
        style={{ animation: "floatA 3.5s ease-in-out infinite", animationDelay: "1s" }}
      />
      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

// ─── Wallet / coins — wallet empty state ───────────────────────────────────
export function EmptyWalletIllustration() {
  return (
    <div className="relative mx-auto h-32 w-44 select-none" aria-hidden="true">
      {/* Coin stack — back */}
      <div className="absolute left-8 bottom-4">
        {[3, 2, 1].map((layer) => (
          <div
            key={layer}
            className="mx-auto h-4 w-20 rounded-full bg-primary/20 border border-primary/10"
            style={{ marginTop: layer === 3 ? 0 : "-10px", zIndex: layer }}
          />
        ))}
      </div>
      {/* Coin — animated floating */}
      <div
        className="absolute left-16 top-0"
        style={{ animation: "floatA 2.5s ease-in-out infinite" }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/15">
          <span className="text-xl font-bold text-primary/50">₦</span>
        </div>
      </div>
      {/* Small coin right */}
      <div
        className="absolute right-4 top-6"
        style={{ animation: "floatB 3s ease-in-out infinite", animationDelay: "0.7s" }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10">
          <span className="text-sm font-bold text-primary/40">₦</span>
        </div>
      </div>
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

// ─── Success checkmark ──────────────────────────────────────────────────────
export function SuccessIllustration() {
  return (
    <div className="relative mx-auto h-24 w-24 select-none" aria-hidden="true">
      <div
        className="absolute inset-0 rounded-full bg-primary/15"
        style={{ animation: "ringPulse 2s ease-in-out infinite" }}
      />
      <div className="absolute inset-3 flex items-center justify-center rounded-full bg-primary/20">
        <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Notifications empty ────────────────────────────────────────────────────
export function EmptyNotificationsIllustration() {
  return (
    <div className="relative mx-auto h-32 w-32 select-none" aria-hidden="true">
      <div
        className="absolute inset-0 rounded-full bg-primary/8"
        style={{ animation: "ringPulse 3s ease-in-out infinite" }}
      />
      {/* Bell SVG */}
      <div
        className="absolute inset-4 flex items-center justify-center"
        style={{ animation: "floatA 2.5s ease-in-out infinite" }}
      >
        <svg viewBox="0 0 24 24" className="h-14 w-14 text-primary/40" fill="currentColor">
          <path d="M18 16v-5a6 6 0 0 0-4-5.66V5a2 2 0 1 0-4 0v.34A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2zm-6 4a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2z" />
        </svg>
      </div>
      {/* Dot accents */}
      <div
        className="absolute right-1 top-5 h-4 w-4 rounded-full bg-primary/20"
        style={{ animation: "floatB 2s ease-in-out infinite" }}
      />
      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50% { transform: translateY(-6px) rotate(4deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
