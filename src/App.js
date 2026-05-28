import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallPrompt from "./components/InstallPrompt";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import GlobalQuickAdd from "./components/GlobalQuickAdd";
import WidgetQuickAdd from "./pages/widgets/WidgetQuickAdd";
import WidgetProgress from "./pages/widgets/WidgetProgress";
import WidgetOneTap from "./pages/widgets/WidgetOneTap";
import WidgetStats from "./pages/widgets/WidgetStats";
import WidgetCompact from "./pages/widgets/WidgetCompact";
import WidgetLogList from "./pages/widgets/WidgetLogList";
import WidgetMiniBar from "./pages/widgets/WidgetMiniBar";

function AppContent() {
  const location = useLocation();
  const isWidget = location.pathname.startsWith('/widget');

  return (
    <>
      <div className={`min-h-screen bg-background ${isWidget ? '' : 'pb-20 sm:pb-0'}`}>
        {!isWidget && <Navbar />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          {/* Widget routes - standalone mini pages for home screen */}
          <Route path="/widget/quick-add" element={<WidgetQuickAdd />} />
          <Route path="/widget/progress" element={<WidgetProgress />} />
          <Route path="/widget/one-tap" element={<WidgetOneTap />} />
          <Route path="/widget/stats" element={<WidgetStats />} />
          <Route path="/widget/compact" element={<WidgetCompact />} />
          <Route path="/widget/log-list" element={<WidgetLogList />} />
          <Route path="/widget/mini-bar" element={<WidgetMiniBar />} />
        </Routes>
        {!isWidget && <GlobalQuickAdd />}
      </div>
      <Toaster position="bottom-center" richColors />
      {!isWidget && <InstallPrompt />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
