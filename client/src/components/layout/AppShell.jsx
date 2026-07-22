import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  ShoppingBag,
  Package,
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
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '../brand/Logo.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { cn } from '../../lib/cn.js';
import { useAuthStore } from '../../store/authStore.js';
import { useLogout } from '../../hooks/data.js';

const SIDEBAR_KEY = 'dokaandm-sidebar-collapsed';

/** Grouped navigation — mirrors how sellers think about the product. */
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Sell',
    items: [
      { to: '/inbox', label: 'Inbox', icon: Inbox },
      { to: '/orders', label: 'Orders', icon: ShoppingBag },
      { to: '/products', label: 'Products', icon: Package },
    ],
  },
  {
    label: 'Customers',
    items: [
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/reminders', label: 'Reminders', icon: Bell },
    ],
  },
  {
    label: 'Setup',
    items: [{ to: '/settings/channels', label: 'Accounts', icon: Link2 }],
  },
];

/** Resolve a calm page title for the top bar from the current path. */
function usePageMeta(pathname) {
  if (pathname === '/') return { title: 'Dashboard', section: 'Overview' };
  if (pathname.startsWith('/inbox')) return { title: 'Inbox', section: 'Sell' };
  if (pathname.startsWith('/orders')) return { title: 'Orders', section: 'Sell' };
  if (pathname.startsWith('/products')) return { title: 'Products', section: 'Sell' };
  if (pathname.startsWith('/customers')) return { title: 'Customers', section: 'Customers' };
  if (pathname.startsWith('/reminders')) return { title: 'Reminders', section: 'Customers' };
  if (pathname.startsWith('/settings/channels')) return { title: 'Accounts', section: 'Setup' };
  if (pathname.startsWith('/settings/plan')) return { title: 'Settings', section: 'Workspace' };
  return { title: 'DokaanDM', section: null };
}

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
}

function NavTooltip({ children }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute left-full z-50 ml-2.5 whitespace-nowrap rounded-lg',
        'border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-fg shadow-md',
        'opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100'
      )}
    >
      {children}
    </span>
  );
}

function NavItem({ to, label, icon: Icon, end, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
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
          {/* Active rail — always, for orientation */}
          <span
            className={cn(
              'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full transition-colors',
              isActive ? 'bg-brand' : 'bg-transparent'
            )}
            aria-hidden
          />
          <Icon
            className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-current')}
            aria-hidden
            strokeWidth={1.75}
          />
          {!collapsed && <span className="truncate">{label}</span>}
          {collapsed && <NavTooltip>{label}</NavTooltip>}
        </>
      )}
    </NavLink>
  );
}

function NavItems({ collapsed, onNavigate }) {
  return (
    <div className={cn('flex flex-col', collapsed ? 'gap-3 px-1.5' : 'gap-4 px-2')}>
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="mb-1.5 px-2.5 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
              {group.label}
            </p>
          )}
          {collapsed && group.label !== NAV_GROUPS[0].label && (
            <div className="mx-auto mb-1.5 h-px w-6 bg-border" aria-hidden />
          )}
          <nav className="flex flex-col gap-0.5" aria-label={group.label}>
            {group.items.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}

function PlanMeter({ plan, collapsed, onNavigate }) {
  const limit = plan?.limits?.ordersPerMonth;
  const used = plan?.usage?.ordersThisPeriod ?? 0;
  const unlimited = limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const warn = !unlimited && pct >= 80;
  const danger = !unlimited && pct >= 90;
  const location = useLocation();
  const active = location.pathname.startsWith('/settings/plan');

  if (collapsed) {
    return (
      <NavLink
        to="/settings/plan"
        onClick={onNavigate}
        title={`${plan?.label || 'Free'} plan`}
        className={cn(
          'group relative flex items-center justify-center rounded-lg p-2.5 transition-colors',
          active
            ? 'bg-brand-soft text-brand'
            : 'text-fg-secondary hover:bg-surface-2 hover:text-fg'
        )}
      >
        <Sparkles className="h-4 w-4 text-brand" strokeWidth={1.75} />
        <NavTooltip>{plan?.label || 'Free'} plan</NavTooltip>
      </NavLink>
    );
  }

  return (
    <NavLink
      to="/settings/plan"
      onClick={onNavigate}
      className={cn(
        'block rounded-xl border p-3 transition-colors',
        active
          ? 'border-brand/30 bg-brand-soft/50'
          : 'border-border bg-bg hover:border-border-strong hover:bg-surface-2/60'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold capitalize tracking-tight text-fg">
            {plan?.label || 'Free'} plan
          </p>
          <p className="text-2xs text-fg-muted">View usage &amp; plans</p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-fg-muted opacity-50" />
      </div>
      {!unlimited && (
        <div className="mt-2.5">
          <div className="mb-1 flex justify-between text-2xs text-fg-muted">
            <span>Orders this month</span>
            <span className="tabular-nums font-medium text-fg-secondary">
              {used}/{limit}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                danger ? 'bg-danger/70' : warn ? 'bg-warning/70' : 'bg-brand/70'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </NavLink>
  );
}

function SidebarContent({ collapsed, onToggle, onNavigate, showToggle = true }) {
  const plan = useAuthStore((s) => s.plan);
  const location = useLocation();
  const settingsActive = location.pathname.startsWith('/settings/plan');

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
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg transition-opacity hover:opacity-80"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <Logo showText={false} size="sm" />
          </button>
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
        <NavItems collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      {/* Footer */}
      <div
        className={cn(
          'shrink-0 space-y-1 border-t border-border',
          collapsed ? 'p-1.5' : 'space-y-1.5 p-2.5'
        )}
      >
        <PlanMeter plan={plan} collapsed={collapsed} onNavigate={onNavigate} />

        <NavLink
          to="/settings/plan"
          onClick={onNavigate}
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2',
            settingsActive
              ? 'bg-brand-soft text-brand'
              : 'text-fg-secondary hover:bg-surface-2 hover:text-fg'
          )}
        >
          <span
            className={cn(
              'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full',
              settingsActive ? 'bg-brand' : 'bg-transparent'
            )}
            aria-hidden
          />
          <Settings className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {!collapsed && <span className="truncate">Settings</span>}
          {collapsed && <NavTooltip>Settings</NavTooltip>}
        </NavLink>

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

function UserMenu({ seller, plan }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const logout = useLogout();
  const displayName = seller?.businessName || seller?.fullName || 'Workspace';

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-bg py-1 pl-1 pr-2 transition-colors',
          'hover:border-border-strong hover:bg-surface-2/60',
          open && 'border-border-strong bg-surface-2/60'
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <Avatar
          name={displayName}
          size="sm"
          className="h-7 w-7 text-2xs ring-2 ring-border/40"
        />
        <span className="hidden min-w-0 max-w-[9rem] text-left sm:block">
          <span className="block truncate text-xs font-semibold leading-tight text-fg">
            {displayName}
          </span>
          {seller?.fullName && seller?.businessName && (
            <span className="block truncate text-2xs leading-tight text-fg-muted">
              {seller.fullName}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'hidden h-3.5 w-3.5 shrink-0 text-fg-muted transition-transform sm:block',
            open && 'rotate-180'
          )}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-fade-in"
        >
          <div className="border-b border-border bg-bg px-3.5 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={displayName} size="md" className="ring-2 ring-border/50" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{displayName}</p>
                {seller?.fullName && (
                  <p className="truncate text-xs text-fg-muted">{seller.fullName}</p>
                )}
                {plan?.label && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-brand-soft px-1.5 py-0.5 text-2xs font-medium capitalize text-brand">
                    <Sparkles className="h-3 w-3" strokeWidth={2} />
                    {plan.label} plan
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate('/settings/plan');
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate('/settings/channels');
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Link2 className="h-4 w-4" strokeWidth={1.75} />
              Accounts
            </button>
          </div>

          <div className="border-t border-border py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout.mutate();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-danger transition-colors hover:bg-danger-soft"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const seller = useAuthStore((s) => s.seller);
  const plan = useAuthStore((s) => s.plan);
  const location = useLocation();
  const page = usePageMeta(location.pathname);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const toggleCollapsed = () => setCollapsed((c) => !c);

  return (
    <div className="flex h-full bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-30 transition-[width] duration-200 ease-out',
            collapsed ? 'w-[68px]' : 'w-60'
          )}
        >
          <SidebarContent collapsed={collapsed} onToggle={toggleCollapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-overlay/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-60 shadow-lg animate-slide-in-right">
            <button
              type="button"
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

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
            {/* Left: mobile nav + page context */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                className="rounded-lg p-1.5 text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="lg:hidden">
                <Logo showText={false} size="sm" />
              </div>

              <div className="hidden h-5 w-px bg-border lg:hidden" />

              <div className="min-w-0">
                {page.section && (
                  <p className="hidden text-2xs font-medium uppercase tracking-wider text-fg-muted sm:block">
                    {page.section}
                  </p>
                )}
                <h1 className="truncate text-sm font-semibold tracking-tight text-fg sm:text-base">
                  {page.title}
                </h1>
              </div>
            </div>

            {/* Right: tools + account */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <ThemeToggle
                size="sm"
                className="rounded-lg border border-transparent hover:border-border hover:bg-surface-2"
              />

              <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />

              <UserMenu seller={seller} plan={plan} />
            </div>
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
