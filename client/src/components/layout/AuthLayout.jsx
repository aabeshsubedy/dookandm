import { MessageSquare, ShoppingBag, ShieldCheck, Facebook, Instagram } from 'lucide-react';
import { Logo } from '../brand/Logo.jsx';
import { SocialBrandRow } from '../brand/SocialOrbit.jsx';
import { FloatingSocial } from '../brand/FloatingSocial.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';

const highlights = [
  {
    icon: MessageSquare,
    title: 'Unified inbox',
    text: 'Facebook & Instagram DMs in one workspace.',
  },
  {
    icon: ShoppingBag,
    title: 'Order capture',
    text: 'Turn any conversation into a tracked order.',
  },
  {
    icon: ShieldCheck,
    title: 'COD risk signals',
    text: 'See return history before you confirm.',
  },
];

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Solid brand panel with floating FB / IG logos */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-brand p-10 lg:flex xl:p-12">
        <FloatingSocial />

        <div className="relative z-10">
          <Logo inverted size="md" />
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">
            Omnichannel commerce
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Sell where your customers already are.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-white/70">
            Inbox, orders, and customer memory for social sellers.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
                  <h.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{h.title}</p>
                  <p className="text-sm text-white/65">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/45">
          © {new Date().getFullYear()} DokaanDM
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-[56%] lg:px-16">
        {/* Mobile floating logos (compact) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden lg:hidden" aria-hidden>
          <div className="absolute right-8 top-6 animate-float-soft">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#1877F2] text-white shadow-md">
              <Facebook className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </div>
          <div className="absolute left-8 top-10 animate-float-soft" style={{ animationDelay: '0.8s' }}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E1306C] text-white shadow-md">
              <Instagram className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </div>
        </div>

        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          {(title || subtitle) && (
            <div className="mb-6">
              {title && (
                <h2 className="text-2xl font-semibold tracking-tight text-fg">{title}</h2>
              )}
              {subtitle && <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>}
            </div>
          )}

          {children}

          <div className="mt-10">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-bg px-3 text-2xs font-medium uppercase tracking-wider text-fg-muted">
                  Connected channels
                </span>
              </div>
            </div>
            <SocialBrandRow />
            <p className="mt-3 text-center text-xs text-fg-muted">
              Facebook · Instagram · Messenger
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
