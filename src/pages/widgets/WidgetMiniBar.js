import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Droplet, Plus, ExternalLink } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WidgetMiniBar() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [authed, setAuthed] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [t, s, h] = await Promise.all([
        axios.get(`${API}/water/today`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
        axios.get(`${API}/water/history?days=7`, { withCredentials: true }),
      ]);
      setTotal(t.data.total);
      setGoal(s.data.daily_goal || 2000);
      setHistory(h.data.history);
    } catch { setAuthed(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWater = async (amount) => {
    try {
      await axios.post(`${API}/water/log`, { amount, label: 'Quick' }, { withCredentials: true });
      fetchData();
    } catch { setAuthed(false); }
  };

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <a href="/" className="text-primary underline text-sm" data-testid="widget-login-link">Open app to sign in</a>
    </div>
  );

  const maxAmount = Math.max(goal, ...history.map(h => h.amount), 1);

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 gap-4" data-testid="widget-mini-bar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Week View</span>
        </div>
        <a href="/" className="text-muted-foreground hover:text-primary" data-testid="widget-open-app-link">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Today highlight */}
      <div className="text-center">
        <span className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{total}</span>
        <span className="text-sm text-muted-foreground"> / {goal}ml today</span>
      </div>

      {/* Mini bar chart */}
      <div className="flex-1 flex items-end justify-center gap-2 px-2 min-h-[120px]">
        {history.map((day, i) => {
          const height = Math.max((day.amount / maxAmount) * 100, 4);
          const isToday = i === history.length - 1;
          const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' });
          const metGoal = day.amount >= goal;
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[9px] text-muted-foreground">{day.amount > 0 ? day.amount : ''}</span>
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  metGoal ? 'bg-green-500' : isToday ? 'bg-primary' : 'bg-primary/40'
                }`}
                style={{ height: `${height}%`, minHeight: '4px' }}
              />
              <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{dayLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Goal line label */}
      <p className="text-center text-[10px] text-muted-foreground">Green = goal met ({goal}ml)</p>

      {/* Quick add */}
      <div className="flex gap-2">
        {[250, 500].map((amt) => (
          <button
            key={amt}
            onClick={() => addWater(amt)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-border bg-card hover:border-primary active:scale-95 transition-all font-semibold text-sm"
            data-testid={`widget-bar-add-${amt}-btn`}
          >
            <Plus className="w-4 h-4 text-primary" />
            {amt}ml
          </button>
        ))}
      </div>
    </div>
  );
}
