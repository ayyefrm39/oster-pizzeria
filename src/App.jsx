import { useEffect, lazy, Suspense } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { I18nProvider } from '@/lib/i18n';
import { CartProvider } from '@/lib/cart';
import { SettingsProvider } from '@/lib/settings';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
const MenuPage = lazy(() => import('@/pages/Menu'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderConfirmation = lazy(() => import('@/pages/OrderConfirmation'));
const Login = lazy(() => import('@/pages/Login'));
const AdminLayout = lazy(() => import('@/components/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminMenuManagement = lazy(() => import('@/pages/admin/AdminMenuManagement'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminOperations = lazy(() => import('@/pages/admin/AdminOperations'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<div className="p-10 text-center text-stone-500">Laddar…</div>}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/meny" element={<MenuPage />} />
        <Route path="/varukorg" element={<Cart />} />
        <Route path="/kassa" element={<Checkout />} />
        <Route path="/order/:id" element={<OrderConfirmation />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
      <Route path="/reset-password" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/meny" element={<AdminMenuManagement />} />
          <Route path="/admin/kategorier" element={<AdminCategories />} />
          <Route path="/admin/drift" element={<AdminOperations />} />
          <Route path="/admin/installningar" element={<AdminSettings />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function ApiErrors() {
  const {toast}=useToast();
  useEffect(()=>{const show=e=>{if(e.detail.status!==401)toast({title:'Åtgärden misslyckades',description:e.detail.message,variant:'destructive'});};const reject=e=>{if(e.reason?.response?.data)e.preventDefault();};window.addEventListener('unhandledrejection',reject);window.addEventListener('api-error',show);return ()=>{window.removeEventListener('api-error',show);window.removeEventListener('unhandledrejection',reject);};},[toast]);
  return null;
}
function App() {

  return (
    <AuthProvider>
      <ApiErrors />
      <QueryClientProvider client={queryClientInstance}>
        <I18nProvider>
          <CartProvider>
            <SettingsProvider>
              <Router>
                <ScrollToTop />
                <AuthenticatedApp />
              </Router>
            </SettingsProvider>
          </CartProvider>
        </I18nProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
