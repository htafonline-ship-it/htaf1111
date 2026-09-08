import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  isCheckingUpdate: boolean;
  swRegistration: ServiceWorkerRegistration | null;
  installApp: () => Promise<boolean>;
  updateApp: () => void;
  checkForUpdate: () => Promise<boolean>;
}

export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // 1. Detect Standalone / Installed mode
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandalone));
    };

    checkIsInstalled();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    try {
      mediaQuery.addEventListener('change', handleMediaChange);
    } catch {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange);
    }

    // 2. Detect iOS / iPadOS devices specifically
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad Pro
    setIsIOS(isAppleMobile);

    // 3. Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 4. Handle Chromium / Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Register Service Worker and monitor updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          setSwRegistration(registration);
          console.log('[PWA SW] Registered successfully with scope:', registration.scope);

          // Check if there is already a waiting service worker
          if (registration.waiting) {
            setHasUpdate(true);
          }

          // Monitor for new service worker installation
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // A new version is available!
                  console.log('[PWA SW] New content is available; please refresh.');
                  setHasUpdate(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA SW] Registration failed (non-fatal):', err);
        });

      // Reload page when the new worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      try {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } catch {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  // Method to prompt user for installation
  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        return false;
      }
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
      return false;
    }
  }, [deferredPrompt]);

  // Method to apply pending update
  const updateApp = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [swRegistration]);

  // Method to manually check for updates
  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !swRegistration) {
      return false;
    }
    setIsCheckingUpdate(true);
    try {
      await swRegistration.update();
      if (swRegistration.waiting) {
        setHasUpdate(true);
        setIsCheckingUpdate(false);
        return true;
      }
      // Re-check after 1 second
      await new Promise((res) => setTimeout(res, 1200));
      const hasPending = Boolean(swRegistration.waiting);
      setHasUpdate(hasPending);
      setIsCheckingUpdate(false);
      return hasPending;
    } catch (err) {
      console.warn('[PWA] Manual update check error:', err);
      setIsCheckingUpdate(false);
      return false;
    }
  }, [swRegistration]);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isOnline,
    hasUpdate,
    isCheckingUpdate,
    swRegistration,
    installApp,
    updateApp,
    checkForUpdate,
  };
}
