export function LottieLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <div className="absolute inset-0 gradient-hero opacity-70" />
      <div className="absolute inset-0 grid-bg opacity-35" />
      <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl animate-pulse" />

      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 320 320"
          className="h-52 w-52 sm:h-64 sm:w-64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Loading"
          role="img"
        >
          <defs>
            <linearGradient id="cf-ring" x1="68" y1="72" x2="252" y2="248" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f4bd8" />
              <stop offset="40%" stopColor="#11b4d8" />
              <stop offset="78%" stopColor="#49d86a" />
              <stop offset="100%" stopColor="#1fa6ff" />
            </linearGradient>
            <linearGradient id="cf-bars" x1="118" y1="132" x2="200" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0fd2c4" />
              <stop offset="100%" stopColor="#46d34d" />
            </linearGradient>
            <linearGradient id="cf-hand" x1="84" y1="186" x2="216" y2="276" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#153d9b" />
              <stop offset="100%" stopColor="#0a2467" />
            </linearGradient>
          </defs>

          <g className="origin-center animate-[logoFloat_10s_ease-in-out_infinite]">
            <path
              d="M234 88c-17-24-47-39-80-39-56 0-102 46-102 102 0 31 12 59 33 80"
              stroke="url(#cf-ring)"
              strokeWidth="21"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="410"
              className="animate-[orbitStroke_18s_linear_infinite]"
            />
            <path
              d="M257 171c0 51-42 93-94 93-27 0-52-11-70-31"
              stroke="url(#cf-ring)"
              strokeWidth="21"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="220"
              className="animate-[orbitStrokeReverse_20s_linear_infinite]"
            />

            <g className="animate-[barsRise_3.8s_ease-in-out_infinite]">
              <rect x="131" y="170" width="24" height="52" rx="5" fill="url(#cf-bars)" />
              <rect x="166" y="144" width="24" height="78" rx="5" fill="url(#cf-bars)" />
              <rect x="201" y="112" width="24" height="110" rx="5" fill="url(#cf-bars)" />
            </g>

            <path
              d="M101 222c16-22 46-24 69-10 16 10 29 12 52 7 10-2 19 5 19 15 0 7-4 13-10 16-22 10-41 9-60 1-21-9-37-7-54 5-20 13-46 8-57-14-7-16-1-32 13-34 9-1 18 4 22 14 2 4 4 6 6 6Z"
              fill="url(#cf-hand)"
              className="animate-[handDrift_7.5s_ease-in-out_infinite]"
            />

            <path
              d="M146 222c18 5 38 9 52 2 5-2 6-5 6-8 0-4-4-7-10-8-14-2-30-1-49 4"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.92"
            />

            <path
              d="M203 92c10 0 19 8 19 19 0 16-15 28-28 28-14 0-29-13-29-30 0-10 8-17 18-17 8 0 12 4 20 0Z"
              fill="#4ed13a"
              className="animate-[leafPulse_4.8s_ease-in-out_infinite]"
            />
            <path
              d="M169 95c-9 5-15 12-16 23 16-1 31-9 41-22-9-4-16-5-25-1Z"
              fill="#59c300"
              className="animate-[leafPulse_5.2s_ease-in-out_infinite]"
            />
            <path
              d="M196 115c1 6 2 13 0 18"
              stroke="#3b8f1f"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
