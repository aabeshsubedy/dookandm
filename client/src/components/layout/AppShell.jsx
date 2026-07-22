import { useEffect, useState } from 'react';
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
  PanelLeftClose,
  PanelLeft,
  Link2,
} from 'lucide-react';
import { Logo } from '../brand/Logo.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { cn } from '../../lib/cn.js';
import { useAuthStore } from '../../store/authStore.js';
import { useLogout } from '../../hooks/data.js';

const SIDEBAR_KEY = 'dokaandm-sidebar-collapsed';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/settings/channels', label: 'Accounts', icon: Link2 },
];

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
}

function NavItems({ collapsed, onNavigate }) {
  return (
    <nav className={cn('flex flex-col gap-0.5', collapsed ? 'px-1.5' : 'px-2')}>
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2',
              isActive
                ? 'bg-brand-soft text-brand'
                : 'text-fg-secondary hover:bg-surface-2 hover:text-fg'
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {collapsed && (
                <span
                  className={cn(
                    'pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md',
                    'border border-border bg-surface px-2 py-1 text-xs font-medium text-fg shadow-md',
                    'opacity-0 transition-opacity group-hover:opacity-100'
                  )}
                >
                  {item.label}
                </span>
              )}
              {isActive && collapsed && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ collapsed, onToggle, onNavigate, showToggle = true }) {
  const plan = useAuthStore((s) => s.plan);

  return (
    <div className="flex h-full flex-col border-r border-border bg-surface">
      {/* Brand */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-border',
          collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-3'
        )}
      >
        {collapsed ? (
          <Logo showText={false} size="sm" />
        ) : (
          <Logo size="sm" />
        )}
        {showToggle && !collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg lg:inline-flex"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3">
        {!collapsed && (
          <p className="mb-1.5 px-4 text-2xs font-medium uppercase tracking-wider text-fg-muted">
            Workspace
          </p>
        )}
        <NavItems collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {/* Footer */}
      <div className={cn('shrink-0 space-y-1 border-t border-border', collapsed ? 'p-1.5' : 'p-2.5')}>
        {/* Plan */}
        <NavLink
          to="/settings/plan"
          onClick={onNavigate}
          title={collapsed ? `${plan?.label || 'Free'} plan` : undefined}
          className={cn(
            'group relative block rounded-lg transition-colors',
            collapsed
              ? 'flex justify-center p-2.5 text-fg-secondary hover:bg-surface-2 hover:text-fg'
              : 'border border-border bg-surface-2/50 p-3 hover:bg-surface-2'
          )}
        >
          {collapsed ? (
            <>
              <Sparkles className="h-4 w-4 text-brand" strokeWidth={1.75} />
              <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-fg shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                {plan?.label || 'Free'} plan
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-fg">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={1.75} />
                <span className="truncate text-sm font-medium capitalize">
                  {plan?.label || 'Free'} plan
                </span>
              </div>
              {plan && plan.limits?.ordersPerMonth != null && (
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-2xs text-fg-muted">
                    <span>Orders</span>
                    <span className="tabular-nums">
                      {plan.usage?.ordersThisPeriod ?? 0}/{plan.limits.ordersPerMonth}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-brand/80 transition-all"
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
            </>
          )}
        </NavLink>

        {/* Settings — appearance, accent colors, plan & usage */}
        <NavLink
          to="/settings/plan"
          onClick={onNavigate}
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2',
              isActive
                ? 'bg-brand-soft text-brand'
                : 'text-fg-secondary hover:bg-surface-2 hover:text-fg'
            )
          }
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {!collapsed && <span className="truncate">Settings</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-fg shadow-md opacity-0 transition-opacity group-hover:opacity-100">
              Settings
            </span>
          )}
        </NavLink>

        {/* Expand when collapsed */}
        {showToggle && collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-lg py-2.5 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const seller = useAuthStore((s) => s.seller);
  const navigate = useNavigate();
  const logout = useLogout();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((c) => !c);

  return (
    <div className="flex h-full bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[68px]' : 'w-56'
        )}
      >
        <div
          className={cn(
            'fixed inset-y-0 left-0 transition-[width] duration-200 ease-out',
            collapsed ? 'w-[68px]' : 'w-56'
          )}
        >
          <SidebarContent collapsed={collapsed} onToggle={toggleCollapsed} />
        </div>
      </aside>

      {/* Mobile drawer — always expanded labels */}
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
            <SidebarContent
              collapsed={false}
              showToggle={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main */}
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
              <button
                type="button"
                className="flex items-center rounded-full ring-2 ring-transparent transition hover:ring-border-strong"
              >
                <Avatar name={seller?.businessName || seller?.fullName} size="sm" />
              </button>
              <div className="invisible absolute right-0 top-full z-30 mt-1.5 w-48 rounded-lg border border-border bg-surface py-1 opacity-0 shadow-md transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => navigate('/settings/plan')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg"
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button
                  type="button"
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
