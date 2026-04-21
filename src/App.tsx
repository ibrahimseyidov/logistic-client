import * as React from "react";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login/page";
import AppShell from "./common/components/layout/appShell/AppShell";
// import RequireAuth from "./common/components/auth/RequireAuth";
import SorgularPage from "./pages/sorgular/page";
import SorguDetailPage from "./pages/sorgular/detail/page";
import SifarislerPage from "./pages/sifarisler/page";
import TapshiriqlarPage from "./pages/tapshiriqlar/page";
import MusterilerPage from "./pages/musteriler/page";
import MusteriDetailPage from "./pages/musteriler/detail/page";
import AyarlarPage from "./pages/ayarlar/page";
import RequireAuth from "./common/components/auth/RequireAuth";

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
              path="/sifarisler"
              element={
                <RequireAuth>
                  <SifarislerPage />
                </RequireAuth>
              }
            />
            <Route
              path="/tapshiriqlar"
              element={
                <RequireAuth>
                  <TapshiriqlarPage />
                </RequireAuth>
              }
            />
            <Route
              path="/musteriler"
              element={
                <RequireAuth>
                  <MusterilerPage />
                </RequireAuth>
              }
            />
            <Route
              path="/musteriler/:customerId"
              element={
                <RequireAuth>
                  <MusteriDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/ayarlar"
              element={
                  <RequireAuth>
                  <AyarlarPage />
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
