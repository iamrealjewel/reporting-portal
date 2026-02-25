import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import ImportStock from "./pages/ImportStock";
import ImportSales from "./pages/ImportSales";
import StockReport from "./pages/StockReport";
import SalesReport from "./pages/SalesReport";
import Dashboard from "./pages/Dashboard";
import SalesSummaries from "./pages/SalesSummaries";
import StockSummaries from "./pages/StockSummaries";
import { Toaster } from "sonner";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">Initializing Session...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            {/* Dashboard currently redirects to Stock Report as it is the primary functional view */}
            <Route index element={<Dashboard />} />
            <Route path="sales-summaries" element={<SalesSummaries />} />
            <Route path="stock-summaries" element={<StockSummaries />} />
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="permissions" element={<Permissions />} />
            <Route path="import-stock" element={<ImportStock />} />
            <Route path="import-sales" element={<ImportSales />} />
            <Route path="stock-report" element={<StockReport />} />
            <Route path="sales-report" element={<SalesReport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
