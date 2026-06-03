import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ProgressRing from '../components/ProgressRing';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Droplet, Trash2, Flame, Activity, Dumbbell, Stethoscope } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import LiquidBackground from '../components/LiquidBackground';
import HydraPlant from '../components/HydraPlant';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [goal, setGoal] = useState(2000);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState(false);
  const [urineColor, setUrineColor] = useState(3);

  const updateModifier = async (field, value) => {
    try {
      await axios.post(`${API}/daily-modifiers`, { [field]: value }, { withCredentials: true });
      if (field === 'workout') setWorkout(value);
      if (field === 'urine_color') setUrineColor(value);
      fetchData();
    } catch (e) {}
  };

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, settingsRes, histRes] = await Promise.all([
        axios.get(`${API}/water/today`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
        axios.get(`${API}/water/history?days=7`, { withCredentials: true })
      ]);
      setLogs(todayRes.data.logs);
      setTotal(todayRes.data.total);
      setGoal(todayRes.data.dynamic_goal || settingsRes.data.daily_goal || 2000);
      setHistory(histRes.data.history.reverse());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
    const handleWaterLogged = () => {
      fetchData();
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_NOTIFICATION' });
      }
    };
    const handleOptimistic = (e) => {
      setTotal(prev => prev + e.detail.amount);
    };
    window.addEventListener('water-logged', handleWaterLogged);
    window.addEventListener('optimistic-water-logged', handleOptimistic);
    return () => {
      window.removeEventListener('water-logged', handleWaterLogged);
      window.removeEventListener('optimistic-water-logged', handleOptimistic);
    };
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

  const currentHour = new Date().getHours() + (new Date().getMinutes() / 60);
  const startHour = 8;
  const activeHours = 14;
  let expectedPace = 0;
  if (currentHour < startHour) expectedPace = 0;
  else if (currentHour >= startHour + activeHours) expectedPace = goal;
  else expectedPace = goal * ((currentHour - startHour) / activeHours);
  
  let paceStatus = 'on-track';
  if (total < expectedPace - 250) paceStatus = 'behind';
  else if (total > expectedPace + 250) paceStatus = 'ahead';

  return (
    <>
    <LiquidBackground percentage={percentage} />
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-10 pb-32 relative z-10" data-testid="dashboard-page">
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
        
        {/* Widget 1.5: Pace Maker Banner & Hydra Plant */}
        <div className="animate-fade-in-delay-2 space-y-4">
          {paceStatus === 'behind' && (
            <div className="bg-orange-500/10 text-orange-600 rounded-2xl p-4 text-sm font-medium text-center shadow-sm">
              You're {Math.round(expectedPace - total)}ml behind schedule! Drink a glass now to catch up.
            </div>
          )}
          {paceStatus === 'ahead' && (
            <div className="bg-pink-500/10 text-pink-600 rounded-2xl p-4 text-sm font-medium text-center shadow-sm">
              You're ahead of schedule! Great pacing today.
            </div>
          )}
          <HydraPlant paceStatus={paceStatus} />
        </div>

        {/* Widget 2: Health Check */}
        <Card className="rounded-3xl shadow-none border border-border/60 bg-card/40 backdrop-blur-md animate-fade-in-delay-2">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Stethoscope className="w-4 h-4" /> Daily Health Check
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Workout Today?</p>
                  <p className="text-[10px] text-muted-foreground">+500ml to daily goal</p>
                </div>
              </div>
              <Switch checked={workout} onCheckedChange={(v) => updateModifier('workout', v)} />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <Droplet className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Urine Color</p>
                  <p className="text-[10px] text-muted-foreground">Adjusts hydration needs</p>
                </div>
              </div>
              <div className="px-2">
                <Slider 
                  value={[urineColor]} 
                  min={1} max={5} step={1} 
                  onValueChange={(v) => setUrineColor(v[0])}
                  onValueCommit={(v) => updateModifier('urine_color', v[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>Clear</span>
                  <span>Normal</span>
                  <span>Dark</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget 3: Stats Row */}
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
    </>
  );
}
