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
      className={cn("inline-block w-6 h-4 rounded-sm shrink-0", className)}
      role="img"
      aria-label={flag.label}
    >
      {flag.paths}
    </svg>
  );
}

// MVP languages: PT (Brazil), EN (USA), JP (Japan)
const FLAGS: Record<string, { label: string; paths: React.ReactNode }> = {
  PT: {
    label: 'Português',
    paths: (
      <>
        <rect width="640" height="480" fill="#009B3A" />
        <polygon points="320,39 610,240 320,441 30,240" fill="#FEDF00" />
        <circle cx="320" cy="240" r="95" fill="#002776" />
        <path d="M196,240 C196,240 258,295 320,295 C382,295 444,240 444,240 C444,240 382,210 320,210 C258,210 196,240 196,240Z" fill="#FFF" />
      </>
    ),
  },
  EN: {
    label: 'English',
    paths: (
      <>
        <rect width="640" height="480" fill="#B22234" />
        {[0, 2, 4, 6, 8, 10, 12].map(i => (
          <rect key={i} y={i * (480 / 13)} width="640" height={480 / 13} fill={i % 2 === 0 ? '#B22234' : '#FFF'} />
        ))}
        <rect width="256" height={480 * 7 / 13} fill="#3C3B6E" />
      </>
    ),
  },
  JP: {
    label: '日本語',
    paths: (
      <>
        <rect width="640" height="480" fill="#FFF" />
        <circle cx="320" cy="240" r="120" fill="#BC002D" />
      </>
    ),
  },
};
