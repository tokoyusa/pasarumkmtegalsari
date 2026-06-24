/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Info, Search, Route, Layers, HelpCircle, Loader2 } from 'lucide-react';

interface MapPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onChange: (lat: number, lng: number, addressDetails?: { village: string; address: string }) => void;
  vendorLat?: number | null;
  vendorLng?: number | null;
  label?: string;
  readOnly?: boolean;
}

// Haversine formula to compute distance between two coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

// Local Kelurahan / Desa in Tegalsari with locations mapping (within Tegalsari, Banyuwangi)
const TEGALSARI_VILLAGES = [
  { name: 'Tegalsari', lat: -8.4357, lng: 114.1293, desc: 'Pusat Kecamatan, dekat Masjid Jami' },
  { name: 'Karangmulyo', lat: -8.4411, lng: 114.1122, desc: 'Bagian barat daya Tegalsari' },
  { name: 'Dasri', lat: -8.4215, lng: 114.1192, desc: 'Bagian utara, sentra pertanian' },
  { name: 'Karangdoro', lat: -8.4521, lng: 114.1415, desc: 'Bagian timur selatan, sentra kripik' },
  { name: 'Tamansari', lat: -8.4298, lng: 114.1388, desc: 'Bagian timur laut, perbatasan Genteng' },
];

export default function MapPicker({
  initialLat,
  initialLng,
  onChange,
  vendorLat = null,
  vendorLng = null,
  label = 'Tentukan Titik Pengiriman (Klik pada Peta)',
  readOnly = false,
}: MapPickerProps) {
  const [lat, setLat] = useState<number>(() => initialLat ? Number(initialLat) : -8.4357);
  const [lng, setLng] = useState<number>(() => initialLng ? Number(initialLng) : 114.1293);
  const [currentVillage, setCurrentVillage] = useState<string>('Tegalsari');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  
  // Choice ref avoiding stale closures during async database updates
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // Choose between Real Map (OpenStreetMap/Leaflet) and Simulated grid map (Canvas)
  const [mapMode, setMapMode] = useState<'real' | 'simulated'>('real');
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [isLeafletError, setIsLeafletError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const vendorMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  // Sync state if initial coordinates change
  useEffect(() => {
    if (initialLat) setLat(Number(initialLat));
    if (initialLng) setLng(Number(initialLng));
  }, [initialLat, initialLng]);

  // Find the closest village name dynamically based on coordinates
  useEffect(() => {
    let closestVillage = TEGALSARI_VILLAGES[0].name;
    let minDistance = Infinity;

    TEGALSARI_VILLAGES.forEach((v) => {
      const d = calculateDistance(lat, lng, v.lat, v.lng);
      if (d < minDistance) {
        minDistance = d;
        closestVillage = v.name;
      }
    });

    setCurrentVillage(closestVillage);
  }, [lat, lng]);

  // Dynamically load Leaflet resources (CSS and JS) from free reliable UNPKG CDN
  useEffect(() => {
    if (mapMode !== 'real') return;

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const cssId = 'leaflet-cdn-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    const jsId = 'leaflet-cdn-js';
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script');
      script.id = jsId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.async = true;
      script.onload = () => {
        setIsLeafletLoaded(true);
      };
      script.onerror = () => {
        setIsLeafletError(true);
        setMapMode('simulated');
      };
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setIsLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mapMode]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (mapMode !== 'real' || !isLeafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    try {
      if (!mapRef.current) {
        // Initialize Leaflet map
        mapRef.current = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 14,
          zoomControl: true,
          scrollWheelZoom: !readOnly,
          dragging: !readOnly,
          touchZoom: !readOnly,
        });

        // Add standard OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Map Click handling to update coordinates
        if (!readOnly) {
          mapRef.current.on('click', (e: any) => {
            const clickLat = e.latlng.lat;
            const clickLng = e.latlng.lng;
            updateLocationAndTrigger(clickLat, clickLng);
          });
        }
      }

      const center = [lat, lng];

      // Custom HTML layout marker for User location
      const userDivIcon = L.divIcon({
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 60px;">
            <span style="font-size: 28px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3)); cursor: pointer;">📍</span>
            <div style="background-color: #ef4444; color: white; font-size: 8px; font-weight: 800; padding: 1.5px 4.5px; border-radius: 4px; border: 1px solid white; white-space: nowrap; margin-top: -5px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
              LOKASI ANDA
            </div>
          </div>
        `,
        className: 'custom-user-leaflet-marker',
        iconSize: [60, 42],
        iconAnchor: [30, 32],
      });

      // Update or create User Marker
      if (markerRef.current) {
        markerRef.current.setLatLng(center);
      } else {
        markerRef.current = L.marker(center, { icon: userDivIcon }).addTo(mapRef.current);
      }

      // Handle Vendor Location Marker
      if (vendorLat && vendorLng) {
        const vPos = [vendorLat, vendorLng];

        const vendorDivIcon = L.divIcon({
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 68px;">
              <span style="font-size: 26px; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3));">🏪</span>
              <div style="background-color: #f59e0b; color: white; font-size: 8px; font-weight: 800; padding: 1.5px 4.5px; border-radius: 4px; border: 1px solid white; white-space: nowrap; margin-top: -5px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                TOKO VENDOR
              </div>
            </div>
          `,
          className: 'custom-vendor-leaflet-marker',
          iconSize: [68, 40],
          iconAnchor: [34, 30],
        });

        if (vendorMarkerRef.current) {
          vendorMarkerRef.current.setLatLng(vPos);
        } else {
          vendorMarkerRef.current = L.marker(vPos, { icon: vendorDivIcon }).addTo(mapRef.current);
        }

        // Draw dashed Polyline representing shipping path
        const lineCoords = [vPos, center];
        if (lineRef.current) {
          lineRef.current.setLatLngs(lineCoords);
        } else {
          lineRef.current = L.polyline(lineCoords, {
            color: '#10b981', // Emerald
            weight: 3.5,
            dashArray: '8, 6',
          }).addTo(mapRef.current);
        }

        // Auto fitting both markers into standard viewport
        const bounds = L.latLngBounds(lineCoords);
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      } else {
        // Just center map view directly on User coords
        mapRef.current.panTo(center);
      }
    } catch (err) {
      console.error('Error rendering Leaflet Map:', err);
    }
  }, [mapMode, isLeafletLoaded, lat, lng, vendorLat, vendorLng, readOnly]);

  const fetchRealAddress = async (latVal: number, lngVal: number) => {
    setIsSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latVal}&lon=${lngVal}&accept-language=id`
      );
      if (response.ok) {
        const data = await response.json();
        const addressObj = data.address || {};
        
        let matchVillage = 'Tegalsari';
        const osmVillage = addressObj.village || addressObj.suburb || addressObj.hamlet || addressObj.village_cleansed || addressObj.town || '';
        
        if (osmVillage) {
          const matched = TEGALSARI_VILLAGES.find(v => 
            v.name.toLowerCase().includes(osmVillage.toLowerCase()) || 
            osmVillage.toLowerCase().includes(v.name.toLowerCase())
          );
          if (matched) {
            matchVillage = matched.name;
          } else {
            matchVillage = osmVillage;
          }
        } else {
          let minD = Infinity;
          TEGALSARI_VILLAGES.forEach((v) => {
            const d = calculateDistance(latVal, lngVal, v.lat, v.lng);
            if (d < minD) {
              minD = d;
              matchVillage = v.name;
            }
          });
        }
        
        const display_name = data.display_name || '';
        let formattedAddr = '';

        if (display_name) {
          // Remove country and postal code components if present to keep the text neat and beautiful
          let cleanAddr = display_name.replace(/, Indonesia$/, '').trim();
          cleanAddr = cleanAddr.replace(/, \d{5}$/, '').trim();
          formattedAddr = cleanAddr;
        } else {
          const road = addressObj.road || addressObj.street || '';
          const hamlet = addressObj.hamlet || addressObj.neighbourhood || addressObj.suburb || '';
          const village = addressObj.village || addressObj.suburb || osmVillage || matchVillage;
          
          if (road) formattedAddr += `${road}, `;
          if (hamlet && hamlet !== road) formattedAddr += `${hamlet}, `;
          
          const formattedVillage = village.toLowerCase().startsWith('desa') ? village : `Desa ${village}`;
          formattedAddr += `${formattedVillage}, Kec. Tegalsari`;
        }
        
        // Append GPS coordinate markers for maximum shipping precision
        formattedAddr += ` (GPS: ${latVal.toFixed(6)}, ${lngVal.toFixed(6)})`;

        onChangeRef.current(latVal, lngVal, {
          village: matchVillage,
          address: formattedAddr
        });
      } else {
        throw new Error('OSM Reverse Geocoding API fail');
      }
    } catch (e) {
      console.warn('Using local calculations for address geocoding fallback:', e);
      let matchVillage = 'Tegalsari';
      let minD = Infinity;
      TEGALSARI_VILLAGES.forEach((v) => {
        const d = calculateDistance(latVal, lngVal, v.lat, v.lng);
        if (d < minD) {
          minD = d;
          matchVillage = v.name;
        }
      });
      onChangeRef.current(latVal, lngVal, {
        village: matchVillage,
        address: `Desa ${matchVillage}, Kec. Tegalsari, Banyuwangi (GPS: ${latVal.toFixed(6)}, ${lngVal.toFixed(6)})`,
      });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const updateLocationAndTrigger = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    fetchRealAddress(newLat, newLng);
  };

  // Use the HTML-5 Geolocation API
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const uLat = position.coords.latitude;
          const uLng = position.coords.longitude;
          updateLocationAndTrigger(uLat, uLng);
        },
        (error) => {
          console.error('Gagal mendapatkan lokasi GPS:', error);
          alert('GPS diblokir oleh browser atau tidak tersedia. Silakan ketuk daerah peta langsung.');
        }
      );
    } else {
      alert('Browser Anda tidak mendukung layanan Lokasi / GPS.');
    }
  };

  // Draw simulated topographic village map on Canvas (for offline/local/fallback use)
  useEffect(() => {
    if (mapMode !== 'simulated') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerLat = -8.4357;
    const centerLng = 114.1293;
    const zoom = 14000;

    const getXY = (gLat: number, gLng: number) => {
      const x = canvas.width / 2 + (gLng - centerLng) * zoom;
      const y = canvas.height / 2 - (gLat - centerLat) * zoom;
      return { x, y };
    };

    // Draw background grid patterns
    ctx.fillStyle = '#f4fbf7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2f4ea';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    // Draw village territories boundaries
    TEGALSARI_VILLAGES.forEach((v) => {
      const { x, y } = getXY(v.lat, v.lng);
      ctx.beginPath();
      ctx.arc(x, y, 65, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.stroke();
    });

    // Draw primary roads
    ctx.beginPath();
    ctx.strokeStyle = '#fad390';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const ptDasri = getXY(-8.4215, 114.1192);
    const ptTegalsari = getXY(-8.4357, 114.1293);
    const ptKarangdoro = getXY(-8.4521, 114.1415);
    ctx.moveTo(ptDasri.x, ptDasri.y);
    ctx.lineTo(ptTegalsari.x, ptTegalsari.y);
    ctx.lineTo(ptKarangdoro.x, ptKarangdoro.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#ffeaa7';
    ctx.lineWidth = 4;
    const ptKarangmulyo = getXY(-8.4411, 114.1122);
    const ptTamansari = getXY(-8.4298, 114.1388);
    ctx.moveTo(ptKarangmulyo.x, ptKarangmulyo.y);
    ctx.lineTo(ptTegalsari.x, ptTegalsari.y);
    ctx.lineTo(ptTamansari.x, ptTamansari.y);
    ctx.stroke();

    // Road texts
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '9px monospace';
    ctx.fillText('JL. JENDERAL SUDIRMAN', ptTegalsari.x - 50, ptTegalsari.y - 12);
    ctx.fillText('JL. RAYA TEGALSARI', ptKarangdoro.x - 60, ptKarangdoro.y - 12);

    // Draw River / Kali Baru
    ctx.beginPath();
    ctx.strokeStyle = '#74b9ff';
    ctx.lineWidth = 5;
    ctx.moveTo(0, 50);
    ctx.bezierCurveTo(canvas.width * 0.25, 80, canvas.width * 0.6, 250, canvas.width, 320);
    ctx.stroke();
    ctx.fillStyle = '#0984e3';
    ctx.font = 'italic 9px sans-serif';
    ctx.fillText('Sungai Kali Baru', canvas.width * 0.4, 180);

    // Label village names
    TEGALSARI_VILLAGES.forEach((v) => {
      const { x, y } = getXY(v.lat, v.lng);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#064e3b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Desa ${v.name}`, x - 30, y - 8);

      ctx.fillStyle = '#6b7280';
      ctx.font = '9px sans-serif';
      ctx.fillText(v.desc, x - 40, y + 16);
    });

    // Draw shipping path
    if (vendorLat && vendorLng) {
      const ptV = getXY(vendorLat, vendorLng);
      const ptB = getXY(lat, lng);

      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.moveTo(ptV.x, ptV.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const midX = (ptV.x + ptB.x) / 2;
      const midY = (ptV.y + ptB.y) / 2;
      const dist = calculateDistance(vendorLat, vendorLng, lat, lng);

      ctx.fillStyle = '#064e3b';
      ctx.fillRect(midX - 35, midY - 10, 70, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(midX - 35, midY - 10, 70, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${dist} KM`, midX, midY);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Draw Vendor marker
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ptV.x, ptV.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('🏪', ptV.x - 5, ptV.y + 3);
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 9pt sans-serif';
      ctx.fillText(' TOKO VENDOR', ptV.x + 10, ptV.y + 4);
    }

    // Customer pin
    const ptUser = getXY(lat, lng);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(ptUser.x, ptUser.y);
    ctx.bezierCurveTo(ptUser.x - 8, ptUser.y - 20, ptUser.x - 12, ptUser.y - 25, ptUser.x, ptUser.y - 32);
    ctx.bezierCurveTo(ptUser.x + 12, ptUser.y - 25, ptUser.x + 8, ptUser.y - 20, ptUser.x, ptUser.y);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ptUser.x, ptUser.y - 22, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(' LOKASI ANDA', ptUser.x + 12, ptUser.y - 12);
  }, [lat, lng, vendorLat, vendorLng, mapMode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerLat = -8.4357;
    const centerLng = 114.1293;
    const zoom = 14000;

    const clickLng = centerLng + (x - canvas.width / 2) / zoom;
    const clickLat = centerLat - (y - canvas.height / 2) / zoom;

    const finalLat = Math.max(-8.5, Math.min(-8.35, clickLat));
    const finalLng = Math.max(114.05, Math.min(114.2, clickLng));

    updateLocationAndTrigger(finalLat, finalLng);
  };

  const handleVillageSelect = (village: typeof TEGALSARI_VILLAGES[0]) => {
    if (readOnly) return;
    updateLocationAndTrigger(village.lat, village.lng);
  };

  const currentDist = vendorLat && vendorLng ? calculateDistance(vendorLat, vendorLng, lat, lng) : null;

  return (
    <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
      {/* Upper header action elements */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          {label}
        </label>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Selector Mode */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setMapMode('real')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                mapMode === 'real'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              Peta Real (FREE)
            </button>
            <button
              type="button"
              onClick={() => setMapMode('simulated')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                mapMode === 'simulated'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simulasi
            </button>
          </div>

          {!readOnly && (
            <button
              onClick={handleGetCurrentLocation}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
            >
              <Navigation className="w-3 h-3 animate-pulse" />
              Gunakan GPS
            </button>
          )}
        </div>
      </div>

      {/* Map views based on mapMode key */}
      <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-emerald-50 shadow-inner">
        {mapMode === 'real' ? (
          <div className="relative h-[300px] w-full">
            {/* Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-full"
              style={{ zIndex: 1 }}
            />
            
            {/* Loader indicator while asynchronous Leaflet resources are loading */}
            {!isLeafletLoaded && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center z-10 transition-opacity">
                <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="font-bold text-sm">Menghubungkan ke OpenStreetMap...</p>
                <p className="text-xs text-slate-300 mt-1 max-w-xs">Peta satelit & jalan 100% gratis tanpa pendaftaran API Key.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full">
            <canvas
              ref={canvasRef}
              width={window.innerWidth < 640 ? 320 : 560}
              height={300}
              onClick={handleCanvasClick}
              className={`w-full block ${readOnly ? 'cursor-default' : 'cursor-crosshair'}`}
            />
          </div>
        )}

        <div className="absolute bottom-2 left-2 bg-slate-900/85 px-2.5 py-1 text-[10px] text-white rounded font-mono flex items-center gap-1.5 shadow-sm z-10">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>{mapMode === 'real' ? '🌍 OpenStreetMap (100% Free Forever)' : '⚙️ Simulasi Offline'}</span>
        </div>
      </div>

      {/* Real-time Address Resolving Status */}
      {isSearchingAddress && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-pulse shadow-xs">
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
          <span className="leading-snug">Menemukan detail jalan asli untuk koordinat {lat.toFixed(5)}, {lng.toFixed(5)} via OpenStreetMap...</span>
        </div>
      )}

      {/* Map selection summary status details */}
      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex flex-col md:flex-row justify-between gap-3 text-xs">
        <div>
          <p className="font-semibold text-emerald-950">Titik Koordinat (Latitude, Longitude):</p>
          <p className="text-emerald-700 font-mono font-bold">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        </div>
        {currentDist !== null && (
          <div className="bg-emerald-600 text-white p-2.5 rounded-lg flex items-center justify-center gap-2 font-bold shadow-xs whitespace-nowrap self-center">
            <Route className="w-4 h-4 shrink-0" />
            Jarak: {currentDist} KM
          </div>
        )}
      </div>

      {/* Helpful educational widget tutorial about standard Google Maps vs OpenStreetMap */}
      <div className="p-3 bg-slate-50/80 border border-slate-150 rounded-xl space-y-1.5">
        <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          Informasi Peta & API Key:
        </p>
        <p className="text-[10px] text-slate-500 leading-normal">
          Aplikasi Anda kini mendukung <b>Peta Real (OpenStreetMap)</b> secara 100% gratis dan langsung aktif secara otomatis tanpa API Key atau biaya apapun! 
          Jika Anda tetap ingin menggunakan <b>Google Maps</b>, Anda perlu mendapatkan API Key berbayar dari Google Cloud Console (dengan kuota gratis bulanan $200). 
          <i> Dengan OpenStreetMap, operasional bisnis UMKM Anda dijamin hemat biaya selamanya!</i>
        </p>
      </div>
    </div>
  );
}
