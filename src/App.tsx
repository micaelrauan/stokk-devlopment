import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import LabelsPage from "./pages/LabelsPage";
import ReaderPage from "./pages/ReaderPage";
import OperationsPage from "./pages/OperationsPage";
import AlertsPage from "./pages/AlertsPage";
import SalesPage from "./pages/SalesPage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import StockPage from "./pages/StockPage";
import AdminPage, { AdminDashboard, AdminUsers, AdminPlans, AdminActivity } from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsers />} />
              <Route path="planos" element={<AdminPlans />} />
              <Route path="atividade" element={<AdminActivity />} />
            </Route>

            {/* Protected app routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/produtos" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <ProductsPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/vendas" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <SalesPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/historico" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <SalesHistoryPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/estoque" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <StockPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/operacoes" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <OperationsPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/etiquetas" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <LabelsPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/leitor" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <ReaderPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="/avisos" element={
              <ProtectedRoute>
                <InventoryProvider>
                  <AppLayout>
                    <AlertsPage />
                  </AppLayout>
                </InventoryProvider>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
