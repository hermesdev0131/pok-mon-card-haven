import { cn } from '@/lib/utils';

interface FlagIconProps {
  code: string;
  className?: string;
}

export function FlagIcon({ code, className }: FlagIconProps) {
  const flag = FLAGS[code.toUpperCase()];
  if (!flag) {
    return (
      <span className={cn("inline-flex items-center justify-center w-6 h-4 rounded-sm bg-muted text-[9px] font-bold text-muted-foreground", className)}>
        {code.toUpperCase().slice(0, 2)}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 640 480"
      className={cn("inline-block w-6 h-4 rounded-sm shrink-0 overflow-hidden", className)}
      role="img"
      aria-label={flag.label}
    >
      {flag.paths}
    </svg>
  );
}

// Accurate flag SVGs based on lipis/flag-icons (MIT license)
// Simplified for small display sizes — details invisible at 24×16px are omitted
const FLAGS: Record<string, { label: string; paths: React.ReactNode }> = {
  PT: {
    label: 'Português (Brasil)',
    paths: (
      <g strokeWidth="1pt">
        {/* Green field */}
        <path fill="#229e45" fillRule="evenodd" d="M0 0h640v480H0z" />
        {/* Yellow diamond */}
        <path fill="#f8e509" fillRule="evenodd" d="m321.4 436 301.5-195.7L319.6 44 17.1 240.7z" />
        {/* Blue globe */}
        <path fill="#2b49a3" fillRule="evenodd" d="M452.8 240c0 70.3-57.1 127.3-127.6 127.3A127.4 127.4 0 1 1 452.8 240" />
        {/* White curved band */}
        <path fill="#fff" fillRule="evenodd" d="M444.4 285.8a125 125 0 0 0 5.8-19.8c-67.8-59.5-143.3-90-238.7-83.7a125 125 0 0 0-8.5 20.9c113-10.8 196 39.2 241.4 82.6" />
      </g>
    ),
  },
  EN: {
    label: 'English (US)',
    paths: (
      <>
        {/* Red background */}
        <path fill="#bd3d44" d="M0 0h640v480H0" />
        {/* White stripes */}
        <path stroke="#fff" strokeWidth="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640" />
        {/* Blue canton */}
        <path fill="#192f5d" d="M0 0h364.8v258.5H0" />
        {/* Simplified stars — 5-pointed stars in grid pattern */}
        {[
          [30, 23], [91, 23], [152, 23], [213, 23], [274, 23], [335, 23],
          [60, 49], [121, 49], [182, 49], [243, 49], [305, 49],
          [30, 75], [91, 75], [152, 75], [213, 75], [274, 75], [335, 75],
          [60, 101], [121, 101], [182, 101], [243, 101], [305, 101],
          [30, 127], [91, 127], [152, 127], [213, 127], [274, 127], [335, 127],
          [60, 153], [121, 153], [182, 153], [243, 153], [305, 153],
          [30, 179], [91, 179], [152, 179], [213, 179], [274, 179], [335, 179],
          [60, 205], [121, 205], [182, 205], [243, 205], [305, 205],
          [30, 231], [91, 231], [152, 231], [213, 231], [274, 231], [335, 231],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="8" fill="#fff" />
        ))}
      </>
    ),
  },
  JP: {
    label: '日本語',
    paths: (
      <>
        {/* White field */}
        <path fill="#fff" d="M0 0h640v480H0z" />
        {/* Red circle (Hinomaru) */}
        <circle cx="320" cy="240" r="150" fill="#bc002d" />
      </>
    ),
  },
};
