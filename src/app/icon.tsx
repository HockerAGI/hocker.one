export default function Icon() {
  return (
    <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="#020617" />
      <rect x="18" y="18" width="92" height="92" rx="24" fill="url(#g)" />
      <path
        d="M44 83V45c0-6.6 5.4-12 12-12h6c10.5 0 19 8.5 19 19s-8.5 19-19 19h-8v12H44Zm12-24h7c4 0 7-3.2 7-7.1 0-4-3.1-7.2-7-7.2h-7V59Z"
        fill="white"
      />
    </svg>
  );
}