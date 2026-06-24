import React from 'react';
import { motion } from 'motion/react';
import { Store, Info, ClipboardList, User, Shield, Briefcase, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface MobileBottomNavProps {
  activeTab: 'katalog' | 'tentang' | 'vendor' | 'admin' | 'profil' | 'pesanan' | 'transaksi-pesanan';
  setActiveTab: (tab: 'katalog' | 'tentang' | 'vendor' | 'admin' | 'profil' | 'pesanan' | 'transaksi-pesanan') => void;
  currentProfile: UserProfile | null;
  ordersCount: number;
  vendorOrdersCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentProfile,
  ordersCount,
  vendorOrdersCount = 0,
}) => {
  // Symmetrical dynamic tab arrangement (guarantees odd number of tabs: 3 or 5)
  // This ensures the middle tab is ALWAYS 'katalog' (Catalog/Home), making it the perfect center 3D button!
  const tabs: Array<{
    id: 'katalog' | 'tentang' | 'vendor' | 'admin' | 'profil' | 'pesanan' | 'transaksi-pesanan';
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
    highlight?: boolean;
  }> = [];

  if (!currentProfile) {
    // 3 tabs: Info (left), Katalog (center 3D), Masuk (right)
    tabs.push({ id: 'tentang', label: 'Tentang', icon: Info });
    tabs.push({ id: 'katalog', label: 'Katalog', icon: Store, highlight: true });
    tabs.push({ id: 'profil', label: 'Masuk', icon: User });
  } else {
    const isVendor = currentProfile.role === 'vendor';
    const isAdmin = currentProfile.role === 'admin';

    if (isVendor) {
      // 5 tabs: Symmetrical layout
      tabs.push({ id: 'transaksi-pesanan', label: 'Pesanan', icon: ClipboardList, badge: vendorOrdersCount });
      tabs.push({ id: 'tentang', label: 'Info', icon: Info });
      tabs.push({ id: 'katalog', label: 'Katalog', icon: Store, highlight: true });
      tabs.push({ id: 'vendor', label: 'Toko Saya', icon: Briefcase });
      tabs.push({ id: 'profil', label: 'Profil', icon: User });
    } else if (isAdmin) {
      // 5 tabs: Symmetrical layout
      tabs.push({ id: 'transaksi-pesanan', label: 'Pesanan', icon: ClipboardList, badge: vendorOrdersCount });
      tabs.push({ id: 'tentang', label: 'Info', icon: Info });
      tabs.push({ id: 'katalog', label: 'Katalog', icon: Store, highlight: true });
      tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
      tabs.push({ id: 'profil', label: 'Profil', icon: User });
    } else {
      // Regular customer
      if (ordersCount > 0) {
        // 3 tabs: Belanjaan (left), Katalog (center 3D), Profil (right)
        tabs.push({ id: 'pesanan', label: 'Belanja', icon: ClipboardList, badge: ordersCount });
        tabs.push({ id: 'katalog', label: 'Katalog', icon: Store, highlight: true });
        tabs.push({ id: 'profil', label: 'Profil', icon: User });
      } else {
        // 3 tabs: Info (left), Katalog (center 3D), Profil (right)
        tabs.push({ id: 'tentang', label: 'Info', icon: Info });
        tabs.push({ id: 'katalog', label: 'Katalog', icon: Store, highlight: true });
        tabs.push({ id: 'profil', label: 'Profil', icon: User });
      }
    }
  }

  const centerIndex = Math.floor(tabs.length / 2);

  return (
    <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[360px] z-40">
      {/* 3D Soft Shadow Glow Underlay */}
      <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-xl -z-10 pointer-events-none" />

      {/* Main Bar */}
      <div className="relative bg-gradient-to-b from-zinc-900/95 to-black/98 border border-zinc-800/85 rounded-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.6),0_15px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] px-2 py-1 flex justify-around items-end h-14">
        
        {tabs.map((tab, idx) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          const isCenter = idx === centerIndex;

          if (isCenter) {
            // Render the massive 3D floating center button (Katalog)
            return (
              <div key={tab.id} className="relative -top-5 flex flex-col items-center select-none shrink-0 z-50">
                {/* 3D Backing shadow halo */}
                <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-md -z-10 animate-pulse duration-3000" />
                
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                    isActive 
                      ? 'from-amber-400 via-emerald-500 to-teal-600 shadow-[0_0_20px_rgba(245,158,11,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] border-amber-300' 
                      : 'from-emerald-500 via-teal-600 to-cyan-700 shadow-[0_8px_20px_rgba(16,185,129,0.45),inset_0_2px_3px_rgba(255,255,255,0.3)] border-emerald-400/80'
                  } border-2 flex flex-col items-center justify-center transform active:scale-95 transition-all duration-250 cursor-pointer group hover:rotate-3`}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                  }}
                >
                  <IconComponent className={`w-6 h-6 text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform duration-200`} />
                  
                  {/* Subtle 3D shine overlay */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
                </button>

                {/* Floating label with a neat glass shadow */}
                <span className={`text-[8.5px] font-extrabold tracking-tight mt-1 text-center transition-all ${
                  isActive ? 'text-amber-300 drop-shadow-sm font-black' : 'text-zinc-400'
                }`}>
                  {tab.label}
                </span>
              </div>
            );
          }

          // Render normal surrounding buttons
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 px-1 focus:outline-none select-none tap-highlight-transparent cursor-pointer group"
            >
              {/* Active flat glow backdrop for non-center tabs */}
              {isActive && (
                <motion.span
                  layoutId="mobileActiveBGGlow"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="absolute inset-x-2 inset-y-1 bg-emerald-600/10 border border-emerald-500/10 rounded-xl"
                />
              )}

              {/* Inner Icon Content */}
              <div className="relative flex flex-col items-center justify-center space-y-0.5">
                <div
                  className={`transition-all duration-200 group-hover:scale-105 ${
                    isActive
                      ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]'
                      : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  <IconComponent className="w-4.5 h-4.5 shrink-0" />
                </div>

                <span
                  className={`text-[8px] sm:text-[8.5px] font-bold tracking-tight text-center transition-all duration-200 ${
                    isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-400'
                  }`}
                >
                  {tab.label}
                </span>

                {/* Dynamic Notification Badge with 3D Pop effect */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-2.5 -right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center shadow-[0_2px_5px_rgba(239,68,68,0.4)] animate-pulse border border-zinc-950">
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}

      </div>
    </div>
  );
};
