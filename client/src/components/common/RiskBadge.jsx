import { ShieldCheck, ShieldAlert, ShieldQuestion, Shield } from 'lucide-react';
import { RISK_LABEL_META } from '@dokaandm/shared';
import { Badge } from '../ui/Badge.jsx';

const toneMap = { good: 'good', warn: 'warn', bad: 'bad', neutral: 'neutral' };
const iconMap = {
  reliable: ShieldCheck,
  medium: ShieldQuestion,
  risky: ShieldAlert,
  new: Shield,
};

/** COD risk badge — the core differentiator, surfaced on customers + orders. */
export function RiskBadge({ label, size = 'sm', showIcon = true }) {
  if (!label) return null;
  const meta = RISK_LABEL_META[label] || RISK_LABEL_META.new;
  const Icon = iconMap[label] || Shield;
  return (
    <Badge tone={toneMap[meta.tone]} className={size === 'md' ? 'px-2.5 py-1 text-sm' : ''}>
      {showIcon && <Icon className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden />}
      {meta.label}
    </Badge>
  );
}
