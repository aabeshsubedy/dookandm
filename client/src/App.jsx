import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { useSessionBootstrap } from './hooks/useSession.js';
import { useRealtime } from './hooks/useRealtime.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { Toaster } from './components/ui/Toaster.jsx';
import { Spinner, LoadingPanel } from './components/ui/Skeleton.jsx';
import { Logo } from './components/brand/Logo.jsx';

// Public marketing + auth load eagerly for first paint.
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// App pages code-split (keeps Recharts etc. out of the initial bundle).
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const InboxPage = lazy(() => import('./pages/InboxPage.jsx'));
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'));
const ProductsPage = lazy(() => import('./pages/ProductsPage.jsx'));
const CustomersPage = lazy(() => import('./pages/CustomersPage.jsx'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage.jsx'));
const RemindersPage = lazy(() => import('./pages/RemindersPage.jsx'));
const ChannelsPage = lazy(() => import('./pages/ChannelsPage.jsx'));
const PlanPage = lazy(() => import('./pages/PlanPage.jsx'));

function FullScreenLoader() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg">
      <Logo size="lg" />
      <Spinner className="h-6 w-6" />
    </div>
  );
}

function Protected({ children }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'anonymous') return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/** Guest sees marketing home; signed-in users get the app shell. */
function AppRoutes() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') return <FullScreenLoader />;

  if (status === 'anonymous') {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Deep links into the app send guests to sign-in */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route
        path="/*"
        element={
          <Protected>
            <AppShell>
              <Suspense fallback={<LoadingPanel />}>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/inbox/:conversationId" element={<InboxPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/customers/:id" element={<CustomerDetailPage />} />
                  <Route path="/reminders" element={<RemindersPage />} />
                  <Route path="/settings/channels" element={<ChannelsPage />} />
                  <Route path="/settings/plan" element={<PlanPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </AppShell>
          </Protected>
        }
      />
    </Routes>
  );
}

export default function App() {
  useSessionBootstrap();
  useRealtime();

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}
