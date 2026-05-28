import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Download, X, Smartphone, Monitor, Share, MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua)) setPlatform('ios');
    else if (/Android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const dismissed = sessionStorage.getItem('install-dismissed');
    if (dismissed) return;

    // Listen for beforeinstallprompt (Chrome/Edge/Samsung)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__pwaInstallPrompt = e;
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // For iOS/Safari - show manual guide after delay
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        setShowBanner(true);
      }
    }, 3000);

    // Installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('install-dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-40 animate-fade-in max-w-md mx-auto" data-testid="install-banner">
        <Card className="rounded-2xl shadow-xl border-primary/20 bg-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>Install HydroFlow</p>
                <p className="text-xs text-muted-foreground mt-0.5">Add to home screen for quick access & offline use</p>
                <div className="flex gap-2 mt-2.5">
                  <Button
                    size="sm"
                    className="rounded-full h-8 px-4 text-xs font-semibold"
                    onClick={handleInstall}
                    data-testid="install-app-btn"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Install
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 px-3 text-xs"
                    onClick={() => setShowGuide(true)}
                    data-testid="install-how-btn"
                  >
                    How?
                  </Button>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full"
                data-testid="install-dismiss-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installation Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="rounded-3xl max-w-sm" data-testid="install-guide-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Install HydroFlow
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">

            {/* iOS */}
            {(platform === 'ios' || platform === 'unknown') && (
              <div className="space-y-3" data-testid="install-guide-ios">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">iPhone / iPad (Safari)</span>
                </div>
                <div className="space-y-2">
                  {[
                    { step: 1, text: 'Tap the Share button', icon: <Share className="w-4 h-4" /> },
                    { step: 2, text: 'Scroll down and tap "Add to Home Screen"' },
                    { step: 3, text: 'Tap "Add" to confirm' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{s.step}</span>
                      </div>
                      <span className="text-sm">{s.text}</span>
                      {s.icon && <span className="ml-auto text-muted-foreground">{s.icon}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Android */}
            {(platform === 'android' || platform === 'unknown') && (
              <div className="space-y-3" data-testid="install-guide-android">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Android (Chrome)</span>
                </div>
                <div className="space-y-2">
                  {[
                    { step: 1, text: 'Tap the menu button', icon: <MoreVertical className="w-4 h-4" /> },
                    { step: 2, text: 'Tap "Add to Home screen" or "Install app"' },
                    { step: 3, text: 'Tap "Install" to confirm' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{s.step}</span>
                      </div>
                      <span className="text-sm">{s.text}</span>
                      {s.icon && <span className="ml-auto text-muted-foreground">{s.icon}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop */}
            {(platform === 'desktop' || platform === 'unknown') && (
              <div className="space-y-3" data-testid="install-guide-desktop">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Desktop (Chrome/Edge)</span>
                </div>
                <div className="space-y-2">
                  {[
                    { step: 1, text: 'Click the install icon in the address bar' },
                    { step: 2, text: 'Or click menu > "Install HydroFlow"' },
                    { step: 3, text: 'Click "Install" to confirm' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{s.step}</span>
                      </div>
                      <span className="text-sm">{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deferredPrompt && (
              <Button
                className="w-full rounded-full h-11 font-semibold"
                onClick={handleInstall}
                data-testid="install-guide-install-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Install Now
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
