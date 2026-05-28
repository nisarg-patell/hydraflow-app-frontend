import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../LoginPage';
import axios from 'axios';
import { Droplet, Target, TrendingUp, Plus, ExternalLink } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WidgetStats() {
  const { user, loading } = useAuth();
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [logCount, setLogCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        axios.get(`${API}/water/today`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
      ]);
      setTotal(t.data.total);
      setLogCount(t.data.logs.length);
      setGoal(s.data.daily_goal || 2000);
    } catch { /* silent fail */; }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWater = async (amount) => {
    try {
      await axios.post(`${API}/water/log`, { amount, label: 'Quick' }, { withCredentials: true });
      fetchData();
    } catch { /* silent fail */; }
  };

  if (loading) return null;
  
  if (!user) return (
    <div className="min-h-screen bg-background">
      <LoginPage />
    </div>
  );

  const pct = Math.min((total / goal) * 100, 100);
  const remaining = Math.max(goal - total, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 gap-4" data-testid="widget-stats">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Today's Stats</span>
        </div>
        <a href="/" className="text-muted-foreground hover:text-primary" data-testid="widget-open-app-link">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Big number */}
      <div className="text-center py-3">
        <span className="text-5xl font-bold text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>{total}</span>
        <span className="text-lg text-muted-foreground ml-1">ml</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Target className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{goal}ml</p>
          <p className="text-[10px] text-muted-foreground">Goal</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{remaining}ml</p>
          <p className="text-[10px] text-muted-foreground">Left</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Droplet className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{logCount}</p>
          <p className="text-[10px] text-muted-foreground">Entries</p>
        </div>
      </div>

      {/* Quick add */}
      <div className="flex gap-2 mt-auto">
        {[250, 500].map((amt) => (
          <button
            key={amt}
            onClick={() => addWater(amt)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-95 transition-all font-semibold text-sm"
            data-testid={`widget-stats-add-${amt}-btn`}
          >
            <Plus className="w-4 h-4 text-primary" />
            {amt}ml
          </button>
        ))}
      </div>
    </div>
  );
}

