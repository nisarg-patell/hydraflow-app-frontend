import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Droplet, Bell, BellRing, Vibrate, Volume2, Sun, Moon, Clock, Target, Music, Plus, X, AlarmClock, Info, Code, Heart, ExternalLink, Download, Smartphone, LayoutGrid, CircleDot, Zap, List, BarChart3, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NOTIFICATION_TYPES = [
  { value: 'vibrate', label: 'Vibrate Only', icon: Vibrate },
  { value: 'vibrate_sound', label: 'Vibrate + Sound', icon: BellRing },
  { value: 'sound', label: 'Sound Only', icon: Volume2 },
];

const CUSTOM_SOUNDS = [
  { value: 'default', label: 'Default Chime' },
  { value: 'droplet', label: 'Water Droplet' },
  { value: 'stream', label: 'Flowing Stream' },
  { value: 'bubble', label: 'Bubble Pop' },
  { value: 'bell', label: 'Gentle Bell' },
];

const REMINDER_INTERVALS = [
  { value: '15', label: 'Every 15 min' },
  { value: '30', label: 'Every 30 min' },
  { value: '45', label: 'Every 45 min' },
  { value: '60', label: 'Every 1 hour' },
  { value: '90', label: 'Every 1.5 hours' },
  { value: '120', label: 'Every 2 hours' },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    daily_goal: 2000,
    reminder_interval: 60,
    notification_type: 'vibrate_sound',
    custom_sound: 'default',
    reminder_enabled: true,
    wake_time: '08:00',
    sleep_time: '22:00',
    custom_reminder_times: [],
    quick_add_position: 'bottom-right',
  });
  const [goalInput, setGoalInput] = useState('2000');
  const [saving, setSaving] = useState(false);
  const [notifPermission, setNotifPermission] = useState('default');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [addingTime, setAddingTime] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const reminderTimerRef = useRef(null);
  const customTimerRef = useRef([]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/settings`, { withCredentials: true });
      setSettings(data);
      setGoalInput(String(data.daily_goal || 2000));
      if (data.theme && data.theme !== theme) {
        setTheme(data.theme);
      }
    } catch (err) {
      console.error(err);
    }
  }, [theme, setTheme]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info('To install, tap your browser menu or share icon and select "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('App installed successfully!');
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Setup interval-based reminder timer
  useEffect(() => {
    if (reminderTimerRef.current) clearInterval(reminderTimerRef.current);

    if (settings.reminder_enabled && notifPermission === 'granted') {
      const intervalMs = (settings.reminder_interval || 60) * 60 * 1000;
      reminderTimerRef.current = setInterval(() => {
        sendNotification();
      }, intervalMs);
    }

    return () => {
      if (reminderTimerRef.current) clearInterval(reminderTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.reminder_enabled, settings.reminder_interval, settings.notification_type, settings.custom_sound, notifPermission]);

  // Setup custom time-based reminders
  useEffect(() => {
    customTimerRef.current.forEach(t => clearTimeout(t));
    customTimerRef.current = [];

    if (!settings.reminder_enabled || notifPermission !== 'granted') return;
    const times = settings.custom_reminder_times || [];
    if (times.length === 0) return;

    const now = new Date();
    times.forEach((timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      let diff = target.getTime() - now.getTime();
      if (diff < 0) diff += 24 * 60 * 60 * 1000; // schedule for next day
      const timer = setTimeout(() => {
        sendNotification();
      }, diff);
      customTimerRef.current.push(timer);
    });

    return () => {
      customTimerRef.current.forEach(t => clearTimeout(t));
      customTimerRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.reminder_enabled, settings.custom_reminder_times, settings.notification_type, settings.custom_sound, notifPermission]);

  const sendNotification = () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const notif = new Notification('Time to Hydrate!', {
      body: 'Take a sip of water to stay healthy.',
      icon: '/favicon.ico',
      tag: 'water-reminder',
      silent: settings.notification_type === 'vibrate',
    });

    // Vibration
    if ((settings.notification_type === 'vibrate' || settings.notification_type === 'vibrate_sound') && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Sound
    if (settings.notification_type === 'sound' || settings.notification_type === 'vibrate_sound') {
      playSound(settings.custom_sound);
    }

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  };

  const playSound = (soundName) => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const soundProfiles = {
      default: { freq: 880, type: 'sine', duration: 0.3 },
      droplet: { freq: 1200, type: 'sine', duration: 0.15 },
      stream: { freq: 600, type: 'triangle', duration: 0.5 },
      bubble: { freq: 1400, type: 'sine', duration: 0.1 },
      bell: { freq: 1047, type: 'sine', duration: 0.6 },
    };

    const profile = soundProfiles[soundName] || soundProfiles.default;
    osc.type = profile.type;
    osc.frequency.setValueAtTime(profile.freq, audioCtx.currentTime);

    if (soundName === 'droplet') {
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + profile.duration);
    } else if (soundName === 'bubble') {
      osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + profile.duration);
    } else if (soundName === 'bell') {
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + profile.duration);
    }

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + profile.duration);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        toast.success('Notifications enabled!');
      } else {
        toast.error('Notification permission denied');
      }
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, { [key]: value }, { withCredentials: true });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleGoalSave = () => {
    const val = parseInt(goalInput);
    if (val > 0 && val <= 10000) {
      updateSetting('daily_goal', val);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    updateSetting('theme', newTheme);
  };

  const testNotification = () => {
    if (notifPermission !== 'granted') {
      toast.error('Please enable notifications first');
      return;
    }
    sendNotification();
    toast.success('Test notification sent!');
  };

  const addCustomReminderTime = async () => {
    if (!newReminderTime) return;
    setAddingTime(true);
    try {
      const { data } = await axios.post(`${API}/settings/reminder-times`, { time: newReminderTime }, { withCredentials: true });
      setSettings(prev => ({ ...prev, custom_reminder_times: data.custom_reminder_times }));
      setNewReminderTime('');
      toast.success(`Reminder at ${formatTime12h(newReminderTime)} added`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add time');
    } finally {
      setAddingTime(false);
    }
  };

  const removeCustomReminderTime = async (time) => {
    try {
      const { data } = await axios.delete(`${API}/settings/reminder-times`, { data: { time }, withCredentials: true });
      setSettings(prev => ({ ...prev, custom_reminder_times: data.custom_reminder_times }));
      toast.success(`Reminder at ${formatTime12h(time)} removed`);
    } catch (err) {
      toast.error('Failed to remove time');
    }
  };

  const formatTime12h = (time24) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8" data-testid="settings-page">
      <div className="animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-base">Customize your hydration experience</p>
      </div>

      {/* Daily Goal */}
      <Card className="rounded-3xl shadow-sm animate-fade-in-delay-1" data-testid="goal-settings-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Daily Goal</CardTitle>
              <CardDescription>Set your daily water intake target</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="goal" className="text-sm">Goal (ml)</Label>
              <Input
                id="goal"
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="rounded-2xl h-12 mt-1"
                min="500"
                max="10000"
                step="100"
                data-testid="goal-input"
              />
            </div>
            <Button onClick={handleGoalSave} className="rounded-full h-12 px-6" data-testid="save-goal-btn">
              Save
            </Button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {[1500, 2000, 2500, 3000].map((g) => (
              <Button
                key={g}
                variant="outline"
                size="sm"
                className={`rounded-full text-xs ${settings.daily_goal === g ? 'border-primary text-primary' : ''}`}
                onClick={() => { setGoalInput(String(g)); updateSetting('daily_goal', g); }}
                data-testid={`preset-goal-${g}-btn`}
              >
                {g}ml
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="rounded-3xl shadow-sm animate-fade-in-delay-2" data-testid="theme-settings-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Appearance</CardTitle>
              <CardDescription>Choose your preferred theme</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="rounded-full flex-1 h-12 gap-2"
              onClick={() => handleThemeChange('light')}
              data-testid="theme-light-btn"
            >
              <Sun className="w-4 h-4" /> Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="rounded-full flex-1 h-12 gap-2"
              onClick={() => handleThemeChange('dark')}
              data-testid="theme-dark-btn"
            >
              <Moon className="w-4 h-4" /> Dark
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Layout Settings */}
      <Card className="rounded-3xl shadow-sm animate-fade-in-delay-2" data-testid="layout-settings-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Layout</CardTitle>
              <CardDescription>Customize the interface</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-sm">Quick Add Button Position</Label>
            <Select
              value={settings.quick_add_position || 'bottom-right'}
              onValueChange={(v) => {
                updateSetting('quick_add_position', v);
                window.dispatchEvent(new CustomEvent('quick-add-position-changed', { detail: v }));
              }}
            >
              <SelectTrigger className="rounded-2xl h-12">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-center">Bottom Center</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="rounded-3xl shadow-sm animate-fade-in-delay-3" data-testid="notification-settings-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Reminders</CardTitle>
              <CardDescription>Configure your hydration reminders</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable Reminders</p>
              <p className="text-xs text-muted-foreground">Get periodic reminders to drink water</p>
            </div>
            <Switch
              checked={settings.reminder_enabled}
              onCheckedChange={(v) => updateSetting('reminder_enabled', v)}
              data-testid="reminder-toggle"
            />
          </div>

          {notifPermission !== 'granted' && (
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={requestNotificationPermission}
              data-testid="enable-notifications-btn"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Browser Notifications
            </Button>
          )}

          <Separator />

          {/* Reminder Interval */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Reminder Interval
            </Label>
            <Select
              value={String(settings.reminder_interval)}
              onValueChange={(v) => updateSetting('reminder_interval', parseInt(v))}
              data-testid="reminder-interval-select"
            >
              <SelectTrigger className="rounded-2xl h-12" data-testid="reminder-interval-trigger">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent data-testid="reminder-interval-content">
                {REMINDER_INTERVALS.map((ri) => (
                  <SelectItem key={ri.value} value={ri.value} data-testid={`interval-${ri.value}-option`}>
                    {ri.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wake/Sleep Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wake" className="text-sm">Wake Time</Label>
              <Input
                id="wake"
                type="time"
                value={settings.wake_time}
                onChange={(e) => updateSetting('wake_time', e.target.value)}
                className="rounded-2xl h-12"
                data-testid="wake-time-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep" className="text-sm">Sleep Time</Label>
              <Input
                id="sleep"
                type="time"
                value={settings.sleep_time}
                onChange={(e) => updateSetting('sleep_time', e.target.value)}
                className="rounded-2xl h-12"
                data-testid="sleep-time-input"
              />
            </div>
          </div>

          <Separator />

          {/* Custom Reminder Times */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm">
              <AlarmClock className="w-4 h-4 text-muted-foreground" />
              Custom Reminder Times
            </Label>
            <p className="text-xs text-muted-foreground">Add specific times when you want to be reminded to drink water</p>

            {/* Add new time */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="rounded-2xl h-12"
                  data-testid="new-reminder-time-input"
                />
              </div>
              <Button
                onClick={addCustomReminderTime}
                className="rounded-full h-12 px-5"
                disabled={!newReminderTime || addingTime}
                data-testid="add-reminder-time-btn"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {/* List of custom times */}
            {(settings.custom_reminder_times || []).length > 0 ? (
              <div className="space-y-2 mt-3">
                {settings.custom_reminder_times.map((time) => (
                  <div
                    key={time}
                    className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors group"
                    data-testid={`reminder-time-${time.replace(':', '')}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <AlarmClock className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{formatTime12h(time)}</span>
                      <span className="text-xs text-muted-foreground">({time})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeCustomReminderTime(time)}
                      data-testid={`remove-time-${time.replace(':', '')}-btn`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-xs py-4">
                No custom reminder times set. Add a time above to get started.
              </p>
            )}
          </div>

          <Separator />

          {/* Notification Type */}
          <div className="space-y-3">
            <Label className="text-sm">Notification Type</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {NOTIFICATION_TYPES.map((nt) => {
                const Icon = nt.icon;
                const isActive = settings.notification_type === nt.value;
                return (
                  <button
                    key={nt.value}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                    onClick={() => updateSetting('notification_type', nt.value)}
                    data-testid={`notif-type-${nt.value}-btn`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {nt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Custom Sound */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Music className="w-4 h-4 text-muted-foreground" />
              Notification Sound
            </Label>
            <Select
              value={settings.custom_sound}
              onValueChange={(v) => updateSetting('custom_sound', v)}
              data-testid="custom-sound-select"
            >
              <SelectTrigger className="rounded-2xl h-12" data-testid="custom-sound-trigger">
                <SelectValue placeholder="Select sound" />
              </SelectTrigger>
              <SelectContent data-testid="custom-sound-content">
                {CUSTOM_SOUNDS.map((s) => (
                  <SelectItem key={s.value} value={s.value} data-testid={`sound-${s.value}-option`}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Button */}
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={testNotification}
            data-testid="test-notification-btn"
          >
            <BellRing className="w-4 h-4 mr-2" />
            Test Notification
          </Button>
        </CardContent>
      </Card>

      {/* User Info */}
      <Card className="rounded-3xl shadow-sm" data-testid="user-info-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Install App */}
      <Card className="rounded-3xl shadow-sm" data-testid="install-app-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Install App</CardTitle>
              <CardDescription>Add HydroFlow to your home screen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Install HydroFlow as an app on your device for faster access, fullscreen experience, and home screen shortcuts.
          </p>
          <Button
            className="w-full rounded-full h-11 font-semibold"
            onClick={() => {
              // Try native prompt first, fallback to showing instructions
              if (window.__pwaInstallPrompt) {
                window.__pwaInstallPrompt.prompt();
              } else {
                toast.info(
                  navigator.userAgent.match(/iPhone|iPad|iPod/)
                    ? 'Tap the Share button in Safari, then "Add to Home Screen"'
                    : navigator.userAgent.match(/Android/)
                    ? 'Tap the browser menu (three dots), then "Add to Home screen"'
                    : 'Click the install icon in the address bar, or use browser menu > "Install HydroFlow"'
                );
              }
            }}
            data-testid="settings-install-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Install HydroFlow
          </Button>
        </CardContent>
      </Card>

      {/* Widgets Gallery */}
      <Card className="rounded-3xl shadow-sm" data-testid="widgets-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Home Screen Widgets</CardTitle>
              <CardDescription>Add widgets to your phone's home screen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Open any widget below, then use your browser's "Add to Home Screen" option to pin it. Each widget works standalone and logs water directly to your account.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Quick Add', desc: '2x2 grid with 4 drink sizes', path: '/widget/quick-add', icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { name: 'Progress Ring', desc: 'Circular progress + add buttons', path: '/widget/progress', icon: CircleDot, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
              { name: 'One Tap', desc: 'Giant button to add 250ml instantly', path: '/widget/one-tap', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { name: 'Daily Stats', desc: 'Stats overview + goal tracking', path: '/widget/stats', icon: Target, color: 'text-green-500', bg: 'bg-green-500/10' },
              { name: 'Compact', desc: 'Minimal progress bar + row of buttons', path: '/widget/compact', icon: Smartphone, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { name: 'Log List', desc: 'Today\'s entries with delete & add', path: '/widget/log-list', icon: List, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { name: 'Week View', desc: '7-day mini bar chart + quick add', path: '/widget/mini-bar', icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            ].map((w) => {
              const Icon = w.icon;
              return (
                <a
                  key={w.path}
                  href={w.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 group"
                  data-testid={`widget-link-${w.path.split('/').pop()}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${w.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${w.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{w.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{w.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              );
            })}
          </div>

          <div className="bg-muted/50 rounded-2xl p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>How to add:</strong> Open a widget &rarr; Tap browser menu (&#8942; or share icon) &rarr; "Add to Home Screen". The widget will appear as a standalone app on your phone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About App */}
      <Card className="rounded-3xl shadow-sm" data-testid="about-app-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>About HydroFlow</CardTitle>
              <CardDescription>App details & credits</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Droplet className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>HydroFlow</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            HydroFlow helps you stay hydrated by tracking your daily water intake, setting personalized goals, and sending timely reminders. Build healthy hydration habits with ease.
          </p>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Developed by</span>
              <span className="text-sm font-semibold text-foreground">Nisarg Patel</span>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-sm text-muted-foreground">Made with love for better health</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Features</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Daily Water Tracking',
                'Custom Intake Goals',
                'Smart Reminders',
                'Custom Notification Sounds',
                'Weekly Analytics',
                'Light & Dark Themes',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 p-2 rounded-xl bg-muted/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={logout}
              className="rounded-full px-6 h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 gap-2 w-full max-w-xs"
              data-testid="settings-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Nisarg Patel. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
