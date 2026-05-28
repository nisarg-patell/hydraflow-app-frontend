import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Droplet, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WidgetOneTap() {
  const [searchParams] = useSearchParams();
  const amount = parseInt(searchParams.get('amount') || '250');
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [tapped, setTapped] = useState(false);
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

  const addWater = async () => {
    try {
      await axios.post(`${API}/water/log`, { amount, label: 'Quick' }, { withCredentials: true });
      setTapped(true);
      setTimeout(() => setTapped(false), 1500);
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6" data-testid="widget-one-tap">
      <a href="/" className="absolute top-3 right-3 text-muted-foreground hover:text-primary" data-testid="widget-open-app-link">
        <ExternalLink className="w-4 h-4" />
      </a>

      <p className="text-sm text-muted-foreground">{total}ml / {goal}ml ({pct.toFixed(0)}%)</p>

      {/* Big tap button */}
      <button
        onClick={addWater}
        className={`w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all duration-300 active:scale-90 ${
          tapped
            ? 'border-green-500 bg-green-500/10 scale-105'
            : 'border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10'
        }`}
        data-testid="widget-one-tap-btn"
      >
        <Droplet className={`w-10 h-10 transition-colors ${tapped ? 'text-green-500' : 'text-primary'}`} />
        <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {tapped ? 'Added!' : `+${amount}ml`}
        </span>
      </button>

      <p className="text-xs text-muted-foreground">Tap to add {amount}ml</p>
    </div>
  );
}
