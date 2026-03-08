import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import BottomNav from "./components/BottomNav";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import CatalogPage from "./pages/CatalogPage";
import DashboardPage from "./pages/DashboardPage";
import DoctorsPage from "./pages/DoctorsPage";
import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import RemindersPage from "./pages/RemindersPage";
import VisitsPage from "./pages/VisitsPage";

export type AppTab =
  | "dashboard"
  | "doctors"
  | "products"
  | "catalog"
  | "visits"
  | "reminders";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-teal flex items-center justify-center animate-pulse">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-white"
              stroke="currentColor"
              strokeWidth={2}
              aria-label="Loading"
              role="img"
            >
              <title>Loading</title>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
            </svg>
          </div>
          <p className="text-sidebar-foreground font-sans text-sm">
            Loading Realmed MR Tracker…
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 content-safe overflow-hidden">
        {activeTab === "dashboard" && (
          <DashboardPage onNavigate={setActiveTab} />
        )}
        {activeTab === "doctors" && <DoctorsPage />}
        {activeTab === "products" && <ProductsPage />}
        {activeTab === "catalog" && <CatalogPage />}
        {activeTab === "visits" && <VisitsPage />}
        {activeTab === "reminders" && <RemindersPage />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster />
    </div>
  );
}
