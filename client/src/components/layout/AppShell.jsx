import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  ShoppingBag,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { Logo } from '../brand/Logo.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { cn } from '../../lib/cn.js';
import { useAuthStore } from '../../store/authStore.js';
import { useLogout } from '../../hooks/data.js';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reminders', label: 'Reminders', icon: Bell },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-soft text-brand'
                : 'text-fg-secondary hover:bg-surface-2 hover:text-fg'
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }) {
  const plan = useAuthStore((s) => s.plan);
  return (
    <div className="flex h-full flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center px-4">
        <Logo size="sm" />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <p className="mb-1.5 px-4 text-2xs font-medium uppercase tracking-wider text-fg-muted">
          Workspace
        </p>
        <NavItems onNavigate={onNavigate} />
      </div>

      <div className="space-y-1 border-t border-border p-3">
        <NavLink
          to="/settings/plan"
          onClick={onNavigate}
          className="block rounded-lg border border-border bg-surface-2/60 p-3 transition-colors hover:bg-surface-2"
        >
          <div className="flex items-center gap-2 text-fg">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span className="text-sm font-medium capitalize">{plan?.label || 'Free'} plan</span>
          </div>
          {plan && plan.limits?.ordersPerMonth != null && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-2xs text-fg-muted">
                <span>Orders</span>
                <span>
                  {plan.usage?.ordersThisPeriod ?? 0}/{plan.limits.ordersPerMonth}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{
                    width: `${Math.min(
                      100,
                      ((plan.usage?.ordersThisPeriod ?? 0) / plan.limits.ordersPerMonth) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </NavLink>
        <NavLink
          to="/settings/channels"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-soft text-brand'
                : 'text-fg-secondary hover:bg-surface-2 hover:text-fg'
            )
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const seller = useAuthStore((s) => s.seller);
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <div className="flex h-full bg-bg">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-56">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-overlay/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-56 shadow-lg animate-slide-in-right">
            <button
              className="absolute right-2 top-3 z-10 rounded-lg p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
          <button
            className="rounded-lg p-1.5 text-fg-secondary hover:bg-surface-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo showText={false} size="sm" />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle size="sm" />
            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-fg">{seller?.businessName}</p>
              <p className="text-xs text-fg-muted">{seller?.fullName}</p>
            </div>
            <div className="group relative">
              <button className="flex items-center rounded-full ring-2 ring-transparent transition hover:ring-border-strong">
                <Avatar name={seller?.businessName || seller?.fullName} size="sm" />
              </button>
              <div className="invisible absolute right-0 top-full z-30 mt-1.5 w-44 rounded-lg border border-border bg-surface py-1 opacity-0 shadow-md transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <button
                  onClick={() => navigate('/settings/plan')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg"
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button
                  onClick={() => logout.mutate()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
