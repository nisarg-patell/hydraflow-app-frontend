import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Droplet, Plus, ExternalLink } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WidgetCompact() {
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [flash, setFlash] = useState(null);
  const [authed, setAuthed] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        axios.get(`${API}/water/today`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
      ]);
      setTotal(t.data.total);
      setGoal(s.data.daily_goal || 2000);
    } catch { setAuthed(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWater = async (amount) => {
    try {
      await axios.post(`${API}/water/log`, { amount, label: 'Quick' }, { withCredentials: true });
      setFlash(amount);
      setTimeout(() => setFlash(null), 1000);
      fetchData();
    } catch { setAuthed(false); }
  };

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <a href="/" className="text-primary underline text-sm" data-testid="widget-login-link">Open app to sign in</a>
    </div>
  );

  const pct = Math.min((total / goal) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-5" data-testid="widget-compact">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-primary" />
          <span className="font-bold text-xs" style={{ fontFamily: 'Outfit, sans-serif' }}>HydroFlow</span>
        </div>
        <a href="/" className="text-muted-foreground hover:text-primary" data-testid="widget-open-app-link">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Center - progress + number */}
      <div className="flex flex-col items-center gap-3 flex-1 justify-center">
        <div className="text-center">
          <span className="text-4xl font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>{total}</span>
          <span className="text-sm text-muted-foreground"> / {goal}ml</span>
        </div>
        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
          />
        </div>
        {flash && (
          <span className="text-sm font-semibold text-primary animate-fade-in">+{flash}ml</span>
        )}
      </div>

      {/* Bottom - row of buttons */}
      <div className="w-full grid grid-cols-4 gap-2">
        {[100, 250, 350, 500].map((amt) => (
          <button
            key={amt}
            onClick={() => addWater(amt)}
            className="flex flex-col items-center py-3 rounded-2xl border border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-95 transition-all"
            data-testid={`widget-compact-add-${amt}-btn`}
          >
            <Plus className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold mt-0.5">{amt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
