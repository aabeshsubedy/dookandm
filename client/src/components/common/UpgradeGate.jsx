import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { planHasFeature, minPlanForFeature, getPlanLimits } from '@dokaandm/shared';
import { useAuthStore } from '../../store/authStore.js';
import { Button } from '../ui/Button.jsx';

export function UpgradeGate({ feature, title, description, children }) {
  const plan = useAuthStore((s) => s.plan);
  const current = plan?.plan || 'free';
  if (planHasFeature(current, feature)) return children;

  const required = minPlanForFeature(feature);
  const requiredLabel = getPlanLimits(required).label;

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="bg-brand px-6 py-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/15 text-white">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-white">
            {title || 'Unlock this feature'}
          </h2>
          <p className="mt-1 text-sm text-white/70">
            {description || 'This is part of a paid plan.'}
          </p>
        </div>
        <div className="px-6 py-5 text-center">
          <p className="text-sm text-fg-secondary">
            Available on the <span className="font-semibold text-fg">{requiredLabel}</span> plan
            and above.
          </p>
          <Link to="/settings/plan">
            <Button variant="primary" size="lg" className="mt-4">
              <Sparkles className="h-4 w-4" /> See plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
