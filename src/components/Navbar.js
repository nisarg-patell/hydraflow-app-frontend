import { NavLink } from 'react-router-dom';
import { Droplet, BarChart3, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary text-primary-foreground shadow-md'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border" data-testid="navbar">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Droplet className="w-7 h-7 text-primary" />
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              HydroFlow
            </span>
          </div>

          <div className="flex items-center gap-1">
            <NavLink to="/" className={linkClass} data-testid="nav-dashboard">
              <Droplet className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink to="/history" className={linkClass} data-testid="nav-history">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </NavLink>
            <NavLink to="/settings" className={linkClass} data-testid="nav-settings">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              data-testid="theme-toggle"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full text-muted-foreground hover:text-destructive"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
