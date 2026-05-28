import { NavLink } from 'react-router-dom';
import { Droplet, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  if (!user) return null;

  const linkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${
      isActive
        ? 'text-primary'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]" data-testid="navbar">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        <NavLink to="/" className={linkClass} data-testid="nav-dashboard">
          <Droplet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </NavLink>
        <NavLink to="/history" className={linkClass} data-testid="nav-history">
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-medium">History</span>
        </NavLink>
        <NavLink to="/settings" className={linkClass} data-testid="nav-settings">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium">Settings</span>
        </NavLink>
      </div>
    </nav>
  );
}
