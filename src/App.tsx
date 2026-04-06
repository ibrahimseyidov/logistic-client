import * as React from "react";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/dashboard/page";
import LoginPage from "./pages/login/page";
import ProductsPage from "./pages/products/page";
import CategoriesPage from "./pages/categories/page";
import PurchasePage from "./pages/purchase/page";
import KassaEklePage from "./pages/settings/kassa-ekle/page";
import KassalarPage from "./pages/kasalar/page";
import AppShell from "./common/components/layout/appShell/AppShell";
import RequireAuth from "./common/components/auth/RequireAuth";
import SuppliersPage from "./pages/suppliers/page";
import SorgularPage from "./pages/sorgular/page";
import SorguDetailPage from "./pages/sorgular/detail/page";

function App() {
  return (
    <Theme appearance="light" accentColor="indigo">
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/sorgular"
              element={
                <RequireAuth>
                  <SorgularPage />
                </RequireAuth>
              }
            />
            <Route
              path="/sorgular/:sorguKey"
              element={
                <RequireAuth>
                  <SorguDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/products"
              element={
                <RequireAuth>
                  <ProductsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/categories"
              element={
                <RequireAuth>
                  <CategoriesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/suppliers"
              element={
                <RequireAuth>
                  <SuppliersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/purchase"
              element={
                <RequireAuth>
                  <PurchasePage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings/kassa-ekle"
              element={
                <RequireAuth>
                  <KassaEklePage />
                </RequireAuth>
              }
            />
            <Route
              path="/kasalar"
              element={
                <RequireAuth>
                  <KassalarPage />
                </RequireAuth>
              }
            />
            <Route path="/" element={<Navigate to="/sorgular" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </Theme>
  );
}

export default App;
