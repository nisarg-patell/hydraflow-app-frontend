import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ProgressRing from '../components/ProgressRing';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Droplet, Trash2, Flame, Activity } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, settingsRes, histRes] = await Promise.all([
        axios.get(`${API}/water/today`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
        axios.get(`${API}/water/history?days=7`, { withCredentials: true })
      ]);
      setLogs(todayRes.data.logs);
      setTotal(todayRes.data.total);
      setGoal(settingsRes.data.daily_goal || 2000);
      setHistory(histRes.data.history.reverse());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
    window.addEventListener('water-logged', fetchData);
    return () => window.removeEventListener('water-logged', fetchData);
  }, [fetchData]);

  const deleteLog = async (timestamp) => {
    try {
      await axios.delete(`${API}/water/log/${encodeURIComponent(timestamp)}`, { withCredentials: true });
      toast.success('Log deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Droplet className="w-8 h-8 text-primary animate-bounce" />
      </div>
    );
  }

  const remaining = Math.max(0, goal - total);
  const percentage = Math.min(100, Math.round((total / goal) * 100));
  
  let motivationMsg = "Stay hydrated today!";
  if (percentage === 0) motivationMsg = "Let's get started!";
  else if (percentage < 50) motivationMsg = "Keep going, you're doing great!";
  else if (percentage < 100) motivationMsg = `Almost there! Just ${remaining}ml to go!`;
  else motivationMsg = "Daily goal reached! Awesome job!";

  const chartData = history.map(h => ({
    day: new Date(h.date).toLocaleDateString('en-US', { weekday: 'narrow' }),
    amount: h.amount
  }));

  const avgIntake = history.length > 0 ? Math.round(history.reduce((a, b) => a + b.amount, 0) / history.length) : 0;
  const daysGoalMet = history.filter(h => h.amount >= goal).length;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-10 pb-32" data-testid="dashboard-page">
      {/* Header & Motivational Text */}
      <div className="animate-fade-in text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Hey, {user?.name || 'there'} 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base font-medium">
          {motivationMsg}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Widget 1: Progress Ring */}
        <div className="flex flex-col items-center justify-center pt-2 pb-4 animate-fade-in-delay-1 relative">
          <ProgressRing current={total} goal={goal} />
          <div className="mt-6 text-center">
            <span className="text-xs font-semibold bg-primary/10 text-primary px-4 py-2 rounded-full uppercase tracking-wider">
              {percentage}% of daily goal
            </span>
          </div>
        </div>

        {/* Widget 2: Stats Row */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-delay-2">
          <Card className="rounded-3xl shadow-none border border-border/60 bg-card/40 backdrop-blur-md transition-all hover:bg-card/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-none">{daysGoalMet}/7</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1.5">Goals Met</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-none border border-border/60 bg-card/40 backdrop-blur-md transition-all hover:bg-card/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-none">{avgIntake}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1.5">Avg ML/Day</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Widget 3: Mini Weekly Chart */}
        <Card className="rounded-3xl shadow-none border border-border/60 bg-card/40 backdrop-blur-md animate-fade-in-delay-2">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.amount >= goal ? "hsl(var(--primary))" : "hsl(var(--primary)/0.2)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-muted-foreground uppercase px-2">
              {chartData.map((d, i) => <span key={i}>{d.day}</span>)}
            </div>
          </CardContent>
        </Card>

        {/* Widget 4: Recent Logs */}
        <Card className="rounded-3xl shadow-none border border-border/60 bg-card/40 backdrop-blur-md animate-fade-in-delay-3">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Today's Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">No entries yet today. Tap + to start!</p>
            ) : (
              <div className="space-y-4">
                {logs.slice(0, 5).map((log, i) => {
                  const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          <Droplet className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-base leading-none">{log.amount}ml</span>
                          <span className="text-xs text-muted-foreground mt-1.5 font-medium">{log.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground/60">{time}</span>
                        <Button
                          variant="ghost" size="icon"
                          className="w-8 h-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteLog(log.timestamp)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
