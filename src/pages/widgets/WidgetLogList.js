import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../LoginPage';
import axios from 'axios';
import { Droplet, ExternalLink, Trash2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WidgetLogList() {
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);

  const fetchData = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        axios.get(`${API}/water/today`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
      ]);
      setLogs(t.data.logs.slice(0, 5));
      setTotal(t.data.total);
      setGoal(s.data.daily_goal || 2000);
    } catch { /* silent fail */; }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWater = async () => {
    try {
      await axios.post(`${API}/water/log`, { amount: 250, label: 'Glass' }, { withCredentials: true });
      fetchData();
    } catch { /* silent fail */; }
  };

  const deleteLog = async (timestamp) => {
    try {
      await axios.delete(`${API}/water/log/${encodeURIComponent(timestamp)}`, { withCredentials: true });
      fetchData();
    } catch {}
  };

  if (loading) return null;
  
  if (!user) return (
    <div className="min-h-screen bg-background">
      <LoginPage />
    </div>
  );

  const pct = Math.min((total / goal) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 gap-3" data-testid="widget-log-list">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Today's Log</span>
        </div>
        <a href="/" className="text-muted-foreground hover:text-primary" data-testid="widget-open-app-link">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{total}/{goal}ml</span>
      </div>

      {/* Log entries */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-8">No entries yet</p>
        ) : (
          logs.map((log, i) => {
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border group">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Droplet className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{log.amount}ml</span>
                    <span className="text-xs text-muted-foreground ml-1.5">{log.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{time}</span>
                  <button
                    onClick={() => deleteLog(log.timestamp)}
                    className="w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    data-testid={`widget-delete-log-${i}-btn`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add button */}
      <button
        onClick={addWater}
        className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
        data-testid="widget-log-add-btn"
      >
        <Droplet className="w-4 h-4" />
        Add 250ml
      </button>
    </div>
  );
}

