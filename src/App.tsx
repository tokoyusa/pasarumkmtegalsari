/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, isSupabaseConfigured } from './lib/supabase';
import { UserProfile, Vendor, Product, Courier, Order, AppSetting } from './types';
import { compressImage } from './lib/imageCompressor';
import MapPicker, { calculateDistance } from './components/MapPicker';
import AboutUMKM from './components/AboutUMKM';
import VendorDashboard from './components/VendorDashboard';
import AdminPanel from './components/AdminPanel';
import PWAInstaller from './components/PWAInstaller';
import { BannerCarousel } from './components/BannerCarousel';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  Menu,
  ShoppingCart,
  LogIn,
  LogOut,
  User,
  MapPin,
  Store,
  ChevronRight,
  Info,
  Search,
  Check,
  X,
  Plus,
  Minus,
  Truck,
  HeartHandshake,
  AlertCircle,
  HelpCircle,
  Phone,
  Bookmark,
  Share2,
  Calendar,
  Sparkles,
  Clipboard,
  ClipboardList,
  ShieldAlert,
  Shield,
  ArrowRight,
  UploadCloud,
  Package,
  Award,
  CreditCard
} from 'lucide-react';

export default function App() {
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<'katalog' | 'tentang' | 'vendor' | 'admin' | 'profil' | 'pesanan' | 'transaksi-pesanan'>('katalog');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // User auth state
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(db.getCurrentUser());
  const [currentUserVendor, setCurrentUserVendor] = useState<Vendor | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authError, setAuthError] = useState('');

  // Register Form states
  const [registerForm, setRegisterForm] = useState({
    email: '',
    name: '',
    phone: '',
    address: 'Dusun Krajan, Desa Tegalsari Centro',
    kecamatan: 'Tegalsari',
    village: 'Tegalsari',
    latitude: -8.4357,
    longitude: 114.1293
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Vendor Registration fields & states
  const [showVendorRegModal, setShowVendorRegModal] = useState(false);
  const [vendorRegForm, setVendorRegForm] = useState({
    business_name: '',
    description: '',
    address: '',
    village: 'Tegalsari',
    bank_name: 'BRI',
    bank_account_number: '',
    bank_account_name: '',
    ktp_url: '',
    logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
    banner_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
    membership_tier: 'free' as 'free' | 'premium' | 'vip'
  });
  const [vendorMembPayMethod, setVendorMembPayMethod] = useState<'pakasir' | 'transfer_manual'>('pakasir');
  const [vendorMembPayProof, setVendorMembPayProof] = useState<string>('');
  const [vendorMembPayStatus, setVendorMembPayStatus] = useState<'unpaid' | 'pending' | 'paid'>('unpaid');
  const [vendorMembActivePayment, setVendorMembActivePayment] = useState<any | null>(null);
  const [vendorMembPayChecking, setVendorMembPayChecking] = useState<boolean>(false);

  // Upgrade Membership states
  const [showUpgradePanel, setShowUpgradePanel] = useState<boolean>(false);
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<'premium' | 'vip'>('premium');
  const [upgradePayMethod, setUpgradePayMethod] = useState<'pakasir' | 'transfer_manual'>('pakasir');
  const [upgradePayProof, setUpgradePayProof] = useState<string>('');
  const [upgradePayStatus, setUpgradePayStatus] = useState<'unpaid' | 'pending' | 'paid'>('unpaid');
  const [upgradeActivePayment, setUpgradeActivePayment] = useState<any | null>(null);
  const [upgradeChecking, setUpgradeChecking] = useState<boolean>(false);

  // PWA (Progressive Web App) states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  // Global App settings and catalog state
  const [appSettings, setAppSettings] = useState<AppSetting | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<Vendor[]>([]);
  const [allCouriers, setAllCouriers] = useState<Courier[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [vendorOrders, setVendorOrders] = useState<Order[]>([]);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<string>('all');
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedVillage, setSelectedVillage] = useState<string>('Semua');

  // Shopping Cart state
  const [cart, setCart] = useState<{ product: Product; variant: string; quantity: number }[]>([]);

  // Selected Detail Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductVariant, setSelectedProductVariant] = useState('');
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<Vendor | null>(null);

  // Checkout Form states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutCourier, setCheckoutCourier] = useState<Courier | null>(null);
  const [checkoutCourierId, setCheckoutCourierId] = useState('');

  // Shipping state variables
  const [shippingMethod, setShippingMethod] = useState<'local' | 'ekspedisi'>('local');
  const [roProvinces, setRoProvinces] = useState<{ province_id: string; province: string }[]>([]);
  const [roCities, setRoCities] = useState<{ city_id: string; type: string; city_name: string; postal_code: string }[]>([]);
  const [roDistricts, setRoDistricts] = useState<{ district_id: string; city_id: string; district_name: string }[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [selectedRoCourier, setSelectedRoCourier] = useState<string>('jne');
  const [roCostResults, setRoCostResults] = useState<{ service: string; description: string; cost: number; etd: string }[]>([]);
  const [selectedRoCostService, setSelectedRoCostService] = useState<{ service: string; description: string; cost: number; etd: string } | null>(null);
  const [roLoadingProvinces, setRoLoadingProvinces] = useState(false);
  const [roLoadingCities, setRoLoadingCities] = useState(false);
  const [roLoadingDistricts, setRoLoadingDistricts] = useState(false);
  const [roLoadingCosts, setRoLoadingCosts] = useState(false);
  const [rajaOngkirStatusMessage, setRajaOngkirStatusMessage] = useState('');

  // Pakasir states
  const [selectedPakasirMethod, setSelectedPakasirMethod] = useState<'qris' | 'cimb_niaga_va' | 'bni_va' | 'sampoerna_va' | 'bnc_va' | 'maybank_va' | 'permata_va' | 'atm_bersama_va' | 'artha_graha_va' | 'bri_va'>('qris');
  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState<string>('COD');
  const [activePakasirPayment, setActivePakasirPayment] = useState<any | null>(null);
  const [isCreatingPakasirTransaction, setIsCreatingPakasirTransaction] = useState(false);
  const [showPakasirPaymentModal, setShowPakasirPaymentModal] = useState(false);

  // BinderByte Tracking states
  const [trackingAwb, setTrackingAwb] = useState('');
  const [trackingCourier, setTrackingCourier] = useState('jne');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [tempResiInputs, setTempResiInputs] = useState<Record<string, { awb: string; courier: string }>>({});

  const handleTrackPackage = async (courierCode: string, awbNumber: string) => {
    if (!courierCode || !awbNumber) return;
    setTrackingLoading(true);
    setTrackingError('');
    setTrackingResult(null);
    setTrackingAwb(awbNumber);
    setTrackingCourier(courierCode);
    setShowTrackingModal(true);
    try {
      const res = await fetch(`/api/binderbyte/track?courier=${courierCode.toLowerCase()}&awb=${awbNumber.trim()}`);
      const data = await res.json();
      if (data.status === 200 && data.data) {
        setTrackingResult(data.data);
      } else {
        setTrackingError(data.error || data.message || 'Gagal memuat history pelacakan resi.');
      }
    } catch (err: any) {
      console.error('BinderByte tracking error:', err);
      setTrackingError(err.message || 'Gagal terhubung ke server pelacak resi.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleUpdateOrderTracking = async (orderId: string) => {
    const input = tempResiInputs[orderId];
    if (!input || !input.awb) {
      alert('Harap isi Nomor Resi / AWB terlebih dahulu!');
      return;
    }
    try {
      await db.updateOrderTracking(orderId, input.awb.trim(), input.courier);
      setUiMessage({ text: `Nomor Resi untuk Order #${orderId} berhasil disimpan!`, type: 'success' });
      // Reload orders
      if (currentProfile) {
        await refreshOrders();
      }
    } catch (err: any) {
      alert('Gagal memperbarui resi: ' + err.message);
    }
  };

  const handleCreatePakasirTransaction = async (method: string, order_id: string, amount: number) => {
    // 1. Attempt using Server API Proxy
    try {
      const res = await fetch('/api/pakasir/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, order_id, amount })
      });
      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('NOT_JSON');
      }

      if (json.success && json.data) {
        // Normalize response so it always has the payment object, matching the client-side fallback
        const paymentData = json.data.payment || json.data;
        return { payment: paymentData };
      }
      if (json.error || json.message) {
        throw new Error(json.message || 'Server error');
      }
    } catch (e: any) {
      console.warn('[Pakasir Proxy Failed, trying direct client-side fallback]', e);
    }

    // 2. Client-side direct call fallback (using appSettings credentials)
    const apiKey = appSettings?.pakasir_api_key;
    const project = appSettings?.pakasir_merchant_id || appSettings?.pakasir_project_name || 'depodomain';
    const isEnabled = appSettings?.pakasir_enabled;

    if (isEnabled && apiKey && apiKey !== 'xxx123') {
      try {
        console.log(`[Pakasir Client] Creating transaction for ${order_id} directly from browser...`);
        const res = await fetch(`https://app.pakasir.com/api/transactioncreate/${method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project,
            order_id,
            amount: Number(amount),
            api_key: apiKey
          })
        });
        const data = await res.json();
        if (res.ok && data) {
          return { payment: data.payment || data };
        } else {
          console.error('[Pakasir Direct API Error]', data);
        }
      } catch (directErr: any) {
        console.error('[Pakasir Direct API Exception]', directErr);
      }
    }

    // 3. Client-side simulation sandbox mode fallback (ensures it NEVER fails)
    console.log('[Pakasir Simulation] Activating sandbox payment simulation for', order_id);

    // Return a beautiful mock payment structure
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);

    let payment_number = '00020101021126570014ID.CO.QRIS.WWW.PAKASIR.SANDBOX';
    if (method !== 'qris') {
      payment_number = '88801' + Math.floor(1000000000 + Math.random() * 9000000000);
    }

    return {
      payment: {
        order_id: order_id,
        amount: Number(amount),
        fee: 0,
        total_payment: Number(amount),
        payment_method: method,
        payment_number: payment_number,
        expired_at: expiryDate.toISOString()
      }
    };
  };

  const handleCheckPakasirStatus = async (orderId: string, amount: number) => {
    try {
      const res = await fetch(`/api/pakasir/status/${orderId}?amount=${amount}`);
      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
        if (json.completed !== undefined) {
          return json.completed;
        }
      } catch (parseErr) {
        // Response is HTML / invalid
      }
    } catch (err) {
      console.warn('[Status Check Proxy Failed]', err);
    }

    // Direct check fallback
    const apiKey = appSettings?.pakasir_api_key;
    const project = appSettings?.pakasir_merchant_id || appSettings?.pakasir_project_name || 'depodomain';
    const isEnabled = appSettings?.pakasir_enabled;

    if (isEnabled && apiKey && apiKey !== 'xxx123') {
      try {
        const queryParams = new URLSearchParams({
          project,
          amount: String(Math.round(amount)),
          order_id: orderId,
          api_key: apiKey
        });
        const res = await fetch(`https://app.pakasir.com/api/transactiondetail?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const extractStatusLower = (obj: any): string => {
            if (!obj) return "";
            const statusKeys = ["status", "payment_status", "transaction_status", "state", "payment_state", "trx_status"];
            for (const key of statusKeys) {
              if (obj[key] && typeof obj[key] === "string") return obj[key].trim().toLowerCase();
            }
            const nestedKeys = ["data", "payment", "transaction", "trx", "result"];
            for (const key of nestedKeys) {
              if (obj[key] && typeof obj[key] === "object") {
                const nestedStatus = extractStatusLower(obj[key]);
                if (nestedStatus) return nestedStatus;
              }
            }
            return "";
          };
          const extracted = extractStatusLower(data);
          const isSuccess = ["completed", "success", "paid", "settlement", "sukses", "berhasil", "done"].includes(extracted);
          if (isSuccess) {
            return true;
          }
        }
      } catch (directErr) {
        console.error('[Direct Status Check Exception]', directErr);
      }
    }

    // Keep the modal open (return false) until the server status check or manual simulator updates it
    console.log('[Pakasir Status] Transaction status checked, remaining in pending state until paid or simulated.');
    return false;
  };

  const loadRoProvinces = async () => {
    if (roProvinces.length > 0) return;
    setRoLoadingProvinces(true);
    setRajaOngkirStatusMessage('');
    try {
      const res = await fetch('/api/shipping/provinces');
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('NOT_JSON');
      }

      if (data.results) {
        setRoProvinces(data.results);
        setRajaOngkirStatusMessage(`✅ Layanan Cek Ongkir Nasional Aktif`);
      } else if (data.error) {
        setRajaOngkirStatusMessage(`❌ Error Server: ${data.error}`);
      } else {
        setRajaOngkirStatusMessage('❌ Gagal menghubungi server pengiriman.');
      }
    } catch (err: any) {
      console.warn('Gagal mengambil data provinsi dari backend, menggunakan client-side fallback:', err);
      try {
        const clientRes = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const clientData = await clientRes.json();
        if (Array.isArray(clientData)) {
          const formatName = (str: string) => {
            return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          };
          const mapped = clientData.map((item: any) => ({
            province_id: String(item.id),
            province: formatName(item.name)
          }));
          setRoProvinces(mapped);
          setRajaOngkirStatusMessage(`✅ Layanan Cek Ongkir Aktif (Client-Side Fallback)`);
        } else {
          throw new Error('Invalid API Response');
        }
      } catch (fallbackErr: any) {
        console.error('Client-side fallback failed:', fallbackErr);
        const LOCAL_PROVINCES = [
          { province_id: "11", province: "Jawa Timur" },
          { province_id: "10", province: "Jawa Tengah" },
          { province_id: "9", province: "Jawa Barat" },
          { province_id: "6", province: "DKI Jakarta" },
          { province_id: "5", province: "DI Yogyakarta" },
          { province_id: "3", province: "Banten" }
        ];
        setRoProvinces(LOCAL_PROVINCES);
        setRajaOngkirStatusMessage(`⚠️ Layanan Cek Ongkir Aktif (Data Lokal)`);
      }
    } finally {
      setRoLoadingProvinces(false);
    }
  };

  const loadRoCities = async (provId: string) => {
    setRoLoadingCities(true);
    setRoCities([]);
    setSelectedCityId('');
    setRoDistricts([]);
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setRoCostResults([]);
    setSelectedRoCostService(null);
    try {
      const res = await fetch(`/api/shipping/cities?provinceId=${provId}`);
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('NOT_JSON');
      }

      if (data.results) {
        setRoCities(data.results);
      } else if (data.error) {
        setRajaOngkirStatusMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.warn('Gagal mengambil data kota dari backend, menggunakan client-side fallback:', err);
      try {
        const clientRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`);
        const clientData = await clientRes.json();
        if (Array.isArray(clientData)) {
          const formatName = (str: string) => {
            return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          };
          const mapped = clientData.map((item: any) => {
            const rawName = item.name || "";
            let type = "Kabupaten";
            let cityName = rawName;
            if (rawName.toUpperCase().startsWith("KABUPATEN ")) {
              type = "Kabupaten";
              cityName = formatName(rawName.substring(10));
            } else if (rawName.toUpperCase().startsWith("KOTA ")) {
              type = "Kota";
              cityName = formatName(rawName.substring(5));
            } else {
              cityName = formatName(rawName);
            }
            return {
              city_id: String(item.id),
              province_id: String(provId),
              type,
              city_name: cityName
            };
          });
          setRoCities(mapped);
        }
      } catch (fallbackErr) {
        console.error('Client-side fallback for cities failed:', fallbackErr);
        const LOCAL_CITIES = [
          { city_id: "42", province_id: "11", type: "Kabupaten", city_name: "Banyuwangi" },
          { city_id: "444", province_id: "11", type: "Kota", city_name: "Surabaya" },
          { city_id: "445", province_id: "11", type: "Kota", city_name: "Malang" }
        ].filter(c => c.province_id === String(provId));
        setRoCities(LOCAL_CITIES);
      }
    } finally {
      setRoLoadingCities(false);
    }
  };

  const loadRoDistricts = async (cityId: string) => {
    setRoLoadingDistricts(true);
    setRoDistricts([]);
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setRoCostResults([]);
    setSelectedRoCostService(null);
    try {
      const res = await fetch(`/api/shipping/districts?cityId=${cityId}`);
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('NOT_JSON');
      }

      if (data.results) {
        setRoDistricts(data.results);
      }
    } catch (err) {
      console.warn('Gagal mengambil data kecamatan dari backend, menggunakan client-side fallback:', err);
      try {
        const clientRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`);
        const clientData = await clientRes.json();
        if (Array.isArray(clientData)) {
          const formatName = (str: string) => {
            return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          };
          const mapped = clientData.map((item: any) => ({
            district_id: String(item.id),
            city_id: String(cityId),
            district_name: formatName(item.name)
          }));
          setRoDistricts(mapped);
        }
      } catch (fallbackErr) {
        console.error('Client-side fallback for districts failed:', fallbackErr);
        const LOCAL_DISTRICTS = [
          { district_id: "351001", city_id: String(cityId), district_name: "Tegalsari" },
          { district_id: "351002", city_id: String(cityId), district_name: "Genteng" },
          { district_id: "351003", city_id: String(cityId), district_name: "Banyuwangi" },
          { district_id: "351004", city_id: String(cityId), district_name: "Rogojampi" }
        ];
        setRoDistricts(LOCAL_DISTRICTS);
      }
    } finally {
      setRoLoadingDistricts(false);
    }
  };

  const calculateRoCosts = async (cityId: string, districtId: string, courier: string) => {
    if (!cityId || !districtId) return;
    setRoLoadingCosts(true);
    setRoCostResults([]);
    setSelectedRoCostService(null);
    setRajaOngkirStatusMessage('');
    try {
      const engine = 'binderbyte';
      
      let originAddress = '';
      if (currentCheckoutVendor?.rajaongkir_origin_district_name && currentCheckoutVendor?.rajaongkir_origin_name) {
        originAddress = `${currentCheckoutVendor.rajaongkir_origin_district_name}, ${currentCheckoutVendor.rajaongkir_origin_name}`;
      } else if (currentCheckoutVendor?.rajaongkir_origin_name) {
        originAddress = currentCheckoutVendor.rajaongkir_origin_name;
      } else {
        originAddress = currentCheckoutVendor?.address || 'tegalsari, banyuwangi';
      }

      const totalWeight = cart.reduce((total, item) => total + (item.product.weight || 1000) * item.quantity, 0);

      const selectedCityObj = roCities.find(c => String(c.city_id) === String(cityId));
      const selectedDistrictObj = roDistricts.find(d => String(d.district_id) === String(districtId));

      let destinationVal = '';
      if (selectedDistrictObj && selectedCityObj) {
        destinationVal = `${selectedDistrictObj.district_name}, ${selectedCityObj.city_name}`;
      } else if (selectedCityObj) {
        destinationVal = selectedCityObj.city_name;
      } else {
        destinationVal = cityId;
      }

      console.log(`[Shipping Costs] Querying origin="${originAddress}", destination="${destinationVal}"`);

      let data: any = {};
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: engine,
            origin: originAddress,
            destination: destinationVal,
            weight: totalWeight,
            courier: courier,
            couriers: [courier] // Only calculate for the selected courier
          })
        });
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          throw new Error('NOT_JSON');
        }
      } catch (err) {
        console.warn('Gagal melakukan estimasi ongkir dari backend, menggunakan client-side simulation:', err);
        // Generate simulated costs directly on the client
        const baseTariffs: Record<string, { service: string, desc: string, rate: number, etd: string }[]> = {
          jne: [
            { service: "JNE REG", desc: "Layanan Reguler JNE", rate: 11000, etd: "2-3 Hari" },
            { service: "JNE YES", desc: "Layanan Yakin Esok Sampai JNE", rate: 22000, etd: "1 Hari" }
          ],
          sicepat: [
            { service: "SICEPAT REG", desc: "SiCepat Reguler", rate: 11500, etd: "1-2 Hari" },
            { service: "SICEPAT BEST", desc: "SiCepat Besok Sampai Tujuan", rate: 20000, etd: "1 Hari" }
          ],
          jnt: [
            { service: "J&T EZ", desc: "J&T Express EZ", rate: 11000, etd: "2-3 Hari" },
            { service: "J&T Super", desc: "J&T Express Super Fast", rate: 23000, etd: "1-2 Hari" }
          ],
          pos: [
            { service: "POS Reguler", desc: "Pos Reguler Kantor Pos", rate: 10000, etd: "2-4 Hari" },
            { service: "POS Nextday", desc: "Pos Next Day Kilat Khusus", rate: 19000, etd: "1-2 Hari" }
          ],
          tiki: [
            { service: "TIKI REG", desc: "TIKI Reguler Service", rate: 10500, etd: "2-3 Hari" },
            { service: "TIKI ONS", desc: "TIKI Over Night Service", rate: 21000, etd: "1 Hari" }
          ],
          anteraja: [
            { service: "ANTERAJA REG", desc: "AnterAja Regular", rate: 10000, etd: "1-3 Hari" },
            { service: "ANTERAJA SDS", desc: "AnterAja Same Day Service", rate: 25000, etd: "1 Hari" }
          ],
          wahana: [
            { service: "WAHANA Normal", desc: "Wahana Service Normal", rate: 8000, etd: "3-5 Hari" }
          ],
          ninja: [
            { service: "NINJA REG", desc: "Ninja Reguler", rate: 10500, etd: "2-3 Hari" }
          ],
          lion: [
            { service: "LION REGPACK", desc: "Lion Parcel Regpack", rate: 10000, etd: "2-3 Hari" }
          ]
        };

        const courierLower = courier.toLowerCase();
        const services = baseTariffs[courierLower] || [
          { service: `${courier.toUpperCase()} REG`, desc: `Layanan Reguler ${courier.toUpperCase()}`, rate: 12000, etd: "2-3 Hari" }
        ];

        const weightMultiplier = Math.max(1, Math.ceil(totalWeight / 1000));
        const mockResults = services.map(s => ({
          service: s.service,
          description: s.desc,
          cost: s.rate * weightMultiplier,
          etd: s.etd
        }));

        data = { results: mockResults };
      }
      
      let formatted: any[] = [];
      if (data.results && Array.isArray(data.results)) {
        formatted = data.results.map((r: any) => ({
          service: r.service,
          description: r.description || r.service,
          cost: r.cost || 0,
          etd: r.etd || '2-3 Hari'
        }));
      }

      setRoCostResults(formatted);

      // Select the first service matching the courier
      const matched = formatted.filter((c: any) => {
        const serviceLower = String(c.service).toLowerCase();
        const courierLower = String(courier).toLowerCase();
        if (courierLower === 'jnt' && (serviceLower.includes('j&t') || serviceLower.includes('jnt'))) {
          return true;
        }
        if (courierLower === 'pos' && serviceLower.includes('pos')) {
          return true;
        }
        return serviceLower.startsWith(courierLower) || serviceLower.includes(courierLower);
      });

      if (matched.length > 0) {
        setSelectedRoCostService(matched[0]);
      } else if (formatted.length > 0) {
        setSelectedRoCostService(formatted[0]);
      } else {
        setRajaOngkirStatusMessage('⚠️ Tidak ada layanan kurir yang tersedia untuk rute atau berat paket ini.');
      }
    } catch (err) {
      console.error('Gagal mengambil biaya pengiriman:', err);
      setRajaOngkirStatusMessage('❌ Gagal menghubungi server pengiriman.');
    } finally {
      setRoLoadingCosts(false);
    }
  };

  useEffect(() => {
    if (shippingMethod === 'ekspedisi' && showCheckoutModal) {
      loadRoProvinces();
    }
  }, [shippingMethod, showCheckoutModal]);

  // Auto poll order status when Pakasir payment modal is active
  useEffect(() => {
    let intervalId: any;
    if (showPakasirPaymentModal && activePakasirPayment?.order_id && currentProfile) {
      intervalId = setInterval(async () => {
        try {
          let isCompleted = false;
          // Sync with server-side transaction completed memory in case of local storage or latency
          try {
            const pAmount = activePakasirPayment.original_amount || activePakasirPayment.amount;
            const completed = await handleCheckPakasirStatus(activePakasirPayment.order_id, pAmount);
            if (completed) {
              await db.updateOrderStatus(activePakasirPayment.order_id, 'processing');
              isCompleted = true;
            }
          } catch (statusErr) {
            console.error('Error fetching/syncing Pakasir status in polling:', statusErr);
          }

          await refreshOrders();
          const currentOrder = userOrders.find((o: any) => o.id === activePakasirPayment.order_id);
          if (isCompleted || (currentOrder && (currentOrder.status === 'processing' || currentOrder.status === 'shipped' || currentOrder.status === 'completed'))) {
            setUiMessage({ text: 'Selamat! Pembayaran Anda sebesar Rp ' + Number(activePakasirPayment.total_payment || activePakasirPayment.amount).toLocaleString() + ' telah terverifikasi secara otomatis oleh sistem Pakasir.', type: 'success' });
            setShowPakasirPaymentModal(false);
            setActiveTab('pesanan');
            
            // Clean up message after 10 seconds
            setTimeout(() => {
              setUiMessage(null);
            }, 10000);
          }
        } catch (err) {
          console.error('Error polling order status:', err);
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showPakasirPaymentModal, activePakasirPayment, currentProfile]);



  // Affiliate context
  const [urlAffiliateId, setUrlAffiliateId] = useState<string | null>(null);

  // Main UI Messages
  const [uiMessage, setUiMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialize and load core marketplace data
  useEffect(() => {
    // Detect URL Affiliate query e.g. ?aff=vendor_budi
    const params = new URLSearchParams(window.location.search);
    const affId = params.get('aff');
    if (affId) {
      setUrlAffiliateId(affId);
      console.log('🔗 Terdeteksi promosi via Affiliator:', affId);
    }

    loadAppMetadata();
  }, []);

  // Listen for PWA installation prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('📌 PWA Install Prompt Event Fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari Detection
    const isIOSMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      setShowInstallBanner(false);
    } else if (isIOSMobile) {
      // For iOS, trigger the instruction banner after a short delay
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install choice outcome: ${outcome}`);
    } catch (err) {
      console.error('Error during PWA installation choice:', err);
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const loadAppMetadata = async () => {
    try {
      const settings = await db.getAppSettings();
      setAppSettings(settings);

      const prods = await db.getProducts();
      setProducts(prods);

      const vends = await db.getApprovedVendors();
      setApprovedVendors(vends);

      const cours = await db.getCouriers();
      setAllCouriers(cours.filter(c => c.status === 'active'));

      try {
        const users = await db.getUsers();
        setAllProfiles(users);
      } catch (e) {
        console.error('Gagal mengambil data user profiles:', e);
      }

      if (currentProfile) {
        await refreshOrders(currentProfile);
        try {
          const v = await db.getVendor(currentProfile.id);
          setCurrentUserVendor(v);
        } catch (e) {
          console.error('Gagal mengambil data vendor user:', e);
        }
      } else {
        setCurrentUserVendor(null);
      }
    } catch (err) {
      console.error('Gagal mengambil data katalog:', err);
    }
  };

  const refreshOrders = async (profile = currentProfile) => {
    if (!profile) {
      setUserOrders([]);
      setVendorOrders([]);
      return;
    }
    try {
      // 1. Always load shopping history (as buyer)
      const bOrds = await db.getOrders(profile.id, 'buyer');
      setUserOrders(bOrds);

      // 2. Load incoming vendor orders if role is vendor or admin
      if (profile.role === 'vendor') {
        const vOrds = await db.getOrders(profile.id, 'vendor');
        setVendorOrders(vOrds);
      } else if (profile.role === 'admin') {
        const allOrds = await db.getOrders(profile.id, 'admin');
        setVendorOrders(allOrds);
      } else {
        setVendorOrders([]);
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
    }
  };

  const handleRefreshProfileSession = async () => {
    const refreshed = db.getCurrentUser();
    setCurrentProfile(refreshed);
    try {
      const users = await db.getUsers();
      setAllProfiles(users);
    } catch (e) {
      console.error(e);
    }
    if (refreshed) {
      await refreshOrders(refreshed);
    }
    await loadAppMetadata();
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (!loginEmail) return;
      const user = await db.signIn(loginEmail.trim());
      setCurrentProfile(user);
      setShowLoginModal(false);
      setLoginEmail('');
      setUiMessage({ text: `Selamat datang kembali, ${user.name}!`, type: 'success' });
      
      // Load user transactions
      await refreshOrders(user);
    } catch (err: any) {
      setAuthError(err.message || 'Email tidak dikenal! Silahkan buat akun baru.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const newUser = await db.signUp(
        registerForm.email.trim(),
        'buyer', // defaults to buyer role
        registerForm.name.trim(),
        registerForm.phone.trim(),
        registerForm.address.trim(),
        registerForm.kecamatan,
        registerForm.village,
        registerForm.latitude,
        registerForm.longitude
      );
      setCurrentProfile(newUser);
      setIsRegistering(false);
      setShowLoginModal(false);
      setUiMessage({ text: `Registrasi berhasil! Selamat datang, ${newUser.name}!`, type: 'success' });
    } catch (err: any) {
      setAuthError(err.message || 'Gagal mendaftar.');
    }
  };

  const handleSignOut = () => {
    db.signOut();
    setCurrentProfile(null);
    setCart([]);
    setUserOrders([]);
    setActiveTab('katalog');
    setUiMessage({ text: 'Sesi akun Anda berhasil keluar.', type: 'success' });
  };

  const handleApplyAsVendor = () => {
    if (!currentProfile) {
      setShowLoginModal(true);
      return;
    }
    // Deep copy user fields to registration form
    setVendorRegForm({
      business_name: `Toko UMKM ${currentProfile.name}`,
      description: 'Pelaku UMKM lokal Desa/Kelurahan Tegalsari yang menyajikan produk unggulan olahan mandiri.',
      address: currentProfile.address,
      village: currentProfile.village,
      bank_name: 'BRI',
      bank_account_number: '',
      bank_account_name: currentProfile.name,
      ktp_url: '', // Empty initially, must be uploaded
      logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
      banner_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
      membership_tier: 'free'
    });
    setVendorMembPayMethod('pakasir');
    setVendorMembPayProof('');
    setVendorMembPayStatus('unpaid');
    setVendorMembActivePayment(null);
    setVendorMembPayChecking(false);
    setShowVendorRegModal(true);
  };

  const handleRegisterVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;
    if (!vendorRegForm.ktp_url) {
      alert("⚠️ UNTUK VERIFIKASI: Anda wajib mengunggah Foto KTP Anda sebelum mengirim pendaftaran!");
      return;
    }

    if (vendorRegForm.membership_tier !== 'free') {
      if (vendorMembPayMethod === 'transfer_manual') {
        if (!vendorMembPayProof) {
          alert("⚠️ PEMBAYARAN: Anda wajib mengunggah bukti transfer manual terlebih dahulu!");
          return;
        }
      } else {
        if (vendorMembPayStatus !== 'paid') {
          alert("⚠️ PEMBAYARAN: Silakan selesaikan pembayaran QRIS Pakasir terlebih dahulu sampai berstatus 'LUNAS / PAID'!");
          return;
        }
      }
    }

    try {
      await db.registerVendor({
        id: currentProfile.id,
        business_name: vendorRegForm.business_name.trim(),
        logo_url: vendorRegForm.logo_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
        banner_url: vendorRegForm.banner_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
        ktp_url: vendorRegForm.ktp_url,
        description: vendorRegForm.description.trim(),
        address: vendorRegForm.address.trim(),
        kecamatan: 'Tegalsari',
        village: vendorRegForm.village,
        phone: currentProfile.phone,
        bank_name: vendorRegForm.bank_name,
        bank_account_number: vendorRegForm.bank_account_number.trim(),
        bank_account_name: vendorRegForm.bank_account_name.trim(),
        status: 'pending', // awaits admin approval
        membership_tier: vendorRegForm.membership_tier.toUpperCase() as any,
        memb_pay_method: vendorRegForm.membership_tier === 'free' ? undefined : vendorMembPayMethod,
        memb_pay_status: vendorRegForm.membership_tier === 'free' ? undefined : (vendorMembPayMethod === 'transfer_manual' ? 'pending' : 'paid'),
        memb_pay_proof: vendorRegForm.membership_tier === 'free' ? undefined : vendorMembPayProof
      });

      setShowVendorRegModal(false);
      setUiMessage({ text: 'Pendaftaran Toko UMKM sukses terkirim! Silahkan hubungi Admin untuk proses aktivasi KTP dan profil toko.', type: 'success' });
      loadAppMetadata();
    } catch (err: any) {
      alert("Gagal mengirim pendaftaran: " + err.message);
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile || !currentUserVendor) return;

    if (upgradePayMethod === 'transfer_manual') {
      if (!upgradePayProof) {
        alert("⚠️ PEMBAYARAN: Anda wajib mengunggah bukti transfer manual terlebih dahulu!");
        return;
      }
    } else {
      if (upgradePayStatus !== 'paid') {
        alert("⚠️ PEMBAYARAN: Silakan selesaikan pembayaran QRIS Pakasir terlebih dahulu sampai berstatus 'LUNAS / PAID'!");
        return;
      }
    }

    try {
      await db.updateVendor(currentProfile.id, {
        membership_tier: upgradeTargetTier.toUpperCase() as any,
        memb_pay_method: upgradePayMethod,
        memb_pay_status: upgradePayMethod === 'transfer_manual' ? 'pending' : 'paid',
        memb_pay_proof: upgradePayProof
      });

      setUiMessage({ 
        text: upgradePayMethod === 'transfer_manual' 
          ? 'Pengajuan upgrade keanggotaan berhasil dikirim! Menunggu verifikasi bukti transfer oleh Admin.' 
          : 'Selamat! Keanggotaan Anda berhasil ditingkatkan secara instan menjadi ' + upgradeTargetTier.toUpperCase() + '.', 
        type: 'success' 
      });
      
      setShowUpgradePanel(false);
      setUpgradePayProof('');
      setUpgradePayStatus('unpaid');
      setUpgradeActivePayment(null);
      
      // Reload app metadata & vendor session
      loadAppMetadata();
    } catch (err: any) {
      alert("Gagal melakukan upgrade keanggotaan: " + err.message);
    }
  };

  // Cart Operations
  const addToCart = (product: Product, variant: string) => {
    const activeVar = variant || (product.variants && product.variants[0]) || 'Original';
    const index = cart.findIndex(c => c.product.id === product.id && c.variant === activeVar);
    
    if (index !== -1) {
      const updated = [...cart];
      updated[index].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, variant: activeVar, quantity: 1 }]);
    }
    setUiMessage({ text: `${product.name} dimasukkan ke keranjang belanja!`, type: 'success' });
  };

  const updateCartQuantity = (prodId: string, variant: string, val: number) => {
    const index = cart.findIndex(c => c.product.id === prodId && c.variant === variant);
    if (index !== -1) {
      const updated = [...cart];
      updated[index].quantity += val;
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1);
      }
      setCart(updated);
    }
  };

  // Checkout calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    const unitPrice = item.product.discount_price || item.product.price;
    return sum + (unitPrice * item.quantity);
  }, 0);

  // Find vendor for of the selected product
  const getProductVendor = (vendorId: string): Vendor | undefined => {
    return approvedVendors.find(v => v.id === vendorId);
  };

  // Compute shipping fee based on distance
  const currentCheckoutVendor = cart.length > 0 ? getProductVendor(cart[0].product.vendor_id) : null;

  // Reset selected courier and shipping options based on checkout vendor setup
  useEffect(() => {
    if (currentCheckoutVendor?.rajaongkir_couriers && currentCheckoutVendor.rajaongkir_couriers.length > 0) {
      setSelectedRoCourier(currentCheckoutVendor.rajaongkir_couriers[0]);
    } else {
      setSelectedRoCourier('jne');
    }
    if (currentCheckoutVendor?.payment_methods && currentCheckoutVendor.payment_methods.length > 0) {
      setSelectedPaymentCategory(currentCheckoutVendor.payment_methods[0]);
    } else {
      setSelectedPaymentCategory('COD');
    }
    setSelectedProvinceId('');
    setSelectedCityId('');
    setRoCostResults([]);
    setSelectedRoCostService(null);
  }, [currentCheckoutVendor]);

  useEffect(() => {
    if (shippingMethod === 'ekspedisi' && selectedPaymentCategory === 'COD') {
      const vendorPaymentMethods = currentCheckoutVendor?.payment_methods && currentCheckoutVendor.payment_methods.length > 0 
        ? currentCheckoutVendor.payment_methods 
        : ['COD', 'Pakasir QRIS', 'Transfer Bank Local'];
      const nonCod = vendorPaymentMethods.filter(m => m !== 'COD');
      if (nonCod.length > 0) {
        setSelectedPaymentCategory(nonCod[0]);
      } else {
        setSelectedPaymentCategory('Pakasir QRIS');
      }
    }
  }, [shippingMethod, selectedPaymentCategory, currentCheckoutVendor]);

  const currentCheckoutVendorProfile = currentCheckoutVendor && allProfiles
    ? allProfiles.find(p => p.id === currentCheckoutVendor.id)
    : null;



  const currentDistanceKm = currentProfile && currentProfile.latitude && currentCheckoutVendor
    ? (() => {
        const pLat = Number(currentProfile.latitude);
        const pLng = Number(currentProfile.longitude || 0);
        
        // Default coordinates if profile data is missing/invalid
        let vLat = -8.4357;
        let vLng = 114.1293;
        
        if (currentCheckoutVendorProfile && currentCheckoutVendorProfile.latitude) {
          vLat = Number(currentCheckoutVendorProfile.latitude);
          vLng = Number(currentCheckoutVendorProfile.longitude || 0);
        } else if (currentCheckoutVendor.id === 'vendor_siti') {
          vLat = -8.4521;
          vLng = 114.1415;
        } else if (currentCheckoutVendor.id === 'vendor_budi') {
          vLat = -8.4215;
          vLng = 114.1192;
        } else {
          // If no specific fallback is configured, check if we can parse from vendor business location details
          // such as mapping database villages to coordinates if they match
          const fallbackVillages: { [key: string]: { lat: number, lng: number } } = {
            'Tegalsari': { lat: -8.4357, lng: 114.1293 },
            'Pulesari': { lat: -8.4410, lng: 114.1250 },
            'Pungangan': { lat: -8.4320, lng: 114.1350 },
            'Randu Kuning': { lat: -8.4480, lng: 114.1200 },
            'Siwatu': { lat: -8.4280, lng: 114.1230 },
            'Bulu': { lat: -8.4390, lng: 114.1420 },
            'Bleder': { lat: -8.4450, lng: 114.1310 },
            'Karangmulyo': { lat: -8.4411, lng: 114.1122 },
            'Dasri': { lat: -8.4215, lng: 114.1192 },
            'Karangdoro': { lat: -8.4521, lng: 114.1415 },
            'Tamansari': { lat: -8.4116, lng: 114.1378 }
          };
          const vVillage = currentCheckoutVendor.village;
          if (vVillage && fallbackVillages[vVillage]) {
            vLat = fallbackVillages[vVillage].lat;
            vLng = fallbackVillages[vVillage].lng;
          }
        }
        
        const calculated = calculateDistance(pLat, pLng, vLat, vLng);
        // Round to 2 decimal places with minimum 0.1 KM precision
        return Math.max(0.1, Number(calculated.toFixed(2)));
      })()
    : 1.5;

  const currentShippingFee = shippingMethod === 'ekspedisi'
    ? (selectedRoCostService ? selectedRoCostService.cost : 0)
    : (checkoutCourier
        ? checkoutCourier.base_fare + Math.max(0, currentDistanceKm - 1) * checkoutCourier.price_per_km
        : 0);

  const grandTotal = cartSubtotal + currentShippingFee;

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    
    const vendor = approvedVendors.find(v => v.id === p.vendor_id);
    const matchesVillage = selectedVillage === 'Semua' || (vendor && vendor.village === selectedVillage);

    return matchesSearch && matchesCategory && matchesVillage;
  });

  const villagesList = ['Tegalsari', 'Pulesari', 'Pungangan', 'Randu Kuning', 'Siwatu', 'Bulu', 'Bleder'];
  const categoriesList = ['Semua', ...(appSettings?.categories && appSettings.categories.length > 0 ? appSettings.categories : ['Makanan Ringan', 'Minuman Tradisional', 'Batik & Sandang', 'Kesehatan & Herbal', 'Sembako & Hasil Bumi', 'Kerajinan Tangan'])];

  // Handle Courier Select
  const handleCourierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    setCheckoutCourierId(cId);
    const courierObj = allCouriers.find(c => c.id === cId) || null;
    setCheckoutCourier(courierObj);
  };

  // Final Order placement
  const handlePlaceOrder = async () => {
    if (!currentProfile) return;
    if (cart.length === 0) return;
    
    if (shippingMethod === 'local' && !checkoutCourier) {
      alert('Harap pilih salah satu kurir lokal mandiri penanggung jawab pengiriman!');
      return;
    }
    if (shippingMethod === 'ekspedisi' && !selectedRoCostService) {
      alert('Harap lengkapi pilihan tujuan pengiriman Anda (Provinsi, Kota, Kecamatan) dan pilih salah satu Layanan & Ongkir Ekspedisi Nasional yang tersedia sebelum membuat pesanan!');
      return;
    }

    // Identify vendor details
    const vendorId = cart[0].product.vendor_id;
    const vendorObj = getProductVendor(vendorId);

    // Calculate affiliate commission (if enabled for this vendor)
    let commAmount = 0;
    if (urlAffiliateId && urlAffiliateId !== vendorId) {
      // 10% standard default commission, or product specifics
      commAmount = Math.round(cartSubtotal * 0.1);
    }

    try {
      setIsCreatingPakasirTransaction(true);
      const isEkspedisi = shippingMethod === 'ekspedisi';
      const isPakasir = selectedPaymentCategory === 'Pakasir QRIS';
      const pm = isPakasir ? `Pakasir (${selectedPakasirMethod.toUpperCase()})` : selectedPaymentCategory;

      const order = await db.createOrder({
        buyer_id: currentProfile.id,
        buyer_name: currentProfile.name,
        buyer_phone: currentProfile.phone,
        vendor_id: vendorId,
        vendor_name: vendorObj?.business_name || 'Vendor UMKM',
        vendor_phone: vendorObj?.phone || currentProfile.phone,
        courier_id: isEkspedisi ? null : checkoutCourier!.id,
        courier_name: isEkspedisi 
          ? `Ekspedisi (${selectedRoCourier.toUpperCase()} - ${selectedRoCostService!.service})` 
          : checkoutCourier!.name,
        courier_phone: isEkspedisi ? 'Ekspedisi Nasional' : checkoutCourier!.phone,
        courier_code: isEkspedisi ? selectedRoCourier : undefined,
        items: cart.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          variant: i.variant,
          quantity: i.quantity,
          price: i.product.discount_price || i.product.price
        })),
        total_amount: grandTotal,
        shipping_fee: currentShippingFee,
        distance_km: currentDistanceKm,
        status: 'pending',
        payment_method: pm,
        shipping_address: currentProfile.address,
        shipping_latitude: currentProfile.latitude || -8.4357,
        shipping_longitude: currentProfile.longitude || 114.1293,
        affiliator_vendor_id: urlAffiliateId,
        commission_amount: commAmount
      });

      // Clear Cart, Close Modal, Notify
      setCart([]);
      setShowCheckoutModal(false);

      if (isPakasir) {
        // Trigger Pakasir Transaction Creation
        try {
          const data = await handleCreatePakasirTransaction(selectedPakasirMethod, order.id, grandTotal);
          if (data && data.payment) {
            setActivePakasirPayment({
              ...data.payment,
              order_id: order.id,
              original_amount: grandTotal
            });
            setShowPakasirPaymentModal(true);
            setUiMessage({ text: `Pesanan #${order.id} berhasil dibuat. Silakan lakukan pembayaran menggunakan Pakasir!`, type: 'success' });
          } else {
            setUiMessage({
              text: `Pesanan #${order.id} dibuat, namun gagal menghubungi sistem pembayaran Pakasir. Silakan hubungi admin.`,
              type: 'error'
            });
          }
        } catch (e: any) {
          console.error('[Pakasir Create Error]', e);
          setUiMessage({
            text: `Pesanan #${order.id} dibuat, namun gagal menghubungi gateway pembayaran Pakasir.`,
            type: 'error'
          });
        }
      } else {
        setUiMessage({ text: `Pesanan #${order.id} Berhasil Dibuat! Silakan hubungi kurir/vendor Anda.`, type: 'success' });
      }

      setActiveTab('pesanan');
      
      // Reload orders list
      await refreshOrders();

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingPakasirTransaction(false);
    }
  };

  // Helper for WhatsApp redirect message generator
  const getWhatsAppURL = (order: Order) => {
    const phone = order.vendor_phone; // redirects to vendor WA
    const itemsList = order.items.map(i => `- ${i.product_name} (${i.variant}) x${i.quantity} @ Rp ${i.price.toLocaleString()}`).join('\n');
    const textMessage = `*PESANAN COD - PASAR UMKM TEGALSARI*\n` +
                        `ID ORDER: #${order.id}\n` +
                        `----------------------\n` +
                        `*Pelanggan:* ${order.buyer_name} (${order.buyer_phone})\n` +
                        `*Alamat:* ${order.shipping_address}\n` +
                        `*Kecamatan:* Tegalsari, Banyuwangi\n` +
                        `----------------------\n` +
                        `*Produk:* \n${itemsList}\n` +
                        `----------------------\n` +
                        `*Subtotal:* Rp ${order.total_amount - order.shipping_fee}\n` +
                        `*Ongkir Jarak (${order.distance_km} KM):* Rp ${order.shipping_fee.toLocaleString()}\n` +
                        `*TOTAL BAYAR (COD):* *Rp ${order.total_amount.toLocaleString()}*\n` +
                        `*Kurir Driver Pilihan:* ${order.courier_name} (${order.courier_phone})\n\n` +
                        `Mohon segera diproses dan siap dikirim ya, terima kasih!`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(textMessage)}`;
  };

  // Helper for WhatsApp vendor messaging buyer
  const getWhatsAppBuyerURL = (order: Order) => {
    const phone = order.buyer_phone; // redirects to buyer WA
    const itemsList = order.items.map(i => `- ${i.product_name} (${i.variant}) x${i.quantity} @ Rp ${i.price.toLocaleString()}`).join('\n');
    const textMessage = `*PESANAN MASUK - PASAR UMKM TEGALSARI*\n` +
                        `Halo Kak ${order.buyer_name},\n` +
                        `Kami dari Toko *${order.vendor_name}* ingin mengonfirmasi pesanan Anda:\n\n` +
                        `*ID ORDER:* #${order.id}\n` +
                        `----------------------\n` +
                        `*Produk:* \n${itemsList}\n` +
                        `----------------------\n` +
                        `*Alamat Kirim:* ${order.shipping_address}\n` +
                        `*Total Pembayaran:* *Rp ${order.total_amount.toLocaleString()}* (${order.payment_method || 'COD'})\n` +
                        `----------------------\n` +
                        `Pesanan Anda sedang kami siapkan untuk dikirim oleh kurir: ${order.courier_name || 'Ekspedisi'}.\n` +
                        `Terima kasih telah berbelanja di toko kami!`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(textMessage)}`;
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-16 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 bg-slate-50 text-slate-900">
      {/* Top Warning banner if Supabase not configured */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-550 text-emerald-950 px-4 py-2 text-[11px] font-semibold text-center flex items-center justify-center gap-1.5 border-b border-amber-600/20 shadow-sm animate-pulse z-40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span><b>Mode Demo Penyimpanan Lokal (LocalStorage) Aktif!</b> Aplikasi berjalan sempurna. Untuk sinkron data langsung & deploy ke Vercel, lengkapi secrets kredensial database Supabase di Google AI Studio.</span>
        </div>
      )}

      {/* Dynamic Announcement banner bar */}
      {appSettings && appSettings.announcement && (
        <div className="bg-amber-400 text-slate-950 p-2.5 text-[10px] sm:text-xs text-center font-extrabold tracking-wide border-b border-amber-500/25 shadow-xs">
          📢 {appSettings.announcement}
        </div>
      )}

      {/* Top Header Section */}
      <header className="bg-emerald-700 text-white border-b border-emerald-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Hamburger Menu Toggle for Mobile */}
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="lg:hidden p-1.5 -ml-1 text-emerald-100 hover:text-white hover:bg-emerald-800/40 rounded-lg transition-all cursor-pointer shrink-0"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Logo and Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none min-w-0" onClick={() => setActiveTab('katalog')}>
            {appSettings?.logo_url ? (
              <img
                src={appSettings.logo_url}
                alt={appSettings.app_name || 'Logo'}
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg bg-white border border-emerald-600/50 shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center text-emerald-700 font-bold text-base sm:text-xl shadow-sm shrink-0">
                PT
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white font-display truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs md:max-w-none">
                {appSettings?.app_name || 'PASAR UMKM TEGALSARI'}
              </h1>
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('katalog')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'katalog' 
                  ? 'bg-emerald-800/90 text-white font-bold shadow-inner border border-emerald-600/60' 
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-650/40'
              }`}
            >
              Katalog Produk
            </button>
            <button
              onClick={() => setActiveTab('tentang')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'tentang' 
                  ? 'bg-emerald-800/90 text-white font-bold shadow-inner border border-emerald-600/60' 
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-650/40'
              }`}
            >
              Tentang UMKM
            </button>
            <a
              href="https://gemini.google.com/share/3ab7daa6e259"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg transition-all duration-200 text-amber-300 hover:text-white hover:bg-emerald-650/40 font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              AI TOOL
            </a>
            {currentProfile && currentProfile.role === 'vendor' && (
              <button
                onClick={() => setActiveTab('vendor')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeTab === 'vendor' 
                    ? 'bg-emerald-800/90 text-white font-bold shadow-inner border border-emerald-600/60' 
                    : 'text-emerald-100 hover:text-white hover:bg-emerald-650/40'
                }`}
              >
                Dasbor Vendor
              </button>
            )}
            {currentProfile && currentProfile.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold shadow-sm border-none transition-all duration-250 transform hover:scale-102 cursor-pointer ${
                  activeTab === 'admin' ? 'ring-2 ring-offset-2 ring-offset-emerald-700 ring-amber-300' : ''
                }`}
              >
                Panel Admin
              </button>
            )}
            {currentProfile && (
              <button
                onClick={() => setActiveTab('pesanan')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeTab === 'pesanan' 
                    ? 'bg-emerald-800/90 text-white font-bold shadow-inner border border-emerald-600/60' 
                    : 'text-emerald-100 hover:text-white hover:bg-emerald-650/40'
                }`}
              >
                Transaksi Belanja ({userOrders.length})
              </button>
            )}
            {currentProfile && (currentProfile.role === 'vendor' || currentProfile.role === 'admin') && (
              <button
                onClick={() => setActiveTab('transaksi-pesanan')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  activeTab === 'transaksi-pesanan' 
                    ? 'bg-emerald-800/90 text-amber-300 font-bold shadow-inner border border-emerald-600/60' 
                    : 'text-emerald-100 hover:text-white hover:bg-emerald-650/40'
                }`}
              >
                Pesanan Masuk ({vendorOrders.length})
              </button>
            )}
          </nav>
          {/* User profile controls and shopping cart trigger */}
          <div className="flex items-center gap-1.5 sm:gap-3">

            {/* Shopping Cart Badge */}
            <div className="relative">
              <button
                onClick={() => {
                  if (cart.length > 0) {
                    setShowCheckoutModal(true);
                  } else {
                    setUiMessage({ text: 'Keranjang belanja Anda masih kosong! Silakan pilih produk unggulan.', type: 'error' });
                  }
                }}
                className={`p-1.5 sm:p-2.5 rounded-xl transition cursor-pointer ${
                  cart.length > 0 
                    ? 'bg-emerald-800 text-amber-300 border border-emerald-650 hover:bg-emerald-900 shadow-sm' 
                    : 'text-emerald-100 hover:text-white hover:bg-emerald-850/40'
                }`}
                title="Keranjang Belanja"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7.5px] sm:text-[9px] w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 font-bold rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* User credentials button */}
            {currentProfile ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveTab('profil')}
                  className="flex items-center gap-1 px-1.5 py-1.5 sm:px-3 bg-emerald-800 hover:bg-emerald-900/80 border border-emerald-600/80 rounded-xl text-[10px] sm:text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
                >
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                  <span className="max-w-[45px] sm:max-w-[85px] truncate">{currentProfile.name}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-1 sm:p-2 text-emerald-200 hover:text-red-300 hover:bg-emerald-800/50 rounded-lg transition-colors cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError('');
                  setShowLoginModal(true);
                }}
                className="flex items-center gap-1 px-1.5 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/30 text-white rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Daftar / Masuk</span>
                <span className="sm:hidden">Masuk</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main body viewport container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* Temporary floating layout notification banner */}
        {uiMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border shadow-xs ${
            uiMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uiMessage.text}</span>
            </div>
            <button onClick={() => setUiMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PWA registration status bar banner */}
        <PWAInstaller />

        {/* Dynamic content rendering based on selected Tab */}
        
        {/* VIEW 1: Catalog & Home listings */}
        {activeTab === 'katalog' && (
          <div className="space-y-6">
            {/* Interactive Banner Carousel (Adaptive: Mobile, Tablet & Desktop) */}
            <BannerCarousel
              banners={appSettings?.banners}
              duration={appSettings?.banner_duration}
              approvedVendorsCount={approvedVendors.length}
              urlAffiliateId={urlAffiliateId}
              carouselBadgeText={appSettings?.carousel_badge_text}
              carouselBadgeUrl={appSettings?.carousel_badge_url}
              rightBannerImg={appSettings?.right_banner_img}
              rightBannerTitle={appSettings?.right_banner_title}
              rightBannerSubtitle={appSettings?.right_banner_subtitle}
              rightBannerLink={appSettings?.right_banner_link}
              rightBannerBadge={appSettings?.right_banner_badge}
              rightBanners={appSettings?.right_banners}
              rightBannerDuration={appSettings?.right_banner_duration}
            />

            {/* Filter and search parameters */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                
                {/* Input Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-450 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Cari camilan, batik, madu buah, merek..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full text-xs p-3 pl-9 border border-slate-200 bg-slate-50/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3.5 text-gray-400 text-xs hover:text-gray-600">✕</button>
                  )}
                </div>

                {/* Village Filter */}
                <div className="w-full md:w-56 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">SARING ASAL DUKUH</span>
                  <select
                    value={selectedVillage}
                    onChange={e => setSelectedVillage(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all font-medium"
                  >
                    <option value="Semua">Semua Dukuh</option>
                    {villagesList.map(v => (
                      <option key={v} value={v}>Dukuh {v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category tags selector */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-slate-500 font-bold">Kategori Produk:</span>
                  <span className="lg:hidden text-[8.5px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono animate-pulse">Geser ↔️</span>
                </div>
                {/* Horizontal scroll container on mobile, wrapped flex on desktop */}
                <div className="flex md:flex-wrap items-center gap-1 w-full overflow-x-auto pb-1.5 no-scrollbar scroll-smooth whitespace-nowrap snap-x">
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 md:px-3 md:py-1.5 text-[10.5px] md:text-xs font-bold rounded-lg border transition shrink-0 snap-start cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-700 border-emerald-750 text-white shadow-sm font-black'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter tags report */}
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <p>Menampilkan <span className="text-emerald-700 font-bold">{filteredProducts.length}</span> produk lokal pilihan</p>
              {(selectedCategory !== 'Semua' || selectedVillage !== 'Semua' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('Semua');
                    setSelectedVillage('Semua');
                    setSearchQuery('');
                  }}
                  className="text-emerald-600 hover:underline font-bold"
                >
                  Clear Semua Filter
                </button>
              )}
            </div>

            {/* Dynamic Products Grid (Display normal & discount prices, vendor, kecamatan) */}
            {filteredProducts.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-gray-200 rounded-3.5xl bg-white max-w-md mx-auto space-y-3">
                <Store className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-800 text-sm">Produk Tidak Ditemukan!</h3>
                <p className="text-xs text-gray-500">Pelaku UMKM lokal di desa terpilih belum menambahkan katalog kualifikasi produk ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => {
                  const vend = approvedVendors.find(v => v.id === p.vendor_id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setSelectedProductVariant((p.variants && p.variants[0]) || 'Original');
                      }}
                      className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/40 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between p-3.5"
                    >
                      <div className="space-y-2.5">
                        {/* Image banner details */}
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {p.discount_price && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded shadow-xs">
                              DISKON {Math.round(((p.price - p.discount_price) / p.price) * 100)}%
                            </span>
                          )}
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-slate-900/85 text-white font-mono text-[9px] rounded font-medium">
                            {p.weight}gr
                          </span>
                        </div>

                        {/* Title & Brand */}
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider font-mono">{p.brand || 'UMKM ASLI'}</p>
                          <h3 className="text-xs font-bold text-slate-850 font-display group-hover:text-emerald-700 transition line-clamp-1">
                            {p.name}
                          </h3>
                        </div>

                        {/* Pricing crossed out */}
                        <div className="flex items-baseline gap-1.5">
                          {p.discount_price ? (
                            <>
                              <span className="text-sm font-black text-emerald-750 font-mono">Rp {p.discount_price.toLocaleString('id-ID')}</span>
                              <span className="text-[10px] text-slate-400 line-through">Rp {p.price.toLocaleString('id-ID')}</span>
                            </>
                          ) : (
                            <span className="text-sm font-black text-emerald-750 font-mono">Rp {p.price.toLocaleString('id-ID')}</span>
                          )}
                        </div>
                      </div>

                      {/* Vendor branding row with village/kecamatan */}
                      <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <img
                            src={vend?.logo_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'}
                            alt={vend?.business_name}
                            className="w-4.5 h-4.5 rounded-full object-cover border border-slate-200/50 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold text-slate-700 leading-tight truncate">
                              {vend?.business_name || 'Vendor UMKM'}
                            </p>
                            <p className="text-[9px] text-slate-400 italic">Dukuh {vend?.village || 'Tegalsari'}</p>
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition flex items-center justify-center shrink-0 border border-slate-100">
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: About UMKM ecosystem Tab */}
        {activeTab === 'tentang' && <AboutUMKM appSettings={appSettings} />}

        {/* VIEW 3: Vendor Dashboard view */}
        {activeTab === 'vendor' && currentProfile && (
          <VendorDashboard
            currentProfile={currentProfile}
            onRefreshProfile={handleRefreshProfileSession}
          />
        )}

        {/* VIEW 4: Admin Panel Tab view */}
        {activeTab === 'admin' && currentProfile && currentProfile.role === 'admin' && (
          <AdminPanel
            currentProfile={currentProfile}
            appSettings={appSettings || { id: 'test', app_name: 'Marketplace', logo_url: '', banner_url: '', contact_phone: '', website_mode: 'active', announcement: '', about_us: '' }}
            onRefreshSettings={loadAppMetadata}
          />
        )}

        {/* VIEW 5: User profile setting & register page */}
        {activeTab === 'profil' && currentProfile && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-emerald-950 font-display">Profil Akun & Lokasi Kirim Anda</h2>
            <p className="text-xs text-gray-500">Silakan melengkapi alamat rumah dan letakan PIN lokasi peta di mana kurir akan mengirim pesanan COD Anda secara tepat.</p>

            {/* MEMBERSHIP STATUS CARD */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Keanggotaan Akun</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {currentUserVendor ? (
                        <>
                          <span className={`font-extrabold text-sm ${
                            currentUserVendor.membership_tier === 'VIP' 
                              ? 'text-purple-700' 
                              : currentUserVendor.membership_tier === 'PREMIUM' 
                                ? 'text-amber-700' 
                                : 'text-slate-700'
                          }`}>
                            {currentUserVendor.membership_tier?.toUpperCase() || 'FREE'} MEMBER
                          </span>
                          <span className="text-[10px] text-gray-400 font-sans">•</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            currentUserVendor.status === 'approved' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : currentUserVendor.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}>
                            Vendor {currentUserVendor.status === 'approved' ? 'Aktif' : currentUserVendor.status === 'pending' ? 'Pending' : 'Ditolak'}
                          </span>
                        </>
                      ) : (
                        <span className="font-extrabold text-sm text-slate-700">PEMBELI UMUM (REGULER)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upgrade or Registration triggers */}
                {!currentUserVendor ? (
                  <button
                    type="button"
                    onClick={handleApplyAsVendor}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-sm animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Jadi Vendor & Jual Produk
                  </button>
                ) : (
                  currentUserVendor.membership_tier !== 'VIP' && !showUpgradePanel && (
                    <button
                      type="button"
                      onClick={() => {
                        setUpgradeTargetTier(currentUserVendor.membership_tier === 'PREMIUM' ? 'vip' : 'premium');
                        setUpgradePayMethod('pakasir');
                        setUpgradePayProof('');
                        setUpgradePayStatus('unpaid');
                        setUpgradeActivePayment(null);
                        setUpgradeChecking(false);
                        setShowUpgradePanel(true);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white animate-spin" /> Upgrade Level Member 🚀
                    </button>
                  )
                )}
              </div>

              {currentUserVendor && (
                <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 bg-white p-2.5 rounded-xl border border-slate-150">
                  <div>Tipe Toko: <strong>Dukuh {currentUserVendor.village}</strong></div>
                  <div>Sistem Pengiriman: <strong>{currentUserVendor.shipping_engine === 'smartengine' ? 'Smart-Engine' : 'Sistem Manual'}</strong></div>
                  <div>Limit Produk: <strong>{currentUserVendor.membership_tier === 'VIP' ? 'Tak Terbatas' : currentUserVendor.membership_tier === 'PREMIUM' ? '25 Produk' : '5 Produk'}</strong></div>
                </div>
              )}

              {/* UPGRADE INTERACTIVE PANEL */}
              {showUpgradePanel && currentUserVendor && (
                <form onSubmit={handleUpgradeSubmit} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Upgrade Keanggotaan Vendor Anda
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUpgradePanel(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Batal
                    </button>
                  </div>

                  {/* Level Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pilih Level Upgrade:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(currentUserVendor.membership_tier === 'FREE' || !currentUserVendor.membership_tier) && (
                        <button
                          type="button"
                          onClick={() => setUpgradeTargetTier('premium')}
                          className={`p-3 text-left border rounded-xl transition cursor-pointer relative overflow-hidden ${
                            upgradeTargetTier === 'premium' 
                              ? 'border-amber-500 bg-amber-50/10 ring-2 ring-amber-500/10' 
                              : 'border-slate-150 bg-white hover:border-slate-250'
                          }`}
                        >
                          <div className="font-bold text-xs text-amber-900 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> PREMIUM
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Biaya: Rp {(appSettings?.membership_settings?.premium?.price ?? 50000).toLocaleString()}</div>
                          <div className="text-[9px] text-amber-700 mt-1 font-medium">Batas katalog naik ke 25 Produk</div>
                          {upgradeTargetTier === 'premium' && (
                            <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">✓</div>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setUpgradeTargetTier('vip')}
                        className={`p-3 text-left border rounded-xl transition cursor-pointer relative overflow-hidden ${
                          upgradeTargetTier === 'vip' 
                            ? 'border-purple-600 bg-purple-50/10 ring-2 ring-purple-600/10' 
                            : 'border-slate-150 bg-white hover:border-slate-250'
                        }`}
                      >
                        <div className="font-bold text-xs text-purple-950 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-purple-600" /> VIP
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Biaya: Rp {(appSettings?.membership_settings?.vip?.price ?? 150000).toLocaleString()}</div>
                        <div className="text-[9px] text-purple-700 mt-1 font-medium">Batas katalog Tak Terbatas</div>
                        {upgradeTargetTier === 'vip' && (
                          <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">✓</div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Payment Method selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Metode Pembayaran:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUpgradePayMethod('pakasir');
                          setUpgradeActivePayment(null);
                        }}
                        className={`py-1.5 px-3 border rounded-lg font-bold text-[11px] cursor-pointer text-center transition ${
                          upgradePayMethod === 'pakasir' 
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        Pakasir QRIS Instan
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpgradePayMethod('transfer_manual')}
                        className={`py-1.5 px-3 border rounded-lg font-bold text-[11px] cursor-pointer text-center transition ${
                          upgradePayMethod === 'transfer_manual' 
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        Transfer Manual
                      </button>
                    </div>
                  </div>

                  {upgradePayMethod === 'pakasir' ? (
                    <div className="space-y-3 p-3 bg-slate-50 border border-slate-150 rounded-xl text-center">
                      {!upgradeActivePayment ? (
                        <div className="space-y-2 py-1">
                          <p className="text-[10px] text-slate-500">Sistem akan otomatis membuat kode pembayaran QRIS menggunakan Pakasir Gateway.</p>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const targetPrice = upgradeTargetTier === 'premium' 
                                  ? (appSettings?.membership_settings?.premium?.price ?? 50000) 
                                  : (appSettings?.membership_settings?.vip?.price ?? 150000);
                                const upgradeOrderId = `UPGRADE_${currentProfile.id}_${Date.now()}`;
                                
                                const data = await handleCreatePakasirTransaction('qris', upgradeOrderId, targetPrice);
                                if (data && data.payment) {
                                  setUpgradeActivePayment({
                                    ...data.payment,
                                    order_id: upgradeOrderId,
                                    original_amount: targetPrice
                                  });
                                  setUpgradePayStatus('unpaid');
                                } else {
                                  alert('Gagal menghubungi Pakasir.');
                                }
                              } catch (err: any) {
                                alert('Gagal membuat pembayaran: ' + err.message);
                              }
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition cursor-pointer"
                          >
                            Buat Kode Pembayaran QRIS
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-3 py-1">
                          <div className="bg-white p-2 border rounded-lg">
                            <img
                              referrerPolicy="no-referrer"
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upgradeActivePayment.payment_number)}`}
                              alt="Upgrade QRIS"
                              className="w-28 h-28"
                            />
                          </div>

                          <div className="text-[9.5px] text-slate-500 leading-relaxed max-w-xs">
                            Pindai QRIS di atas dengan e-wallet atau aplikasi m-banking pilihan Anda.
                          </div>

                          <div className="bg-white p-2.5 border rounded-lg w-full text-xs text-slate-700 space-y-1 text-left font-mono">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Invoice ID:</span>
                              <span className="font-bold">#{upgradeActivePayment.order_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Jumlah:</span>
                              <span className="font-bold">Rp {upgradeActivePayment.original_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Status Bayar:</span>
                              <span className={`font-bold ${upgradePayStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {upgradePayStatus === 'paid' ? 'LUNAS / PAID' : 'PENDING'}
                              </span>
                            </div>
                          </div>

                          {/* Simulation & check buttons */}
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  if (!isSupabaseConfigured) {
                                    setUpgradePayStatus('paid');
                                    alert('Simulasi pembayaran upgrade sukses (Mode Lokal)!');
                                  } else {
                                    await fetch('/api/pakasir/simulate', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        order_id: upgradeActivePayment.order_id,
                                        amount: upgradeActivePayment.original_amount
                                      })
                                    });
                                    alert('Simulasi pembayaran upgrade dikirim! Silakan klik "Cek Pembayaran".');
                                  }
                                } catch (err: any) {
                                  alert(err.message);
                                }
                              }}
                              className="py-1 px-2.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold rounded text-[10px] cursor-pointer"
                            >
                              Simulasi Bayar
                            </button>
                            <button
                              type="button"
                              disabled={upgradeChecking}
                              onClick={async () => {
                                setUpgradeChecking(true);
                                try {
                                  const completed = await handleCheckPakasirStatus(upgradeActivePayment.order_id, upgradeActivePayment.original_amount);
                                  if (completed) {
                                    setUpgradePayStatus('paid');
                                    alert('Pembayaran sukses terverifikasi! Klik "Kirim Upgrade" di bawah untuk menyimpan perubahan.');
                                  } else {
                                    alert('Pembayaran belum diterima. Coba beberapa saat lagi.');
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setUpgradeChecking(false);
                                }
                              }}
                              className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] cursor-pointer"
                            >
                              {upgradeChecking ? 'Mengecek...' : 'Cek Pembayaran'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
                      <div className="text-[10px] text-slate-600 space-y-1 text-left">
                        <p className="font-bold text-slate-750">Instruksi Transfer Manual:</p>
                        <p>Kirim ke rekening admin:</p>
                        <div className="p-2 bg-white border rounded-lg font-mono text-slate-800 space-y-0.5">
                          <div>Bank: <strong>BRI</strong></div>
                          <div>No Rekening: <strong>0021-01-098765-53-1</strong></div>
                          <div>Atas Nama: <strong>Admin Pasar UMKM Tegalsari</strong></div>
                          <div className="text-emerald-700 mt-0.5">Nominal: <strong>Rp {(upgradeTargetTier === 'premium' ? (appSettings?.membership_settings?.premium?.price ?? 50000) : (appSettings?.membership_settings?.vip?.price ?? 150000)).toLocaleString()}</strong></div>
                        </div>
                      </div>

                      {/* File receipt upload */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 block">Unggah Bukti Transfer *</label>
                        <div className="flex gap-2 items-center">
                          {upgradePayProof ? (
                            <img src={upgradePayProof} className="w-10 h-10 rounded object-cover shrink-0 border" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-200 rounded border flex items-center justify-center text-[8px] text-slate-400 text-center shrink-0">Belum Ada</div>
                          )}
                          <div className="relative flex-1 border border-dashed border-gray-300 hover:border-emerald-500 rounded-lg p-1.5 text-center cursor-pointer bg-white">
                            <input
                              type="file"
                              accept="image/*"
                              required={upgradePayMethod === 'transfer_manual'}
                              onChange={async e => {
                                const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImage(file, 800, 800, 0.75);
                                      setUpgradePayProof(compressed);
                                      setUpgradePayStatus('pending');
                                    } catch (err) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === 'string') {
                                          setUpgradePayProof(reader.result);
                                          setUpgradePayStatus('pending');
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <span className="text-[10px] text-gray-500 font-semibold">Pilih Gambar Bukti</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUpgradePanel(false)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs shadow cursor-pointer"
                    >
                      Kirim Upgrade Keanggotaan✓
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Nama Lengkap</label>
                  <input
                    type="text"
                    value={currentProfile.name}
                    onChange={e => db.updateProfile(currentProfile.id, { name: e.target.value }).then(handleRefreshProfileSession)}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Nomor WhatsApp (628...)</label>
                  <input
                    type="text"
                    value={currentProfile.phone}
                    onChange={e => db.updateProfile(currentProfile.id, { phone: e.target.value }).then(handleRefreshProfileSession)}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={currentProfile.village || ''}
                    onChange={e => db.updateProfile(currentProfile.id, { village: e.target.value }).then(handleRefreshProfileSession)}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                    placeholder="Nama Jalan,RT/RW"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">Email Utama (Login)</label>
                  <input
                    type="text"
                    disabled
                    value={currentProfile.email}
                    className="w-full p-2 border border-gray-150 bg-gray-50 text-gray-500 cursor-not-allowed rounded-lg"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-gray-600">Alamat Rumah Sesuai Titik Koordinat</label>
                  <input
                    type="text"
                    value={currentProfile.address}
                    onChange={e => db.updateProfile(currentProfile.id, { address: e.target.value }).then(handleRefreshProfileSession)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Map coordinate settings */}
              <MapPicker
                initialLat={currentProfile.latitude}
                initialLng={currentProfile.longitude}
                onChange={(lat, lng, details) => {
                  db.updateProfile(currentProfile.id, {
                    latitude: lat,
                    longitude: lng,
                    address: details ? details.address : currentProfile.address,
                    village: details ? details.village : currentProfile.village
                  }).then(handleRefreshProfileSession);
                }}
              />

              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                {currentProfile.role !== 'vendor' && (
                  <button
                    onClick={handleApplyAsVendor}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                  >
                    <Store className="w-4 h-4" /> Daftarkan Diri Saya Sebagai Penjual/Vendor
                  </button>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-200 rounded-xl text-xs transition cursor-pointer"
                >
                  Keluar / Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: Transactions Shopping Orders listing */}
        {activeTab === 'pesanan' && currentProfile && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-lg font-bold text-emerald-950 font-display">Daftar Transaksi Belanja Anda ({userOrders.length})</h2>
            <p className="text-xs text-gray-500 -mt-4">Setiap pesanan di Pasar Tegalsari diselesaikan menggunakan sistem bayar di tempat (COD) demi kenyamanan berinteraksi langsung.</p>

            {/* Cek Resi Nasional Widget (BinderByte API Integration) */}
            <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-300 animate-bounce" />
                <div>
                  <h3 className="font-bold text-sm font-display tracking-tight text-white">Lacak Pengiriman Paket Nusantara (BinderByte API)</h3>
                  <p className="text-[10px] text-emerald-200">Terintegrasi BinderByte API • Cek Resi JNE, J&T, SiCepat, POS, Anteraja, dll.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider font-mono">PILIH EKSPEDISI / KURIR</label>
                  <select
                    value={trackingCourier}
                    onChange={(e) => setTrackingCourier(e.target.value)}
                    className="w-full p-2.5 bg-emerald-900/60 border border-emerald-600/40 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-300 font-medium"
                  >
                    <option value="jne" className="bg-emerald-950">JNE Express</option>
                    <option value="jnt" className="bg-emerald-950">J&T Express</option>
                    <option value="sicepat" className="bg-emerald-950">SiCepat</option>
                    <option value="pos" className="bg-emerald-950">POS Indonesia</option>
                    <option value="tiki" className="bg-emerald-950">TIKI</option>
                    <option value="anteraja" className="bg-emerald-950">AnterAja</option>
                    <option value="wahana" className="bg-emerald-950">Wahana</option>
                    <option value="ninja" className="bg-emerald-950">Ninja Express</option>
                    <option value="lion" className="bg-emerald-950">Lion Parcel</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider font-mono">NOMOR RESI / AIRWAY BILL (AWB)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan Nomor Resi Pengiriman..."
                      value={trackingAwb}
                      onChange={(e) => setTrackingAwb(e.target.value)}
                      className="flex-1 p-2.5 bg-emerald-900/60 border border-emerald-600/40 rounded-xl text-xs text-white placeholder-emerald-300/60 focus:outline-none focus:ring-1 focus:ring-emerald-300 font-mono font-bold"
                    />
                    <button
                      onClick={() => handleTrackPackage(trackingCourier, trackingAwb)}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                    >
                      <Search className="w-4 h-4" /> Lacak Paket
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {userOrders.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-gray-200 rounded-2xl bg-white">
                <p className="text-xs text-gray-400 italic">Belum ada transaksi pembelian lokal yang dilakukan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map(order => (
                  <div key={order.id} className="bg-white border rounded-2xl border-emerald-100 p-4 space-y-3.5 hover:shadow-xs transition duration-200">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-3 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-900">Order ID: #{order.id}</span>
                        <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(order.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.payment_method?.startsWith('Pakasir') ? `• ONLINE (Pakasir): ${order.status.toUpperCase()}` : `• Mode COD: ${order.status.toUpperCase()}`}
                        </span>
                      </div>
                    </div>

                    {/* Products details */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Toko: {order.vendor_name}</p>
                      <div className="divide-y divide-gray-55 divide-dotted text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2 flex justify-between">
                            <span>{item.product_name} ({item.variant}) x{item.quantity}</span>
                            <span className="font-bold">Rp {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 p-2.5 rounded-xl text-xs space-y-1.5 border border-emerald-100/50">
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <span>Ongkos Kirim Jarak ({order.distance_km} KM):</span>
                        <span>Rp {order.shipping_fee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-950">
                        <span>{order.payment_method?.startsWith('Pakasir') ? 'Total Pembayaran (Pakasir Online):' : 'Total Tagihan (Bayar saat COD):'}</span>
                        <span>Rp {order.total_amount.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 italic mt-1 font-mono">📍 Alamat Kirim: {order.shipping_address}</p>
                    </div>

                    {/* Vendor and courier information links */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-xs">
                      <div>
                        {order.courier_name && (
                          <p className="text-[11px] text-gray-600">
                            🛵 Kurir Antar: <b>{order.courier_name}</b> (+{order.courier_phone})
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        {order.status === 'pending' && order.payment_method?.startsWith('Pakasir') && (
                          <button
                            onClick={async () => {
                              try {
                                const matches = order.payment_method.match(/\(([^)]+)\)/);
                                const methodCode = matches ? matches[1].toLowerCase() : 'qris';
                                
                                setUiMessage({ text: "Menghubungkan ke gateway Pakasir...", type: "success" });
                                
                                const data = await handleCreatePakasirTransaction(methodCode, order.id, order.total_amount);
                                if (data && data.payment) {
                                  setActivePakasirPayment({
                                    ...data.payment,
                                    order_id: order.id,
                                    original_amount: order.total_amount
                                  });
                                  setShowPakasirPaymentModal(true);
                                  setUiMessage({ text: "Berhasil memuat transaksi Pakasir!", type: "success" });
                                } else {
                                  alert(`Gagal memuat instruksi pembayaran Pakasir.`);
                                }
                              } catch (e: any) {
                                console.error('[Pakasir re-create error]', e);
                                alert('Gagal terhubung ke sistem pembayaran Pakasir.');
                              }
                            }}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            💳 Bayar Sekarang
                          </button>
                        )}
                        <a
                          href={getWhatsAppURL(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-4 py-2 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                        >
                          <Phone className="w-3.5 h-3.5" /> Hubungi WA Toko / Kurir
                        </a>
                        
                        {/* Status controls if they are a vendor or admin reviewing orders */}
                        {currentProfile.role === 'vendor' && order.status === 'pending' && (
                          <button
                            onClick={async () => {
                              await db.updateOrderStatus(order.id, 'processing');
                              await refreshOrders();
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold px-3 py-2 rounded-xl transition text-[11px]"
                          >
                            Proses Order
                          </button>
                        )}

                        {currentProfile.role === 'vendor' && order.status === 'processing' && (
                          <button
                            onClick={async () => {
                              await db.updateOrderStatus(order.id, 'shipped');
                              await refreshOrders();
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-2 rounded-xl transition text-[11px]"
                          >
                            Serahkan ke Kurir
                          </button>
                        )}

                        {order.status === 'shipped' && (
                          <button
                            onClick={async () => {
                              await db.updateOrderStatus(order.id, 'completed');
                              await refreshOrders();
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-2 rounded-xl transition text-[11px]"
                          >
                            Barang Diterima (Sukses COD)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 6.5: Dedicated Transaksi Pesanan (Vendor Incoming Orders) */}
        {activeTab === 'transaksi-pesanan' && currentProfile && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-emerald-950 font-display flex items-center gap-2">
                  <ClipboardList className="w-5.5 h-5.5 text-emerald-650" />
                  Transaksi Pesanan Masuk (Vendor)
                </h2>
                <p className="text-xs text-gray-500">
                  Kelola pesanan masuk dari pembeli untuk toko Anda. Proses transaksi, input resi pengiriman, dan update status pesanan.
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start md:self-auto bg-emerald-50 text-emerald-900 border border-emerald-100 px-3 py-1.5 rounded-xl font-semibold text-xs">
                Total Pesanan: {vendorOrders.length}
              </div>
            </div>

            {/* Status Summary Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { status: 'all', label: 'Semua', count: vendorOrders.length, color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
                { status: 'pending', label: 'Menunggu', count: vendorOrders.filter(o => o.status === 'pending').length, color: 'bg-rose-50 text-rose-850 border-rose-200' },
                { status: 'processing', label: 'Diproses', count: vendorOrders.filter(o => o.status === 'processing').length, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                { status: 'shipped', label: 'Dikirim', count: vendorOrders.filter(o => o.status === 'shipped').length, color: 'bg-blue-50 text-blue-800 border-blue-200' },
                { status: 'completed', label: 'Selesai', count: vendorOrders.filter(o => o.status === 'completed').length, color: 'bg-teal-50 text-teal-800 border-teal-200' }
              ].map(stat => (
                <button
                  key={stat.status}
                  onClick={() => setVendorStatusFilter(stat.status)}
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${stat.color} ${
                    vendorStatusFilter === stat.status
                      ? 'ring-2 ring-emerald-600 font-bold scale-102 shadow-xs'
                      : 'opacity-70 hover:opacity-100 hover:scale-101'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide">{stat.label}</span>
                  <span className="text-lg font-black mt-0.5">{stat.count}</span>
                </button>
              ))}
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-emerald-50/80 p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari Order ID, Nama Pembeli, No HP..."
                  value={vendorSearchQuery}
                  onChange={(e) => setVendorSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-bold uppercase font-mono">Filter Status:</span>
                <select
                  value={vendorStatusFilter}
                  onChange={(e) => setVendorStatusFilter(e.target.value)}
                  className="p-2 border border-gray-200 bg-white rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu (Pending)</option>
                  <option value="processing">Diproses (Processing)</option>
                  <option value="shipped">Dikirim (Shipped)</option>
                  <option value="completed">Selesai (Completed)</option>
                  <option value="cancelled">Dibatalkan (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* List of Incoming Orders */}
            {(() => {
              const filteredVendorOrders = vendorOrders.filter(order => {
                if (vendorStatusFilter !== 'all' && order.status !== vendorStatusFilter) {
                  return false;
                }
                if (vendorSearchQuery.trim()) {
                  const q = vendorSearchQuery.toLowerCase();
                  const matchId = order.id.toLowerCase().includes(q);
                  const matchBuyer = order.buyer_name?.toLowerCase().includes(q);
                  const matchPhone = order.buyer_phone?.toLowerCase().includes(q);
                  const matchVendor = order.vendor_name?.toLowerCase().includes(q);
                  return matchId || matchBuyer || matchPhone || matchVendor;
                }
                return true;
              });

              if (filteredVendorOrders.length === 0) {
                return (
                  <div className="text-center p-12 border border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
                    <ClipboardList className="w-8 h-8 text-gray-300 mx-auto animate-pulse" />
                    <p className="text-xs text-gray-400 italic font-semibold">Tidak ada pesanan masuk yang cocok dengan filter atau kriteria pencarian.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredVendorOrders.map(order => (
                    <div key={order.id} className="bg-white border rounded-2xl border-emerald-100 p-4 space-y-3.5 hover:shadow-xs transition duration-200">
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-3 gap-2 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-950 text-sm">Order ID: #{order.id}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-lg ${
                              order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              • STATUS: {order.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(order.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div className="text-left sm:text-right flex flex-col sm:items-end">
                          <span className="font-extrabold text-gray-900 text-xs">Pembeli: {order.buyer_name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">Telp: {order.buyer_phone}</span>
                        </div>
                      </div>

                      {/* Products details */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Detail Produk Belanjaan:</p>
                        <div className="divide-y divide-gray-100 divide-dotted text-xs">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="py-2 flex justify-between">
                              <span>{item.product_name} ({item.variant}) x{item.quantity}</span>
                              <span className="font-bold">Rp {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery & Financial Summary Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Informasi Pengiriman</p>
                          <p className="font-semibold text-slate-800">🛵 Metode: {order.courier_name} ({order.courier_phone})</p>
                          <p className="font-medium text-slate-600">📍 Jarak: {order.distance_km} KM</p>
                          <p className="font-medium text-slate-500 text-[11px] leading-relaxed italic">Alamat: {order.shipping_address}</p>
                        </div>

                        <div className="space-y-1 md:border-l md:border-slate-200 md:pl-3 flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Rincian Pembayaran</p>
                            <p className="font-semibold text-slate-800 flex justify-between">
                              <span>Metode Bayar:</span>
                              <span className="font-bold text-emerald-850">{order.payment_method || 'COD'}</span>
                            </p>
                            <p className="font-medium text-slate-600 flex justify-between">
                              <span>Biaya Ongkir:</span>
                              <span>Rp {order.shipping_fee.toLocaleString()}</span>
                            </p>
                          </div>
                          <div className="border-t border-slate-200/60 pt-1.5 mt-1.5 flex justify-between font-extrabold text-emerald-950 text-sm">
                            <span>Total Tagihan:</span>
                            <span>Rp {order.total_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Resi Tracking Form (if national shipping) */}
                      {(order.courier_id === 'ekspedisi' || order.courier_phone === 'Ekspedisi Nasional') && (
                        <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Input / Update Nomor Resi Ekspedisi Nasional</p>
                          <div className="flex flex-wrap sm:flex-nowrap gap-1.5">
                            <select
                              value={tempResiInputs[order.id]?.courier || order.courier_code || 'jne'}
                              onChange={(e) => setTempResiInputs({
                                ...tempResiInputs,
                                [order.id]: {
                                  awb: tempResiInputs[order.id]?.awb || order.awb_number || '',
                                  courier: e.target.value
                                }
                              })}
                              className="p-1.5 border border-gray-300 rounded-lg bg-white text-[10.5px] font-semibold text-slate-700 cursor-pointer"
                            >
                              <option value="jne">JNE</option>
                              <option value="jnt">J&T</option>
                              <option value="sicepat">SiCepat</option>
                              <option value="pos">POS</option>
                              <option value="tiki">TIKI</option>
                              <option value="anteraja">AnterAja</option>
                              <option value="wahana">Wahana</option>
                              <option value="ninja">Ninja</option>
                              <option value="lion">Lion</option>
                            </select>
                            
                            <input
                              type="text"
                              placeholder="Masukkan nomor resi..."
                              value={tempResiInputs[order.id]?.awb !== undefined ? tempResiInputs[order.id].awb : (order.awb_number || '')}
                              onChange={(e) => setTempResiInputs({
                                ...tempResiInputs,
                                [order.id]: {
                                  courier: tempResiInputs[order.id]?.courier || order.courier_code || 'jne',
                                  awb: e.target.value
                                }
                              })}
                              className="flex-1 p-1.5 border border-gray-300 rounded-lg text-[10.5px] font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                            />

                            <button
                              onClick={() => handleUpdateOrderTracking(order.id)}
                              className="px-4 py-1.5 bg-slate-850 hover:bg-slate-900 text-white text-[10.5px] font-bold rounded-lg shadow-xs transition cursor-pointer"
                            >
                              Simpan Resi
                            </button>
                          </div>
                          {order.awb_number && (
                            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 font-mono">
                              ✓ Resi saat ini: <b className="uppercase">{order.courier_code}</b> - {order.awb_number}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions Panel */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-1">
                        <div>
                          {order.payment_method?.startsWith('Pakasir') && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                              order.status !== 'pending' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              💳 Pembayaran Online (Pakasir): {order.status === 'pending' ? 'BELUM LUNAS' : 'LUNAS / BERHASIL'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {/* WhatsApp Contact */}
                          <a
                            href={getWhatsAppBuyerURL(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition"
                          >
                            <Phone className="w-3.5 h-3.5" /> WA Pembeli
                          </a>

                          {/* Status Transitions */}
                          {order.status === 'pending' && (
                            <button
                              onClick={async () => {
                                await db.updateOrderStatus(order.id, 'processing');
                                await refreshOrders();
                                setUiMessage({ text: `Pesanan #${order.id} berhasil diproses!`, type: 'success' });
                              }}
                              className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold px-4 py-2 rounded-xl transition text-[11px] cursor-pointer"
                            >
                              Proses Order
                            </button>
                          )}

                          {order.status === 'processing' && (
                            <button
                              onClick={async () => {
                                await db.updateOrderStatus(order.id, 'shipped');
                                await refreshOrders();
                                setUiMessage({ text: `Pesanan #${order.id} telah diserahkan ke kurir untuk dikirim!`, type: 'success' });
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2 rounded-xl transition text-[11px] cursor-pointer"
                            >
                              Serahkan ke Kurir
                            </button>
                          )}

                          {order.status === 'shipped' && (
                            <button
                              onClick={async () => {
                                await db.updateOrderStatus(order.id, 'completed');
                                await refreshOrders();
                                setUiMessage({ text: `Pesanan #${order.id} telah diselesaikan secara sukses! Saldo Anda telah otomatis bertambah.`, type: 'success' });
                              }}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-2 rounded-xl transition text-[11px] cursor-pointer"
                            >
                              Barang Diterima (Sukses COD)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* FOOTER PENGHANTAR COGNISANCE */}
      <footer className="bg-emerald-950 text-white border-t border-emerald-900 mt-16 p-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 font-sans text-xs">
          
          <div className="space-y-2">
            <h4 className="text-sm font-bold font-display tracking-tight text-emerald-400">
              {appSettings?.app_name || 'PASAR UMKM TEGALSARI'}
            </h4>
            <p className="text-emerald-200 font-light leading-relaxed whitespace-pre-wrap">
              {appSettings?.footer_text || 'Program inovasi ketahanan pangan dan ekonomi rakyat pedesaan Kecamatan Tegalsari, Kabupaten Banyuwangi. Mendukung produk higienis hasil bumi mandiri.'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold font-display tracking-tight text-emerald-400">Hubungi Pengurus</h4>
            <p className="text-emerald-200">📍 {appSettings?.footer_address || 'Jl. Raya Tegalsari No. 1, Kecamatan Tegalsari, Banyuwangi'}</p>
            <p className="text-emerald-200 font-mono">WhatsApp Admin: +{appSettings?.contact_phone || '6281234567890'}</p>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Login & Registrasi User Overlay */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-950 text-sm font-display">
                {isRegistering ? 'Daftar Akun Warga Baru' : 'Masuk Ke Pasar Tegalsari'}
              </h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {authError && (
              <p className="p-2 bg-red-50 text-red-800 text-[11px] rounded border border-red-150 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {authError}
              </p>
            )}

            {/* Login Form */}
            {!isRegistering ? (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Alamat Email Anda</label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: agus@gmail.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                  />

                </div>

                <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition">
                  Masuk Sesi Saya
                </button>

                <p className="text-center text-[11px] text-gray-500 pt-1">
                  Warga baru belum punya akun?{' '}
                  <button type="button" onClick={() => { setIsRegistering(true); setAuthError(''); }} className="text-emerald-700 font-bold hover:underline">
                    Daftar Sekarang
                  </button>
                </p>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Nama Lengkap Sesuai KTP</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan Nama Lengkap"
                    value={registerForm.name}
                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Alamat Email Aktif</label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: agus@gmail.com"
                    value={registerForm.email}
                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Nomor WhatsApp Aktif (Format: 628...)</label>
                  <input
                    type="text"
                    required
                    placeholder="628123456789"
                    value={registerForm.phone}
                    onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">PILIH DUKUH</label>
                  <select
                    value={registerForm.village}
                    onChange={e => setRegisterForm({ ...registerForm, village: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                  >
                    {villagesList.map(v => (
                      <option key={v} value={v}>Dukuh {v}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Alamat Rumah Lengkap (Untuk Kurir)</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Jalan, RT, RW, Nomor Rumah"
                    value={registerForm.address}
                    onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition">
                   Daftar Sekarang
                </button>

                <p className="text-center text-[11px] text-gray-500 pt-1">
                  Sudah memiliki akun warga?{' '}
                  <button type="button" onClick={() => { setIsRegistering(false); setAuthError(''); }} className="text-emerald-700 font-bold hover:underline">
                    Ketuk Masuk
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1B: Vendor Registration Modal (KTP Upload + Shop Logo + banner cover!) */}
      {showVendorRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-xl border border-emerald-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-emerald-950 text-sm font-display flex items-center gap-1.5 uppercase tracking-wider">
                <Store className="w-5 h-5 text-emerald-600" /> Pengajuan Mitra Toko UMKM Baru
              </h3>
              <button 
                type="button"
                onClick={() => setShowVendorRegModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[10.5px] text-slate-500 leading-normal">
              Silahkan lengkapi data usaha UMKM Anda di Desa Tegalsari. Lampirkan salinan KTP sah pemilik untuk proses verifikasi keanggotaan oleh administrator sebelum diaktifkan.
            </p>

            <form onSubmit={handleRegisterVendorSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Nama Usaha / Toko UMKM</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Keripik Singkong Barokah"
                    value={vendorRegForm.business_name}
                    onChange={e => setVendorRegForm({ ...vendorRegForm, business_name: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Pilih Dukuh Asal Usaha</label>
                  <select
                    value={vendorRegForm.village}
                    onChange={e => setVendorRegForm({ ...vendorRegForm, village: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white"
                  >
                    {villagesList.map(v => (
                      <option key={v} value={v}>Dukuh {v}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-gray-700">Deskripsi Ringkas Usaha & Produk</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Sebutkan jenis produk olahan/sumber daya lokal yang dijual..."
                    value={vendorRegForm.description}
                    onChange={e => setVendorRegForm({ ...vendorRegForm, description: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                {/* SELECT MEMBERSHIP TIER (FREE, PREMIUM, VIP) */}
                <div className="col-span-2 space-y-2">
                  <label className="font-bold text-gray-705 block text-emerald-950">Pilih Tingkat Keanggotaan (Membership Tier) *</label>
                  <p className="text-[10px] text-gray-400">Level tier menentukan batas maksimal pemajangan produk Anda di katalog.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* FREE */}
                    <button
                      type="button"
                      onClick={() => setVendorRegForm({ ...vendorRegForm, membership_tier: 'free' })}
                      className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden cursor-pointer ${
                        vendorRegForm.membership_tier === 'free'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-800">FREE</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">Biaya: Gratis</div>
                      <div className="text-[9.5px] text-emerald-700 font-medium mt-1">
                        Max: {appSettings?.membership_settings?.free?.max_products ?? 5} Produk
                      </div>
                      {vendorRegForm.membership_tier === 'free' && (
                        <div className="absolute top-1 right-1 bg-emerald-605 bg-emerald-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[8.5px] font-bold">✓</div>
                      )}
                    </button>

                    {/* PREMIUM */}
                    <button
                      type="button"
                      onClick={() => setVendorRegForm({ ...vendorRegForm, membership_tier: 'premium' })}
                      className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden cursor-pointer ${
                        vendorRegForm.membership_tier === 'premium'
                          ? 'border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-amber-900 flex items-center gap-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" /> PREMIUM
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Biaya: Rp {(appSettings?.membership_settings?.premium?.price ?? 50000).toLocaleString()}
                      </div>
                      <div className="text-[9.5px] text-amber-700 font-medium mt-1">
                        Max: {appSettings?.membership_settings?.premium?.max_products ?? 25} Produk
                      </div>
                      {vendorRegForm.membership_tier === 'premium' && (
                        <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[8.5px] font-bold">✓</div>
                      )}
                    </button>

                    {/* VIP */}
                    <button
                      type="button"
                      onClick={() => setVendorRegForm({ ...vendorRegForm, membership_tier: 'vip' })}
                      className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden cursor-pointer ${
                        vendorRegForm.membership_tier === 'vip'
                          ? 'border-purple-650 border-purple-600 bg-purple-50/20 ring-2 ring-purple-600/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-purple-900 flex items-center gap-0.5">
                        <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" /> VIP
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Biaya: Rp {(appSettings?.membership_settings?.vip?.price ?? 150000).toLocaleString()}
                      </div>
                      <div className="text-[9.5px] text-purple-700 font-medium mt-1">
                        Max: {appSettings?.membership_settings?.vip?.max_products ?? 1000} Produk
                      </div>
                      {vendorRegForm.membership_tier === 'vip' && (
                        <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[8.5px] font-bold">✓</div>
                      )}
                    </button>
                  </div>
                </div>

                {/* MEMBERSHIP PAYMENT SECTION */}
                {vendorRegForm.membership_tier !== 'free' && (
                  <div className="col-span-2 p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span className="font-extrabold text-emerald-950 uppercase tracking-wider text-[11px]">
                        Verifikasi Pembayaran Keanggotaan ({vendorRegForm.membership_tier.toUpperCase()})
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Sesuai aturan pasar, keanggotaan Premium & VIP memerlukan pembayaran di muka sebesar <strong className="text-emerald-700">Rp {(vendorRegForm.membership_tier === 'premium' ? (appSettings?.membership_settings?.premium?.price ?? 50000) : (appSettings?.membership_settings?.vip?.price ?? 150000)).toLocaleString()}</strong>. Silakan pilih metode pembayaran di bawah ini.
                    </p>

                    {/* Method Tabs */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVendorMembPayMethod('pakasir');
                          setVendorMembActivePayment(null);
                        }}
                        className={`py-2 px-3 text-center border rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                          vendorMembPayMethod === 'pakasir'
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        Pakasir QRIS Instan
                      </button>
                      <button
                        type="button"
                        onClick={() => setVendorMembPayMethod('transfer_manual')}
                        className={`py-2 px-3 text-center border rounded-xl font-bold transition-all text-[11px] cursor-pointer ${
                          vendorMembPayMethod === 'transfer_manual'
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        Transfer Manual
                      </button>
                    </div>

                    {vendorMembPayMethod === 'pakasir' ? (
                      <div className="space-y-3 p-3 bg-white border border-slate-150 rounded-xl text-center">
                        {!vendorMembActivePayment ? (
                          <div className="space-y-2 py-2">
                            <p className="text-[10px] text-slate-500">
                              Sistem akan membuat kode QRIS unik khusus untuk Anda via gerbang pembayaran Pakasir.
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const tierPrice = vendorRegForm.membership_tier === 'premium' 
                                    ? (appSettings?.membership_settings?.premium?.price ?? 50000) 
                                    : (appSettings?.membership_settings?.vip?.price ?? 150000);
                                  
                                  const customOrderId = `MEMB_${currentProfile.id}_${Date.now()}`;
                                  
                                  const data = await handleCreatePakasirTransaction('qris', customOrderId, tierPrice);
                                  if (data && data.payment) {
                                    setVendorMembActivePayment({
                                      ...data.payment,
                                      order_id: customOrderId,
                                      original_amount: tierPrice
                                    });
                                    setVendorMembPayStatus('unpaid');
                                    setUiMessage({ text: 'Kode QRIS Pakasir berhasil dibuat! Silakan bayar.', type: 'success' });
                                  } else {
                                    alert('Gagal menghubungi Pakasir.');
                                  }
                                } catch (err: any) {
                                  alert('Gagal membuat transaksi: ' + err.message);
                                }
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition shadow cursor-pointer"
                            >
                              Buat Pembayaran QRIS Pakasir
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 flex flex-col items-center">
                            <div className="bg-slate-50 p-2 border rounded-lg">
                              <img
                                referrerPolicy="no-referrer"
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vendorMembActivePayment.payment_number)}`}
                                alt="Membership QRIS"
                                className="w-32 h-32"
                              />
                            </div>
                            
                            <div className="text-[10px] text-slate-500 max-w-xs">
                              Silakan scan kode QRIS diatas dengan e-wallet (GoPay, OVO, Dana) atau Mobile Banking.
                            </div>

                            <div className="bg-slate-50 p-2.5 rounded-lg border w-full space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-500">Invoice ID:</span>
                                <span className="font-mono text-slate-800 font-bold">#{vendorMembActivePayment.order_id}</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-500">Status Pembayaran:</span>
                                <span className={`font-bold ${vendorMembPayStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {vendorMembPayStatus === 'paid' ? 'LUNAS / PAID' : 'MENUNGGU / UNPAID'}
                                </span>
                              </div>
                            </div>

                            {/* Simulation & status check */}
                            <div className="grid grid-cols-2 gap-2 w-full pt-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    if (!isSupabaseConfigured) {
                                      setVendorMembPayStatus('paid');
                                      alert('Simulasi sukses (Mode Lokal)! Status pembayaran keanggotaan Anda telah diset LUNAS.');
                                    } else {
                                      await fetch('/api/pakasir/simulate', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          order_id: vendorMembActivePayment.order_id,
                                          amount: vendorMembActivePayment.original_amount
                                        })
                                      });
                                      alert('Simulasi pembayaran berhasil dikirim! Silakan klik "Cek Status Pembayaran".');
                                    }
                                  } catch (err: any) {
                                    alert('Gagal simulasi: ' + err.message);
                                  }
                                }}
                                className="py-1 px-2 bg-yellow-500 hover:bg-yellow-650 text-slate-900 font-extrabold rounded text-[10px] cursor-pointer"
                              >
                                Simulasikan Bayar
                              </button>
                              
                              <button
                                type="button"
                                disabled={vendorMembPayChecking}
                                onClick={async () => {
                                  setVendorMembPayChecking(true);
                                  try {
                                    const completed = await handleCheckPakasirStatus(vendorMembActivePayment.order_id, vendorMembActivePayment.original_amount);
                                    if (completed) {
                                      setVendorMembPayStatus('paid');
                                      setUiMessage({ text: 'Pembayaran keanggotaan terverifikasi LUNAS! Anda dapat melanjutkan pendaftaran.', type: 'success' });
                                    } else {
                                      alert('Pembayaran belum diterima. Jika Anda sudah membayar, silakan tunggu beberapa saat lalu cek kembali.');
                                    }
                                  } catch (err: any) {
                                    console.error(err);
                                  } finally {
                                    setVendorMembPayChecking(false);
                                  }
                                }}
                                className="py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded text-[10px] cursor-pointer disabled:opacity-50"
                              >
                                {vendorMembPayChecking ? 'Mengecek...' : 'Cek Status'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-white border border-slate-150 rounded-xl">
                        <div className="text-[10px] text-slate-600 space-y-1">
                          <p className="font-bold text-slate-750">Instruksi Transfer Manual:</p>
                          <p>Silakan kirim nominal persis ke rekening admin berikut:</p>
                          <div className="p-2 bg-slate-50 border rounded-lg font-mono text-slate-800 space-y-0.5 text-left">
                            <div>Bank: <strong>BRI (Bank Rakyat Indonesia)</strong></div>
                            <div>No. Rekening: <strong>0021-01-098765-53-1</strong></div>
                            <div>Atas Nama: <strong>Admin Pasar UMKM Tegalsari</strong></div>
                            <div className="text-emerald-700 mt-1">Nominal: <strong>Rp {(vendorRegForm.membership_tier === 'premium' ? (appSettings?.membership_settings?.premium?.price ?? 50000) : (appSettings?.membership_settings?.vip?.price ?? 150000)).toLocaleString()}</strong></div>
                          </div>
                        </div>

                        {/* File receipt upload */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700">Unggah Bukti Transfer (Foto Kertas Struk/Screenshot) *</label>
                          <div className="flex gap-2 items-center">
                            {vendorMembPayProof ? (
                              <img src={vendorMembPayProof} className="w-12 h-12 rounded object-cover shrink-0 border" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-12 h-12 bg-slate-100 rounded border flex items-center justify-center text-[8px] text-slate-400 text-center shrink-0">Belum Ada</div>
                            )}
                            <div className="relative flex-1 border border-dashed border-gray-300 hover:border-emerald-500 rounded-lg p-2 text-center cursor-pointer transition">
                              <input
                                type="file"
                                accept="image/*"
                                required={vendorRegForm.membership_tier !== 'free' && vendorMembPayMethod === 'transfer_manual'}
                                onChange={async e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImage(file, 800, 800, 0.75);
                                      setVendorMembPayProof(compressed);
                                      setVendorMembPayStatus('pending');
                                    } catch (err) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        if (typeof reader.result === 'string') {
                                          setVendorMembPayProof(reader.result);
                                          setVendorMembPayStatus('pending');
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <span className="text-[10px] text-gray-500 font-semibold block">Pilih File Bukti</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-gray-700">Alamat Lengkap Rumah/Toko (Tegalsari)</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Dusun, RT/RW, Kecamatan Tegalsari"
                    value={vendorRegForm.address}
                    onChange={e => setVendorRegForm({ ...vendorRegForm, address: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                {/* Bank account details block */}
                <div className="col-span-2 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                  <p className="font-bold text-gray-750 text-[10.5px] uppercase tracking-wider">Rekening Bank Pencairan Hasil Penjualan</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-600 font-semibold">Nama Bank</label>
                      <select
                        value={vendorRegForm.bank_name}
                        onChange={e => setVendorRegForm({ ...vendorRegForm, bank_name: e.target.value })}
                        className="w-full p-1.5 border border-gray-200 rounded bg-white text-xs"
                      >
                        {['BRI', 'Bank Mandiri', 'BCA', 'BNI', 'Bank Jatim', 'DANA', 'OVO'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] text-gray-600 font-semibold">Nomor Rekening / No E-Wallet</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 6012xxxxxxxxxxxx"
                        value={vendorRegForm.bank_account_number}
                        onChange={e => setVendorRegForm({ ...vendorRegForm, bank_account_number: e.target.value })}
                        className="w-full p-1.5 border border-gray-200 rounded text-xs"
                      />
                    </div>
                    <div className="space-y-1 col-span-3">
                      <label className="text-[10px] text-gray-600 font-semibold">Atas Nama Pemegang Rekening (Harus Sesuai KTP)</label>
                      <input
                        type="text"
                        required
                        value={vendorRegForm.bank_account_name}
                        onChange={e => setVendorRegForm({ ...vendorRegForm, bank_account_name: e.target.value })}
                        className="w-full p-1.5 border border-gray-200 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* MANDATORY KTP local upload widget */}
                <div className="space-y-1.5 col-span-2 p-3 border-2 border-dashed border-amber-300 bg-amber-50/10 rounded-xl">
                  <label className="font-bold text-amber-950 flex justify-between">
                    <span>File Identitas Penduduk (Foto KTP Pemilik Usaha) *</span>
                    <span className="text-[9px] text-amber-800 font-sans uppercase font-bold">Wajib diunggah!</span>
                  </label>
                  <p className="text-[9.5px] text-gray-500 pb-1">KTP diunggah aman dan hanya digunakan oleh Pengurus Desa untuk memvalidasi kelayakan kepemilikan usaha lokal.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    {vendorRegForm.ktp_url ? (
                      <div className="relative group shrink-0 border border-amber-200 rounded-lg overflow-hidden w-28 h-18 bg-emerald-50">
                        <img src={vendorRegForm.ktp_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <span className="absolute bottom-0 right-0 bg-emerald-600 text-white text-[8px] px-1 font-bold">Terunggah</span>
                      </div>
                    ) : (
                      <div className="w-28 h-18 bg-slate-100 rounded-lg flex items-center justify-center text-center text-slate-400 font-bold border shrink-0 text-[10px]">
                        Belum Upload
                      </div>
                    )}
                    
                    <div className="relative flex-1 border-2 border-dashed border-amber-200 bg-white hover:border-amber-500/50 rounded-xl p-3 text-center transition cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        required={!vendorRegForm.ktp_url}
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 800, 800, 0.75);
                              setVendorRegForm(prev => ({ ...prev, ktp_url: compressed }));
                            } catch (err) {
                              console.error('Gagal kompres KTP:', err);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setVendorRegForm(prev => ({ ...prev, ktp_url: reader.result }));
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-[10px] text-amber-950 font-bold flex flex-col items-center gap-1">
                        <UploadCloud className="w-5 h-5 text-amber-600 group-hover:scale-105 transition" />
                        <span>Klik untuk Unggah Berkas KTP atau Foto Kamera</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional local Logo and Banner upload */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-700 flex justify-between">
                    <span>Logo Toko Anda</span>
                    <span className="text-[9px] text-gray-400">Bisa upload lokal</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    {vendorRegForm.logo_url && (
                      <img src={vendorRegForm.logo_url} className="w-8 h-8 rounded-lg object-cover shrink-0 border" referrerPolicy="no-referrer" />
                    )}
                    <div className="relative flex-1 border border-dashed border-gray-300 bg-white rounded-lg p-1.5 text-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 200, 200, 0.7);
                              setVendorRegForm(v => ({ ...v, logo_url: compressed }));
                            } catch (err) {
                              console.error('Gagal kompres logo:', err);
                              const r = new FileReader();
                              r.onloadend = () => setVendorRegForm(v => ({ ...v, logo_url: r.result as string }));
                              r.readAsDataURL(file);
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-500">Pilih Logo</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-gray-700 flex justify-between">
                    <span>Banner Toko Anda</span>
                    <span className="text-[9px] text-gray-400">Bisa upload lokal</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    {vendorRegForm.banner_url && (
                      <img src={vendorRegForm.banner_url} className="w-12 h-8 rounded shrink-0 border object-cover" referrerPolicy="no-referrer" />
                    )}
                    <div className="relative flex-1 border border-dashed border-gray-300 bg-white rounded-lg p-1.5 text-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 1000, 500, 0.7);
                              setVendorRegForm(v => ({ ...v, banner_url: compressed }));
                            } catch (err) {
                              console.error('Gagal kompres banner:', err);
                              const r = new FileReader();
                              r.onloadend = () => setVendorRegForm(v => ({ ...v, banner_url: r.result as string }));
                              r.readAsDataURL(file);
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-500">Pilih Banner</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowVendorRegModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Batal / Keluar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg transition shadow-xs flex items-center gap-1"
                >
                  Ajukan Pendaftaran Toko✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Single Product Detail Modal (Variants + Certifications + Affiliate Promotion link creator!) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                Detail Produk
              </span>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedVendorDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                className="w-full aspect-square object-cover rounded-xl border border-gray-100"
              />
              
              <div className="space-y-3 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-gray-400 font-bold font-mono uppercase">Merek: {selectedProduct.brand}</p>
                  <h3 className="text-sm font-black text-gray-900 font-display">{selectedProduct.name}</h3>
                </div>

                <div className="flex items-baseline gap-2">
                  {selectedProduct.discount_price ? (
                    <>
                      <span className="text-base font-black text-emerald-700 font-mono">Rp {selectedProduct.discount_price.toLocaleString('id-ID')}</span>
                      <span className="text-xs text-gray-400 line-through">Rp {selectedProduct.price.toLocaleString('id-ID')}</span>
                    </>
                  ) : (
                    <span className="text-base font-black text-emerald-700 font-mono font-bold">Rp {selectedProduct.price.toLocaleString('id-ID')}</span>
                  )}
                </div>

                {/* Variants chooser */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-700">Pilih Varian / Rasa / Ukuran:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedProduct.variants.map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSelectedProductVariant(v)}
                          className={`px-2 py-1 border text-[10px] rounded transition ${
                            selectedProductVariant === v
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <p className="font-semibold text-gray-700">Informasi Stok & Logistik:</p>
                  <p className="text-gray-600 text-[10px]">Stok Tersedia: <b>{selectedProduct.stock} unit</b></p>
                  <p className="text-gray-600 text-[10px]">Berat Produk: <b>{selectedProduct.weight} Gram</b></p>
                </div>

                {/* Regulatory Approvals */}
                <div className="space-y-1 pt-1.5">
                  <p className="font-semibold text-emerald-950 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    🏅 Sertifikasi & Legalitas Pengawasan
                  </p>
                  {selectedProduct.pirt && selectedProduct.pirt !== '-' && <p className="text-[10px] text-gray-500 font-mono">• P-IRT No: {selectedProduct.pirt}</p>}
                  {selectedProduct.bpom && selectedProduct.bpom !== '-' && <p className="text-[10px] text-gray-500 font-mono">• BPOM RI: {selectedProduct.bpom}</p>}
                  {selectedProduct.pkrt && selectedProduct.pkrt !== '-' && <p className="text-[10px] text-gray-500 font-mono">• PKRT No: {selectedProduct.pkrt}</p>}
                  {(!selectedProduct.pirt || selectedProduct.pirt === '-') && (!selectedProduct.bpom || selectedProduct.bpom === '-') && (!selectedProduct.pkrt || selectedProduct.pkrt === '-') && (
                    <p className="text-[10px] text-gray-400 italic">Ijin lokal terdaftar di Desa asal.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description accordion details */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-gray-800">Deskripsi Lengkap Produk:</h4>
              <p className="text-gray-600 leading-relaxed text-[11.5px] select-all bg-emerald-50/20 p-2.5 rounded-xl border border-dotted border-emerald-100">
                {selectedProduct.description || 'Pemberian keterangan produk belum dimasukkan oleh pengampu usaha.'}
              </p>
            </div>

            {/* Affiliate Link Clipboard Copier (Fulfills the regency affiliate setup) */}
            {currentProfile && currentProfile.role === 'vendor' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <HeartHandshake className="w-4.5 h-4.5 text-amber-700" /> Pengiklan Afiliasi (Raup Komisi)
                </p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Bantu promosikan produk ini ke jaringan media sosial Anda! Pengunjung yang membeli produk ini lewat url di bawah ini akan menambahkan komisi otomatis ke dasbor toko Anda.
                </p>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled
                    value={`${window.location.protocol}//${window.location.host}/?aff=${currentProfile.id}`}
                    className="bg-white border text-[10px] p-1.5 rounded-lg font-mono text-gray-600 flex-1 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/?aff=${currentProfile.id}`);
                      alert('Tautan afiliasi toko Anda berhasil dicopy ke clipboard!');
                    }}
                    type="button"
                    className="p-1 px-3 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-lg text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5" /> Salin Link
                  </button>
                </div>
              </div>
            )}

            {/* CTA Buy Buttons */}
            <div className="flex gap-2.5 pt-3 border-t border-gray-150">
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedVendorDetail(getProductVendor(selectedProduct.vendor_id) || null);
                }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold flex items-center gap-1 transition text-xs cursor-pointer shrink-0"
              >
                <Store className="w-4 h-4 text-emerald-600" /> Profil Toko
              </button>

              <button
                onClick={() => {
                  if (cart.length > 0 && cart[0].product.vendor_id !== selectedProduct.vendor_id) {
                    alert('Keranjang Anda sudah memuat produk dari toko lain. Tiap transaksi COD wajib diselesaikan satu-per-satu per-toko untuk kenyamanan rute kurir.');
                    return;
                  }
                  addToCart(selectedProduct, selectedProductVariant);
                  setSelectedProduct(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-100"
              >
                <ShoppingCart className="w-4 h-4" /> Masukkan Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Vendor Store Profile detail catalog */}
      {selectedVendorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <span className="font-bold text-gray-900 font-display text-xs">Profil Vendor UMKM</span>
              <button onClick={() => setSelectedVendorDetail(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Header info card */}
            <div className="relative h-28 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-emerald-900" />
              <img src={selectedVendorDetail.banner_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'} alt="Store banner" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3.5">
                <div className="flex items-center gap-3">
                  <img src={selectedVendorDetail.logo_url} alt="Logo store" className="w-10 h-10 rounded-xl object-contain bg-white shrink-0 border" />
                  <div className="text-white text-xs">
                    <h3 className="font-bold text-sm tracking-tight">{selectedVendorDetail.business_name}</h3>
                    <p className="text-[10px] text-emerald-200">📍 Desa {selectedVendorDetail.village}, Alamat: {selectedVendorDetail.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-600 leading-relaxed font-sans pr-1">
              <p className="font-semibold text-gray-950 mb-0.5">Tentang Usaha:</p>
              {selectedVendorDetail.description}
            </div>

            <div className="border-t border-gray-100 pt-3.5 space-y-3">
              <p className="font-bold text-emerald-950 text-xs">Katalog Dagangan Toko Ini ({products.filter(p => p.vendor_id === selectedVendorDetail.id).length}):</p>
              
              <div className="grid grid-cols-2 gap-3.5">
                {products.filter(p => p.vendor_id === selectedVendorDetail.id).map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setSelectedProductVariant((p.variants && p.variants[0]) || 'Original');
                      setSelectedVendorDetail(null);
                    }}
                    className="p-2.5 border border-gray-100 rounded-xl hover:border-emerald-250 transition-all cursor-pointer space-y-1.5"
                  >
                    <img src={p.image_url} alt={name} className="w-full h-24 object-cover rounded-lg" />
                    <h4 className="font-semibold text-gray-900 text-[11px] truncate">{p.name}</h4>
                    <p className="text-xs font-bold text-emerald-700">
                      Rp {(p.discount_price || p.price).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Shopping Cart & Checkout (Coordinates maps courier selection + grand totals) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 max-h-[88vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <h3 className="font-bold text-gray-950 text-sm font-display flex items-center gap-1.5">
                <ShoppingCart className="w-4.5 h-4.5 text-emerald-600" /> Checkout Keranjang Belanja COD
              </h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {/* Verification of User profile coordinates check */}
            {!currentProfile ? (
              <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 text-xs space-y-3.5 rounded-xl">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-amber-700" /> Silakan Daftar / MasukTerlebih Dahulu
                </p>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Untuk menaruh titik koordinat pengantaran kurir di peta Tegalsari serta memproses orderan, silakan mendaftarkan akun warga atau masuk menggunakan demonstrasi email di bar atas.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setShowLoginModal(true);
                  }}
                  className="px-4 py-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                >
                  Daftar / Masuk Akun Warga
                </button>
              </div>
            ) : (
              /* User coordinates registered */
              <div className="space-y-4 text-xs">
                
                {/* List items inside the cart */}
                <div className="space-y-2 border-b border-gray-100 pb-3">
                  <p className="font-bold text-emerald-950 text-xs">Item Pembelian Anda:</p>
                  <div className="space-y-1.5">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100/30">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 leading-tight">{item.product.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Varian: {item.variant} | Qty: {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="font-bold text-emerald-700 font-mono">
                            Rp {((item.product.discount_price || item.product.price) * item.quantity).toLocaleString()}
                          </span>
                          
                          <div className="flex gap-1.5 bg-white border border-gray-200 p-0.5 rounded-lg">
                            <button onClick={() => updateCartQuantity(item.product.id, item.variant, -1)} className="p-1 hover:bg-gray-50 text-gray-600">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[11px] font-bold px-1.5">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.product.id, item.variant, 1)} className="p-1 hover:bg-gray-50 text-gray-600">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping map coordinates selection for the buyer */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-emerald-950 text-xs">Detail Pengiriman Pembeli:</p>
                    <button
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setActiveTab('profil');
                      }}
                      className="text-emerald-700 font-bold hover:underline text-[11px]"
                    >
                      Ubah Titik Rumah via Akun
                    </button>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl space-y-1.5 text-emerald-950 border border-emerald-100 leading-normal">
                    <p className="font-bold flex items-center gap-1">📍 Alamat Pengiriman COD Sesuai Peta Pas GPS:</p>
                    <p className="text-emerald-800 text-[11px]">{currentProfile.address} (Desa {currentProfile.village})</p>
                    {currentProfile.latitude ? (
                      <p className="text-[10px] text-emerald-600 font-mono">
                        Koordinat Aktif: {currentProfile.latitude.toFixed(5)}, {currentProfile.longitude?.toFixed(5)} (Jarak {currentDistanceKm} KM dari Toko Vendor)
                      </p>
                    ) : (
                      <p className="text-[10px] text-red-700 font-bold">📢 Belum meletakan kordinat GPS di akun! Estimasi jarak standar 1.5 KM digunakan.</p>
                    )}
                  </div>
                </div>

                {/* Shipping Method Selector */}
                <div className="space-y-1.5 pb-2">
                  <span className="font-bold text-emerald-950 text-xs">Pilih Metode Pengiriman:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShippingMethod('local')}
                      className={`flex-1 py-2 px-3 border rounded-xl text-center font-bold text-xs transition cursor-pointer ${
                        shippingMethod === 'local'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-gray-750 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      🛵 Kurir Lokal Mandiri
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingMethod('ekspedisi')}
                      className={`flex-1 py-2 px-3 border rounded-xl text-center font-bold text-xs transition cursor-pointer ${
                        shippingMethod === 'ekspedisi'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-gray-750 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      📦 Ekspedisi Nasional
                    </button>
                  </div>
                </div>

                {/* Courier selection (Fulfills vendor courier create custom and calculate maps) */}
                {shippingMethod === 'local' ? (
                  <div className="space-y-1.5">
                    <label className="font-bold text-emerald-950 text-xs flex items-center gap-1">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      Pilih Layanan Kurir Mandiri dari Vendor ({currentCheckoutVendor?.business_name}):
                    </label>
                    
                    <select
                      required
                      value={checkoutCourierId}
                      onChange={handleCourierChange}
                      className="w-full p-2.5 border border-emerald-200 bg-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- Pilih Kurir Sopir Toko --</option>
                      {allCouriers
                        .filter(c => c.vendor_id === currentCheckoutVendor?.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.vehicle_type}) [Tarif {c.base_fare.toLocaleString()} + {c.price_per_km.toLocaleString()}/KM]
                          </option>
                        ))}
                    </select>

                    {allCouriers.filter(c => c.vendor_id === currentCheckoutVendor?.id).length === 0 && (
                      <p className="text-[10px] text-red-700 italic">⚠️ Vendor ini belum mengaktifkan personil kurir mandiri. Silakan kabari pengurus kecamatan atau hubungi vendor.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 pb-1 border-b border-emerald-100">
                      <Truck className="w-4 h-4 text-emerald-650" />
                      Pengaturan Ekspedisi Nasional
                    </div>
                    
                    {rajaOngkirStatusMessage && (
                      <p className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 leading-normal">
                        {rajaOngkirStatusMessage}
                      </p>
                    )}

                    <div className="space-y-2 bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* PROVINSI */}
                        <div className="space-y-1">
                          <span className="font-bold text-gray-700 block text-xs">Provinsi Tujuan:</span>
                          {roLoadingProvinces ? (
                            <div className="py-2 px-3 border border-gray-200 rounded-xl bg-white text-gray-400 text-xs">Loading Provinsi...</div>
                          ) : (
                            <select
                              required
                              value={selectedProvinceId}
                              onChange={(e) => {
                                setSelectedProvinceId(e.target.value);
                                loadRoCities(e.target.value);
                              }}
                              className="w-full p-2 border border-gray-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs"
                            >
                              <option value="">-- Pilih Provinsi --</option>
                              {roProvinces.map(p => (
                                <option key={p.province_id} value={p.province_id}>{p.province}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* KOTA / KABUPATEN */}
                        <div className="space-y-1">
                          <span className="font-bold text-gray-700 block text-xs">Kota Tujuan:</span>
                          {roLoadingCities ? (
                            <div className="py-2 px-3 border border-gray-200 rounded-xl bg-white text-gray-400 text-xs">Loading Kota...</div>
                          ) : (
                            <select
                              required
                              disabled={!selectedProvinceId}
                              value={selectedCityId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedCityId(val);
                                if (val) {
                                  loadRoDistricts(val);
                                }
                              }}
                              className="w-full p-2 border border-gray-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-xs"
                            >
                              <option value="">-- Pilih Kota --</option>
                              {roCities.map(c => (
                                <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* KECAMATAN */}
                        <div className="space-y-1">
                          <span className="font-bold text-gray-700 block text-xs">Kecamatan Tujuan:</span>
                          {roLoadingDistricts ? (
                            <div className="py-2 px-3 border border-gray-200 rounded-xl bg-white text-gray-400 text-xs">Loading Kecamatan...</div>
                          ) : (
                            <select
                              required
                              disabled={!selectedCityId}
                              value={selectedDistrictId}
                              onChange={(e) => {
                                const distId = e.target.value;
                                setSelectedDistrictId(distId);
                                const found = roDistricts.find(d => d.district_id === distId);
                                if (found) {
                                  setSelectedDistrictName(found.district_name);
                                }
                                calculateRoCosts(selectedCityId, distId, selectedRoCourier);
                              }}
                              className="w-full p-2 border border-gray-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-xs"
                            >
                              <option value="">-- Pilih Kecamatan --</option>
                              {roDistricts.map(d => (
                                <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="font-bold text-gray-705 block">Pilih Ekspedisi:</span>
                        <select
                          required
                          value={selectedRoCourier}
                          onChange={(e) => {
                            const courierVal = e.target.value;
                            setSelectedRoCourier(courierVal);
                            if (selectedCityId && selectedDistrictId) {
                              calculateRoCosts(selectedCityId, selectedDistrictId, courierVal);
                            }
                          }}
                          className="w-full p-2 border border-gray-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs text-slate-800"
                        >
                          {(currentCheckoutVendor?.rajaongkir_couriers && currentCheckoutVendor.rajaongkir_couriers.length > 0
                            ? currentCheckoutVendor.rajaongkir_couriers
                            : ['jne', 'pos', 'tiki']
                          ).map(c => {
                            const courierNames: Record<string, string> = {
                              jne: 'JNE Express',
                              pos: 'POS Indonesia',
                              tiki: 'TIKI',
                              sicepat: 'SiCepat',
                              jnt: 'J&T Express',
                              gosend: 'GoSend Instant',
                              grab: 'Grab Express',
                              anteraja: 'AnterAja',
                              paxel: 'Paxel',
                              lion: 'Lion Parcel'
                            };
                            return (
                              <option key={c} value={c}>
                                {courierNames[c] || c.toUpperCase()}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="font-bold text-gray-705 block">Layanan & Ongkir:</span>
                        {roLoadingCosts ? (
                          <div className="py-2 px-3 border border-gray-200 rounded-xl bg-white text-gray-400">Menghitung...</div>
                        ) : (
                          <select
                            required
                            disabled={roCostResults.length === 0}
                            value={selectedRoCostService ? JSON.stringify(selectedRoCostService) : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                setSelectedRoCostService(JSON.parse(e.target.value));
                              } else {
                                setSelectedRoCostService(null);
                              }
                            }}
                            className="w-full p-2 border border-gray-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-xs"
                          >
                            {(() => {
                              const courierLower = String(selectedRoCourier).toLowerCase();
                              let filtered = roCostResults.filter(c => {
                                const serviceLower = String(c.service).toLowerCase();
                                if (courierLower === 'jnt' && (serviceLower.includes('j&t') || serviceLower.includes('jnt') || serviceLower.includes('j-t'))) {
                                  return true;
                                }
                                if (courierLower === 'pos' && (serviceLower.includes('pos') || serviceLower.includes('indonesia'))) {
                                  return true;
                                }
                                return serviceLower.startsWith(courierLower) || serviceLower.includes(courierLower);
                              });

                              if (filtered.length === 0) {
                                filtered = roCostResults;
                              }

                              if (filtered.length === 0) {
                                return <option value="">Layanan tidak ditemukan</option>;
                              }

                              return filtered.map((c, idx) => (
                                <option key={idx} value={JSON.stringify(c)}>
                                  {c.service} - Rp {c.cost.toLocaleString()} ({c.etd})
                                </option>
                              ));
                            })()}
                          </select>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* STORE/VENDOR SUPPORTED PAYMENT METHODS */}
                <div className="space-y-2 bg-emerald-50/25 border border-emerald-100 p-4 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 pb-1 border-b border-emerald-100/60">
                    <span className="text-sm">💳</span> Metode Pembayaran Toko:
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Vendor <span className="font-semibold text-emerald-900">{currentCheckoutVendor?.business_name}</span> menentukan metode pembayaran yang diizinkan berikut:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {(() => {
                      let vendorPaymentMethods = currentCheckoutVendor?.payment_methods && currentCheckoutVendor.payment_methods.length > 0 
                        ? currentCheckoutVendor.payment_methods 
                        : ['COD', 'Pakasir QRIS', 'Transfer Bank Local'];
                      
                      if (shippingMethod !== 'local') {
                        vendorPaymentMethods = vendorPaymentMethods.filter(m => m !== 'COD');
                      }
                      
                      const methodInfos: Record<string, { label: string, icon: string, desc: string }> = {
                        'COD': { label: 'COD (Bayar di Tempat)', icon: '💵', desc: 'Bayar tunai saat barang diantar.' },
                        'Pakasir QRIS': { label: 'Pakasir Online (QRIS/VA)', icon: '⚡', desc: 'Diverifikasi otomatis & instan.' },
                        'Transfer Bank Local': { label: 'Transfer Manual', icon: '🏦', desc: 'Transfer ke rekening bank vendor.' }
                      };

                      return vendorPaymentMethods.map(method => {
                        const info = methodInfos[method] || { label: method, icon: '💰', desc: 'Metode pembayaran kustom.' };
                        const isSelected = selectedPaymentCategory === method;
                        return (
                          <button
                            type="button"
                            key={method}
                            onClick={() => setSelectedPaymentCategory(method)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className="font-bold flex items-center gap-1 text-[11px]">
                              <span>{info.icon}</span> {info.label}
                            </span>
                            <span className={`text-[9px] leading-relaxed mt-1 font-medium ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                              {info.desc}
                            </span>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* If Pakasir is selected, show Pakasir VA/QRIS selector */}
                  {selectedPaymentCategory === 'Pakasir QRIS' && (
                    <div className="mt-3 p-3 bg-white border border-emerald-100 rounded-xl space-y-2">
                      <span className="font-bold text-gray-750 block flex items-center gap-1 text-[10px] text-emerald-800">
                        ⚡ Pilih Saluran Pembayaran Pakasir:
                      </span>
                      <select
                        value={selectedPakasirMethod}
                        onChange={(e) => setSelectedPakasirMethod(e.target.value as any)}
                        className="w-full p-2 border border-emerald-200 bg-emerald-50/20 rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-slate-800"
                      >
                        <option value="qris">QRIS (Otomatis & Rekomendasi)</option>
                        <option value="bni_va">BNI Virtual Account</option>
                        <option value="bri_va">BRI Virtual Account</option>
                        <option value="cimb_niaga_va">CIMB Niaga Virtual Account</option>
                        <option value="sampoerna_va">Sampoerna Virtual Account</option>
                        <option value="bnc_va">BNC Virtual Account</option>
                        <option value="maybank_va">Maybank Virtual Account</option>
                        <option value="permata_va">Permata Virtual Account</option>
                        <option value="atm_bersama_va">ATM Bersama VA</option>
                        <option value="artha_graha_va">Artha Graha Virtual Account</option>
                      </select>
                      <p className="text-[9px] text-gray-400 italic">
                        *Pesanan Anda akan diverifikasi otomatis oleh sistem pembayaran pintar Pakasir.
                      </p>
                    </div>
                  )}

                  {/* If Transfer Bank Local is selected, show Bank Account details of the vendor */}
                  {selectedPaymentCategory === 'Transfer Bank Local' && (
                    <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-950 text-[11px] leading-relaxed">
                      <p className="font-bold text-amber-900 flex items-center gap-1">🏦 Rekening Bank Vendor untuk Transfer Manual:</p>
                      <div className="mt-1 font-mono text-xs bg-white p-2 rounded-lg border border-amber-200/50 space-y-0.5">
                        <p>Bank: <span className="font-bold text-slate-800">{currentCheckoutVendor?.bank_name}</span></p>
                        <p>No. Rekening: <span className="font-bold text-slate-800">{currentCheckoutVendor?.bank_account_number}</span></p>
                        <p>Atas Nama: <span className="font-bold text-slate-800">{currentCheckoutVendor?.bank_account_name}</span></p>
                      </div>
                      <p className="text-[10px] text-amber-800/80 mt-1.5 font-medium italic">
                        *Harap kirim bukti transfer manual ke nomor Whatsapp vendor setelah menyelesaikan pembayaran.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bill details */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2.5 border border-gray-200/50">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total belanja produk:</span>
                    <span className="font-mono text-gray-950">Rp {cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {shippingMethod === 'ekspedisi' ? 'Ongkos Kirim Ekspedisi Nasional' : `Ongkos Kirim COD (${currentDistanceKm} KM)`}:
                    </span>
                    <span className="font-mono text-gray-950">Rp {currentShippingFee.toLocaleString()}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between text-sm font-bold text-emerald-950">
                    <span>
                      {shippingMethod === 'ekspedisi' ? 'Total Keseluruhan (Ekspedisi + Produk):' : 'Total Keseluruhan (Bayar Tunai di Tempat):'}
                    </span>
                    <span className="font-mono">Rp {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <div className="flex gap-2 justify-end pt-3 border-t border-gray-150">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isCreatingPakasirTransaction}
                    onClick={handlePlaceOrder}
                    className="px-5 py-2.5 bg-emerald-600 disabled:bg-gray-250 disabled:cursor-not-allowed hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100"
                  >
                    {shippingMethod === 'ekspedisi' ? 'Buat Pesanan via Ekspedisi' : 'Buat Pesanan & Bayar COD'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* PAKASIR PAYMENT MODAL */}
      {showPakasirPaymentModal && activePakasirPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 relative shrink-0">
              <button
                onClick={() => setShowPakasirPaymentModal(false)}
                className="absolute top-3.5 right-3.5 bg-white/15 hover:bg-white/25 rounded-full p-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  Pakasir Gateway
                </span>
                <span className="bg-emerald-800/40 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Awaiting Payment
                </span>
              </div>
              <h3 className="text-base font-extrabold tracking-tight">Selesaikan Pembayaran Anda</h3>
              <p className="text-white/80 text-[11px] mt-0.5">Invoice ID: #{activePakasirPayment.order_id}</p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              
              {/* Payment Details */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Nominal Belanja:</span>
                  <span className="font-mono text-slate-800">Rp {Number(activePakasirPayment.original_amount || activePakasirPayment.amount).toLocaleString()}</span>
                </div>
                {activePakasirPayment.fee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Biaya Layanan (Fee):</span>
                    <span className="font-mono text-slate-800">Rp {activePakasirPayment.fee.toLocaleString()}</span>
                  </div>
                )}
                <hr className="border-slate-200 border-dashed" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Total Harus Dibayar:</span>
                  <span className="font-mono text-base font-black text-emerald-600">
                    Rp {Number(activePakasirPayment.total_payment || activePakasirPayment.amount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Metode: {activePakasirPayment.payment_method?.toUpperCase()}
                </div>

                {activePakasirPayment.payment_method === 'qris' ? (
                  /* QRIS QR CODE DISPLAY */
                  <div className="flex flex-col items-center space-y-2 bg-white p-3 border border-slate-100 rounded-2xl shadow-inner shadow-slate-50">
                    <img
                      referrerPolicy="no-referrer"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activePakasirPayment.payment_number)}`}
                      alt="Pakasir QRIS Code"
                      className="w-36 h-36 rounded-lg border-4 border-white shadow-md"
                    />
                    <div className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                      Pindai QRIS di atas menggunakan aplikasi e-wallet pilihan Anda seperti <strong className="text-emerald-700">GoPay, OVO, Dana, LinkAja, ShopeePay</strong> atau aplikasi Mobile Banking.
                    </div>
                  </div>
                ) : (
                  /* VIRTUAL ACCOUNT NUMBER DISPLAY */
                  <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm text-center space-y-2.5">
                    <span className="text-slate-500 text-xs font-medium block">Nomor Virtual Account Anda:</span>
                    <div className="flex items-center justify-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <code className="text-base font-black text-slate-850 font-mono tracking-wider">{activePakasirPayment.payment_number}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activePakasirPayment.payment_number);
                          alert('Nomor Virtual Account berhasil disalin ke clipboard!');
                        }}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                      >
                        Salin
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-relaxed">
                      Silakan lakukan transfer dari Mobile Banking, Internet Banking, atau mesin ATM ke nomor Virtual Account di atas.
                    </div>
                  </div>
                )}
              </div>

              {/* Expired info & Sandbox simulator */}
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Berlaku hingga:</span>
                  <span className="font-semibold text-rose-600 font-mono">
                    {new Date(activePakasirPayment.expired_at).toLocaleString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Simulated action for sandbox testing */}
                <div className="bg-yellow-50 border border-yellow-200/60 rounded-xl p-2.5 text-[10px] text-yellow-800">
                  <p className="font-bold mb-0.5 flex items-center gap-1">⚡ Simulator Pembayaran Sandbox</p>
                  <p className="mb-1.5 leading-relaxed">Anda dapat mensimulasikan pembayaran selesai secara instan untuk mengetes integrasi Webhook di backend.</p>
                  <button
                    onClick={async () => {
                      try {
                        if (!isSupabaseConfigured) {
                          await db.updateOrderStatus(activePakasirPayment.order_id, 'processing');
                          await refreshOrders();
                          alert('Simulasi pembayaran sukses berhasil (Mode Lokal)! Status pesanan Anda telah diperbarui.');
                        } else {
                          try {
                            const res = await fetch('/api/pakasir/simulate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                order_id: activePakasirPayment.order_id,
                                amount: activePakasirPayment.original_amount || activePakasirPayment.amount
                              })
                            });
                            const text = await res.text();
                            const data = JSON.parse(text);
                            if (data && data.success) {
                              alert('Simulasi pembayaran berhasil dikirim! Silakan klik "Cek Status Pembayaran" atau tunggu beberapa saat agar terverifikasi otomatis.');
                              return;
                            }
                            throw new Error(data.message || 'Server error');
                          } catch (simulateErr) {
                            console.warn('[Server simulation failed, updating Supabase directly client-side]', simulateErr);
                            await db.updateOrderStatus(activePakasirPayment.order_id, 'processing');
                            await refreshOrders();
                            alert('Simulasi pembayaran sukses berhasil (Direct Supabase Fallback)! Status pesanan Anda telah diperbarui.');
                          }
                        }
                      } catch (err: any) {
                        alert('Gagal mengirim simulasi: ' + err.message);
                      }
                    }}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-extrabold py-1 px-2.5 rounded-lg shadow transition cursor-pointer text-center text-[10px]"
                  >
                    Simulasikan Pembayaran Sukses
                  </button>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-150 flex gap-2 shrink-0">
              <button
                onClick={() => setShowPakasirPaymentModal(false)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer text-center text-xs"
              >
                Bayar Nanti
              </button>
              <button
                onClick={async () => {
                  if (currentProfile && activePakasirPayment?.order_id) {
                    let isCompleted = false;
                    // Force a check against the server-side memory cache first to sync state
                    try {
                      const pAmount = activePakasirPayment.original_amount || activePakasirPayment.amount;
                      const completed = await handleCheckPakasirStatus(activePakasirPayment.order_id, pAmount);
                      if (completed) {
                        await db.updateOrderStatus(activePakasirPayment.order_id, 'processing');
                        isCompleted = true;
                      }
                    } catch (statusErr) {
                      console.error('Error syncing status in check click:', statusErr);
                    }

                    await refreshOrders();
                    const currentOrder = userOrders.find((o: any) => o.id === activePakasirPayment.order_id);
                    if (isCompleted || (currentOrder && (currentOrder.status === 'processing' || currentOrder.status === 'shipped' || currentOrder.status === 'completed'))) {
                      setUiMessage({ text: 'Selamat! Pembayaran Anda sebesar Rp ' + Number(activePakasirPayment.total_payment || activePakasirPayment.amount).toLocaleString() + ' telah terverifikasi secara otomatis oleh sistem Pakasir.', type: 'success' });
                      setShowPakasirPaymentModal(false);
                      setActiveTab('pesanan');
                      setTimeout(() => setUiMessage(null), 10000);
                    } else {
                      alert('Status pesanan masih "Pending". Jika Anda baru saja membayar, tunggu beberapa saat lalu coba lagi.');
                    }
                  }
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md shadow-emerald-100 cursor-pointer text-center text-xs"
              >
                Cek Status Pembayaran
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Hideable Mobile Left Navigation Sidebar/Drawer overlay */}
      {showMobileSidebar && (
        <div id="mobile-sidebar-overlay" className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop blur & black screen */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setShowMobileSidebar(false)}
          />

          {/* Drawer body container */}
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-emerald-950 text-white shadow-2xl transition-transform duration-300 transform translate-x-0 overflow-y-auto">
            {/* Header info */}
            <div className="p-4 border-b border-emerald-800 bg-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {appSettings?.logo_url ? (
                  <img
                    src={appSettings.logo_url}
                    alt="Logo"
                    className="w-7 h-7 object-cover rounded-md bg-white border border-emerald-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-7 h-7 bg-white rounded-md flex items-center justify-center text-emerald-800 font-bold text-sm">
                    PT
                  </span>
                )}
                <span className="font-extrabold text-xs tracking-tight truncate max-w-[170px]">
                  {appSettings?.app_name || 'PASAR UMKM'}
                </span>
              </div>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-1 hover:bg-emerald-805/65 rounded-lg text-emerald-100 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items block */}
            <div className="p-4 flex-1 space-y-5">
              
              {/* Core App Navigation list */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 font-mono mb-2">Menu Utama</p>
                
                <button
                  onClick={() => {
                    setActiveTab('katalog');
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'katalog' 
                      ? 'bg-emerald-800 text-amber-300 border border-emerald-700/65' 
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-900/50'
                  }`}
                >
                  <Store className="w-4 h-4 shrink-0" />
                  Katalog Produk
                </button>

                <button
                  onClick={() => {
                    setActiveTab('tentang');
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'tentang' 
                      ? 'bg-emerald-800 text-amber-300 border border-emerald-700/65' 
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-900/50'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0" />
                  Tentang UMKM
                </button>

                <a
                  href="https://gemini.google.com/share/3ab7daa6e259"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowMobileSidebar(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-amber-300 hover:text-white hover:bg-emerald-900/50"
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                  AI TOOL
                </a>

                {currentProfile && currentProfile.role === 'vendor' && (
                  <button
                    onClick={() => {
                      setActiveTab('vendor');
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeTab === 'vendor' 
                        ? 'bg-emerald-800 text-amber-300 border border-emerald-700/65' 
                        : 'text-emerald-100 hover:text-white hover:bg-emerald-900/50'
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0 text-emerald-300" />
                    Dasbor Vendor
                  </button>
                )}

                {currentProfile && currentProfile.role === 'admin' && (
                  <button
                    onClick={() => {
                      setActiveTab('admin');
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeTab === 'admin' 
                        ? 'bg-amber-400 text-emerald-950 font-bold' 
                        : 'text-emerald-100 hover:text-white hover:bg-emerald-900/50'
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    Panel Admin
                  </button>
                )}

                {currentProfile && (
                  <button
                    onClick={() => {
                      setActiveTab('pesanan');
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeTab === 'pesanan' 
                        ? 'bg-emerald-800 text-amber-300 border border-emerald-700/65' 
                        : 'text-emerald-100 hover:text-white hover:bg-emerald-900/50'
                    }`}
                  >
                    <Clipboard className="w-4 h-4 shrink-0" />
                    Belanja Saya ({userOrders.length})
                  </button>
                )}

                {currentProfile && (currentProfile.role === 'vendor' || currentProfile.role === 'admin') && (
                  <button
                    onClick={() => {
                      setActiveTab('transaksi-pesanan');
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      activeTab === 'transaksi-pesanan' 
                        ? 'bg-emerald-800 text-amber-300 border border-emerald-700/65' 
                        : 'text-emerald-100 hover:text-white hover:bg-emerald-900/50'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 shrink-0 text-amber-300" />
                    Pesanan Masuk ({vendorOrders.length})
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab('profil');
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'profil' 
                      ? 'bg-emerald-800 text-amber-300 border border-emerald-700/65' 
                      : 'text-emerald-100 hover:text-white hover:bg-emerald-900/50'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  Profil & Alamat
                </button>
              </div>

              {/* Horizontal Divider */}
              <div className="border-t border-emerald-850 my-1" />

              {/* Requirement #1: Category list menu integration */}
              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 font-mono mb-2">Kategori Produk</p>
                <div className="space-y-0.5 max-h-[220px] overflow-y-auto pr-1">
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setActiveTab('katalog');
                        setShowMobileSidebar(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition ${
                        selectedCategory === cat 
                          ? 'bg-emerald-800 text-amber-300 font-bold' 
                          : 'text-emerald-250 hover:text-white hover:bg-emerald-900/40'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Auth/Profile Footer section inside drawer */}
            <div className="p-4 border-t border-emerald-850 bg-emerald-900/60 block">
              {currentProfile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-850 flex items-center justify-center text-xs font-bold border border-emerald-750">
                      {currentProfile.name ? currentProfile.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{currentProfile.name}</p>
                      <p className="text-[9px] text-emerald-300 truncate font-mono">{currentProfile.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowMobileSidebar(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-950/40 hover:bg-red-900/30 text-red-200 hover:text-red-100 border border-red-900/30 rounded-xl text-[11px] font-semibold transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Keluar Sesi
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthError('');
                    setShowLoginModal(true);
                    setShowMobileSidebar(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  <LogIn className="w-4 h-4" /> Masuk / Daftar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentProfile={currentProfile}
        ordersCount={userOrders.length}
      />

      {/* MODAL: BinderByte Tracking Details */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-emerald-100">
            {/* Modal Header */}
            <div className="p-4 bg-emerald-950 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm font-display tracking-tight">Status Pengiriman Nasional</h3>
                  <p className="text-[10px] text-emerald-300 font-mono">Resi: {trackingAwb} ({trackingCourier.toUpperCase()})</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowTrackingModal(false); setTrackingResult(null); setTrackingError(''); }} 
                className="p-1 hover:bg-white/10 rounded-lg text-emerald-200 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {trackingLoading && (
                <div className="text-center py-10 space-y-3">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 font-medium">Menghubungi API Gateway BinderByte...</p>
                  <p className="text-[10px] text-gray-400">Sedang melacak status pengiriman live</p>
                </div>
              )}

              {trackingError && (
                <div className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-200 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" /> Gagal Melacak Resi
                  </p>
                  <p className="text-[11px] leading-relaxed">{trackingError}</p>
                </div>
              )}

              {trackingResult && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-emerald-800 uppercase font-mono font-bold tracking-wider">Status Terakhir</p>
                      <h4 className="font-bold text-emerald-950 text-sm">
                        {trackingResult.summary?.status || 'Sedang Diproses'}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-mono">Update: {trackingResult.summary?.date || '-'}</p>
                    </div>

                    <span className={`px-3 py-1.5 rounded-full font-bold text-[10px] tracking-wide ${
                      String(trackingResult.summary?.status).toLowerCase().includes('deliv') || 
                      String(trackingResult.summary?.status).toLowerCase().includes('terima')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {String(trackingResult.summary?.status || 'ON PROCESS').toUpperCase()}
                    </span>
                  </div>

                  {/* Detail Panel */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono uppercase font-bold">PENGIRIM</p>
                      <p className="font-bold text-slate-800 mt-0.5">{trackingResult.detail?.shipper || 'Vendor Tegalsari'}</p>
                      <p className="text-[10px] text-slate-500">{trackingResult.detail?.origin || 'Banyuwangi'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono uppercase font-bold">PENERIMA</p>
                      <p className="font-bold text-slate-800 mt-0.5">{trackingResult.detail?.receiver || 'Warga / Pembeli'}</p>
                      <p className="text-[10px] text-slate-500">{trackingResult.detail?.destination || '-'}</p>
                    </div>
                  </div>

                  {/* History / Timeline */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Riwayat Perjalanan Paket (Timeline)</p>
                    
                    {(!trackingResult.history || trackingResult.history.length === 0) ? (
                      <p className="text-gray-400 italic text-center py-4">Belum ada riwayat update perjalanan paket.</p>
                    ) : (
                      <div className="relative border-l border-slate-200 pl-4 ml-1.5 space-y-4 py-1">
                        {trackingResult.history.map((hist: any, index: number) => {
                          const isNewest = index === 0;
                          return (
                            <div key={index} className="relative">
                              {/* Indicator Dot */}
                              <div className={`absolute -left-[21px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                                isNewest 
                                  ? 'border-emerald-600 ring-2 ring-emerald-100' 
                                  : 'border-slate-300'
                              }`} />
                              
                              <div className="space-y-0.5">
                                <span className={`text-[10px] font-mono font-bold ${isNewest ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}`}>
                                  {hist.date}
                                </span>
                                <p className={`text-[11.5px] leading-relaxed ${isNewest ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                                  {hist.desc}
                                </p>
                                {hist.location && (
                                  <p className="text-[10px] text-slate-500 font-mono">📍 {hist.location}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => { setShowTrackingModal(false); setTrackingResult(null); setTrackingError(''); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup Pelacakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Floating Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white border border-emerald-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 z-50 flex flex-col gap-3 backdrop-blur-md bg-white/95">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0 font-bold text-lg shadow-md border border-emerald-500">
              {appSettings?.logo_url ? (
                <img
                  src={appSettings.logo_url}
                  alt={appSettings.app_name || 'Logo'}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                'PT'
              )}
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <h4 className="font-extrabold text-xs text-slate-900 leading-tight">Pasang Aplikasi Pasar Tegalsari</h4>
              <p className="text-[10.5px] text-slate-500 leading-relaxed">
                {!deferredPrompt && /iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                  <>
                    Tekan tombol <span className="inline-flex items-center align-middle mx-0.5 px-1 py-0.5 bg-gray-100 rounded text-slate-700 font-bold"><Share2 className="w-3 h-3" /> Bagikan (Share)</span> di bagian bawah Safari, lalu pilih <span className="font-bold text-emerald-700">Tambahkan ke Layar Utama (Add to Home Screen)</span>.
                  </>
                ) : (
                  "Belanja lebih cepat, hemat kuota, dan langsung buka dari layar handphone Anda!"
                )}
              </p>
            </div>
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowInstallBanner(false)}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition text-center"
            >
              Nanti Saja
            </button>
            {deferredPrompt ? (
              <button
                onClick={handleInstallPWA}
                className="flex-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                Pasang Sekarang
              </button>
            ) : (
              <button
                onClick={() => setShowInstallBanner(false)}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition text-center"
              >
                Saya Mengerti
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
