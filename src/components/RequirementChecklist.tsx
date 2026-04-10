import { Check, Circle } from 'lucide-react';

export interface Requirement {
  label: string;
  met: boolean;
}

export function RequirementChecklist({ requirements }: { requirements: Requirement[] }) {
  return (
    <ul className="space-y-1 text-xs">
      {requirements.map((req, i) => (
        <li key={i} className={`flex items-center gap-2 ${req.met ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {req.met ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
          {req.label}
        </li>
      ))}
    </ul>
  );
}
