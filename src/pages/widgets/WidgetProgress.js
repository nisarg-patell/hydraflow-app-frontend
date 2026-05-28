import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Droplet, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../LoginPage';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WidgetProgress() {
  const { user, loading } = useAuth();
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);

  const fetchData = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        axios.get(`${API}/water/today`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
      ]);
      setTotal(t.data.total);
      setGoal(s.data.daily_goal || 2000);
    } catch { /* Handled globally */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWater = async (amount) => {
    try {
      await axios.post(`${API}/water/log`, { amount, label: 'Glass' }, { withCredentials: true });
      fetchData();
    } catch { /* fail silently in widget */ }
  };

  if (loading) return null;
  
  if (!user) return (
    <div className="min-h-screen bg-background">
      <LoginPage />
    </div>
  );

  const size = 200;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min((total / goal) * 100, 100);
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6" data-testid="widget-progress">
      <a href="/" className="absolute top-3 right-3 text-muted-foreground hover:text-primary" data-testid="widget-open-app-link">
        <ExternalLink className="w-4 h-4" />
      </a>

      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={pct >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
            strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Droplet className="w-5 h-5 text-primary mb-1" />
          <span className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{total}</span>
          <span className="text-xs text-muted-foreground">/ {goal} ml</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        {[100, 250, 500].map((amt) => (
          <button
            key={amt}
            onClick={() => addWater(amt)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 border-border bg-card hover:border-primary hover:bg-primary/5 active:scale-95 transition-all text-sm font-semibold"
            data-testid={`widget-progress-add-${amt}-btn`}
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            {amt}ml
          </button>
        ))}
      </div>
    </div>
  );
}
