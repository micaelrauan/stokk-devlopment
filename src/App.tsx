import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
const LabelsPage = lazy(() => import("./pages/LabelsPage"));
const ReaderPage = lazy(() => import("./pages/ReaderPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const SalesHistoryPage = lazy(() => import("./pages/SalesHistoryPage"));
const StockPage = lazy(() => import("./pages/StockPage"));
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.default })),
);
const AdminDashboard = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminDashboard })),
);
const AdminUsers = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminUsers })),
);
const AdminPlans = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPlans })),
);
const AdminActivity = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminActivity })),
);
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPage />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="planos" element={<AdminPlans />} />
                <Route path="atividade" element={<AdminActivity />} />
              </Route>

              {/* Protected app routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <DashboardPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/produtos"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <ProductsPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendas"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <SalesPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historico"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <SalesHistoryPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/estoque"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <StockPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operacoes"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <OperationsPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/etiquetas"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <LabelsPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leitor"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <ReaderPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/avisos"
                element={
                  <ProtectedRoute>
                    <InventoryProvider>
                      <AppLayout>
                        <AlertsPage />
                      </AppLayout>
                    </InventoryProvider>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
