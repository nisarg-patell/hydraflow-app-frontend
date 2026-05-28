import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Droplet, GlassWater, Coffee, Wine, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../LoginPage';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OPTIONS = [
  { amount: 100, label: 'Sip', icon: Droplet, color: '#38BDF8' },
  { amount: 250, label: 'Glass', icon: GlassWater, color: '#0EA5E9' },
  { amount: 350, label: 'Cup', icon: Coffee, color: '#0284C7' },
  { amount: 500, label: 'Bottle', icon: Wine, color: '#0369A1' },
];

export default function WidgetQuickAdd() {
  const { user, loading } = useAuth();
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [added, setAdded] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        axios.get(`${API}/water/today`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
      ]);
      setTotal(t.data.total);
      setGoal(s.data.daily_goal || 2000);
    } catch { /* Handled globally or silently fail */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWater = async (amount, label) => {
    try {
      await axios.post(`${API}/water/log`, { amount, label }, { withCredentials: true });
      setAdded(amount);
      setTimeout(() => setAdded(null), 1200);
      fetchData();
    } catch { /* fail silently in widget */ }
  };

  if (loading) return null;
  
  if (!user) return (
    <div className="min-h-screen bg-background">
      <LoginPage />
    </div>
  );

  const pct = Math.min((total / goal) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="widget-quick-add">
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Quick Add</span>
        </div>
        <a href="/" className="text-muted-foreground hover:text-primary" data-testid="widget-open-app-link">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{total}ml</span>
          <span>{goal}ml</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% of daily goal</p>
      </div>

      {/* Feedback */}
      {added && (
        <div className="px-4 pb-2 animate-fade-in">
          <div className="bg-primary/10 text-primary text-center text-sm font-medium py-2 rounded-2xl">
            +{added}ml added
          </div>
        </div>
      )}

      {/* 2x2 Grid */}
      <div className="flex-1 px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 h-full">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.amount}
                onClick={() => addWater(opt.amount, opt.label)}
                className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-95 transition-all duration-150"
                data-testid={`widget-add-${opt.amount}-btn`}
              >
                <Icon className="w-7 h-7" style={{ color: opt.color }} />
                <span className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{opt.amount}ml</span>
                <span className="text-xs text-muted-foreground">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
