import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Droplet, TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [goal, setGoal] = useState(2000);
  const [days, setDays] = useState('7');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [histRes, settingsRes] = await Promise.all([
        axios.get(`${API}/water/history?days=${days}`, { withCredentials: true }),
        axios.get(`${API}/settings`, { withCredentials: true }),
      ]);
      setHistory(histRes.data.history);
      setGoal(settingsRes.data.daily_goal || 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const chartData = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    amount: h.amount,
    shortDate: new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' }),
  }));

  const avgIntake = history.length > 0 ? Math.round(history.reduce((a, b) => a + b.amount, 0) / history.length) : 0;
  const daysGoalMet = history.filter(h => h.amount >= goal).length;
  const bestDay = history.reduce((max, h) => h.amount > max ? h.amount : max, 0);

  // Dates with water logs (for calendar highlighting)
  const loggedDates = history.filter(h => h.amount > 0).map(h => new Date(h.date));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-2xl p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-primary font-bold">{payload[0].value} ml</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8" data-testid="history-page">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            History
          </h1>
          <p className="text-muted-foreground mt-1 text-base">Track your hydration over time</p>
        </div>
        <Select value={days} onValueChange={setDays} data-testid="days-select">
          <SelectTrigger className="w-[140px] rounded-2xl" data-testid="days-select-trigger">
            <SelectValue placeholder="Select days" />
          </SelectTrigger>
          <SelectContent data-testid="days-select-content">
            <SelectItem value="7" data-testid="days-7-option">Last 7 days</SelectItem>
            <SelectItem value="14" data-testid="days-14-option">Last 14 days</SelectItem>
            <SelectItem value="30" data-testid="days-30-option">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-delay-1">
        <Card className="rounded-3xl shadow-sm" data-testid="avg-intake-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Droplet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{avgIntake} ml</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Avg Daily</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl shadow-sm" data-testid="goal-met-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{daysGoalMet}/{history.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Goals Met</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl shadow-sm" data-testid="best-day-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{bestDay} ml</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Best Day</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="rounded-3xl shadow-sm animate-fade-in-delay-2" data-testid="history-chart-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Water Intake
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Droplet className="w-6 h-6 text-primary animate-bounce" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="shortDate"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={goal} stroke="hsl(var(--success))" strokeDasharray="6 4" strokeWidth={2} label={{ value: `Goal: ${goal}ml`, position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="rounded-3xl shadow-sm animate-fade-in-delay-3" data-testid="calendar-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            modifiers={{ logged: loggedDates }}
            modifiersStyles={{
              logged: { backgroundColor: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontWeight: 600, borderRadius: '50%' }
            }}
            className="rounded-2xl"
            data-testid="history-calendar"
          />
        </CardContent>
      </Card>
    </div>
  );
}
