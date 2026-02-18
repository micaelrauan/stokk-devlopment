import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { lazy, Suspense } from "react";

// Lazy load pages for code-splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const FinancePanel = lazy(() => import("./components/FinancePanel"));
const LabelsPage = lazy(() => import("./pages/LabelsPage"));
const ReaderPage = lazy(() => import("./pages/ReaderPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const SalesHistoryPage = lazy(() => import("./pages/SalesHistoryPage"));
const StockPage = lazy(() => import("./pages/StockPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Layout route: single InventoryProvider shared across all app pages */
function AppRouteLayout() {
  return (
    <ProtectedRoute>
      <InventoryProvider>
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </AppLayout>
      </InventoryProvider>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected app routes — single InventoryProvider for all */}
              <Route element={<AppRouteLayout />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/financeiro" element={<FinancePanel />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/vendas" element={<SalesPage />} />
                <Route path="/historico" element={<SalesHistoryPage />} />
                <Route path="/estoque" element={<StockPage />} />
                <Route path="/operacoes" element={<OperationsPage />} />
                <Route path="/etiquetas" element={<LabelsPage />} />
                <Route path="/leitor" element={<ReaderPage />} />
                <Route path="/avisos" element={<AlertsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
