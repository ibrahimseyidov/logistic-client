import * as React from "react";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/dashboard/page";
import LoginPage from "./pages/login/page";
import ProductsPage from "./pages/products/page";
import CategoriesPage from "./pages/categories/page";
import AppShell from "./common/components/layout/appShell/AppShell";
import RequireAuth from "./common/components/auth/RequireAuth";

function App() {
  return (
    <Theme appearance="light" accentColor="indigo">
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </Theme>
  );
}

export default App;
