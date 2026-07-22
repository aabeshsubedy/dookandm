import { Moon, Sun, Monitor, Check } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore.js';
import { cn } from '../../lib/cn.js';

export function ThemeToggle({ className, size = 'md' }) {
  const resolved = useThemeStore((s) => s.resolved);
  const toggle = useThemeStore((s) => s.toggle);
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-fg-secondary transition-colors',
        'hover:bg-surface-2 hover:text-fg',
        dims,
        className
      )}
      aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={resolved === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function ThemeSegmented({ className }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const options = [
    { key: 'light', icon: Sun, label: 'Light' },
    { key: 'system', icon: Monitor, label: 'System' },
    { key: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <div
      className={cn('inline-flex rounded-lg border border-border bg-surface-2 p-0.5', className)}
      role="group"
      aria-label="Theme"
    >
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setTheme(key)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            theme === key ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg-secondary'
          )}
          aria-pressed={theme === key}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Compact brand color dots for header / auth. */
export function BrandColorPicker({ className, size = 'md' }) {
  const accent = useThemeStore((s) => s.accent);
  const accents = useThemeStore((s) => s.accents);
  const setAccent = useThemeStore((s) => s.setAccent);
  const dim = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="group"
      aria-label="Brand color"
    >
      {accents.map((c) => {
        const active = accent === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setAccent(c.id)}
            title={c.label}
            aria-label={`${c.label} theme`}
            aria-pressed={active}
            className={cn(
              'relative grid place-items-center rounded-full transition-transform hover:scale-110',
              dim,
              active && 'ring-2 ring-fg ring-offset-2 ring-offset-bg'
            )}
            style={{ backgroundColor: c.swatch }}
          >
            {active && <Check className="h-3 w-3 text-white drop-shadow" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

/** Full labeled brand color cards for settings. */
export function BrandColorGrid({ className }) {
  const accent = useThemeStore((s) => s.accent);
  const accents = useThemeStore((s) => s.accents);
  const setAccent = useThemeStore((s) => s.setAccent);

  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)}>
      {accents.map((c) => {
        const active = accent === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setAccent(c.id)}
            aria-pressed={active}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
              active
                ? 'border-brand bg-brand-soft ring-1 ring-brand/30'
                : 'border-border bg-surface hover:border-border-strong hover:bg-surface-2'
            )}
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg shadow-xs"
              style={{ backgroundColor: c.swatch }}
            >
              {active && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">{c.label}</span>
              <span className="block truncate text-2xs text-fg-muted">{c.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
