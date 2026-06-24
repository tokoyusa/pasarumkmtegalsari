/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, Monitor, Smartphone, Check, X } from 'lucide-react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Store event so we can trigger it later
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('PASAR UMKM Tegalsari PWA berhasil diinstal!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native PWA install prompt
    deferredPrompt.prompt();
    
    // Wait for user preference response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to installation prompt: ${outcome}`);
    
    // Reset deferred prompt
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  if (isInstalled) {
    return null;
  }

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <ArrowDownToLine className="w-5 h-5 text-amber-300 animate-bounce" />
        </div>
        <div className="space-y-0.5 text-center sm:text-left">
          <h4 className="font-bold text-sm font-display tracking-tight">Pasang Aplikasi Pasar Tegalsari</h4>
          <p className="text-[10px] text-emerald-100">Dapatkan akses instan, loading super ringan, dan gunakan seperti aplikasi seluler asli!</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <button
          onClick={handleInstallClick}
          className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5" /> Pasang PWA
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-2 hover:bg-white/10 rounded-lg text-emerald-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
