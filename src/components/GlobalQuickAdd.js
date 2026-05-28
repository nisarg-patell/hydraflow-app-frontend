import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Droplet, GlassWater, Plus, Coffee, Wine } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QUICK_OPTIONS = [
  { amount: 100, label: 'Sip', icon: Droplet },
  { amount: 250, label: 'Glass', icon: GlassWater },
  { amount: 350, label: 'Cup', icon: Coffee },
  { amount: 500, label: 'Bottle', icon: Wine },
];

export default function GlobalQuickAdd() {
  const { user } = useAuth();
  const location = useLocation();
  const [customAmount, setCustomAmount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [position, setPosition] = useState('bottom-right');

  useEffect(() => {
    if (user) {
      axios.get(`${API}/settings`, { withCredentials: true })
        .then(res => setPosition(res.data.quick_add_position || 'bottom-right'))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handlePosChange = (e) => setPosition(e.detail);
    window.addEventListener('quick-add-position-changed', handlePosChange);
    return () => window.removeEventListener('quick-add-position-changed', handlePosChange);
  }, []);

  // Show only if logged in and on the dashboard
  if (!user || location.pathname !== '/') {
    return null;
  }

  const addWater = async (amount, label) => {
    try {
      await axios.post(`${API}/water/log`, { amount, label }, { withCredentials: true });
      toast.success(`+${amount}ml logged`);
      setIsOpen(false);
      window.dispatchEvent(new Event('water-logged'));
    } catch (err) {
      toast.error('Failed to log water');
    }
  };

  const handleCustomAdd = () => {
    const amt = parseInt(customAmount);
    if (amt > 0) {
      addWater(amt, 'Custom');
      setCustomAmount('');
      setCustomDialogOpen(false);
      setIsOpen(false);
    }
  };

  let positionClasses = "bottom-[calc(6rem+env(safe-area-inset-bottom))] right-6 items-end";
  if (position === 'bottom-left') positionClasses = "bottom-[calc(6rem+env(safe-area-inset-bottom))] left-6 items-start";
  if (position === 'bottom-center') positionClasses = "bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 items-center";

  return (
    <div className={`fixed z-50 flex flex-col ${positionClasses}`}>
      {/* Backdrop for closing when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed Dial Options */}
      <div 
        className={`flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom z-50 ${
          position === 'bottom-left' ? 'items-start' : position === 'bottom-center' ? 'items-center' : 'items-end'
        } ${isOpen ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}
      >
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="rounded-full px-4 py-5 h-auto flex gap-3 items-center border-border hover:border-primary hover:bg-primary/5 shadow-lg bg-background transition-transform duration-200 hover:scale-105"
            >
              <span className="text-sm font-semibold">Custom</span>
              <Plus className="w-5 h-5 text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl z-[60]">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Add Custom Amount</DialogTitle>
            </DialogHeader>
            <div className="flex gap-3 items-end pt-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Amount in ml"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="rounded-2xl h-12"
                  min="1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
                />
              </div>
              <Button onClick={handleCustomAdd} className="rounded-full h-12 px-6">
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* The 4 options reversed to stack bottom up */}
        {[...QUICK_OPTIONS].reverse().map((opt, index) => {
          const Icon = opt.icon;
          return (
            <Button
              key={opt.amount}
              variant="outline"
              className="rounded-full px-4 py-5 h-auto flex gap-3 items-center border-border hover:border-primary hover:bg-primary/5 shadow-lg bg-background transition-all duration-200 hover:scale-105"
              onClick={() => addWater(opt.amount, opt.label)}
              style={{
                transitionDelay: `${isOpen ? index * 40 : 0}ms`,
                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                opacity: isOpen ? 1 : 0
              }}
            >
              <div className={`flex flex-col leading-tight ${position === 'bottom-left' ? 'ml-1 items-start order-last' : 'mr-1 items-end'}`}>
                <span className="text-sm font-semibold">{opt.amount}ml</span>
                <span className="text-[10px] text-muted-foreground">{opt.label}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            </Button>
          );
        })}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={`w-14 h-14 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 z-50 ${
          isOpen ? 'rotate-[135deg] shadow-none bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'hover:scale-105 bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        data-testid="global-quick-add-fab"
      >
        <Plus className="w-6 h-6 transition-transform duration-300" />
      </Button>
    </div>
  );
}
