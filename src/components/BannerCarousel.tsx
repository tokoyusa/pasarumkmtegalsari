import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Store, Sparkles, ExternalLink } from 'lucide-react';

const formatLinkUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

interface Banner {
  id: string;
  image_url: string;
  text?: string;
  subtitle?: string;
  link_url?: string;
  badge_text?: string;
  badge_url?: string;
  status: 'active' | 'inactive';
}

interface RightBanner {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  title?: string;
  subtitle?: string;
  link_url?: string;
  badge_text?: string;
  status: 'active' | 'inactive';
}

interface BannerCarouselProps {
  banners?: Banner[];
  duration?: number;
  approvedVendorsCount: number;
  urlAffiliateId?: string | null;
  carouselBadgeText?: string;
  carouselBadgeUrl?: string;
  rightBannerImg?: string;
  rightBannerTitle?: string;
  rightBannerSubtitle?: string;
  rightBannerLink?: string;
  rightBannerBadge?: string;
  rightBanners?: RightBanner[];
  rightBannerDuration?: number;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners = [],
  duration = 3000,
  approvedVendorsCount,
  urlAffiliateId,
  carouselBadgeText = 'Gerakan Beli Karya Tetangga',
  carouselBadgeUrl = '',
  rightBannerImg,
  rightBannerTitle,
  rightBannerSubtitle,
  rightBannerLink,
  rightBannerBadge,
  rightBanners = [],
  rightBannerDuration = 3000,
}) => {
  const activeBanners = banners.filter(b => b.status === 'active');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const activeRightBanners = (rightBanners && rightBanners.length > 0)
    ? rightBanners.filter(b => b.status === 'active')
    : [
        {
          id: 'default_rb',
          media_url: rightBannerImg || 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&q=80&w=600',
          media_type: 'image' as const,
          title: rightBannerTitle || 'Promo Karya Tetangga',
          subtitle: rightBannerSubtitle || 'Dukung pertumbuhan ekonomi kreatif lokal Kecamatan Tegalsari hari ini.',
          link_url: rightBannerLink || '',
          badge_text: rightBannerBadge || 'PROMO TERBATAS',
          status: 'active' as const
        }
      ];

  const [rightIndex, setRightIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % activeBanners.length);
    }, duration);

    return () => clearInterval(interval);
  }, [activeBanners.length, duration, isHovered]);

  useEffect(() => {
    if (activeRightBanners.length <= 1) return;

    const interval = setInterval(() => {
      setRightIndex(prev => (prev + 1) % activeRightBanners.length);
    }, rightBannerDuration);

    return () => clearInterval(interval);
  }, [activeRightBanners.length, rightBannerDuration]);

  // Handle click on the banner to navigate to banner's link_url
  const handleBannerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Do not redirect if clicked on controls or details button
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('[id="affiliate-badge-car"]') || 
      target.closest('[id="affiliate-spark-badge"]')
    ) {
      return;
    }
    
    const url = activeBanners[currentIndex]?.link_url;
    if (url) {
      window.open(formatLinkUrl(url), '_blank', 'noopener,noreferrer');
    }
  };

  if (activeBanners.length === 0) {
    // Default fallback banner (original design)
    return (
      <div id="default-banner-fallback" className="relative overflow-hidden rounded-2xl bg-emerald-950 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 border border-emerald-800">
        <div className="absolute inset-0 bg-cover bg-center brightness-100 opacity-90 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200')]" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/60 to-black/10" />
        <div className="relative z-10 max-w-xl space-y-3 text-center md:text-left">
          {carouselBadgeUrl ? (
            <a
              href={formatLinkUrl(carouselBadgeUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-850/80 hover:bg-emerald-700/90 border border-emerald-750 rounded-lg text-[10px] uppercase font-bold tracking-wider font-mono text-amber-300 transition-all hover:scale-105"
            >
              <span>{carouselBadgeText}</span>
              <ExternalLink className="w-3 h-3 text-amber-200" />
            </a>
          ) : (
            <span className="px-3 py-1 bg-emerald-850/60 border border-emerald-700 rounded-lg text-[10px] uppercase font-bold tracking-wider font-mono text-emerald-400">
              {carouselBadgeText}
            </span>
          )}
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-display drop-shadow-md">
            Sinergi Toko UMKM Tingkat Desa Kecamatan Tegalsari
          </h1>
          <p className="text-emerald-100 text-xs md:text-sm font-light leading-relaxed drop-shadow-xs">
            Beli produk kuliner lokal beryodium, madu hutan murni, batik orisinil, & kerajinan Desa Tegalsari, Karangdoro, atau Dasri langsung dikirim menggunakan kurir lokal tunai di tempat.
          </p>
          {urlAffiliateId && (
            <div id="affiliate-spark-badge" className="bg-amber-400 text-emerald-950 p-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-950" />
              <span><b>Tautan Mitra Aktif:</b> Anda berbelanja melalui rekomendasi promotor afiliasi kami!</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  const currentBanner = activeBanners[currentIndex];

  const isSplitLayout = true;

  const currentRightBanner = activeRightBanners[rightIndex] || activeRightBanners[0];

  const handleRightBannerClick = () => {
    if (currentRightBanner?.link_url) {
      window.open(formatLinkUrl(currentRightBanner.link_url), '_blank', 'noopener,noreferrer');
    }
  };

  const carouselElement = (
    <div
      id="banner-carousel-container"
      onClick={handleBannerClick}
      className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-emerald-950 text-white min-h-[180px] sm:min-h-[220px] md:min-h-[280px] h-full flex items-center border border-emerald-800/80 transition-all shadow-md group/carousel ${
        currentBanner?.link_url ? 'hover:cursor-pointer' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={currentBanner?.link_url ? 'Klik untuk membuka tautan promo' : undefined}
    >
      {/* Background Image Carousel with Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-cover bg-center brightness-100 contrast-[1.05] saturate-[1.05]"
          style={{ backgroundImage: `url(${currentBanner.image_url})` }}
        />
      </AnimatePresence>
      
      {/* Conditionally render gradient overlay and content if banner has any overlay text elements */}
      {(currentBanner?.text || currentBanner?.subtitle || currentBanner?.badge_text || urlAffiliateId) && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/50 to-black/5 z-0" />

          {/* Content wrapper */}
          <div className="relative z-10 w-full px-5 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="max-w-2xl space-y-2.5 text-center md:text-left">
              {(currentBanner?.badge_text || carouselBadgeText) && (
                currentBanner?.badge_url || carouselBadgeUrl ? (
                  <a
                    href={formatLinkUrl(currentBanner?.badge_url || carouselBadgeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-800/80 hover:bg-emerald-700/95 border border-emerald-600/85 rounded font-mono uppercase font-bold tracking-wider text-[10px] text-amber-300 transition-all hover:scale-105 shadow-sm animate-pulse"
                  >
                    <span>{currentBanner?.badge_text || carouselBadgeText}</span>
                    <ExternalLink className="w-3 h-3 text-amber-250" />
                  </a>
                ) : (
                  <span className="inline-block px-3 py-1 bg-emerald-800/70 border border-emerald-600/80 rounded font-mono uppercase font-bold tracking-wider text-[10px] text-emerald-300">
                    {currentBanner?.badge_text || carouselBadgeText}
                  </span>
                )
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBanner.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-2 md:space-y-3"
                >
                  {currentBanner.text && (
                    <h1 className="text-xl sm:text-2xl md:text-3.5xl font-black tracking-tight font-display text-white leading-tight drop-shadow-md">
                      {currentBanner.text}
                    </h1>
                  )}
                  {currentBanner.subtitle && (
                    <p className="text-emerald-50 text-[11px] sm:text-xs md:text-sm font-medium leading-relaxed max-w-xl drop-shadow-sm">
                      {currentBanner.subtitle}
                    </p>
                  )}
                  
                  {currentBanner.link_url && (
                    <div className="pt-2">
                      <a
                        href={formatLinkUrl(currentBanner.link_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-650 active:scale-95 text-white text-[11px] font-bold rounded-xl transition shadow-md hover:scale-102"
                      >
                        <span>Kunjungi Promo / Tautan</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                      </a>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {urlAffiliateId && (
                <div id="affiliate-badge-car" className="bg-amber-400 text-emerald-950 px-2.5 py-1 text-[10px] md:text-xs font-bold rounded-lg inline-flex items-center gap-1 shadow-sm mt-3">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-950" />
                  <span>Sinergi Mitra Aktif</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Navigational Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            id="banner-prev-btn"
            onClick={handlePrev}
            className="absolute left-2 md:left-4 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            id="banner-next-btn"
            onClick={handleNext}
            className="absolute right-2 md:right-4 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/30 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </>
      )}

      {/* Page bullet indicators */}
      {activeBanners.length > 1 && (
        <div id="banner-bullets-indicator" className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/25 px-2.5 py-1 rounded-full backdrop-blur-xs">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'bg-emerald-400 w-3' : 'bg-white/40'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (isSplitLayout) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left wider carousel: 2/3 width */}
        <div className="lg:col-span-2">
          {carouselElement}
        </div>
        
        {/* Right narrower promo banner: 1/3 width, hidden on mobile */}
        <div
          onClick={handleRightBannerClick}
          className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-950 text-white min-h-[180px] sm:min-h-[220px] md:min-h-[280px] hidden lg:flex flex-col justify-end p-6 border border-emerald-800/20 transition-all shadow-md group/right-banner ${
            currentRightBanner?.link_url ? 'hover:cursor-pointer hover:scale-[1.01] transition-transform duration-300' : ''
          }`}
          title={currentRightBanner?.link_url ? 'Klik untuk membuka promo' : undefined}
        >
          {/* Sliding Content Container */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.div
                key={currentRightBanner.id}
                initial={{ y: '-100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                {currentRightBanner.media_type === 'video' ? (
                  <video
                    src={currentRightBanner.media_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover brightness-[0.7]"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-cover bg-center brightness-[0.7] group-hover/right-banner:scale-105 transition-transform duration-700"
                    style={{ backgroundImage: `url(${currentRightBanner.media_url})` }}
                  />
                )}
                {/* Subtle gradient overlay to read text */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              </motion.div>
            </AnimatePresence>
          </div>
 
          {/* Right Banner Content */}
          <div className="relative z-10 space-y-2 mt-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRightBanner.id}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.12,
                      delayChildren: 0.05
                    }
                  },
                  exit: {
                    opacity: 0,
                    y: -12,
                    transition: { duration: 0.2, ease: "easeInOut" }
                  }
                }}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-2.5"
              >
                {currentRightBanner.badge_text && (
                  <motion.span
                    variants={{
                      hidden: { opacity: 0, x: -15, scale: 0.95 },
                      visible: { opacity: 1, x: 0, scale: 1 }
                    }}
                    transition={{ type: "spring", stiffness: 220, damping: 16 }}
                    className="inline-block px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-extrabold uppercase rounded tracking-wider font-mono shadow-xs"
                  >
                    {currentRightBanner.badge_text}
                  </motion.span>
                )}
                <motion.h3
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 14 }}
                  className="text-lg md:text-xl font-black tracking-tight font-display text-white leading-snug drop-shadow-md line-clamp-2"
                >
                  {currentRightBanner.title}
                </motion.h3>
                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="text-amber-100/95 text-[10.5px] leading-relaxed drop-shadow-xs font-medium line-clamp-2"
                >
                  {currentRightBanner.subtitle}
                </motion.p>
                {currentRightBanner.link_url && (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.35 }}
                    className="pt-1.5"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-300 group-hover/right-banner:text-amber-200 transition-all bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs hover:bg-white/15">
                      <span>Lihat Selengkapnya</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return carouselElement;
};
