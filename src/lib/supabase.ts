/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { UserProfile, Vendor, Product, Courier, AffiliateRelation, CommissionSetting, Order, AppSetting, BalanceTransaction, WithdrawalRequest } from '../types';

// Read config from Vite environment variables
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Detect if Supabase is properly configured
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Initialize Supabase Client (if keys are available)
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

console.log(
  isSupabaseConfigured
    ? '✅ Bersambung ke database Supabase!'
    : '⚠️ Supabase belum dikonfigurasi. Menggunakan penyimpanan lokal (LocalStorage Mode) untuk demo.'
);

// --- INITIAL DATA FOR OFFLINE / LOCALSTORAGE MODE ---
const INITIAL_SETTINGS: AppSetting = {
  id: 'global_settings',
  app_name: 'PASAR UMKM TEGALSARI',
  logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
  banner_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
  contact_phone: '6281234567890',
  website_mode: 'active',
  announcement: 'Selamat datang di Pasar UMKM Tegalsari! Dukung perekonomian lokal desa kita.',
  about_us: 'Pasar UMKM Tegalsari adalah wadah marketplace lokal mandiri untuk para UMKM di tingkat Desa dan Kelurahan di wilayah Kecamatan Tegalsari, Kabupaten Banyuwangi. Kami mendukung pengiriman mandiri oleh kurir vendor dengan titik koordinat maps, serta sistem keagenan affiliator lokal untuk memperluas jangkauan pasar produk lokal.',
  carousel_badge_text: 'Gerakan Beli Karya Tetangga',
  carousel_badge_url: '',
  categories: ['Makanan Ringan', 'Minuman Tradisional', 'Batik & Sandang', 'Kesehatan & Herbal', 'Sembako & Hasil Bumi', 'Kerajinan Tangan'],
  pakasir_enabled: false,
  pakasir_api_key: '',
  pakasir_merchant_id: '',
  google_maps_enabled: true,
  google_maps_api_key: '',
  payment_methods: ['COD', 'Pakasir QRIS', 'Transfer Bank Local'],
  shipping_methods: '["Kurir Mandiri Vendor", "Ambil Sendiri ke Toko"]',
  banner_duration: 3000,
  admin_commission_percent: 5,
  admin_commission_flat: 0,
  banners: [
    {
      id: 'banner_1',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
      text: 'Selamat Datang di Pasar UMKM Tegalsari',
      subtitle: 'Nikmati produk berkualitas langsung dari pelaku usaha mikro di dukuh terdekat.',
      link_url: '',
      status: 'active'
    },
    {
      id: 'banner_2',
      image_url: 'https://images.unsplash.com/photo-1488459718432-36fa50eec7a7?auto=format&fit=crop&q=80&w=1200',
      text: 'Produk Segar Langsung Dari Petani & Pengrajin Dukuh Kita',
      subtitle: 'Beli keripik renyah, madu hutan burni, kue basah beryodium, & kerajinan lokal tanpa perantara.',
      link_url: '',
      status: 'active'
    }
  ],
  membership_settings: {
    free: { price: 0, max_products: 5, name: 'FREE' },
    premium: { price: 50000, max_products: 25, name: 'PREMIUM' },
    vip: { price: 150000, max_products: 1000, name: 'VIP' }
  },
  right_banner_duration: 3000,
  right_banners: [
    {
      id: 'rb_1',
      media_url: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&q=80&w=600',
      media_type: 'image',
      title: 'Promo Karya Tetangga',
      subtitle: 'Dukung pertumbuhan ekonomi kreatif lokal Kecamatan Tegalsari hari ini.',
      link_url: '',
      badge_text: 'PROMO TERBATAS',
      status: 'active'
    }
  ]
};

const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'admin_user',
    email: 'admin@tegalsari.id',
    role: 'admin',
    name: 'Administrator Tegalsari',
    phone: '6281234567890',
    address: 'Kantor Kecamatan Tegalsari, Jl. Raya Tegalsari No.1',
    kecamatan: 'Tegalsari',
    village: 'Tegalsari',
    latitude: -8.4357,
    longitude: 114.1293,
    created_at: new Date().toISOString()
  },
  {
    id: 'vendor_siti',
    email: 'siti@kripik.com',
    role: 'vendor',
    name: 'Ibu Siti Khodijah',
    phone: '6285233114455',
    address: 'Dusung Krajan, RT 02 RW 01',
    kecamatan: 'Tegalsari',
    village: 'Karangdoro',
    latitude: -8.4521,
    longitude: 114.1415,
    created_at: new Date().toISOString()
  },
  {
    id: 'vendor_budi',
    email: 'budi@madu.com',
    role: 'vendor',
    name: 'Pak Budi Waluyo',
    phone: '6281122334455',
    address: 'Jl. Melati No. 12, Lingkungan Tamansari',
    kecamatan: 'Tegalsari',
    village: 'Dasri',
    latitude: -8.4215,
    longitude: 114.1192,
    created_at: new Date().toISOString()
  },
  {
    id: 'buyer_ani',
    email: 'ani@gmail.com',
    role: 'buyer',
    name: 'Ani Setyowati',
    phone: '6289988776655',
    address: 'Perumahan Tegalsari Indah Blok B-05',
    kecamatan: 'Tegalsari',
    village: 'Tegalsari',
    latitude: -8.4394,
    longitude: 114.1351,
    created_at: new Date().toISOString()
  }
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vendor_siti',
    business_name: 'Kripik Renyah Bu Siti',
    logo_url: 'https://images.unsplash.com/photo-1566478431375-738563a568b5?auto=format&fit=crop&q=80&w=200',
    banner_url: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=800',
    description: 'Produsen camilan kripik singkong, kripik pisang, dan rengginang rumahan yang renyah dan gurih asli resep leluhur Tegalsari.',
    address: 'Dusun Krajan, Desa Karangdoro',
    kecamatan: 'Tegalsari',
    village: 'Karangdoro',
    phone: '6285233114455',
    bank_name: 'Bank Jatim',
    bank_account_number: '0153344556',
    bank_account_name: 'Siti Khodijah',
    status: 'approved',
    created_at: new Date().toISOString()
  },
  {
    id: 'vendor_budi',
    business_name: 'Madu Rimba Lestari',
    logo_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=200',
    banner_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800',
    description: 'Madu hutan murni alam Tegalsari, dipanen langsung secara tradisional dan higienis. Menjaga imunitas seluruh keluarga lokal.',
    address: 'Lingkungan Tamansari, Desa Dasri',
    kecamatan: 'Tegalsari',
    village: 'Dasri',
    phone: '6281122334455',
    bank_name: 'BRI',
    bank_account_number: '601201014499532',
    bank_account_name: 'Budi Waluyo',
    status: 'approved',
    created_at: new Date().toISOString()
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_kripik_singkong',
    vendor_id: 'vendor_siti',
    name: 'Kripik Singkong Gurih Berkah',
    image_url: 'https://images.unsplash.com/photo-1566478431375-738563a568b5?auto=format&fit=crop&q=80&w=500',
    brand: 'Bu Siti',
    variants: ['Original', 'Pedas Manis', 'Asin Keju'],
    price: 15000,
    discount_price: 12000,
    weight: 250,
    description: 'Dibuat dari singkong pilihan hasil kebun petani mitra di Desa Karangdoro. Diiris tipis, digoreng dengan minyak kelapa berkualitas, tanpa bahan pengawet buatan.',
    pirt: 'P-IRT No. 2063510010243-26',
    pkrt: '-',
    bpom: '-',
    category: 'Makanan Ringan',
    stock: 50,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod_kripik_pisang',
    vendor_id: 'vendor_siti',
    name: 'Kripik Pisang Cokelat Lumer',
    image_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=500',
    brand: 'Bu Siti',
    variants: ['Cokelat', 'Susu', 'Caramel'],
    price: 18000,
    discount_price: 15000,
    weight: 200,
    description: 'Kripik pisang kepok lokal dibalut bubuk cokelat premium lumer di mulut. Camilan favorit anak-anak dan dewasa.',
    pirt: 'P-IRT No. 2063510010244-26',
    pkrt: '-',
    bpom: '-',
    category: 'Makanan Ringan',
    stock: 30,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod_madu_asli',
    vendor_id: 'vendor_budi',
    name: 'Madu Kaliandra Organik Murni',
    image_url: 'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&q=80&w=500',
    brand: 'Rimba Lestari',
    variants: ['Botol 250ml', 'Botol 500ml'],
    price: 90000,
    discount_price: 85000,
    weight: 400,
    description: 'Madu nektar bunga kaliandra murni tanpa pemanasan atau pasteurisasi. Kaya akan enzim alami berkualitas tinggi untuk kesehatan pencernaan.',
    pirt: '-',
    pkrt: '-',
    bpom: 'BPOM RI MD 252113002241',
    category: 'Kesehatan & Herbal',
    stock: 20,
    created_at: new Date().toISOString()
  }
];

const INITIAL_COURIERS: Courier[] = [
  {
    id: 'cour_siti_1',
    vendor_id: 'vendor_siti',
    name: 'Kang Slamet',
    phone: '628522334411',
    vehicle_type: 'Motor',
    price_per_km: 2000,
    base_fare: 5000,
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'cour_budi_1',
    vendor_id: 'vendor_budi',
    name: 'Mas Joko Cargo',
    phone: '62811442233',
    vehicle_type: 'Motor',
    price_per_km: 1500,
    base_fare: 6000,
    status: 'active',
    created_at: new Date().toISOString()
  }
];

const INITIAL_AFFILIATES: AffiliateRelation[] = [
  {
    id: 'aff_siti_budi',
    affiliator_vendor_id: 'vendor_budi', // Pak Budi promotes Bu Siti's products
    owner_vendor_id: 'vendor_siti',
    status: 'approved',
    created_at: new Date().toISOString()
  }
];

const INITIAL_COMMISSIONS: CommissionSetting[] = [
  {
    id: 'com_siti_all',
    vendor_id: 'vendor_siti',
    product_id: null, // applies to all
    commission_percentage: 10, // 10% affiliate commission
    created_at: new Date().toISOString()
  }
];

// Helper to initialize local storage tables if not exist
const initLocalStorageDB = () => {
  if (!localStorage.getItem('umkm_settings')) {
    localStorage.setItem('umkm_settings', JSON.stringify(INITIAL_SETTINGS));
  }
  if (!localStorage.getItem('umkm_profiles')) {
    localStorage.setItem('umkm_profiles', JSON.stringify(INITIAL_PROFILES));
  }
  if (!localStorage.getItem('umkm_vendors')) {
    localStorage.setItem('umkm_vendors', JSON.stringify(INITIAL_VENDORS));
  }
  if (!localStorage.getItem('umkm_products')) {
    localStorage.setItem('umkm_products', JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem('umkm_couriers')) {
    localStorage.setItem('umkm_couriers', JSON.stringify(INITIAL_COURIERS));
  }
  if (!localStorage.getItem('umkm_affiliates')) {
    localStorage.setItem('umkm_affiliates', JSON.stringify(INITIAL_AFFILIATES));
  }
  if (!localStorage.getItem('umkm_commissions')) {
    localStorage.setItem('umkm_commissions', JSON.stringify(INITIAL_COMMISSIONS));
  }
  if (!localStorage.getItem('umkm_orders')) {
    localStorage.setItem('umkm_orders', JSON.stringify([]));
  }
};

initLocalStorageDB();

// Global runtime memory session
let currentUserSession: UserProfile | null = (() => {
  const session = localStorage.getItem('umkm_session');
  return session ? JSON.parse(session) : null;
})();

const getLocalData = <T>(key: string): T[] => {
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const setLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- DATA ACCESS STRATEGY IMPLEMENTATION ---

export const db = {
  // === AUTHENTICATION ===
  async signUp(email: string, role: 'buyer' | 'vendor' | 'admin', name: string, phone: string, address: string, kecamatan: string, village: string, lat: number | null, lng: number | null) {
    if (isSupabaseConfigured && supabase) {
      // In a real production app we would use Supabase auth.signUp plus inserting into the profile.
      // To keep it simple and ultra-reliable, we mock authentication over the Supabase data services
      // by inserting directly into the 'profiles' table. Below is a bulletproof RPC / Table Insert pattern!
      const id = 'user_' + Math.random().toString(36).substr(2, 9);
      const newProfile: UserProfile = {
        id,
        email,
        role,
        name,
        phone,
        address,
        kecamatan,
        village,
        latitude: lat,
        longitude: lng,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').insert([newProfile]);
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }
      currentUserSession = newProfile;
      localStorage.setItem('umkm_session', JSON.stringify(newProfile));
      return newProfile;
    } else {
      // Local storage path
      const profiles = getLocalData<UserProfile>('umkm_profiles');
      if (profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email ini sudah pernah terdaftar!');
      }
      const id = 'user_' + Math.random().toString(36).substr(2, 9);
      const newProfile: UserProfile = {
        id,
        email,
        role,
        name,
        phone,
        address,
        kecamatan,
        village,
        latitude: lat,
        longitude: lng,
        created_at: new Date().toISOString()
      };
      profiles.push(newProfile);
      setLocalData('umkm_profiles', profiles);
      currentUserSession = newProfile;
      localStorage.setItem('umkm_session', JSON.stringify(newProfile));
      return newProfile;
    }
  },

  async signIn(email: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Email tidak ditemukan! Silakan daftar terlebih dahulu.');

      currentUserSession = data as UserProfile;
      localStorage.setItem('umkm_session', JSON.stringify(data));
      return data as UserProfile;
    } else {
      // Local storage path
      const profiles = getLocalData<UserProfile>('umkm_profiles');
      const profile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (!profile) {
        throw new Error('Email tidak ditemukan! Silakan daftar terlebih dahulu.');
      }
      currentUserSession = profile;
      localStorage.setItem('umkm_session', JSON.stringify(profile));
      return profile;
    }
  },

  getCurrentUser(): UserProfile | null {
    return currentUserSession;
  },

  signOut() {
    currentUserSession = null;
    localStorage.removeItem('umkm_session');
  },

  async updateProfile(id: string, updates: Partial<UserProfile>) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (currentUserSession?.id === id) {
        currentUserSession = { ...currentUserSession, ...data };
        localStorage.setItem('umkm_session', JSON.stringify(currentUserSession));
      }
      return data as UserProfile;
    } else {
      const profiles = getLocalData<UserProfile>('umkm_profiles');
      const index = profiles.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Profil tidak ditemukan!');
      profiles[index] = { ...profiles[index], ...updates };
      setLocalData('umkm_profiles', profiles);

      if (currentUserSession?.id === id) {
        currentUserSession = profiles[index];
        localStorage.setItem('umkm_session', JSON.stringify(currentUserSession));
      }
      return profiles[index];
    }
  },

  // === VENDORS ===
  parseVendorKtp(v: any): Vendor {
    if (!v) return v;
    let ktp_url = v.ktp_url || '';
    let membership_tier = v.membership_tier || 'FREE';
    let description = v.description || '';
    let rajaongkir_enabled = v.rajaongkir_enabled !== undefined ? !!v.rajaongkir_enabled : false;
    let rajaongkir_couriers = v.rajaongkir_couriers || ['jne', 'pos', 'tiki'];
    let rajaongkir_origin_id = v.rajaongkir_origin_id || '';
    let rajaongkir_origin_name = v.rajaongkir_origin_name || '';
    let shipping_engine: 'binderbyte' | 'smartengine' = v.shipping_engine || 'smartengine';
    let payment_methods: string[] = v.payment_methods || ['COD', 'Pakasir QRIS', 'Transfer Bank Local'];
    let memb_pay_method: 'pakasir' | 'transfer_manual' | undefined = v.memb_pay_method || undefined;
    let memb_pay_status: 'unpaid' | 'paid' | 'pending' | undefined = v.memb_pay_status || undefined;
    let memb_pay_proof: string | undefined = v.memb_pay_proof || undefined;

    if (!ktp_url && description.includes('[KTP_URL:')) {
      const match = description.match(/\[KTP_URL:\s*([^\]]*)\s*\]/);
      if (match) {
        ktp_url = match[1];
        description = description.replace(/\s*\[KTP_URL:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[MEMB_PAY_METHOD:')) {
      const match = description.match(/\[MEMB_PAY_METHOD:\s*([^\]]*)\s*\]/);
      if (match) {
        memb_pay_method = match[1].trim() as any;
        description = description.replace(/\s*\[MEMB_PAY_METHOD:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[MEMB_PAY_STATUS:')) {
      const match = description.match(/\[MEMB_PAY_STATUS:\s*([^\]]*)\s*\]/);
      if (match) {
        memb_pay_status = match[1].trim() as any;
        description = description.replace(/\s*\[MEMB_PAY_STATUS:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[MEMB_PAY_PROOF:')) {
      const match = description.match(/\[MEMB_PAY_PROOF:\s*([^\]]*)\s*\]/);
      if (match) {
        memb_pay_proof = match[1].trim();
        description = description.replace(/\s*\[MEMB_PAY_PROOF:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[PAYMENT_METHODS:')) {
      const match = description.match(/\[PAYMENT_METHODS:\s*([^\]]*)\s*\]/);
      if (match) {
        payment_methods = match[1].split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        description = description.replace(/\s*\[PAYMENT_METHODS:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[MEMBERSHIP:')) {
      const match = description.match(/\[MEMBERSHIP:\s*([^\]]*)\s*\]/);
      if (match) {
        membership_tier = match[1].trim() as any;
        description = description.replace(/\s*\[MEMBERSHIP:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[RAJAONGKIR_ENABLED:')) {
      const match = description.match(/\[RAJAONGKIR_ENABLED:\s*([^\]]*)\s*\]/);
      if (match) {
        rajaongkir_enabled = match[1].trim() === 'true';
        description = description.replace(/\s*\[RAJAONGKIR_ENABLED:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[RAJAONGKIR_COURIERS:')) {
      const match = description.match(/\[RAJAONGKIR_COURIERS:\s*([^\]]*)\s*\]/);
      if (match) {
        rajaongkir_couriers = match[1].split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0);
        description = description.replace(/\s*\[RAJAONGKIR_COURIERS:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[RAJAONGKIR_ORIGIN_ID:')) {
      const match = description.match(/\[RAJAONGKIR_ORIGIN_ID:\s*([^\]]*)\s*\]/);
      if (match) {
        rajaongkir_origin_id = match[1].trim();
        description = description.replace(/\s*\[RAJAONGKIR_ORIGIN_ID:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[RAJAONGKIR_ORIGIN_NAME:')) {
      const match = description.match(/\[RAJAONGKIR_ORIGIN_NAME:\s*([^\]]*)\s*\]/);
      if (match) {
        rajaongkir_origin_name = match[1].trim();
        description = description.replace(/\s*\[RAJAONGKIR_ORIGIN_NAME:\s*[^\]]*\s*\]/, '');
      }
    }
    if (description.includes('[SHIPPING_ENGINE:')) {
      const match = description.match(/\[SHIPPING_ENGINE:\s*([^\]]*)\s*\]/);
      if (match) {
        shipping_engine = match[1].trim() as any;
        description = description.replace(/\s*\[SHIPPING_ENGINE:\s*[^\]]*\s*\]/, '');
      }
    }
    return {
      ...v,
      ktp_url,
      description: description.trim(),
      membership_tier,
      rajaongkir_enabled,
      rajaongkir_couriers,
      rajaongkir_origin_id,
      rajaongkir_origin_name,
      shipping_engine,
      payment_methods,
      memb_pay_method,
      memb_pay_status,
      memb_pay_proof
    };
  },

  parseAppSettings(settings: any): AppSetting {
    if (!settings) return INITIAL_SETTINGS;
    
    let parsedSettings = { ...INITIAL_SETTINGS, ...settings };
    let aboutUs = settings.about_us || '';
    
    // Check if about_us has the [METADATA_JSON: ...] tag
    const tagStartIndex = aboutUs.lastIndexOf('[METADATA_JSON:');
    if (tagStartIndex !== -1) {
      const tagContentStart = tagStartIndex + '[METADATA_JSON:'.length;
      const lastBracketIndex = aboutUs.lastIndexOf(']');
      if (lastBracketIndex > tagContentStart) {
        const jsonStr = aboutUs.substring(tagContentStart, lastBracketIndex).trim();
        try {
          const extra = JSON.parse(jsonStr);
          parsedSettings = {
            ...parsedSettings,
            ...extra
          };
          // Remove the tag from about_us for user-facing displays
          parsedSettings.about_us = aboutUs.substring(0, tagStartIndex).trim();
        } catch (e) {
          console.error('Failed to parse app settings metadata JSON', e, jsonStr);
        }
      }
    }
    
    return parsedSettings as AppSetting;
  },

  async getVendors() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('vendors').select('*');
      if (error) throw new Error(error.message);
      return (data || []).map(v => this.parseVendorKtp(v));
    } else {
      return getLocalData<Vendor>('umkm_vendors');
    }
  },

  async getApprovedVendors() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('vendors').select('*').eq('status', 'approved');
      if (error) throw new Error(error.message);
      return (data || []).map(v => this.parseVendorKtp(v));
    } else {
      return getLocalData<Vendor>('umkm_vendors').filter(v => v.status === 'approved');
    }
  },

  async getVendor(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('vendors').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? this.parseVendorKtp(data) : null;
    } else {
      return getLocalData<Vendor>('umkm_vendors').find(v => v.id === id) || null;
    }
  },

  async registerVendor(vendorData: Omit<Vendor, 'created_at'>) {
    const newVendor: Vendor = {
      ...vendorData,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('vendors').upsert([newVendor]);
        if (error) {
          if (error.message?.includes('ktp_url') || error.message?.includes('membership_tier') || error.message?.includes('rajaongkir_') || error.message?.includes('payment_methods') || error.message?.includes('column') || error.code === 'PGRST104' || error.message?.includes('memb_pay')) {
            const { ktp_url, membership_tier, rajaongkir_enabled, rajaongkir_couriers, payment_methods, memb_pay_method, memb_pay_status, memb_pay_proof, ...rest } = newVendor;
            const updatedDescription = `${rest.description || ''}\n\n[KTP_URL: ${ktp_url || ''}]\n[MEMBERSHIP: ${membership_tier || 'FREE'}]\n[RAJAONGKIR_ENABLED: ${rajaongkir_enabled ?? false}]\n[RAJAONGKIR_COURIERS: ${(rajaongkir_couriers || []).join(',')}]\n[PAYMENT_METHODS: ${(payment_methods || ['COD', 'Pakasir QRIS', 'Transfer Bank Local']).join(',')}]\n[MEMB_PAY_METHOD: ${memb_pay_method || ''}]\n[MEMB_PAY_STATUS: ${memb_pay_status || 'unpaid'}]\n[MEMB_PAY_PROOF: ${memb_pay_proof || ''}]`;
            const retryPayload = {
              ...rest,
              description: updatedDescription
            };
            const { error: retryError } = await supabase.from('vendors').upsert([retryPayload]);
            if (retryError) throw new Error(retryError.message);
            return newVendor;
          }
          throw new Error(error.message);
        }
        return newVendor;
      } catch (err: any) {
        if (err.message?.includes('ktp_url') || err.message?.includes('membership_tier') || err.message?.includes('rajaongkir_') || err.message?.includes('payment_methods') || err.message?.includes('column') || err.message?.includes('memb_pay')) {
          const { ktp_url, membership_tier, rajaongkir_enabled, rajaongkir_couriers, payment_methods, memb_pay_method, memb_pay_status, memb_pay_proof, ...rest } = newVendor;
          const updatedDescription = `${rest.description || ''}\n\n[KTP_URL: ${ktp_url || ''}]\n[MEMBERSHIP: ${membership_tier || 'FREE'}]\n[RAJAONGKIR_ENABLED: ${rajaongkir_enabled ?? false}]\n[RAJAONGKIR_COURIERS: ${(rajaongkir_couriers || []).join(',')}]\n[PAYMENT_METHODS: ${(payment_methods || ['COD', 'Pakasir QRIS', 'Transfer Bank Local']).join(',')}]\n[MEMB_PAY_METHOD: ${memb_pay_method || ''}]\n[MEMB_PAY_STATUS: ${memb_pay_status || 'unpaid'}]\n[MEMB_PAY_PROOF: ${memb_pay_proof || ''}]`;
          const retryPayload = {
            ...rest,
            description: updatedDescription
          };
          const { error: retryError } = await supabase.from('vendors').upsert([retryPayload]);
          if (retryError) throw new Error(retryError.message);
          return newVendor;
        }
        throw err;
      }
    } else {
      const vendors = getLocalData<Vendor>('umkm_vendors');
      const idx = vendors.findIndex(v => v.id === newVendor.id);
      if (idx !== -1) {
        vendors[idx] = newVendor;
      } else {
        vendors.push(newVendor);
      }
      setLocalData('umkm_vendors', vendors);
      return newVendor;
    }
  },

  async updateVendorStatus(id: string, status: 'approved' | 'rejected') {
    if (isSupabaseConfigured && supabase) {
      // Update both vendor and user profiles
      const { error: err1 } = await supabase.from('vendors').update({ status }).eq('id', id);
      if (err1) throw new Error(err1.message);

      if (status === 'approved') {
        const { error: err2 } = await supabase.from('profiles').update({ role: 'vendor' }).eq('id', id);
        if (err2) throw new Error(err2.message);
      }
      return true;
    } else {
      const vendors = getLocalData<Vendor>('umkm_vendors');
      const vIdx = vendors.findIndex(v => v.id === id);
      if (vIdx !== -1) {
        vendors[vIdx].status = status;
        setLocalData('umkm_vendors', vendors);
      }

      const profiles = getLocalData<UserProfile>('umkm_profiles');
      const pIdx = profiles.findIndex(p => p.id === id);
      if (pIdx !== -1 && status === 'approved') {
        profiles[pIdx].role = 'vendor';
        setLocalData('umkm_profiles', profiles);
        if (currentUserSession?.id === id) {
          currentUserSession.role = 'vendor';
          localStorage.setItem('umkm_session', JSON.stringify(currentUserSession));
        }
      }
      return true;
    }
  },

  async updateVendor(id: string, updates: Partial<Vendor>) {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch current vendor so we can do a proper merge
        const currentParsed = await this.getVendor(id);
        const merged = currentParsed ? { ...currentParsed, ...updates } : updates;

        const { data, error } = await supabase
          .from('vendors')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) {
          if (error.message?.includes('ktp_url') || error.message?.includes('membership_tier') || error.message?.includes('rajaongkir_') || error.message?.includes('shipping_engine') || error.message?.includes('payment_methods') || error.message?.includes('column') || error.code === 'PGRST104' || error.message?.includes('memb_pay')) {
            const { ktp_url, membership_tier, rajaongkir_enabled, rajaongkir_couriers, rajaongkir_origin_id, rajaongkir_origin_name, rajaongkir_origin_province_id, rajaongkir_origin_province_name, rajaongkir_origin_district_id, rajaongkir_origin_district_name, shipping_engine, payment_methods, memb_pay_method, memb_pay_status, memb_pay_proof, ...rest } = updates;
            let finalRest = { ...rest };
            
            const ktpVal = merged.ktp_url || '';
            const membVal = merged.membership_tier || 'FREE';
            const roEnabled = merged.rajaongkir_enabled !== undefined ? !!merged.rajaongkir_enabled : false;
            const roCouriers = (merged.rajaongkir_couriers || ['jne', 'pos', 'tiki']).join(',');
            const roOriginId = merged.rajaongkir_origin_id || '';
            const roOriginName = merged.rajaongkir_origin_name || '';
            const roProvinceId = merged.rajaongkir_origin_province_id || '';
            const roProvinceName = merged.rajaongkir_origin_province_name || '';
            const roDistrictId = merged.rajaongkir_origin_district_id || '';
            const roDistrictName = merged.rajaongkir_origin_district_name || '';
            const engineVal = merged.shipping_engine || 'smartengine';
            const pmVal = (merged.payment_methods || ['COD', 'Pakasir QRIS', 'Transfer Bank Local']).join(',');
            
            const mpmVal = merged.memb_pay_method || '';
            const mpsVal = merged.memb_pay_status || 'unpaid';
            const mppVal = merged.memb_pay_proof || '';
            
            const cleanDesc = (merged.description || '').trim();
            finalRest.description = `${cleanDesc}\n\n[KTP_URL: ${ktpVal}]\n[MEMBERSHIP: ${membVal}]\n[RAJAONGKIR_ENABLED: ${roEnabled}]\n[RAJAONGKIR_COURIERS: ${roCouriers}]\n[RAJAONGKIR_ORIGIN_ID: ${roOriginId}]\n[RAJAONGKIR_ORIGIN_NAME: ${roOriginName}]\n[RAJAONGKIR_PROVINCE_ID: ${roProvinceId}]\n[RAJAONGKIR_PROVINCE_NAME: ${roProvinceName}]\n[RAJAONGKIR_DISTRICT_ID: ${roDistrictId}]\n[RAJAONGKIR_DISTRICT_NAME: ${roDistrictName}]\n[SHIPPING_ENGINE: ${engineVal}]\n[PAYMENT_METHODS: ${pmVal}]\n[MEMB_PAY_METHOD: ${mpmVal}]\n[MEMB_PAY_STATUS: ${mpsVal}]\n[MEMB_PAY_PROOF: ${mppVal}]`.trim();

            const { data: retryData, error: retryError } = await supabase
              .from('vendors')
              .update(finalRest)
              .eq('id', id)
              .select()
              .single();
            if (retryError) throw new Error(retryError.message);
            return this.parseVendorKtp(retryData);
          }
          throw new Error(error.message);
        }
        return this.parseVendorKtp(data);
      } catch (err: any) {
        try {
          const currentParsed = await this.getVendor(id);
          const merged = currentParsed ? { ...currentParsed, ...updates } : updates;
          
          if (err.message?.includes('ktp_url') || err.message?.includes('membership_tier') || err.message?.includes('rajaongkir_') || err.message?.includes('shipping_engine') || err.message?.includes('payment_methods') || err.message?.includes('column') || err.message?.includes('memb_pay')) {
            const { ktp_url, membership_tier, rajaongkir_enabled, rajaongkir_couriers, rajaongkir_origin_id, rajaongkir_origin_name, rajaongkir_origin_province_id, rajaongkir_origin_province_name, rajaongkir_origin_district_id, rajaongkir_origin_district_name, shipping_engine, payment_methods, memb_pay_method, memb_pay_status, memb_pay_proof, ...rest } = updates;
            let finalRest = { ...rest };
            
            const ktpVal = merged.ktp_url || '';
            const membVal = merged.membership_tier || 'FREE';
            const roEnabled = merged.rajaongkir_enabled !== undefined ? !!merged.rajaongkir_enabled : false;
            const roCouriers = (merged.rajaongkir_couriers || ['jne', 'pos', 'tiki']).join(',');
            const roOriginId = merged.rajaongkir_origin_id || '';
            const roOriginName = merged.rajaongkir_origin_name || '';
            const roProvinceId = merged.rajaongkir_origin_province_id || '';
            const roProvinceName = merged.rajaongkir_origin_province_name || '';
            const roDistrictId = merged.rajaongkir_origin_district_id || '';
            const roDistrictName = merged.rajaongkir_origin_district_name || '';
            const engineVal = merged.shipping_engine || 'smartengine';
            const pmVal = (merged.payment_methods || ['COD', 'Pakasir QRIS', 'Transfer Bank Local']).join(',');
            
            const mpmVal = merged.memb_pay_method || '';
            const mpsVal = merged.memb_pay_status || 'unpaid';
            const mppVal = merged.memb_pay_proof || '';
            
            const cleanDesc = (merged.description || '').trim();
            finalRest.description = `${cleanDesc}\n\n[KTP_URL: ${ktpVal}]\n[MEMBERSHIP: ${membVal}]\n[RAJAONGKIR_ENABLED: ${roEnabled}]\n[RAJAONGKIR_COURIERS: ${roCouriers}]\n[RAJAONGKIR_ORIGIN_ID: ${roOriginId}]\n[RAJAONGKIR_ORIGIN_NAME: ${roOriginName}]\n[RAJAONGKIR_PROVINCE_ID: ${roProvinceId}]\n[RAJAONGKIR_PROVINCE_NAME: ${roProvinceName}]\n[RAJAONGKIR_DISTRICT_ID: ${roDistrictId}]\n[RAJAONGKIR_DISTRICT_NAME: ${roDistrictName}]\n[SHIPPING_ENGINE: ${engineVal}]\n[PAYMENT_METHODS: ${pmVal}]\n[MEMB_PAY_METHOD: ${mpmVal}]\n[MEMB_PAY_STATUS: ${mpsVal}]\n[MEMB_PAY_PROOF: ${mppVal}]`.trim();

            const { data: retryData, error: retryError } = await supabase
              .from('vendors')
              .update(finalRest)
              .eq('id', id)
              .select()
              .single();
            if (retryError) throw new Error(retryError.message);
            return this.parseVendorKtp(retryData);
          }
        } catch (innerErr) {
          // Fall through to throw original err
        }
        throw err;
      }
    } else {
      const vendors = getLocalData<Vendor>('umkm_vendors');
      const idx = vendors.findIndex(v => v.id === id);
      if (idx === -1) throw new Error('Vendor tidak ditemukan!');
      vendors[idx] = { ...vendors[idx], ...updates };
      setLocalData('umkm_vendors', vendors);
      return vendors[idx];
    }
  },

  // === PRODUCTS ===
  async getProducts() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw new Error(error.message);
      return data as Product[];
    } else {
      return getLocalData<Product>('umkm_products');
    }
  },

  async getProduct(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Product | null;
    } else {
      return getLocalData<Product>('umkm_products').find(p => p.id === id) || null;
    }
  },

  async saveProduct(id: string | null, productData: Omit<Product, 'id' | 'created_at'>) {
    const finalId = id || 'prod_' + Math.random().toString(36).substr(2, 9);
    const newProduct: Product = {
      ...productData,
      id: finalId,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').upsert([newProduct]);
      if (error) throw new Error(error.message);
      return newProduct;
    } else {
      const products = getLocalData<Product>('umkm_products');
      const idx = products.findIndex(p => p.id === finalId);
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...productData };
      } else {
        products.push(newProduct);
      }
      setLocalData('umkm_products', products);
      return newProduct;
    }
  },

  async deleteProduct(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    } else {
      const products = getLocalData<Product>('umkm_products');
      const filtered = products.filter(p => p.id !== id);
      setLocalData('umkm_products', filtered);
      return true;
    }
  },

  // === COURIERS ===
  async getCouriers(vendorId?: string) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('couriers').select('*');
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Courier[];
    } else {
      const couriers = getLocalData<Courier>('umkm_couriers');
      return vendorId ? couriers.filter(c => c.vendor_id === vendorId) : couriers;
    }
  },

  async saveCourier(id: string | null, courierData: Omit<Courier, 'id' | 'created_at'>) {
    const finalId = id || 'cour_' + Math.random().toString(36).substr(2, 9);
    const courier: Courier = {
      ...courierData,
      id: finalId,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('couriers').upsert([courier]);
      if (error) throw new Error(error.message);
      return courier;
    } else {
      const couriers = getLocalData<Courier>('umkm_couriers');
      const idx = couriers.findIndex(c => c.id === finalId);
      if (idx !== -1) {
        couriers[idx] = { ...couriers[idx], ...courierData };
      } else {
        couriers.push(courier);
      }
      setLocalData('umkm_couriers', couriers);
      return courier;
    }
  },

  async deleteCourier(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('couriers').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    } else {
      const couriers = getLocalData<Courier>('umkm_couriers');
      setLocalData('umkm_couriers', couriers.filter(c => c.id !== id));
      return true;
    }
  },

  // === AFFILIATE RELATIONS ===
  async getAffiliateRelations() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('affiliate_relations').select('*');
      if (error) throw new Error(error.message);
      return data as AffiliateRelation[];
    } else {
      return getLocalData<AffiliateRelation>('umkm_affiliates');
    }
  },

  async requestAffiliate(affiliatorVendorId: string, ownerVendorId: string) {
    const relation: AffiliateRelation = {
      id: 'aff_' + Math.random().toString(36).substr(2, 9),
      affiliator_vendor_id: affiliatorVendorId,
      owner_vendor_id: ownerVendorId,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('affiliate_relations').insert([relation]);
      if (error) throw new Error(error.message);
      return relation;
    } else {
      const affiliates = getLocalData<AffiliateRelation>('umkm_affiliates');
      affiliates.push(relation);
      setLocalData('umkm_affiliates', affiliates);
      return relation;
    }
  },

  async updateAffiliateStatus(id: string, status: 'approved' | 'rejected') {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('affiliate_relations').update({ status }).eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    } else {
      const affiliates = getLocalData<AffiliateRelation>('umkm_affiliates');
      const idx = affiliates.findIndex(a => a.id === id);
      if (idx !== -1) {
        affiliates[idx].status = status;
        setLocalData('umkm_affiliates', affiliates);
      }
      return true;
    }
  },

  // === COMMISSION SETTINGS ===
  async getCommissionSettings(vendorId: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('commission_settings').select('*').eq('vendor_id', vendorId);
      if (error) throw new Error(error.message);
      return data as CommissionSetting[];
    } else {
      return getLocalData<CommissionSetting>('umkm_commissions').filter(c => c.vendor_id === vendorId);
    }
  },

  async saveCommissionSetting(vendorId: string, productId: string | null, commissionPercentage: number) {
    const id = 'com_' + Math.random().toString(36).substr(2, 9);
    const setting: CommissionSetting = {
      id,
      vendor_id: vendorId,
      product_id: productId,
      commission_percentage: commissionPercentage,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('commission_settings').insert([setting]);
      if (error) throw new Error(error.message);
      return setting;
    } else {
      const commissions = getLocalData<CommissionSetting>('umkm_commissions');
      // If we already have a setting for this product, modify it. Otherwise append.
      const idx = commissions.findIndex(c => c.vendor_id === vendorId && c.product_id === productId);
      if (idx !== -1) {
        commissions[idx].commission_percentage = commissionPercentage;
      } else {
        commissions.push(setting);
      }
      setLocalData('umkm_commissions', commissions);
      return setting;
    }
  },

  // === ORDERS ===
  async createOrder(orderData: Omit<Order, 'id' | 'created_at'>) {
    const id = 'ord_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const order: Order = {
      ...orderData,
      id,
      created_at: new Date().toISOString()
    };

    const virtualizeOrder = (o: any) => {
      if (o.payment_method && o.payment_method !== 'COD') {
        const realPaymentMethod = o.payment_method;
        return {
          ...o,
          payment_method: 'COD',
          shipping_address: `${o.shipping_address} || PM:${realPaymentMethod}`
        };
      }
      return o;
    };

    if (isSupabaseConfigured && supabase) {
      const dbOrder = virtualizeOrder(order);
      const { error } = await supabase.from('orders').insert([dbOrder]);
      if (error) throw new Error(error.message);
      return order;
    } else {
      const orders = getLocalData<Order>('umkm_orders');
      orders.push(order);
      setLocalData('umkm_orders', orders);
      return order;
    }
  },

  devirtualizeOrderHelper(o: any) {
    if (!o) return o;
    const order = { ...o };
    if (order.shipping_address) {
      if (order.shipping_address.includes(' || PM:')) {
        const parts = order.shipping_address.split(' || PM:');
        order.shipping_address = parts[0];
        order.payment_method = parts[1];
      }
      if (order.shipping_address.includes(' || AWB:')) {
        const parts = order.shipping_address.split(' || AWB:');
        order.shipping_address = parts[0];
        const awbParts = parts[1].split(' || CC:');
        order.awb_number = awbParts[0];
        if (awbParts[1]) {
          order.courier_code = awbParts[1];
        }
      }
    }
    return order;
  },

  async getOrders(userId: string, role: 'buyer' | 'vendor' | 'admin') {
    if (isSupabaseConfigured && supabase) {
      let query;
      if (role === 'admin') {
        query = supabase.from('orders').select('*');
      } else if (role === 'vendor') {
        query = supabase.from('orders').select('*').eq('vendor_id', userId);
      } else {
        query = supabase.from('orders').select('*').eq('buyer_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(this.devirtualizeOrderHelper) as Order[];
    } else {
      const orders = getLocalData<Order>('umkm_orders');
      let result = [];
      if (role === 'admin') {
        result = orders;
      } else if (role === 'vendor') {
        result = orders.filter(o => o.vendor_id === userId);
      } else {
        result = orders.filter(o => o.buyer_id === userId);
      }
      // Sort newest first
      return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async updateOrderStatus(id: string, status: Order['status']) {
    let order: Order | null = null;
    
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        order = db.devirtualizeOrderHelper(data) as Order;
      }
    } else {
      const orders = getLocalData<Order>('umkm_orders');
      const found = orders.find(o => o.id === id);
      if (found) {
        order = found;
      }
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const orders = getLocalData<Order>('umkm_orders');
      const idx = orders.findIndex(o => o.id === id);
      if (idx !== -1) {
        orders[idx].status = status;
        setLocalData('umkm_orders', orders);
      }
    }

    // Balance crediting if completed
    if (status === 'completed' && order) {
      // Prevent double-crediting
      const existingTx = await db.getBalanceTransactions();
      const alreadyCredited = existingTx.some(t => t.description.includes(id));
      
      if (!alreadyCredited) {
        // Retrieve app settings for admin commission
        const settings = await db.getAppSettings();
        const adminCommPercent = Number(settings?.admin_commission_percent ?? 5);
        const adminCommFlat = Number(settings?.admin_commission_flat ?? 0);

        // Calculate credits
        const isEkspedisi = order.courier_name?.toLowerCase().includes('ekspedisi');
        const commAmount = Number(order.commission_amount || 0);
        const shippingFee = Number(order.shipping_fee || 0);
        const totalAmount = Number(order.total_amount || 0);
        const baseAmount = Math.max(0, totalAmount - shippingFee);

        // Calculate admin commission
        const adminCommission = Math.round((baseAmount * (adminCommPercent / 100)) + adminCommFlat);

        // Seller vendor share
        const sellerShare = totalAmount - commAmount - adminCommission - (isEkspedisi ? shippingFee : 0);

        // Credit seller vendor
        if (sellerShare > 0) {
          await db.createBalanceTransaction({
            vendor_id: order.vendor_id,
            amount: sellerShare,
            type: 'sales',
            description: `Penjualan produk order ${id} (Total: Rp ${totalAmount.toLocaleString()}, Komisi Admin: Rp ${adminCommission.toLocaleString()} (${adminCommPercent}%), Afiliasi: Rp ${commAmount.toLocaleString()}${isEkspedisi ? `, Ongkir Ekspedisi: Rp ${shippingFee.toLocaleString()}` : ''})`
          });
        }

        // Credit affiliator if present
        if (order.affiliator_vendor_id && commAmount > 0) {
          await db.createBalanceTransaction({
            vendor_id: order.affiliator_vendor_id,
            amount: commAmount,
            type: 'commission',
            description: `Komisi afiliasi order ${id} dari ${order.vendor_name}`
          });
        }
      }
    }

    return true;
  },

  async updateOrderTracking(id: string, awb_number: string, courier_code: string) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('orders').update({ awb_number, courier_code }).eq('id', id);
        if (!error) return true;
        console.warn('[Supabase updateOrderTracking] Standard update failed, attempting virtual fallback:', error.message);
      } catch (err: any) {
        console.warn('[Supabase updateOrderTracking] Exception on standard update:', err.message);
      }

      // Fallback: Store AWB / Courier in shipping_address
      try {
        const { data: orderData, error: fetchError } = await supabase.from('orders').select('shipping_address').eq('id', id).single();
        if (!fetchError && orderData) {
          let currentAddress = orderData.shipping_address || '';
          if (currentAddress.includes(' || AWB:')) {
            currentAddress = currentAddress.split(' || AWB:')[0];
          }
          const virtualizedAddress = `${currentAddress} || AWB:${awb_number} || CC:${courier_code}`;
          const { error: updateError } = await supabase.from('orders').update({
            shipping_address: virtualizedAddress
          }).eq('id', id);

          if (!updateError) {
            console.log('[Supabase updateOrderTracking] Fallback virtual update succeeded!');
            return true;
          }
          throw new Error(updateError.message);
        }
        if (fetchError) throw new Error(fetchError.message);
      } catch (fallbackErr: any) {
        console.error('[Supabase updateOrderTracking] Fallback failed:', fallbackErr.message);
        throw fallbackErr;
      }
      return true;
    } else {
      const orders = getLocalData<Order>('umkm_orders');
      const idx = orders.findIndex(o => o.id === id);
      if (idx !== -1) {
        orders[idx].awb_number = awb_number;
        orders[idx].courier_code = courier_code;
        setLocalData('umkm_orders', orders);
      }
      return true;
    }
  },

  // === APP SETTINGS ===
  async getAppSettings() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'global_settings').maybeSingle();
      if (error) throw new Error(error.message);
      return data ? this.parseAppSettings(data) : INITIAL_SETTINGS;
    } else {
      return JSON.parse(localStorage.getItem('umkm_settings') || 'null') || INITIAL_SETTINGS;
    }
  },

  async updateAppSettings(updates: Partial<AppSetting>) {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch current hydrated settings to ensure we merge safely
      let currentHydrated: AppSetting = INITIAL_SETTINGS;
      try {
        const { data } = await supabase.from('app_settings').select('*').eq('id', 'global_settings').maybeSingle();
        if (data) {
          currentHydrated = this.parseAppSettings(data);
        }
      } catch (e) {
        console.error('Error fetching existing settings for merge, using INITIAL_SETTINGS', e);
      }

      // Merge overall hydrated settings
      const mergedHydrated = { ...currentHydrated, ...updates, id: 'global_settings' };

      // Helper function to build the fallback payload (only standard columns + serialized metadata)
      const getFallbackPayload = () => {
        const extraKeysObj = {
          categories: mergedHydrated.categories,
          pakasir_enabled: mergedHydrated.pakasir_enabled,
          pakasir_api_key: mergedHydrated.pakasir_api_key,
          pakasir_merchant_id: mergedHydrated.pakasir_merchant_id,
          google_maps_enabled: mergedHydrated.google_maps_enabled,
          google_maps_api_key: mergedHydrated.google_maps_api_key,
          payment_methods: mergedHydrated.payment_methods,
          shipping_methods: mergedHydrated.shipping_methods,
          banners: mergedHydrated.banners,
          banner_duration: mergedHydrated.banner_duration,
          membership_settings: mergedHydrated.membership_settings,
          admin_commission_percent: mergedHydrated.admin_commission_percent,
          admin_commission_flat: mergedHydrated.admin_commission_flat,
          about_us_welcome_heading: mergedHydrated.about_us_welcome_heading,
          about_us_welcome_text: mergedHydrated.about_us_welcome_text,
          about_us_hero_img: mergedHydrated.about_us_hero_img,
          about_us_villages: mergedHydrated.about_us_villages,
          about_us_quote_text: mergedHydrated.about_us_quote_text,
          about_us_quote_author: mergedHydrated.about_us_quote_author,
          carousel_text: mergedHydrated.carousel_badge_text, // just mapping it
          carousel_badge_text: mergedHydrated.carousel_badge_text,
          carousel_badge_url: mergedHydrated.carousel_badge_url,
          footer_text: mergedHydrated.footer_text,
          footer_address: mergedHydrated.footer_address,
          right_banners: mergedHydrated.right_banners,
          right_banner_duration: mergedHydrated.right_banner_duration
        };

        let cleanAboutUs = mergedHydrated.about_us || '';
        const tagIdx = cleanAboutUs.lastIndexOf('[METADATA_JSON:');
        if (tagIdx !== -1) {
          cleanAboutUs = cleanAboutUs.substring(0, tagIdx).trim();
        }
        
        // Return strictly mapped valid columns of public.app_settings table only
        return {
          id: 'global_settings',
          app_name: mergedHydrated.app_name || 'PASAR UMKM TEGALSARI',
          logo_url: mergedHydrated.logo_url || null,
          banner_url: mergedHydrated.banner_url || null,
          contact_phone: mergedHydrated.contact_phone || null,
          website_mode: mergedHydrated.website_mode || 'active',
          announcement: mergedHydrated.announcement || null,
          about_us: `${cleanAboutUs}\n\n[METADATA_JSON: ${JSON.stringify(extraKeysObj)}]`
        };
      };

      try {
        // Try the direct upsert of the complete merged config first (in case columns exist in database)
        const firstAttemptPayload = { ...mergedHydrated };
        const { error } = await supabase.from('app_settings').upsert([firstAttemptPayload]);
        if (!error) {
          return true;
        }
        
        // If the direct upsert yielded any error, we apply the metadata serialization fallback with whitelisted schema columns
        console.warn('Direct upsert settings failed. Attempting fallback metadata serialization format with whitelist...', error);
        const fallbackPayload = getFallbackPayload();
        const { error: fallbackError } = await supabase.from('app_settings').upsert([fallbackPayload]);
        if (fallbackError) {
          throw new Error(fallbackError.message);
        }
        return true;
      } catch (err: any) {
        // If an exception was thrown during direct upsert, also apply fallback
        console.warn('Exception thrown during direct upsert. Attempting fallback metadata serialization format with whitelist...', err);
        try {
          const fallbackPayload = getFallbackPayload();
          const { error: fallbackError } = await supabase.from('app_settings').upsert([fallbackPayload]);
          if (fallbackError) {
            throw new Error(fallbackError.message);
          }
          return true;
        } catch (innerErr: any) {
          console.error('Even whitelisted fallback settings save failed:', innerErr);
          throw innerErr;
        }
      }
    } else {
      const current = JSON.parse(localStorage.getItem('umkm_settings') || 'null') || INITIAL_SETTINGS;
      const updated = { ...current, ...updates };
      localStorage.setItem('umkm_settings', JSON.stringify(updated));
      return true;
    }
  },

  // === USER MANAGEMENT (FOR ADMIN) ===
  async getUsers() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw new Error(error.message);
      return data as UserProfile[];
    } else {
      return getLocalData<UserProfile>('umkm_profiles');
    }
  },

  async deleteUser(id: string) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    } else {
      const profiles = getLocalData<UserProfile>('umkm_profiles');
      setLocalData('umkm_profiles', profiles.filter(p => p.id !== id));
      return true;
    }
  },

  async updateProfileRole(id: string, role: 'buyer' | 'vendor' | 'admin') {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    } else {
      const profiles = getLocalData<UserProfile>('umkm_profiles');
      const idx = profiles.findIndex(p => p.id === id);
      if (idx !== -1) {
        profiles[idx].role = role;
        setLocalData('umkm_profiles', profiles);
      }
      return true;
    }
  },

  // === BALANCES & WITHDRAWALS ===
  async getBalanceTransactions(vendorId?: string) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('balance_transactions').select('*');
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      const logs = getLocalData<BalanceTransaction>('umkm_balance_transactions');
      const filteredLogs = vendorId ? logs.filter(l => l.vendor_id === vendorId) : logs;

      if (error) {
        console.warn('Supabase balance_transactions table missing, falling back to local storage:', error.message);
        return filteredLogs;
      }

      // Merge Supabase and local storage logs to ensure data integrity
      const merged = [...(data || [])];
      for (const log of filteredLogs) {
        if (!merged.some(m => m.id === log.id)) {
          merged.push(log);
        }
      }
      return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      const logs = getLocalData<BalanceTransaction>('umkm_balance_transactions');
      return (vendorId ? logs.filter(l => l.vendor_id === vendorId) : logs).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  },

  async createBalanceTransaction(tx: Omit<BalanceTransaction, 'id' | 'created_at'>) {
    const id = 'tx_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const transaction: BalanceTransaction = {
      ...tx,
      id,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('balance_transactions').insert([transaction]);
      if (error) {
        console.warn('Supabase balance_transactions insert failed, saving locally:', error.message);
      }
      // Always store locally too to ensure local fallback has a copy
      const logs = getLocalData<BalanceTransaction>('umkm_balance_transactions');
      logs.push(transaction);
      setLocalData('umkm_balance_transactions', logs);
      return transaction;
    } else {
      const logs = getLocalData<BalanceTransaction>('umkm_balance_transactions');
      logs.push(transaction);
      setLocalData('umkm_balance_transactions', logs);
      return transaction;
    }
  },

  async getWithdrawalRequests(vendorId?: string) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('withdrawal_requests').select('*');
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      const requests = getLocalData<WithdrawalRequest>('umkm_withdrawal_requests');
      const filteredRequests = vendorId ? requests.filter(r => r.vendor_id === vendorId) : requests;

      if (error) {
        console.warn('Supabase withdrawal_requests table missing, falling back to local storage:', error.message);
        return filteredRequests;
      }

      // Merge Supabase and local storage logs to ensure data integrity
      const merged = [...(data || [])];
      for (const req of filteredRequests) {
        if (!merged.some(m => m.id === req.id)) {
          merged.push(req);
        }
      }
      return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      const requests = getLocalData<WithdrawalRequest>('umkm_withdrawal_requests');
      return (vendorId ? requests.filter(r => r.vendor_id === vendorId) : requests).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  },

  async createWithdrawalRequest(req: Omit<WithdrawalRequest, 'id' | 'created_at' | 'status'>) {
    const id = 'wd_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const request: WithdrawalRequest = {
      ...req,
      id,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Deduct vendor balance immediately as a withdrawal transaction
    await this.createBalanceTransaction({
      vendor_id: req.vendor_id,
      amount: -req.amount, // negative amount for deduction
      type: 'withdrawal',
      description: `Penarikan Saldo (${id}) ke ${req.bank_name} - ${req.bank_account_number}`
    });

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('withdrawal_requests').insert([request]);
      if (error) {
        console.warn('Supabase withdrawal_requests insert failed, saving locally:', error.message);
        const requests = getLocalData<WithdrawalRequest>('umkm_withdrawal_requests');
        requests.push(request);
        setLocalData('umkm_withdrawal_requests', requests);
      }
      return request;
    } else {
      const requests = getLocalData<WithdrawalRequest>('umkm_withdrawal_requests');
      requests.push(request);
      setLocalData('umkm_withdrawal_requests', requests);
      return request;
    }
  },

  async updateWithdrawalStatus(id: string, status: 'approved' | 'rejected') {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('withdrawal_requests').update({
        status,
        completed_at: new Date().toISOString()
      }).eq('id', id);
      
      // If rejected, we must refund the balance!
      if (status === 'rejected') {
        const requests = await this.getWithdrawalRequests();
        const found = requests.find(r => r.id === id);
        if (found) {
          await this.createBalanceTransaction({
            vendor_id: found.vendor_id,
            amount: found.amount, // positive amount for refund
            type: 'refund',
            description: `Pengembalian Dana Penarikan Ditolak (${id})`
          });
        }
      }
      return true;
    } else {
      const requests = getLocalData<WithdrawalRequest>('umkm_withdrawal_requests');
      const idx = requests.findIndex(r => r.id === id);
      if (idx !== -1) {
        requests[idx].status = status;
        requests[idx].completed_at = new Date().toISOString();
        setLocalData('umkm_withdrawal_requests', requests);

        // If rejected, we must refund the balance!
        if (status === 'rejected') {
          const req = requests[idx];
          await this.createBalanceTransaction({
            vendor_id: req.vendor_id,
            amount: req.amount, // positive amount for refund
            type: 'refund',
            description: `Pengembalian Dana Penarikan Ditolak (${id})`
          });
        }
      }
      return true;
    }
  }
};
