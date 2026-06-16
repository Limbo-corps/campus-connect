/**
 * Campus Connect logo — an original vector mark inspired by the brief:
 * a gradient "C" ring enclosing student silhouettes against a city skyline,
 * with a heart chat-bubble at the ring's opening.
 *
 * Scales cleanly from favicon (16px) to hero sizes. Pure SVG, no assets.
 * Drop a real PNG at /public/logo.png later and swap <Logo/> for <img/> if desired.
 */

interface LogoProps {
  size?: number
  className?: string
  /** show the "Campus Connect" wordmark next to the mark */
  withWordmark?: boolean
  wordmarkClassName?: string
}

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Campus Connect"
    >
      <defs>
        <linearGradient id="cc-ring" x1="12" y1="105" x2="105" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="0.55" stopColor="#9333ea" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="cc-people" x1="40" y1="90" x2="80" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#312e81" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="cc-skyline" x1="40" y1="40" x2="84" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id="cc-heart" x1="86" y1="48" x2="110" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <clipPath id="cc-clip">
          {/* interior disc so skyline/people stay inside the ring */}
          <circle cx="60" cy="60" r="38" />
        </clipPath>
      </defs>

      {/* Interior content, clipped to the inner disc */}
      <g clipPath="url(#cc-clip)">
        {/* skyline hint */}
        <g fill="url(#cc-skyline)">
          <rect x="34" y="52" width="11" height="22" rx="1.5" />
          <rect x="46" y="46" width="8" height="28" rx="1.5" />
          {/* central dome building */}
          <rect x="55" y="50" width="16" height="24" rx="1.5" />
          <path d="M55 51a8 8 0 0 1 16 0z" />
          <rect x="62" y="38" width="2" height="9" rx="1" />
          <path d="M64 39h7l-2.2 2.2L71 43h-7z" />
          {/* right tower */}
          <rect x="72" y="44" width="7" height="30" rx="1.5" />
          <rect x="74" y="40" width="3" height="5" rx="1" />
        </g>
        {/* three student silhouettes (heads + shoulders) */}
        <g fill="url(#cc-people)">
          <circle cx="48" cy="66" r="6.5" />
          <circle cx="60" cy="63.5" r="7.5" />
          <circle cx="72" cy="66" r="6.5" />
          <path d="M36 92c0-9 5.5-16 12-16s12 7 12 16z" />
          <path d="M48 94c0-10 6-18 12-18s12 8 12 18z" />
          <path d="M60 92c0-9 5.5-16 12-16s12 7 12 16z" />
        </g>
      </g>

      {/* The "C" ring with an opening on the right */}
      <path
        d="M96.77 29.14 A48 48 0 1 0 96.77 90.86 L86.04 81.86 A34 34 0 1 1 86.04 38.14 Z"
        fill="url(#cc-ring)"
      />

      {/* Heart chat-bubble sitting at the ring opening */}
      <g>
        <path
          d="M88 50h18a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H98l-6 6v-6h-4a6 6 0 0 1-6-6V56a6 6 0 0 1 6-6Z"
          fill="url(#cc-heart)"
        />
        <path
          d="M97 58.6c-1.4-2.7-5.6-2-5.6 1.2 0 2.2 2.9 4.3 5.6 6.2 2.7-1.9 5.6-4 5.6-6.2 0-3.2-4.2-3.9-5.6-1.2Z"
          fill="#fff"
        />
      </g>
    </svg>
  )
}

export default function Logo({ size = 32, className, withWordmark = false, wordmarkClassName }: LogoProps) {
  if (!withWordmark) return <LogoMark size={size} className={className} />
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark size={size} />
      <span className={wordmarkClassName ?? 'text-sm font-bold tracking-tight text-[--foreground]'}>
        Campus Connect
      </span>
    </span>
  )
}
