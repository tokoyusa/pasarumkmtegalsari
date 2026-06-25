/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { UserProfile, Vendor, Product, Courier, AffiliateRelation, CommissionSetting } from '../types';
import { compressImage } from '../lib/imageCompressor';
import { Plus, Edit2, Trash2, Check, X, Shield, Award, Users, Percent, Truck, PlusCircle, AlertCircle, ShoppingBag, Landmark, UploadCloud, Package } from 'lucide-react';

interface VendorDashboardProps {
  currentProfile: UserProfile;
  onRefreshProfile: () => void;
}

export default function VendorDashboard({ currentProfile, onRefreshProfile }: VendorDashboardProps) {
  const [vendorInfo, setVendorInfo] = useState<Vendor | null>(null);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateRelation[]>([]);
  const [commissions, setCommissions] = useState<CommissionSetting[]>([]);
  const [otherVendors, setOtherVendors] = useState<Vendor[]>([]);

  const categoriesToUse = appSettings?.categories && appSettings.categories.length > 0 
    ? appSettings.categories 
    : ['Makanan Ringan', 'Minuman Tradisional', 'Batik & Sandang', 'Kesehatan & Herbal', 'Sembako & Hasil Bumi', 'Kerajinan Tangan'];

  // Form states
  const [profileForm, setProfileForm] = useState({
    business_name: '',
    logo_url: '',
    banner_url: '',
    description: '',
    address: '',
    kecamatan: 'Tegalsari',
    village: 'Tegalsari',
    bank_name: 'BRI',
    bank_account_number: '',
    bank_account_name: '',
    payment_methods: ['COD', 'Pakasir QRIS', 'Transfer Bank Local'] as string[]
  });

  const [activeTab, setActiveTab] = useState<'profil' | 'produk' | 'kurir' | 'afiliasi' | 'saldo'>('profil');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [roEnabled, setRoEnabled] = useState(false);
  const [roCouriers, setRoCouriers] = useState<string[]>(['jne', 'pos', 'tiki']);
  const [shippingEngine, setShippingEngine] = useState<'binderbyte' | 'smartengine'>('smartengine');

  // Balance and Withdrawal States
  const [balanceTransactions, setBalanceTransactions] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: ''
  });


  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 800, 0.5);
      callback(compressed);
    } catch (err) {
      console.error('Gagal kompres gambar:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Forms for adding/editing entity
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    image_url: '',
    brand: '',
    variantsString: '', // comma separated values
    price: 0,
    discount_price: '' as string | number,
    weight: 0,
    description: '',
    pirt: '',
    pkrt: '',
    bpom: '',
    category: 'Makanan Ringan',
    stock: 10
  });

  const [showCourierModal, setShowCourierModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [courierForm, setCourierForm] = useState({
    name: '',
    phone: '',
    vehicle_type: 'Motor' as Courier['vehicle_type'],
    price_per_km: 2000,
    base_fare: 5000,
    status: 'active' as Courier['status']
  });

  const [commissionForm, setCommissionForm] = useState({
    product_id: 'all', // 'all' or empty means apply to all products of the vendor
    commission_percentage: 10
  });

  // RajaOngkir origin location states with province, city, district cascading
  const [originProvinces, setOriginProvinces] = useState<{ province_id: string; province: string }[]>([]);
  const [originCities, setOriginCities] = useState<{ city_id: string; type: string; city_name: string; postal_code: string }[]>([]);
  const [originDistricts, setOriginDistricts] = useState<{ district_id: string; city_id: string; district_name: string }[]>([]);

  const [selectedRoProvince, setSelectedRoProvince] = useState('');
  const [selectedRoProvinceName, setSelectedRoProvinceName] = useState('');
  const [selectedRoCity, setSelectedRoCity] = useState('');
  const [selectedRoCityName, setSelectedRoCityName] = useState('');
  const [selectedRoDistrict, setSelectedRoDistrict] = useState('');
  const [selectedRoDistrictName, setSelectedRoDistrictName] = useState('');

  const [roLoadingProvinces, setRoLoadingProvinces] = useState(false);
  const [roLoadingCities, setRoLoadingCities] = useState(false);
  const [roLoadingDistricts, setRoLoadingDistricts] = useState(false);

  const loadOriginProvinces = async () => {
    setRoLoadingProvinces(true);
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
        setOriginProvinces(data.results);
      }
    } catch (err) {
      console.warn('Failed to load origin provinces from backend, falling back to client-side API:', err);
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
          setOriginProvinces(mapped);
        }
      } catch (fallbackErr) {
        console.error('Client-side fallback for provinces failed:', fallbackErr);
        const LOCAL_PROVINCES = [
          { province_id: "11", province: "Jawa Timur" },
          { province_id: "10", province: "Jawa Tengah" },
          { province_id: "9", province: "Jawa Barat" },
          { province_id: "6", province: "DKI Jakarta" },
          { province_id: "5", province: "DI Yogyakarta" },
          { province_id: "3", province: "Banten" }
        ];
        setOriginProvinces(LOCAL_PROVINCES);
      }
    } finally {
      setRoLoadingProvinces(false);
    }
  };

  const loadOriginCities = async (provId: string) => {
    if (!provId) return;
    setRoLoadingCities(true);
    setOriginCities([]);
    setOriginDistricts([]);
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
        setOriginCities(data.results);
      }
    } catch (err) {
      console.warn('Failed to load origin cities from backend, falling back to client-side API:', err);
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
          setOriginCities(mapped);
        }
      } catch (fallbackErr) {
        console.error('Client-side fallback for cities failed:', fallbackErr);
        const LOCAL_CITIES = [
          { city_id: "42", province_id: "11", type: "Kabupaten", city_name: "Banyuwangi" },
          { city_id: "444", province_id: "11", type: "Kota", city_name: "Surabaya" },
          { city_id: "445", province_id: "11", type: "Kota", city_name: "Malang" }
        ].filter(c => c.province_id === String(provId));
        setOriginCities(LOCAL_CITIES);
      }
    } finally {
      setRoLoadingCities(false);
    }
  };

  const loadOriginDistricts = async (cityId: string) => {
    if (!cityId) return;
    setRoLoadingDistricts(true);
    setOriginDistricts([]);
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
        setOriginDistricts(data.results);
      }
    } catch (err) {
      console.warn('Failed to load origin districts from backend, falling back to client-side API:', err);
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
          setOriginDistricts(mapped);
        }
      } catch (fallbackErr) {
        console.error('Client-side fallback for districts failed:', fallbackErr);
        const LOCAL_DISTRICTS = [
          { district_id: "351001", city_id: String(cityId), district_name: "Tegalsari" },
          { district_id: "351002", city_id: String(cityId), district_name: "Genteng" },
          { district_id: "351003", city_id: String(cityId), district_name: "Banyuwangi" },
          { district_id: "351004", city_id: String(cityId), district_name: "Rogojampi" }
        ];
        setOriginDistricts(LOCAL_DISTRICTS);
      }
    } finally {
      setRoLoadingDistricts(false);
    }
  };

  useEffect(() => {
    if (roEnabled) {
      loadOriginProvinces();
    }
  }, [roEnabled]);

  // Sync compatible couriers on engine switch
  useEffect(() => {
    if (!vendorInfo) return; // Wait for initial profile load
    if (shippingEngine === 'binderbyte') {
      setRoCouriers(['jne', 'sicepat', 'jnt', 'pos', 'tiki', 'anteraja', 'wahana', 'ninja', 'lion']);
    } else if (shippingEngine === 'smartengine') {
      setRoCouriers(['jne', 'sicepat', 'jnt', 'pos', 'tiki', 'anteraja', 'wahana', 'ninja', 'lion']);
    }
  }, [shippingEngine]);

  // Init & trigger data fetches
  useEffect(() => {
    loadVendorData();
  }, [currentProfile]);

  const loadVendorData = async () => {
    try {
      const settings = await db.getAppSettings();
      if (settings) {
        setAppSettings(settings);
      }
      const v = await db.getVendor(currentProfile.id);
      if (v) {
        setVendorInfo(v);
        setRoEnabled(v.rajaongkir_enabled || false);
        setRoCouriers(v.rajaongkir_couriers || ['jne', 'pos', 'tiki']);
        setSelectedRoProvince(v.rajaongkir_origin_province_id || '');
        setSelectedRoProvinceName(v.rajaongkir_origin_province_name || '');
        setSelectedRoCity(v.rajaongkir_origin_id || '');
        setSelectedRoCityName(v.rajaongkir_origin_name || '');
        setSelectedRoDistrict(v.rajaongkir_origin_district_id || '');
        setSelectedRoDistrictName(v.rajaongkir_origin_district_name || '');
        setShippingEngine(v.shipping_engine || 'smartengine');

        if (v.rajaongkir_origin_province_id) {
          loadOriginCities(v.rajaongkir_origin_province_id);
        }
        if (v.rajaongkir_origin_id) {
          loadOriginDistricts(v.rajaongkir_origin_id);
        }

        setProfileForm({
          business_name: v.business_name || '',
          logo_url: v.logo_url || '',
          banner_url: v.banner_url || '',
          description: v.description || '',
          address: v.address || '',
          kecamatan: v.kecamatan || 'Tegalsari',
          village: v.village || 'Tegalsari',
          bank_name: v.bank_name || 'BRI',
          bank_account_number: v.bank_account_number || '',
          bank_account_name: v.bank_account_name || '',
          payment_methods: v.payment_methods || ['COD', 'Pakasir QRIS', 'Transfer Bank Local']
        });

        // Load vendor specific lists
        const allProducts = await db.getProducts();
        setProducts(allProducts.filter(p => p.vendor_id === currentProfile.id));

        const allCouriers = await db.getCouriers(currentProfile.id);
        setCouriers(allCouriers);

        const allComms = await db.getCommissionSettings(currentProfile.id);
        setCommissions(allComms);
        
        await loadBalanceData();
      }

      // Load affiliate applications and lists
      const relations = await db.getAffiliateRelations();
      setAffiliates(relations);

      const allVendors = await db.getVendors();
      setOtherVendors(allVendors.filter(vendor => vendor.id !== currentProfile.id && vendor.status === 'approved'));

    } catch (err: any) {
      console.error(err);
    }
  };

  const loadBalanceData = async () => {
    try {
      const txs = await db.getBalanceTransactions(currentProfile.id);
      setBalanceTransactions(txs);
      const wds = await db.getWithdrawalRequests(currentProfile.id);
      setWithdrawalRequests(wds);
    } catch (err) {
      console.error('Failed to load balance/withdrawal data:', err);
    }
  };

  useEffect(() => {
    if (vendorInfo) {
      setWithdrawForm(prev => ({
        ...prev,
        bank_name: prev.bank_name || vendorInfo.bank_name || 'BRI',
        bank_account_number: prev.bank_account_number || vendorInfo.bank_account_number || '',
        bank_account_name: prev.bank_account_name || vendorInfo.bank_account_name || ''
      }));
    }
  }, [vendorInfo]);

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const amountNum = Number(withdrawForm.amount);
    if (isNaN(amountNum) || amountNum < 100000) {
      setMessage({ text: 'Minimal penarikan saldo adalah Rp 100.000', type: 'error' });
      return;
    }

    const currentBalance = balanceTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
    if (amountNum > currentBalance) {
      setMessage({ text: `Saldo Anda tidak mencukupi. Saldo saat ini: Rp ${currentBalance.toLocaleString()}`, type: 'error' });
      return;
    }

    try {
      await db.createWithdrawalRequest({
        vendor_id: currentProfile.id,
        amount: amountNum,
        bank_name: withdrawForm.bank_name || vendorInfo?.bank_name || 'BRI',
        bank_account_number: withdrawForm.bank_account_number || vendorInfo?.bank_account_number || '',
        bank_account_name: withdrawForm.bank_account_name || vendorInfo?.bank_account_name || ''
      });
      setMessage({ text: 'Permintaan penarikan berhasil diajukan dan saldo Anda langsung dibukukan!', type: 'success' });
      setWithdrawForm(prev => ({ ...prev, amount: '' }));
      await loadBalanceData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const saved = await db.registerVendor({
        id: currentProfile.id,
        business_name: profileForm.business_name,
        logo_url: profileForm.logo_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
        banner_url: profileForm.banner_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
        description: profileForm.description,
        address: profileForm.address,
        kecamatan: profileForm.kecamatan,
        village: profileForm.village,
        phone: currentProfile.phone,
        bank_name: profileForm.bank_name,
        bank_account_number: profileForm.bank_account_number,
        bank_account_name: profileForm.bank_account_name,
        payment_methods: profileForm.payment_methods,
        status: vendorInfo ? vendorInfo.status : 'pending' // preserves status
      });

      setVendorInfo(saved);
      setMessage({ text: 'Data profil toko Anda berhasil diperbarui!', type: 'success' });
      onRefreshProfile();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };



  const handleSaveRajaOngkir = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await db.updateVendor(currentProfile.id, {
        rajaongkir_enabled: roEnabled,
        rajaongkir_couriers: roCouriers,
        rajaongkir_origin_id: selectedRoCity,
        rajaongkir_origin_name: selectedRoCityName,
        rajaongkir_origin_province_id: selectedRoProvince,
        rajaongkir_origin_province_name: selectedRoProvinceName,
        rajaongkir_origin_district_id: selectedRoDistrict,
        rajaongkir_origin_district_name: selectedRoDistrictName,
        shipping_engine: shippingEngine
      });
      const updatedVendor = await db.getVendor(currentProfile.id);
      if (updatedVendor) {
        setVendorInfo(updatedVendor);
      }
      setMessage({ text: 'Pengaturan ekspedisi logistik nasional berhasil diperbarui!', type: 'success' });
      onRefreshProfile();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };
  const openProductModal = (prod: Product | null) => {
    if (!prod) {
      // New product upload limit validation
      const currentTier = (vendorInfo?.membership_tier || 'free') as 'free' | 'premium' | 'vip';
      const maxAllowed = appSettings?.membership_settings?.[currentTier]?.max_products 
                         ?? (currentTier === 'free' ? 5 : currentTier === 'premium' ? 25 : 1000);
      
      if (products.length >= maxAllowed) {
        alert(`⚠️ BATAS UPLOAD TERCAPAI: Membership Anda (${currentTier.toUpperCase()}) membatasi maksimal upload produk hingga ${maxAllowed} item. Silakan hubungi admin untuk meningkatkan/upgrade tier membership Anda!`);
        return;
      }
    }

    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        image_url: prod.image_url,
        brand: prod.brand,
        variantsString: prod.variants.join(', '),
        price: prod.price,
        discount_price: prod.discount_price !== null ? prod.discount_price : '',
        weight: prod.weight,
        description: prod.description,
        pirt: prod.pirt,
        pkrt: prod.pkrt,
        bpom: prod.bpom,
        category: prod.category,
        stock: prod.stock
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        image_url: '',
        brand: '',
        variantsString: 'Original, Pedas',
        price: 15000,
        discount_price: '',
        weight: 250,
        description: '',
        pirt: '-',
        pkrt: '-',
        bpom: '-',
        category: 'Makanan Ringan',
        stock: 50
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const vars = productForm.variantsString.split(',').map(v => v.trim()).filter(v => v.length > 0);
      const disc = productForm.discount_price === '' ? null : Number(productForm.discount_price);

      await db.saveProduct(editingProduct ? editingProduct.id : null, {
        vendor_id: currentProfile.id,
        name: productForm.name,
        image_url: productForm.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=500',
        brand: productForm.brand || 'Lokal',
        variants: vars,
        price: Number(productForm.price),
        discount_price: disc,
        weight: Number(productForm.weight),
        description: productForm.description,
        pirt: productForm.pirt || '-',
        pkrt: productForm.pkrt || '-',
        bpom: productForm.bpom || '-',
        category: productForm.category,
        stock: Number(productForm.stock)
      });

      setShowProductModal(false);
      setMessage({ text: 'Produk berhasil disimpan!', type: 'success' });
      loadVendorData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Anda yakin ingin menghapus produk ini?')) return;
    try {
      await db.deleteProduct(id);
      setMessage({ text: 'Produk berhasil dihapus!', type: 'success' });
      loadVendorData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  // Courier CRUD
  const openCourierModal = (cour: Courier | null) => {
    if (cour) {
      setEditingCourier(cour);
      setCourierForm({
        name: cour.name,
        phone: cour.phone,
        vehicle_type: cour.vehicle_type,
        price_per_km: cour.price_per_km,
        base_fare: cour.base_fare,
        status: cour.status
      });
    } else {
      setEditingCourier(null);
      setCourierForm({
        name: '',
        phone: '',
        vehicle_type: 'Motor',
        price_per_km: 2000,
        base_fare: 5000,
        status: 'active'
      });
    }
    setShowCourierModal(true);
  };

  const handleSaveCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await db.saveCourier(editingCourier ? editingCourier.id : null, {
        vendor_id: currentProfile.id,
        name: courierForm.name,
        phone: courierForm.phone,
        vehicle_type: courierForm.vehicle_type,
        price_per_km: Number(courierForm.price_per_km),
        base_fare: Number(courierForm.base_fare),
        status: courierForm.status
      });

      setShowCourierModal(false);
      setMessage({ text: 'Kurir berhasil disimpan!', type: 'success' });
      loadVendorData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDeleteCourier = async (id: string) => {
    if (!confirm('Hapus kurir ini?')) return;
    try {
      await db.deleteCourier(id);
      setMessage({ text: 'Kurir berhasil dihapus!', type: 'success' });
      loadVendorData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  // Affiliate & Commissions Settings
  const handleApplyAffiliate = async (targetVendorId: string) => {
    try {
      await db.requestAffiliate(currentProfile.id, targetVendorId);
      setMessage({ text: 'Aplikasi afiliasi bermitra berhasil dikirim!', type: 'success' });
      loadVendorData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleRespondAffiliate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await db.updateAffiliateStatus(id, status);
      setMessage({ text: `Permohonan mitra di-${status === 'approved' ? 'setujui' : 'tolak'}!`, type: 'success' });
      loadVendorData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prodId = commissionForm.product_id === 'all' ? null : commissionForm.product_id;
      await db.saveCommissionSetting(currentProfile.id, prodId, Number(commissionForm.commission_percentage));
      setMessage({ text: 'Komisi afiliasi toko berhasil diatur!', type: 'success' });
      loadVendorData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const isAppliedTo = (targetVendorId: string) => {
    return affiliates.find(a => a.affiliator_vendor_id === currentProfile.id && a.owner_vendor_id === targetVendorId);
  };

  // Check pending requests for our shop (where we are the owner)
  const incomingRequests = affiliates.filter(a => a.owner_vendor_id === currentProfile.id && a.status === 'pending');
  // Approved partners who can promote our product
  const approvedPromotersByMe = affiliates.filter(a => a.owner_vendor_id === currentProfile.id && a.status === 'approved');

  const incomingRequestDetails = incomingRequests.map(req => {
    const requester = otherVendors.find(v => v.id === req.affiliator_vendor_id);
    return { req, requester };
  });

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-950 font-display">Dashboard Vendor</h2>
          <p className="text-gray-500 text-xs">Kelola toko, produk, kurir mandiri, dan komisi afiliasi Anda.</p>
        </div>

        {vendorInfo && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl p-1 px-2.5">
              <span className="text-[10px] text-gray-500 font-mono">Keanggotaan:</span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                vendorInfo.membership_tier === 'vip'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : vendorInfo.membership_tier === 'premium'
                  ? 'bg-amber-100 text-amber-850 border border-amber-205'
                  : 'bg-slate-150 text-slate-700 border border-slate-200'
              }`}>
                {vendorInfo.membership_tier || 'free'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl p-1 px-2.5">
              <span className="text-[10px] text-gray-500 font-mono">Status Toko:</span>
              {vendorInfo.status === 'approved' ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> Disetujui (Aktif)
                </span>
              ) : vendorInfo.status === 'rejected' ? (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-semibold rounded-md flex items-center gap-1">
                  <X className="w-3 h-3" /> Ditolak / Nonaktif
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded-md flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Menunggu Persetujuan
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {(['profil', 'produk', 'kurir', 'afiliasi', 'saldo'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'saldo') {
                loadBalanceData();
              }
            }}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'profil' && 'Profil Toko'}
            {tab === 'produk' && 'Produk'}
            {tab === 'kurir' && 'Kurir'}
            {tab === 'afiliasi' && 'Afiliasi'}
            {tab === 'saldo' && '💰 Saldo & Penarikan'}
          </button>
        ))}
      </div>

      {/* Profile settings tab */}
      {activeTab === 'profil' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 text-amber-900 flex gap-3 text-xs">
            <Landmark className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Informasi Pencairan Dana (Rekening)</p>
              <p className="text-amber-800 leading-relaxed">
                Mohon lengkapi info perbankan Anda dengan benar. Pembayaran COD kami hitung manual atau dibukukan di dasbor, namun untuk transfer/deposit atau penagihan fee pembeli diperlukan data rekening yang sah.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nama Bisnis / Toko UMKM</label>
              <input
                type="text"
                required
                placeholder="Contoh: Batik Tegalsari Jaya"
                value={profileForm.business_name}
                onChange={e => setProfileForm({ ...profileForm, business_name: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-750 flex justify-between">
                <span>Foto Logo Toko</span>
                <span className="text-[10px] text-emerald-600">Bisa upload file lokal</span>
              </label>
              <div className="flex gap-2 items-center">
                {profileForm.logo_url && (
                  <img src={profileForm.logo_url} className="w-10 h-10 rounded-lg object-cover border border-gray-150 shrink-0" referrerPolicy="no-referrer" />
                )}
                <div className="relative flex-1 border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-emerald-500 rounded-xl p-2.5 text-center transition cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleLocalImageUpload(e, (base64) => setProfileForm(v => ({ ...v, logo_url: base64 })))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                    <span>Upload Logo Lokal</span>
                  </div>
                </div>
              </div>
              <input
                type="text"
                placeholder="Atau masukkan URL Logo luar..."
                value={profileForm.logo_url}
                onChange={e => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-750 flex justify-between">
                <span>Banner Cover Toko</span>
                <span className="text-[10px] text-emerald-600">Bisa upload file lokal</span>
              </label>
              <div className="flex gap-2 items-center">
                {profileForm.banner_url && (
                  <img src={profileForm.banner_url} className="w-14 h-9 rounded-md object-cover border border-gray-150 shrink-0" referrerPolicy="no-referrer" />
                )}
                <div className="relative flex-1 border-2 border-dashed border-gray-200 bg-gray-50/50 hover:border-emerald-500 rounded-xl p-2.5 text-center transition cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleLocalImageUpload(e, (base64) => setProfileForm(v => ({ ...v, banner_url: base64 })))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                    <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                    <span>Upload Banner Lokal</span>
                  </div>
                </div>
              </div>
              <input
                type="text"
                placeholder="Atau masukkan URL Banner luar..."
                value={profileForm.banner_url}
                onChange={e => setProfileForm({ ...profileForm, banner_url: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-[11px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nama Bank Penerima</label>
              <select
                value={profileForm.bank_name}
                onChange={e => setProfileForm({ ...profileForm, bank_name: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs"
              >
                {['BRI', 'Bank Mandiri', 'BCA', 'BNI', 'Bank Jatim', 'DANA', 'OVO'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nomor Rekening</label>
              <input
                type="text"
                required
                placeholder="Masukkan Nomor Rekening"
                value={profileForm.bank_account_number}
                onChange={e => setProfileForm({ ...profileForm, bank_account_number: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Atas Nama Rekening</label>
              <input
                type="text"
                required
                placeholder="Nama Pemilik Rekening"
                value={profileForm.bank_account_name}
                onChange={e => setProfileForm({ ...profileForm, bank_account_name: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs"
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Deskripsi Singkat Usaha</label>
              <textarea
                rows={3}
                required
                placeholder="Jelaskan mengenai keunikan atau mutu produk usaha Anda..."
                value={profileForm.description}
                onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Dukuh</label>
              <select
                value={profileForm.village}
                onChange={e => setProfileForm({ ...profileForm, village: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs"
              >
                {['Tegalsari', 'Pulesari', 'Pungangan', 'Randu Kuning', 'Siwatu', 'Bulu', 'Bleder'].map(v => (
                  <option key={v} value={v}>Dukuh {v}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Alamat Lengkap Usaha</label>
              <input
                type="text"
                required
                placeholder="Contoh: Jl. Melati RT 03 RW 02"
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* STORE PAYMENT METHODS SETTING */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              💳 Pengaturan Metode Pembayaran Toko
            </h3>
            <p className="text-[11px] text-slate-500">
              Pilih metode pembayaran yang Anda izinkan bagi pembeli saat mereka melakukan checkout pesanan dari toko Anda.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                { key: 'COD', label: 'Cash on Delivery (COD)', desc: 'Bayar tunai ke kurir saat barang sampai.' },
                { key: 'Pakasir QRIS', label: 'Pakasir Gateway (Online)', desc: 'Pembayaran otomatis QRIS & Virtual Account.' },
                { key: 'Transfer Bank Local', label: 'Transfer Bank Manual', desc: 'Pembeli transfer langsung ke rekening Anda.' }
              ].map(item => {
                const checked = (profileForm.payment_methods || []).includes(item.key);
                return (
                  <label
                    key={item.key}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-1 cursor-pointer transition ${
                      checked
                        ? 'bg-emerald-50/55 border-emerald-300 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const currentMethods = profileForm.payment_methods || [];
                          const updated = checked
                            ? currentMethods.filter(m => m !== item.key)
                            : [...currentMethods, item.key];
                          setProfileForm({ ...profileForm, payment_methods: updated });
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold">{item.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed pl-6">
                      {item.desc}
                    </p>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all w-full cursor-pointer shadow-sm"
          >
            Simpan & Daftarkan Profil UMKM
          </button>
        </form>
      )}

      {/* Products tab */}
      {activeTab === 'produk' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800">Katalog Produk Anda ({products.length})</h3>
            <button
              onClick={() => openProductModal(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Produk
            </button>
          </div>

          {!vendorInfo && (
            <div className="p-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Harap mengisi data profil toko terlebih dahulu di tab 'Profil' sebelum menambah produk baru.</span>
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-200 rounded-2xl">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-xs font-medium">Belum ada produk terupload.</p>
              <p className="text-gray-400 text-[10px] mt-0.5">Pilih tombol 'Tambah Produk' untuk mulai mengunggah katalog dagangan Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map(p => (
                <div key={p.id} className="p-3 border border-gray-100 rounded-xl flex gap-3 hover:border-emerald-200 transition-all">
                  <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-100" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-semibold text-gray-900 text-xs truncate">{p.name}</h4>
                    <p className="text-[10px] text-gray-500 font-mono">Merek: {p.brand} | Stok: {p.stock}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.discount_price ? (
                        <>
                          <span className="text-xs font-bold text-emerald-700">Rp {p.discount_price.toLocaleString('id-ID')}</span>
                          <span className="text-[10px] text-gray-400 line-through">Rp {p.price.toLocaleString('id-ID')}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700">Rp {p.price.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                    {/* Certificates badges */}
                    <div className="flex gap-1 flex-wrap">
                      {p.pirt && p.pirt !== '-' && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono">PIRT: {p.pirt}</span>}
                      {p.bpom && p.bpom !== '-' && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono">BPOM: {p.bpom}</span>}
                      {p.pkrt && p.pkrt !== '-' && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono">PKRT: {p.pkrt}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openProductModal(p)} className="p-1 px-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded transition border border-gray-200/50">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-1 px-1.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 rounded transition border border-gray-200/50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product form Modal overlay */}
          {showProductModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <h3 className="font-bold text-gray-900 font-display text-sm">
                    {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
                  </h3>
                  <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-gray-700">Nama Produk Rekomendasi</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kripik Singkong Daun Jeruk 250gr"
                        value={productForm.name}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Kategori</label>
                      <select
                        value={productForm.category}
                        onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      >
                        {categoriesToUse.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Merek Produk</label>
                      <input
                        type="text"
                        placeholder="Contoh: Bu Siti"
                        value={productForm.brand}
                        onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Harga Normal (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Masukkan harga normal"
                        value={productForm.price || ''}
                        onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Harga Diskon (Rp) / Opsional</label>
                      <input
                        type="number"
                        placeholder="Lebih rendah dari harga biasa"
                        value={productForm.discount_price}
                        onChange={e => setProductForm({ ...productForm, discount_price: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Berat Produk (Gram)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 250"
                        value={productForm.weight || ''}
                        onChange={e => setProductForm({ ...productForm, weight: Number(e.target.value) })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Jumlah Stok</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 50"
                        value={productForm.stock || ''}
                        onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-gray-705 flex justify-between">
                        <span>Gambar Produk</span>
                        <span className="text-[10px] text-emerald-600">Bisa upload file lokal</span>
                      </label>
                      <div className="flex gap-2.5 items-center bg-gray-50/50 p-2 rounded-xl border border-gray-150">
                        {productForm.image_url && (
                          <img src={productForm.image_url} alt="Preview Produk" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200" referrerPolicy="no-referrer" />
                        )}
                        <div className="relative flex-1 border-2 border-dashed border-gray-300 bg-white hover:border-emerald-500 rounded-xl p-2.5 text-center transition cursor-pointer group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleLocalImageUpload(e, (base64) => setProductForm(v => ({ ...v, image_url: base64 })))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
                            <UploadCloud className="w-4.5 h-4.5 text-slate-450 group-hover:text-emerald-600" />
                            <span>Ambil Foto / Pilih Berkas Lokal</span>
                          </div>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Atau masukkan URL Foto luar..."
                        value={productForm.image_url}
                        onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-gray-700">Varian Produk (Dipisah tanda koma)</label>
                      <input
                        type="text"
                        placeholder="Contoh: Manis, Pedas, Original"
                        value={productForm.variantsString}
                        onChange={e => setProductForm({ ...productForm, variantsString: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl space-y-2 sm:col-span-2 border border-emerald-100">
                      <p className="font-bold text-emerald-950 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" /> Regulasi & Sertifikasi Keamanan Pangan
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[10px] text-emerald-800 font-semibold">Ijin P-IRT</label>
                          <input
                            type="text"
                            placeholder="Sertifikat PIRT"
                            value={productForm.pirt}
                            onChange={e => setProductForm({ ...productForm, pirt: e.target.value })}
                            className="w-full p-1.5 bg-white border border-emerald-200 rounded text-[10px]"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] text-emerald-800 font-semibold">Ijin BPOM RI</label>
                          <input
                            type="text"
                            placeholder="Sertifikasi BPOM"
                            value={productForm.bpom}
                            onChange={e => setProductForm({ ...productForm, bpom: e.target.value })}
                            className="w-full p-1.5 bg-white border border-emerald-200 rounded text-[10px]"
                          />
                        </div>
                        <div className="space-y-0.5 sm:col-span-2">
                          <label className="text-[10px] text-emerald-800 font-semibold">PKRT (Perbekalan Kesehatan RT)</label>
                          <input
                            type="text"
                            placeholder="Nomor Ijin PKRT"
                            value={productForm.pkrt}
                            onChange={e => setProductForm({ ...productForm, pkrt: e.target.value })}
                            className="w-full p-1.5 bg-white border border-emerald-200 rounded text-[10px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="font-semibold text-gray-700">Deskripsi Lengkap Produk</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Jelaskan spesifikasi detail, bahan utama, keunggulan, jangka simpan produk Anda..."
                        value={productForm.description}
                        onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                    >
                      Simpan Produk
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courier tab */}
      {activeTab === 'kurir' && (
        <div className="space-y-4">
          {/* RAJA ONGKIR SETTINGS SECTION */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Layanan Ekspedisi & Kurir Nasional
                </h4>
                <p className="text-gray-500 text-[10px]">Aktifkan pengiriman berskala nasional dan pilih kurir ekspedisi yang didukung.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">Status Layanan:</span>
                <button
                  type="button"
                  onClick={() => setRoEnabled(!roEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    roEnabled ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      roEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {roEnabled && (
              <form onSubmit={handleSaveRajaOngkir} className="space-y-4 text-xs">
                {/* PILIH LOKASI ASAL VENDOR */}
                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl space-y-3 shadow-2xs">
                  <h5 className="font-bold text-gray-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    📍 Tentukan Lokasi Toko Anda (Asal Pengiriman)
                  </h5>
                  <p className="text-gray-500 text-[10px]">
                    Agar ongkos kirim ekspedisi real dan akurat dari Binderbyte, tentukan Provinsi, Kota/Kabupaten, dan Kecamatan asal pengiriman toko Anda.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* PROVINSI */}
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600 block text-[10px] uppercase tracking-wider">Provinsi Asal</label>
                      <select
                        value={selectedRoProvince}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedRoProvince(val);
                          const name = originProvinces.find(p => p.province_id === val)?.province || '';
                          setSelectedRoProvinceName(name);
                          setSelectedRoCity('');
                          setSelectedRoCityName('');
                          setSelectedRoDistrict('');
                          setSelectedRoDistrictName('');
                          if (val) loadOriginCities(val);
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer font-medium"
                        required
                      >
                        <option value="">-- Pilih Provinsi --</option>
                        {originProvinces.map(p => (
                          <option key={p.province_id} value={p.province_id}>{p.province}</option>
                        ))}
                      </select>
                    </div>

                    {/* KOTA / KABUPATEN */}
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600 block text-[10px] uppercase tracking-wider">Kota/Kabupaten Asal</label>
                      <select
                        value={selectedRoCity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedRoCity(val);
                          const found = originCities.find(c => c.city_id === val);
                          const name = found ? `${found.type} ${found.city_name}` : '';
                          setSelectedRoCityName(name);
                          setSelectedRoDistrict('');
                          setSelectedRoDistrictName('');
                          if (val) loadOriginDistricts(val);
                        }}
                        disabled={!selectedRoProvince || roLoadingCities}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
                        required
                      >
                        <option value="">{roLoadingCities ? 'Loading...' : '-- Pilih Kota/Kabupaten --'}</option>
                        {originCities.map(c => (
                          <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* KECAMATAN */}
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600 block text-[10px] uppercase tracking-wider">Kecamatan Asal</label>
                      <select
                        value={selectedRoDistrict}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedRoDistrict(val);
                          const name = originDistricts.find(d => d.district_id === val)?.district_name || '';
                          setSelectedRoDistrictName(name);
                        }}
                        disabled={!selectedRoCity || roLoadingDistricts}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
                        required
                      >
                        <option value="">{roLoadingDistricts ? 'Loading...' : '-- Pilih Kecamatan --'}</option>
                        {originDistricts.map(d => (
                          <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedRoDistrictName && (
                    <div className="text-[10px] text-emerald-800 bg-emerald-50/50 border border-emerald-100/50 px-3 py-2 rounded-lg font-semibold leading-relaxed">
                      📍 <strong>Lokasi Toko/Asal Pengiriman:</strong> Kecamatan {selectedRoDistrictName}, {selectedRoCityName}, Provinsi {selectedRoProvinceName}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 block">Pilih Kurir Ekspedisi yang Diaktifkan:</label>
                  <p className="text-gray-500 text-[10px]">Beri tanda centang pada kurir ekspedisi yang Anda ijinkan untuk mengirim produk Anda:</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {[
                      'jne', 'sicepat', 'jnt', 'pos', 'tiki', 'anteraja', 'wahana', 'ninja', 'lion'
                    ].map(courierCode => {
                      const isChecked = roCouriers.includes(courierCode);
                      return (
                        <label
                          key={courierCode}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                            isChecked
                              ? 'bg-emerald-50/50 border-emerald-500 text-emerald-900 font-semibold shadow-xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                if (roCouriers.length === 1) {
                                  alert("⚠️ Anda harus menyisakan minimal satu kurir ekspedisi aktif!");
                                  return;
                                }
                                setRoCouriers(roCouriers.filter(c => c !== courierCode));
                              } else {
                                setRoCouriers([...roCouriers, courierCode]);
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="uppercase text-xs tracking-wider">{courierCode}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer"
                  >
                    Simpan Pengaturan Ekspedisi
                  </button>
                </div>
              </form>
            )}

            {!roEnabled && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveRajaOngkir}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 border border-slate-200 rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer"
                >
                  Simpan Status Nonaktif
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 my-2 pt-2"></div>

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800">Manajemen Kurir Mandiri Anda ({couriers.length})</h3>
            <button
              onClick={() => openCourierModal(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Sopir Kurir
            </button>
          </div>

          <div className="p-3 bg-emerald-50 text-emerald-950 rounded-xl space-y-1.5 border border-emerald-100/50 text-xs text-justify">
            <p className="font-semibold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" /> Mengapa membuat kurir mandiri?
            </p>
            <p className="text-emerald-800 leading-relaxed text-[11px]">
              Setiap vendor UMKM Tegalsari dapat menggunakan anak buah, ojek desa, tetangga sekitar, atau supir toko sebagai kurir pengiriman sendiri demi kelancaran logistik lokal desa & kecamatan! Saat pembeli memesan produk toko Anda, sistem akan mencocokan jarak titik koordinat GPS toko Anda dengan rumah pembeli dan menerapkan biaya tarif sesuai aturan kurir yang Anda atur di bawah.
            </p>
          </div>

          {couriers.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-200 rounded-2xl">
              <Truck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-xs font-medium">Belum mendaftarkan driver kurir.</p>
              <p className="text-gray-400 text-[10px] mt-0.5">Mulai daftarkan kurir kepercayaan Anda agar orderan COD bisa langsung dikirim.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {couriers.map(c => (
                <div key={c.id} className="p-3 border border-gray-100 rounded-xl flex justify-between items-center bg-gray-50/50 hover:border-emerald-100 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-950 text-xs">{c.name}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.status === 'active' ? 'Aktif' : 'Libur'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono">No.WA: +{c.phone} | Kendaraan: {c.vehicle_type}</p>
                    <p className="text-xs text-gray-600">
                      Tarif Dasar: <span className="font-bold text-gray-900">Rp {c.base_fare.toLocaleString()}</span> | Tarif/KM: <span className="font-bold text-gray-900">Rp {c.price_per_km.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openCourierModal(c)} className="p-1 px-1.5 bg-white text-gray-700 rounded border hover:text-emerald-700 transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCourier(c.id)} className="p-1 px-1.5 bg-white text-gray-700 rounded border hover:text-red-700 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Edit / Create courier modal */}
          {showCourierModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {editingCourier ? 'Edit Driver Kurir' : 'Daftar Supir Kurir Toko'}
                  </h3>
                  <button onClick={() => setShowCourierModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveCourier} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Nama Lengkap Kurir</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama driver"
                      value={courierForm.name}
                      onChange={e => setCourierForm({ ...courierForm, name: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Nomor HP/WhatsApp Supir (Format: 628...)</label>
                    <input
                      type="text"
                      required
                      placeholder="628xxxxxxxxxx"
                      value={courierForm.phone}
                      onChange={e => setCourierForm({ ...courierForm, phone: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Jenis Armada Kendaraan</label>
                    <select
                      value={courierForm.vehicle_type}
                      onChange={e => setCourierForm({ ...courierForm, vehicle_type: e.target.value as Courier['vehicle_type'] })}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                    >
                      <option value="Motor">Motor (Cepat, lincah)</option>
                      <option value="Mobil">Mobil (Muatan besar)</option>
                      <option value="Tricycle">Tricycle / Gerobak Motor</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Tarif Dasar Awal (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 5000"
                        value={courierForm.base_fare || ''}
                        onChange={e => setCourierForm({ ...courierForm, base_fare: Number(e.target.value) })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Biaya Tambahan per KM (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 2000"
                        value={courierForm.price_per_km || ''}
                        onChange={e => setCourierForm({ ...courierForm, price_per_km: Number(e.target.value) })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Status Keaktifan</label>
                    <div className="flex gap-4 p-1 bg-gray-50 rounded-lg border border-gray-200/50">
                      <label className="flex items-center gap-1.5 p-1 px-3 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="courier_status"
                          value="active"
                          checked={courierForm.status === 'active'}
                          onChange={() => setCourierForm({ ...courierForm, status: 'active' })}
                        />
                        <span>Aktif (Siap Antre)</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-1 px-3 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="courier_status"
                          value="inactive"
                          checked={courierForm.status === 'inactive'}
                          onChange={() => setCourierForm({ ...courierForm, status: 'inactive' })}
                        />
                        <span>Libur (Tutup)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowCourierModal(false)}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                    >
                      Simpan Kurir
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affiliate, Commission Setup, and partner settings tab */}
      {activeTab === 'afiliasi' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 text-amber-950 rounded-2xl space-y-2 border border-amber-200 text-xs">
            <p className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-amber-700 shrink-0" /> Sinergi Kemitraan Affiliate Antar-Toko
            </p>
            <p className="text-amber-800 leading-relaxed text-[11px] text-justify">
              Sebagai salah satu fitur unggulan Pasar Tegalsari untuk tingkat Kabupaten, sesama vendor lokal dapat mengajukan kerjasama afiliasi! Setelah menjadi mitra, Anda bisa mengiklankan / memajang link produk toko milik vendor rekanan tersebut. Jika ada warga memesan melalui tautan afiliasi Anda, Anda berhak memperoleh persentase komisi yang dicairkan secara COD atau transfer.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Owner Section: Configure commission percentages */}
            <div className="space-y-4 p-4 border border-gray-100 bg-gray-50/50 rounded-2xl">
              <h3 className="text-xs font-bold uppercase text-emerald-900 flex items-center gap-1">
                <Percent className="w-4 h-4 text-emerald-600" />
                Atur Komisi Afiliator untuk Produk Saya
              </h3>

              <form onSubmit={handleSaveCommission} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Terapkan Pada Produk</label>
                  <select
                    value={commissionForm.product_id}
                    onChange={e => setCommissionForm({ ...commissionForm, product_id: e.target.value })}
                    className="w-full p-2 border border-gray-200 bg-white rounded-lg"
                  >
                    <option value="all">Terapkan pada Semua Produk Saya</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Persentase Komisi (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={50}
                      defaultValue={10}
                      value={commissionForm.commission_percentage}
                      onChange={e => setCommissionForm({ ...commissionForm, commission_percentage: Number(e.target.value) })}
                      className="w-full p-2 pr-8 border border-gray-200 bg-white rounded-lg text-xs"
                    />
                    <span className="absolute right-3.5 top-2.5 font-bold text-gray-400 text-xs">%</span>
                  </div>
                </div>

                <button type="submit" className="px-4 py-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition">
                  Terapkan Setelan Komisi
                </button>
              </form>

              {/* Commission rules listing */}
              <div className="space-y-1.5 pt-3 border-t border-gray-200/60 text-[11px]">
                <p className="font-semibold text-gray-700">Setelan Komisi Terdaftar:</p>
                {commissions.length === 0 ? (
                  <p className="text-gray-400 italic">Belum ada aturan komisi khusus (Setelan bawaan 10% berlaku secara default).</p>
                ) : (
                  <div className="space-y-1">
                    {commissions.map(c => {
                      const prodLabel = c.product_id ? (products.find(p => p.id === c.product_id)?.name || 'Produk Khusus') : 'Semua Produk';
                      return (
                        <div key={c.id} className="flex justify-between p-1.5 bg-white border rounded">
                          <span className="truncate">{prodLabel}</span>
                          <span className="font-bold text-emerald-700 font-mono text-[10px]">{c.commission_percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Approval Section: Approve incoming affiliate requests */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600" /> Pengajuan Mitra Masuk ({incomingRequestDetails.length})
              </h4>

              {incomingRequestDetails.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-3 border border-dashed rounded-xl bg-gray-50 text-center">Belum ada permohonan afiliator tetangga masuk.</p>
              ) : (
                <div className="space-y-2">
                  {incomingRequestDetails.map(({ req, requester }) => (
                    <div key={req.id} className="p-3 border border-amber-100 bg-amber-50/20 rounded-xl flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 text-xs truncate">{requester?.business_name || 'UMKM Rekan'}</p>
                        <p className="text-[10px] text-gray-600 truncate">Sewa Promosi: Desa {requester?.village}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => handleRespondAffiliate(req.id, 'approved')}
                          className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Terima
                        </button>
                        <button
                          onClick={() => handleRespondAffiliate(req.id, 'rejected')}
                          className="p-1 px-2.5 bg-red-100 hover:bg-red-200 text-red-800 rounded text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Verified promoters */}
              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-bold text-gray-700">Afiliator Terverifikasi ({approvedPromotersByMe.length})</p>
                {approvedPromotersByMe.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">Belum memiliki jaringan afiliator aktif.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {approvedPromotersByMe.map(p => {
                      const promoter = otherVendors.find(v => v.id === p.affiliator_vendor_id);
                      return (
                        <span key={p.id} className="text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-medium">
                          {promoter?.business_name || 'Afiliator Toko'} ({promoter?.village})
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Connect Section: apply for affiliate networks to other vendors */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase text-emerald-950 flex items-center gap-1">
              <Users className="w-4 h-4 text-emerald-600" /> Gabung Jaringan Afiliasi UMKM Tegalsari Lainnya
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherVendors.map(vendor => {
                const application = isAppliedTo(vendor.id);
                const applied = !!application;
                const status = application?.status;

                return (
                  <div key={vendor.id} className="border border-gray-100 rounded-xl p-3.5 flex flex-col justify-between gap-3 text-xs bg-white hover:shadow-sm hover:border-emerald-100 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <img src={vendor.logo_url} alt={vendor.business_name} className="w-7 h-7 rounded-lg object-cover" />
                        <span className="font-bold text-emerald-950 truncate max-w-[130px]">{vendor.business_name}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{vendor.description}</p>
                      <p className="text-[10px] text-emerald-700 font-medium">📍 Desa {vendor.village}, Kecamatan Tegalsari</p>
                    </div>

                    {applied ? (
                      status === 'approved' ? (
                        <div className="p-1 px-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-center font-bold rounded-lg text-[10px]">
                          ✓ Terdaftar Sebagai Mitra
                        </div>
                      ) : status === 'rejected' ? (
                        <div className="p-1 px-1.5 bg-red-50 text-red-800 border border-red-200 text-center font-medium rounded-lg text-[10px]">
                          Aplikasi Ditolak
                        </div>
                      ) : (
                        <div className="p-1 px-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-center font-medium rounded-lg text-[10px]">
                          Aplikasi Sedang Ditinjau
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => handleApplyAffiliate(vendor.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-[10px] font-bold border border-emerald-200/50 hover:border-emerald-600 flex items-center justify-center gap-1 transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Ajukan Kerjasama Mitra
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Saldo & Penarikan Tab */}
      {activeTab === 'saldo' && (
        <div className="space-y-6">
          {/* Header summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total balance card */}
            <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm border border-emerald-500/10 space-y-2 relative overflow-hidden">
              <div className="absolute right-[-15px] bottom-[-15px] opacity-10 text-9xl">💰</div>
              <p className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">Saldo Tersedia</p>
              <h3 className="text-3xl font-black font-mono">
                Rp {balanceTransactions.reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString()}
              </h3>
              <p className="text-[10px] text-emerald-100/80 leading-snug">
                Akumulasi penjualan produk dan komisi afiliasi yang siap dicairkan ke rekening bank Anda.
              </p>
            </div>

            {/* Total Income card */}
            <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-2 relative overflow-hidden">
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Pendapatan</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-800">
                Rp {balanceTransactions.filter(t => Number(t.amount) > 0).reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-400">
                Total semua dana masuk dari penjualan produk dan komisi afiliasi yang berhasil diselesaikan.
              </p>
            </div>

            {/* Total Withdrawn card */}
            <div className="p-5 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-2 relative overflow-hidden">
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Penarikan</p>
              <h3 className="text-2xl font-bold font-mono text-amber-600">
                Rp {Math.abs(balanceTransactions.filter(t => Number(t.amount) < 0).reduce((acc, t) => acc + Number(t.amount), 0)).toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-400">
                Jumlah dana yang telah ditarik atau sedang diajukan untuk proses pencairan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left form: request withdrawal */}
            <div className="p-5 border border-gray-150 bg-white rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Landmark className="w-4.5 h-4.5 text-emerald-600" />
                Ajukan Pencairan / Penarikan Saldo
              </h3>

              <form onSubmit={handleRequestWithdrawal} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">Jumlah Penarikan (Rupiah)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-gray-400 font-mono">Rp</span>
                    <input
                      required
                      type="number"
                      min="100000"
                      placeholder="Contoh: 150000"
                      value={withdrawForm.amount}
                      onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800 bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 flex flex-wrap gap-x-2">
                    <span>*Minimal penarikan: <strong className="text-red-600 font-extrabold">Rp 100.000</strong></span>
                    <span>| Maksimal: <span className="font-bold text-emerald-700">Rp {balanceTransactions.reduce((acc, t) => acc + Number(t.amount), 0).toLocaleString()}</span></span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 block">Nama Bank Tujuan</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: BRI, Mandiri, BCA"
                      value={withdrawForm.bank_name}
                      onChange={e => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                      className="w-full p-2 border border-gray-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700 block">Nomor Rekening</label>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: 1234567890"
                      value={withdrawForm.bank_account_number}
                      onChange={e => setWithdrawForm({ ...withdrawForm, bank_account_number: e.target.value })}
                      className="w-full p-2 border border-gray-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">Nama Pemegang Rekening (Atas Nama)</label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={withdrawForm.bank_account_name}
                    onChange={e => setWithdrawForm({ ...withdrawForm, bank_account_name: e.target.value })}
                    className="w-full p-2 border border-gray-200 bg-white rounded-xl focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={balanceTransactions.reduce((acc, t) => acc + Number(t.amount), 0) <= 0}
                  className="w-full py-2.5 bg-emerald-600 disabled:bg-gray-200 disabled:cursor-not-allowed hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" /> Cairkan Saldo Sekarang
                </button>
              </form>
            </div>

            {/* Right: History of Penarikan */}
            <div className="p-5 border border-gray-150 bg-white rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Landmark className="w-4.5 h-4.5 text-amber-600" />
                Status Penarikan Dana Anda
              </h3>

              {withdrawalRequests.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  Belum ada permintaan penarikan dana.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {withdrawalRequests.map(wd => (
                    <div key={wd.id} className="p-3 bg-gray-50/75 border border-gray-150 rounded-xl text-[11px] flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-xs">Rp {Number(wd.amount).toLocaleString()}</p>
                        <p className="text-gray-500 font-medium">{wd.bank_name} • {wd.bank_account_number}</p>
                        <p className="text-gray-400 text-[10px]">Atas Nama: {wd.bank_account_name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {wd.id} • {new Date(wd.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                      <span className={`px-2 py-0.5 font-bold rounded-full text-[9px] ${
                        wd.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : wd.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {wd.status === 'pending' && '⏳ Menunggu Persetujuan'}
                        {wd.status === 'approved' && '✓ Sukses Ditransfer'}
                        {wd.status === 'rejected' && '✗ Ditolak / Refund'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom section: Log Transaksi Saldo (Live Ledger) */}
          <div className="p-5 border border-gray-150 bg-white rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              ⚡ Mutasi Saldo & Log Transaksi Keuangan (Harus LIVE)
            </h3>

            {balanceTransactions.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                Belum ada catatan mutasi saldo. Transaksi Anda akan dibukukan di sini setelah order sukses diselesaikan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50">
                      <th className="p-2">Tanggal</th>
                      <th className="p-2">Jenis</th>
                      <th className="p-2">Jumlah</th>
                      <th className="p-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceTransactions.map(t => (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="p-2 text-gray-400 font-mono text-[10px]">
                          {new Date(t.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.type === 'sales'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.type === 'commission'
                              ? 'bg-blue-100 text-blue-800'
                              : t.type === 'withdrawal'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {t.type === 'sales' && 'Penjualan'}
                            {t.type === 'commission' && 'Komisi'}
                            {t.type === 'withdrawal' && 'Penarikan'}
                            {t.type === 'refund' && 'Pengembalian'}
                          </span>
                        </td>
                        <td className={`p-2 font-mono font-bold ${Number(t.amount) > 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {Number(t.amount) > 0 ? '+' : ''}Rp {Number(t.amount).toLocaleString()}
                        </td>
                        <td className="p-2 text-gray-600 max-w-xs truncate" title={t.description}>
                          {t.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
