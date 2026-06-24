/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { UserProfile, Vendor, AppSetting } from '../types';
import { compressImage } from '../lib/imageCompressor';
import { Check, X, Shield, Users, Settings, Megaphone, Info, RefreshCw, AlertCircle, Sparkles, UploadCloud, Trash2, Plus, CreditCard, Map, Truck, UserCheck, Award, Zap } from 'lucide-react';

interface AdminPanelProps {
  currentProfile: UserProfile;
  appSettings: AppSetting;
  onRefreshSettings: () => void;
}

export default function AdminPanel({ currentProfile, appSettings, onRefreshSettings }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [processingWdId, setProcessingWdId] = useState<string | null>(null);

  // New Category input state
  const [newCategory, setNewCategory] = useState('');

  // New Banner creator state
  const [newBannerImgUrl, setNewBannerImgUrl] = useState('');
  const [newBannerText, setNewBannerText] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerLinkUrl, setNewBannerLinkUrl] = useState('');
  const [newBannerBadgeText, setNewBannerBadgeText] = useState('');
  const [newBannerBadgeUrl, setNewBannerBadgeUrl] = useState('');
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // New Right Banner creator state
  const [newRBMediaUrl, setNewRBMediaUrl] = useState('');
  const [newRBTitle, setNewRBTitle] = useState('');
  const [newRBSubtitle, setNewRBSubtitle] = useState('');
  const [newRBLinkUrl, setNewRBLinkUrl] = useState('');
  const [newRBBadgeText, setNewRBBadgeText] = useState('');

  // App settings form
  const [settingsForm, setSettingsForm] = useState({
    app_name: '',
    logo_url: '',
    banner_url: '',
    contact_phone: '',
    website_mode: 'active' as AppSetting['website_mode'],
    announcement: '',
    about_us: '',
    about_us_welcome_heading: '',
    about_us_welcome_text: '',
    about_us_hero_img: '',
    about_us_villages: '',
    about_us_quote_text: '',
    about_us_quote_author: '',
    carousel_badge_text: '',
    carousel_badge_url: '',
    footer_text: '',
    footer_address: '',
    categories: [] as string[],
    pakasir_enabled: false,
    pakasir_api_key: '',
    pakasir_merchant_id: '',
    google_maps_enabled: true,
    google_maps_api_key: '',
    payment_methods: [] as string[],
    shipping_methods: '[]',
    banner_duration: 3000,
    banners: [] as Exclude<AppSetting['banners'], undefined>,
    banner_layout_desktop: 'full' as 'full' | 'split',
    right_banner_img: '',
    right_banner_title: '',
    right_banner_subtitle: '',
    right_banner_link: '',
    right_banner_badge: '',
    right_banners: [] as Array<{
      id: string;
      media_url: string;
      media_type: 'image' | 'video';
      title?: string;
      subtitle?: string;
      link_url?: string;
      badge_text?: string;
      status: 'active' | 'inactive';
    }>,
    right_banner_duration: 3000,
    membership_settings: {
      free: { price: 0, max_products: 5, name: 'FREE' },
      premium: { price: 50000, max_products: 25, name: 'PREMIUM' },
      vip: { price: 150000, max_products: 1000, name: 'VIP' }
    },
    admin_commission_percent: 5,
    admin_commission_flat: 0
  });

  useEffect(() => {
    loadAdminData();
  }, [appSettings]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Fetch settings
      setSettingsForm({
        app_name: appSettings.app_name || 'PASAR UMKM TEGALSARI',
        logo_url: appSettings.logo_url || '',
        banner_url: appSettings.banner_url || '',
        contact_phone: appSettings.contact_phone || '6281234567890',
        website_mode: appSettings.website_mode || 'active',
        announcement: appSettings.announcement || '',
        about_us: appSettings.about_us || '',
        about_us_welcome_heading: appSettings.about_us_welcome_heading || '',
        about_us_welcome_text: appSettings.about_us_welcome_text || '',
        about_us_hero_img: appSettings.about_us_hero_img || '',
        about_us_villages: appSettings.about_us_villages || '',
        about_us_quote_text: appSettings.about_us_quote_text || '',
        about_us_quote_author: appSettings.about_us_quote_author || '',
        carousel_badge_text: appSettings.carousel_badge_text || '',
        carousel_badge_url: appSettings.carousel_badge_url || '',
        footer_text: appSettings.footer_text || '',
        footer_address: appSettings.footer_address || '',
        categories: appSettings.categories || ['Makanan Ringan', 'Minuman Tradisional', 'Batik & Sandang', 'Kesehatan & Herbal', 'Sembako & Hasil Bumi', 'Kerajinan Tangan'],
        pakasir_enabled: !!appSettings.pakasir_enabled,
        pakasir_api_key: appSettings.pakasir_api_key || '',
        pakasir_merchant_id: appSettings.pakasir_merchant_id || '',
        google_maps_enabled: appSettings.google_maps_enabled !== false,
        google_maps_api_key: appSettings.google_maps_api_key || '',
        payment_methods: appSettings.payment_methods || ['COD'],
        shipping_methods: appSettings.shipping_methods || '["Kurir Mandiri Vendor", "Ambil Sendiri ke Toko"]',
        banner_duration: appSettings.banner_duration || 3000,
        banners: appSettings.banners || [
          {
            id: 'banner_1',
            image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
            text: 'Selamat Datang di Pasar UMKM Tegalsari',
            link_url: '',
            status: 'active'
          }
        ],
        banner_layout_desktop: appSettings.banner_layout_desktop || 'full',
        right_banner_img: appSettings.right_banner_img || '',
        right_banner_title: appSettings.right_banner_title || '',
        right_banner_subtitle: appSettings.right_banner_subtitle || '',
        right_banner_link: appSettings.right_banner_link || '',
        right_banner_badge: appSettings.right_banner_badge || '',
        right_banners: appSettings.right_banners || [
          {
            id: 'rb_1',
            media_url: appSettings.right_banner_img || 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&q=80&w=600',
            media_type: 'image',
            title: appSettings.right_banner_title || 'Promo Karya Tetangga',
            subtitle: appSettings.right_banner_subtitle || 'Dukung pertumbuhan ekonomi kreatif lokal Kecamatan Tegalsari hari ini.',
            link_url: appSettings.right_banner_link || '',
            badge_text: appSettings.right_banner_badge || 'PROMO TERBATAS',
            status: 'active'
          }
        ],
        right_banner_duration: appSettings.right_banner_duration || 3000,
        membership_settings: appSettings.membership_settings || {
          free: { price: 0, max_products: 5, name: 'FREE' },
          premium: { price: 50000, max_products: 25, name: 'PREMIUM' },
          vip: { price: 150000, max_products: 1000, name: 'VIP' }
        },
        admin_commission_percent: appSettings.admin_commission_percent ?? 5,
        admin_commission_flat: appSettings.admin_commission_flat ?? 0
      });

      // Fetch users
      const allUsers = await db.getUsers();
      setUsers(allUsers);

      // Fetch vendors
      const allVendors = await db.getVendors();
      setVendors(allVendors);

      // Fetch withdrawal requests
      const allWds = await db.getWithdrawalRequests();
      setWithdrawalRequests(allWds);

    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'Gagal mengambil data administratif: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await db.updateAppSettings({
        app_name: settingsForm.app_name,
        logo_url: settingsForm.logo_url,
        banner_url: settingsForm.banner_url,
        contact_phone: settingsForm.contact_phone,
        website_mode: settingsForm.website_mode,
        announcement: settingsForm.announcement,
        about_us: settingsForm.about_us,
        about_us_welcome_heading: settingsForm.about_us_welcome_heading,
        about_us_welcome_text: settingsForm.about_us_welcome_text,
        about_us_hero_img: settingsForm.about_us_hero_img,
        about_us_villages: settingsForm.about_us_villages,
        about_us_quote_text: settingsForm.about_us_quote_text,
        about_us_quote_author: settingsForm.about_us_quote_author,
        carousel_badge_text: settingsForm.carousel_badge_text,
        carousel_badge_url: settingsForm.carousel_badge_url,
        footer_text: settingsForm.footer_text,
        footer_address: settingsForm.footer_address,
        categories: settingsForm.categories,
        pakasir_enabled: settingsForm.pakasir_enabled,
        pakasir_api_key: settingsForm.pakasir_api_key,
        pakasir_merchant_id: settingsForm.pakasir_merchant_id,
        google_maps_enabled: settingsForm.google_maps_enabled,
        google_maps_api_key: settingsForm.google_maps_api_key,
        payment_methods: settingsForm.payment_methods,
        shipping_methods: settingsForm.shipping_methods,
        banner_duration: settingsForm.banner_duration,
        banners: settingsForm.banners,
        banner_layout_desktop: settingsForm.banner_layout_desktop,
        right_banner_img: settingsForm.right_banner_img,
        right_banner_title: settingsForm.right_banner_title,
        right_banner_subtitle: settingsForm.right_banner_subtitle,
        right_banner_link: settingsForm.right_banner_link,
        right_banner_badge: settingsForm.right_banner_badge,
        right_banners: settingsForm.right_banners,
        right_banner_duration: Number(settingsForm.right_banner_duration),
        membership_settings: settingsForm.membership_settings,
        admin_commission_percent: Number(settingsForm.admin_commission_percent),
        admin_commission_flat: Number(settingsForm.admin_commission_flat)
      });
      setMessage({ text: 'Pengaturan website berhasil diperbarui secara global!', type: 'success' });
      onRefreshSettings();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleUpdateUserRole = async (userId: string, role: 'buyer' | 'vendor' | 'admin') => {
    setMessage(null);
    try {
      await db.updateProfileRole(userId, role);
      setMessage({ text: 'Peran pengguna berhasil diperbarui!', type: 'success' });
      loadAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentProfile.id) {
      setMessage({ text: 'Anda tidak dapat menghapus akun Anda sendiri!', type: 'error' });
      return;
    }
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini dari sistem secara permanen?')) return;
    setMessage(null);
    try {
      await db.deleteUser(userId);
      setMessage({ text: 'Pengguna berhasil dihapus secara permanen dari sistem.', type: 'success' });
      loadAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logo_url' | 'banner_url' | 'right_banner_img') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Logos look great at 400x400, banners at 1200x600 with high clarity
      const maxW = fieldName === 'logo_url' ? 400 : 1200;
      const maxH = fieldName === 'logo_url' ? 400 : 600;
      const compressed = await compressImage(file, maxW, maxH, 0.8);
      setSettingsForm(prev => ({ ...prev, [fieldName]: compressed }));
    } catch (err) {
      console.error('Gagal kompres gambar:', err);
      // Fallback to standard reader
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSettingsForm(prev => ({ ...prev, [fieldName]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (settingsForm.categories.includes(trimmed)) {
      alert('Kategori sudah ada!');
      return;
    }
    setSettingsForm(prev => ({
      ...prev,
      categories: [...prev.categories, trimmed]
    }));
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    setSettingsForm(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== cat)
    }));
  };

  const handleBannerLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 1200, 600, 0.8);
      setNewBannerImgUrl(compressed);
    } catch (err) {
      console.error('Gagal kompres banner:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewBannerImgUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBanner = () => {
    if (!newBannerImgUrl.trim()) {
      alert('Pilih gambar lokal atau masukkan tautan URL gambar banner!');
      return;
    }
    const nb = {
      id: 'banner_' + Date.now(),
      image_url: newBannerImgUrl.trim(),
      text: newBannerText.trim() || undefined,
      subtitle: newBannerSubtitle.trim() || undefined,
      link_url: newBannerLinkUrl.trim() || undefined,
      badge_text: newBannerBadgeText.trim() || undefined,
      badge_url: newBannerBadgeUrl.trim() || undefined,
      status: 'active' as const
    };
    setSettingsForm(prev => ({
      ...prev,
      banners: [...(prev.banners || []), nb]
    }));
    setNewBannerImgUrl('');
    setNewBannerText('');
    setNewBannerSubtitle('');
    setNewBannerLinkUrl('');
    setNewBannerBadgeText('');
    setNewBannerBadgeUrl('');
  };

  const handleRemoveBanner = (id: string) => {
    setSettingsForm(prev => ({
      ...prev,
      banners: (prev.banners || []).filter(b => b.id !== id)
    }));
  };

  const handleToggleBannerStatus = (id: string) => {
    setSettingsForm(prev => ({
      ...prev,
      banners: (prev.banners || []).map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b)
    }));
  };

  const handleUpdateBannerField = (id: string, field: string, value: any) => {
    setSettingsForm(prev => ({
      ...prev,
      banners: (prev.banners || []).map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const handleAddRightBanner = () => {
    if (!newRBMediaUrl.trim()) {
      alert('Pilih gambar lokal atau masukkan tautan URL gambar!');
      return;
    }
    const nrb = {
      id: 'rb_' + Date.now(),
      media_url: newRBMediaUrl.trim(),
      media_type: 'image' as const,
      title: newRBTitle.trim() || undefined,
      subtitle: newRBSubtitle.trim() || undefined,
      link_url: newRBLinkUrl.trim() || undefined,
      badge_text: newRBBadgeText.trim() || undefined,
      status: 'active' as const
    };
    setSettingsForm(prev => ({
      ...prev,
      right_banners: [...(prev.right_banners || []), nrb]
    }));
    setNewRBMediaUrl('');
    setNewRBTitle('');
    setNewRBSubtitle('');
    setNewRBLinkUrl('');
    setNewRBBadgeText('');
  };

  const handleRemoveRightBanner = (id: string) => {
    setSettingsForm(prev => ({
      ...prev,
      right_banners: (prev.right_banners || []).filter(rb => rb.id !== id)
    }));
  };

  const handleToggleRightBannerStatus = (id: string) => {
    setSettingsForm(prev => ({
      ...prev,
      right_banners: (prev.right_banners || []).map(rb => rb.id === id ? { ...rb, status: rb.status === 'active' ? 'inactive' : 'active' } : rb)
    }));
  };

  const handleRightBannerLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const compressed = await compressImage(file, 800, 1200, 0.8);
      setNewRBMediaUrl(compressed);
    } catch (err) {
      console.error('Gagal kompres gambar:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewRBMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePaymentMethod = (method: string) => {
    setSettingsForm(prev => {
      const active = prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method];
      
      // Prevent completely empty payment methods
      const finalMethods = active.length === 0 ? [method] : active;
      return { ...prev, payment_methods: finalMethods };
    });
  };

  const handleApproveVendor = async (vendorId: string) => {
    setMessage(null);
    try {
      await db.updateVendorStatus(vendorId, 'approved');
      setMessage({ text: 'Vendor berhasil disetujui! Perannya diperbarui menjadi Vendor.', type: 'success' });
      loadAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleRejectVendor = async (vendorId: string) => {
    setMessage(null);
    try {
      await db.updateVendorStatus(vendorId, 'rejected');
      setMessage({ text: 'Pengajuan vendor berhasil ditolak.', type: 'success' });
      loadAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleApproveWithdrawal = async (wdId: string) => {
    setMessage(null);
    try {
      await db.updateWithdrawalStatus(wdId, 'approved');
      setMessage({ text: 'Permintaan penarikan dana berhasil disetujui dan ditransfer!', type: 'success' });
      loadAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleApproveWithdrawalOtomatis = async (wd: any) => {
    setMessage(null);
    setProcessingWdId(wd.id);
    try {
      // Call our server-side proxy
      const res = await fetch('/api/pakasir/disbursement/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wdId: wd.id,
          amount: Number(wd.amount),
          bank_name: wd.bank_name,
          bank_account_number: wd.bank_account_number,
          bank_account_name: wd.bank_account_name
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal memproses penarikan saldo otomatis via Pakasir');
      }

      // Also trigger db update to sync local state correctly
      await db.updateWithdrawalStatus(wd.id, 'approved');

      setMessage({
        text: `Sukses! Penarikan saldo Rp ${Number(wd.amount).toLocaleString()} berhasil dikirim otomatis via Pakasir. ${result.is_simulated ? '(Mode Simulasi / Sandbox)' : ''}`,
        type: 'success'
      });
      loadAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setProcessingWdId(null);
    }
  };

  const handleRejectWithdrawal = async (wdId: string) => {
    setMessage(null);
    try {
      await db.updateWithdrawalStatus(wdId, 'rejected');
      setMessage({ text: 'Permintaan penarikan dana ditolak dan saldo berhasil dikembalikan ke vendor.', type: 'success' });
      loadAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="ml-2 text-xs text-gray-500">Memuat konsol admin...</span>
      </div>
    );
  }

  const pendingVendors = vendors.filter(v => v.status === 'pending');
  const approvedVendors = vendors.filter(v => v.status === 'approved');

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-950 font-display flex items-center gap-1.5">
            <Shield className="w-5.5 h-5.5 text-emerald-700" /> Panel Administrasi Konsol
          </h2>
          <p className="text-gray-500 text-xs">Atur sistem, verifikasi vendor, dan kustomisasi konten aplikasi Pasar Tegalsari.</p>
        </div>
        <button
          onClick={loadAdminData}
          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Segarkan Konsol
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Total Pengguna</p>
          <p className="text-2xl font-bold text-emerald-950">{users.length}</p>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Vendor Terdaftar</p>
          <p className="text-2xl font-bold text-amber-950">{vendors.length}</p>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Menunggu Persetujuan</p>
          <p className="text-2xl font-bold text-emerald-950">{pendingVendors.length}</p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-gray-700 tracking-wider">Mode Website</p>
          <p className="text-xs font-bold font-mono text-gray-900 uppercase pt-2.5">{appSettings.website_mode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Verifying vendors & User Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending vendors */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Persetujuan Pendaftaran Vendor / UMKM Baru ({pendingVendors.length})
            </h3>

            {pendingVendors.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                <p className="text-xs text-gray-500 italic">Belum ada pengajuan pendaftaran vendor baru.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingVendors.map(v => {
                  const requester = users.find(u => u.id === v.id);
                  return (
                    <div key={v.id} className="p-4 border border-amber-100 bg-amber-50/10 rounded-xl space-y-3">
                      <div className="flex gap-3 justify-between items-start">
                        <img src={v.logo_url} alt={v.business_name} className="w-12 h-12 rounded-lg object-cover border border-amber-200 shadow-xs" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-bold text-emerald-950 text-xs truncate">{v.business_name}</p>
                          <p className="text-[10px] text-gray-500 leading-relaxed">{v.description}</p>
                          <p className="text-[11px] text-emerald-800 font-medium">📍 Desa {v.village}, Alamat: {v.address}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Pendaftar: {requester?.name || 'User'} ({v.phone})</p>
                        </div>
                      </div>

                      {/* KTP Section - Mandatory validation */}
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] text-slate-700 font-semibold">
                          <span>KARTU TANDA PENDUDUK (KTP)</span>
                          {v.ktp_url ? (
                            <span className="text-emerald-600">Terlampir ✓</span>
                          ) : (
                            <span className="text-red-500">KTP Kosong / Belum Diunggah ⚠️</span>
                          )}
                        </div>
                        {v.ktp_url ? (
                          <div className="mt-1">
                            <details className="cursor-pointer group">
                              <summary className="text-[10px] text-emerald-700 font-bold hover:underline">
                                Lihat Berkas KTP Pemilik Toko (Klik untuk Perbesar)
                              </summary>
                              <div className="mt-2 bg-white p-2 rounded-lg border border-slate-200/60 shadow-xs flex justify-center max-w-sm">
                                <img src={v.ktp_url} alt="KTP Vendor" className="max-h-48 rounded object-contain" referrerPolicy="no-referrer" />
                              </div>
                            </details>
                          </div>
                        ) : (
                          <p className="text-[9.5px] text-xs text-red-500 italic">Pendaftar belum mengunggah salinan KTP yang valid.</p>
                        )}
                      </div>

                      {/* Bank Details check */}
                      <div className="p-2 border border-slate-150/60 bg-white rounded-lg flex items-center justify-between text-[11px] text-gray-700 font-mono">
                        <span>Pencairan: {v.bank_name} - {v.bank_account_number}</span>
                        <span>A.N: {v.bank_account_name}</span>
                      </div>

                      {/* Membership & Payment Verification Section */}
                      <div className="p-2.5 bg-emerald-50/20 rounded-lg border border-emerald-100/60 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">Tingkat Keanggotaan:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            v.membership_tier === 'vip' 
                              ? 'bg-purple-100 text-purple-800' 
                              : v.membership_tier === 'premium' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-800'
                          }`}>
                            {v.membership_tier?.toUpperCase() || 'FREE'}
                          </span>
                        </div>
                        {v.membership_tier && v.membership_tier !== 'free' && (
                          <div className="space-y-1 mt-1 pt-1 border-t border-emerald-100/30">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500">Metode Bayar:</span>
                              <span className="font-semibold text-slate-800 uppercase">{v.memb_pay_method || 'Tidak Diketahui'}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500">Status Pembayaran:</span>
                              <span className={`font-bold ${v.memb_pay_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {v.memb_pay_status?.toUpperCase() || 'MENUNGGU VERIFIKASI'}
                              </span>
                            </div>
                            {v.memb_pay_proof && (
                              <div className="mt-1">
                                <details className="cursor-pointer group">
                                  <summary className="text-[10px] text-emerald-700 font-bold hover:underline">
                                    Lihat Bukti Pembayaran (Klik untuk Perbesar)
                                  </summary>
                                  <div className="mt-2 bg-white p-2 rounded-lg border shadow-xs max-w-sm flex justify-center">
                                    <img src={v.memb_pay_proof} alt="Bukti Transfer" className="max-h-48 rounded object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => handleApproveVendor(v.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Setujui Toko
                        </button>
                        <button
                          onClick={() => handleRejectVendor(v.id)}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-100 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active/Approved Vendors & Membership Management */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              Daftar Vendor Aktif & Pengaturan Keanggotaan ({approvedVendors.length})
            </h3>

            {approvedVendors.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                <p className="text-xs text-gray-500 italic">Belum ada vendor aktif.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedVendors.map(v => {
                  const requester = users.find(u => u.id === v.id);
                  const hasPendingUpgrade = v.memb_pay_status === 'pending';
                  
                  return (
                    <div key={v.id} className="p-4 border border-gray-150 bg-white rounded-xl space-y-3 text-xs">
                      <div className="flex gap-3 justify-between items-start">
                        <img src={v.logo_url} alt={v.business_name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 truncate">{v.business_name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider ${
                              v.membership_tier === 'vip' 
                                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                : v.membership_tier === 'premium' 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                  : 'bg-slate-100 text-slate-800 border border-slate-250'
                            }`}>
                              {v.membership_tier?.toUpperCase() || 'FREE'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium">📍 Desa {v.village} | Pemilik: {requester?.name || 'User'} ({v.phone})</p>
                        </div>
                      </div>

                      {/* Display upgrade payment proof if pending */}
                      {hasPendingUpgrade && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold text-amber-800">
                            <span>⚠️ PENGAJUAN UPGRADE MEMBER ({v.membership_tier?.toUpperCase()})</span>
                            <span className="bg-amber-100 px-1.5 py-0.5 rounded text-[8px]">BUTUH VERIFIKASI</span>
                          </div>
                          <div className="text-[10px] text-gray-600">
                            Metode: <strong className="uppercase">{v.memb_pay_method || 'transfer'}</strong>
                          </div>
                          {v.memb_pay_proof && (
                            <div>
                              <details className="cursor-pointer group">
                                <summary className="text-[10px] text-amber-700 font-bold hover:underline">
                                  Lihat Bukti Transfer Upgrade (Klik untuk Perbesar)
                                </summary>
                                <div className="mt-1.5 bg-white p-2 rounded-lg border max-w-sm flex justify-center">
                                  <img src={v.memb_pay_proof} alt="Bukti Transfer Upgrade" className="max-h-48 rounded object-contain" referrerPolicy="no-referrer" />
                                </div>
                              </details>
                            </div>
                          )}

                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              onClick={async () => {
                                try {
                                  await db.updateVendor(v.id, {
                                    memb_pay_status: 'paid'
                                  });
                                  setMessage({ text: `Pembayaran upgrade keanggotaan untuk ${v.business_name} berhasil diverifikasi!`, type: 'success' });
                                  loadAdminData();
                                } catch (err: any) {
                                  setMessage({ text: err.message, type: 'error' });
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] cursor-pointer shadow-xs"
                            >
                              Konfirmasi Pembayaran Lunas✓
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await db.updateVendor(v.id, {
                                    memb_pay_status: 'unpaid',
                                    memb_pay_proof: ''
                                  });
                                  setMessage({ text: `Pembayaran upgrade ditolak.`, type: 'success' });
                                  loadAdminData();
                                } catch (err: any) {
                                  setMessage({ text: err.message, type: 'error' });
                                }
                              }}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded text-[10px] border border-red-100 cursor-pointer"
                            >
                              Tolak Bukti
                            </button>
                          </div>
                        </div>
                      )}

                      {/* General Membership adjustment */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
                        <span className="text-gray-500">Atur Tingkat Member secara manual:</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={async () => {
                              try {
                                await db.updateVendor(v.id, { membership_tier: 'FREE', memb_pay_status: 'unpaid' });
                                setMessage({ text: `Status ${v.business_name} diubah ke FREE.`, type: 'success' });
                                loadAdminData();
                              } catch (err: any) {
                                setMessage({ text: err.message, type: 'error' });
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.membership_tier === 'FREE' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-150'}`}
                          >
                            FREE
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await db.updateVendor(v.id, { membership_tier: 'PREMIUM', memb_pay_status: 'paid' });
                                setMessage({ text: `Status ${v.business_name} ditingkatkan ke PREMIUM.`, type: 'success' });
                                loadAdminData();
                              } catch (err: any) {
                                setMessage({ text: err.message, type: 'error' });
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.membership_tier === 'PREMIUM' ? 'bg-amber-200 text-amber-800' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                          >
                            PREMIUM
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await db.updateVendor(v.id, { membership_tier: 'VIP', memb_pay_status: 'paid' });
                                setMessage({ text: `Status ${v.business_name} ditingkatkan ke VIP.`, type: 'success' });
                                loadAdminData();
                              } catch (err: any) {
                                setMessage({ text: err.message, type: 'error' });
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.membership_tier === 'VIP' ? 'bg-purple-200 text-purple-800' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                          >
                            VIP
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Withdrawal Requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Persetujuan Penarikan Saldo Vendor / UMKM ({withdrawalRequests.filter(r => r.status === 'pending').length})
            </h3>

            {withdrawalRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                <p className="text-xs text-gray-500 italic">Belum ada pengajuan penarikan saldo yang tertunda (pending).</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalRequests.filter(r => r.status === 'pending').map(wd => {
                  const requesterVendor = vendors.find(v => v.id === wd.vendor_id);
                  return (
                    <div key={wd.id} className="p-4 border border-emerald-100 bg-emerald-50/10 rounded-xl space-y-3 text-xs">
                      <div className="flex gap-3 justify-between items-start">
                        {requesterVendor?.logo_url && (
                          <img src={requesterVendor.logo_url} alt={requesterVendor.business_name} className="w-10 h-10 rounded-lg object-cover border border-emerald-200 shadow-xs" />
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-bold text-emerald-950 text-xs">
                            {requesterVendor?.business_name || 'Vendor UMKM'} (📍 Desa {requesterVendor?.village || 'Tegalsari'})
                          </p>
                          <p className="text-[10px] text-gray-500">Diajukan pada: {new Date(wd.created_at).toLocaleString('id-ID')}</p>
                          <p className="text-sm font-extrabold text-emerald-700 font-mono">
                            Jumlah Pencairan: Rp {Number(wd.amount).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Bank account detail */}
                      <div className="p-2.5 bg-white border border-gray-200 rounded-lg flex flex-col gap-1 text-[11px] font-mono text-slate-800">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Nama Bank:</span>
                          <span className="font-bold text-slate-900">{wd.bank_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Nomor Rekening:</span>
                          <span className="font-bold text-slate-900">{wd.bank_account_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Atas Nama (A.N):</span>
                          <span className="font-bold text-slate-900">{wd.bank_account_name}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 justify-end pt-1">
                        <button
                          disabled={processingWdId !== null}
                          onClick={() => handleApproveWithdrawalOtomatis(wd)}
                          className={`px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs ${processingWdId === wd.id ? 'opacity-70 cursor-wait' : ''}`}
                        >
                          {processingWdId === wd.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Memproses...
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5" />
                              Kirim Otomatis via Pakasir
                            </>
                          )}
                        </button>
                        <button
                          disabled={processingWdId !== null}
                          onClick={() => handleApproveWithdrawal(wd.id)}
                          className="px-3 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 border border-gray-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-slate-500" /> Setujui Manual
                        </button>
                        <button
                          disabled={processingWdId !== null}
                          onClick={() => handleRejectWithdrawal(wd.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold border border-red-100 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Users lists - MANAGE USER IN PANEL ADMIN */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Daftar Semua Pengguna Marketplace ({users.length})
            </h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {users.map(u => (
                  <div key={u.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">{u.name}</p>
                        <span className={`px-2 py-0.5 text-[8.5px] font-bold rounded-full uppercase tracking-wider shrink-0 ${
                          u.role === 'admin'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : u.role === 'vendor'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-250'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono truncate">{u.email} | {u.phone}</p>
                      <p className="text-[10px] text-emerald-800 font-medium">📍 Desa: {u.village} | Kecamatan: {u.kecamatan}</p>
                    </div>

                    {/* Interactive operations */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Ganti Peran:</span>
                        <select
                          value={u.role}
                          onChange={e => handleUpdateUserRole(u.id, e.target.value as any)}
                          className="bg-white border border-slate-200 text-slate-700 text-[10.5px] rounded-lg px-2 py-1 outline-hidden font-medium cursor-pointer"
                        >
                          <option value="buyer">Pembeli (Buyer)</option>
                          <option value="vendor">Penjual (Vendor)</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg hover:text-red-700 transition cursor-pointer border border-transparent hover:border-red-100"
                        title="Hapus Akun Pengguna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Global app settings & Configuration Forms */}
        <div className="space-y-6">
          <div className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase text-emerald-950 flex items-center gap-1.5 border-b border-emerald-100/50 pb-2">
              <Settings className="w-4 h-4 text-emerald-600" /> Kustomisasi Website
            </h3>

            <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Nama Aplikasi</label>
                <input
                  type="text"
                  required
                  value={settingsForm.app_name}
                  onChange={e => setSettingsForm({ ...settingsForm, app_name: e.target.value })}
                  className="w-full p-2 border border-emerald-250 bg-white rounded-lg text-xs"
                />
              </div>

              {/* Logo local upload & manual text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700 flex justify-between">
                  <span>Logo Website</span>
                  <span className="text-[10px] text-emerald-700">Bisa upload file lokal</span>
                </label>
                <div className="flex gap-2 items-center">
                  {settingsForm.logo_url && (
                    <img src={settingsForm.logo_url} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                  )}
                  <div className="relative flex-1 border-2 border-dashed border-slate-200 bg-white hover:border-emerald-500 rounded-xl p-2 text-center transition cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleLocalUpload(e, 'logo_url')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-[10.5px] text-slate-500 font-medium flex items-center justify-center gap-1">
                      <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                      <span>Pilih Logo Lokal</span>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Atau masukkan URL Logo eksternal..."
                  value={settingsForm.logo_url}
                  onChange={e => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                  className="w-full p-1.5 border border-slate-200 bg-white rounded-lg text-[10.5px]"
                />
              </div>

              {/* Banner Cover local upload & manual text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-gray-700 flex justify-between">
                  <span>Banner Sampul Utama</span>
                  <span className="text-[10px] text-emerald-700">Bisa upload file lokal</span>
                </label>
                <div className="flex gap-2 items-center">
                  {settingsForm.banner_url && (
                    <img src={settingsForm.banner_url} className="w-12 h-8 rounded-md object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                  )}
                  <div className="relative flex-1 border-2 border-dashed border-slate-200 bg-white hover:border-emerald-500 rounded-xl p-2 text-center transition cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleLocalUpload(e, 'banner_url')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-[10.5px] text-slate-500 font-medium flex items-center justify-center gap-1">
                      <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                      <span>Pilih Banner Lokal</span>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Atau masukkan URL Banner eksternal..."
                  value={settingsForm.banner_url}
                  onChange={e => setSettingsForm({ ...settingsForm, banner_url: e.target.value })}
                  className="w-full p-1.5 border border-slate-200 bg-white rounded-lg text-[10.5px]"
                />
              </div>

              {/* Category Management */}
              <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2.5">
                <label className="font-bold text-gray-700 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" /> Kelola Kategori Produk ({settingsForm.categories.length})
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Contoh: Keripik, Madu, Tenun"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                    className="flex-1 p-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-xs flex items-center"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {settingsForm.categories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-800 text-[10.5px] font-semibold rounded-full border border-slate-150">
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="p-0.5 text-slate-400 hover:text-red-500 transition"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Payment & Pakasir configuration panel */}
              <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-3">
                <label className="font-bold text-gray-700 flex items-center gap-1.5 text-emerald-850">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-650" /> Konfigurasi Pembayaran & Pakasir
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-1.5 border border-slate-100 bg-slate-50/50 rounded-lg">
                    <span className="font-medium text-slate-700 text-[11px]">Metode Pembayaran COD (Tunai)</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.payment_methods.includes('COD')}
                      onChange={() => handleTogglePaymentMethod('COD')}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="flex items-center justify-between p-1.5 border border-slate-100 bg-slate-50/50 rounded-lg">
                    <span className="font-medium text-slate-700 text-[11px]">Transfer Rekening / Manual Bank</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.payment_methods.includes('Transfer Bank Local')}
                      onChange={() => handleTogglePaymentMethod('Transfer Bank Local')}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="flex items-center justify-between p-1.5 border border-slate-100 bg-slate-50/50 rounded-lg">
                    <span className="font-medium text-slate-700 text-[11px]">Integrasi Pakasir QRIS Gateway</span>
                    <input
                      type="checkbox"
                      checked={settingsForm.payment_methods.includes('Pakasir QRIS')}
                      onChange={() => handleTogglePaymentMethod('Pakasir QRIS')}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-800">Gunakan Payment Gateway Pakasir</span>
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, pakasir_enabled: !settingsForm.pakasir_enabled })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                        settingsForm.pakasir_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {settingsForm.pakasir_enabled ? 'Aktif' : 'Non-aktif'}
                    </button>
                  </div>

                  {settingsForm.pakasir_enabled && (
                    <div className="space-y-3 bg-slate-50/50 p-2.5 border border-slate-150 rounded-lg">
                      <div>
                        <span className="text-[10px] text-gray-550 block font-semibold">Pakasir Slug / Project Name (Merchant ID)</span>
                        <input
                          type="text"
                          required={settingsForm.pakasir_enabled}
                          placeholder="Masukkan Slug / Project Name Pakasir"
                          value={settingsForm.pakasir_merchant_id}
                          onChange={e => setSettingsForm({ ...settingsForm, pakasir_merchant_id: e.target.value })}
                          className="w-full p-1.5 border border-slate-200 bg-white rounded-lg text-[10.5px]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-550 block font-semibold">Pakasir API Key (Secret Key)</span>
                        <input
                          type="password"
                          required={settingsForm.pakasir_enabled}
                          placeholder="pks_live_xxxxxxxxxxxxxxxx"
                          value={settingsForm.pakasir_api_key}
                          onChange={e => setSettingsForm({ ...settingsForm, pakasir_api_key: e.target.value })}
                          className="w-full p-1.5 border border-slate-200 bg-white rounded-lg text-[10.5px]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-550 block font-semibold">URL Webhook Pakasir (Otomatis Terisi)</span>
                        <div className="flex gap-1.5 mt-0.5">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/api/pakasir/webhook`}
                            className="flex-1 p-1.5 border border-slate-200 bg-slate-100 rounded-lg text-[10px] font-mono text-slate-600 select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/api/pakasir/webhook`);
                              alert('URL Webhook berhasil disalin! Silakan tempel (paste) di menu Webhook panel Pakasir Anda.');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer transition shadow-sm"
                          >
                            Salin
                          </button>
                        </div>
                        <p className="text-[8.5px] text-slate-450 mt-1 leading-snug">
                          Salin URL di atas dan tempelkan ke kolom <strong>Webhook URL</strong> pada menu Developer / Webhook di panel dashboard Pakasir Anda agar status pembayaran otomatis terupdate sukses di aplikasi Pasar UMKM Tegalsari.
                        </p>
                      </div>
                      <p className="text-[9px] text-slate-450 italic leading-snug pt-0.5 border-t border-slate-200/60">Pakasir memproses integrasi QRIS, retail bank transfer, dan e-wallet lokal Banyuwangi otomatis untuk UMKM.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Maps API configuration */}
              <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2.5">
                <label className="font-bold text-gray-750 flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-sky-600" /> Google Maps API & Titik Koordinat
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-700">Aktifkan Google Maps koordinat</span>
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, google_maps_enabled: !settingsForm.google_maps_enabled })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                      settingsForm.google_maps_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {settingsForm.google_maps_enabled ? 'Aktif' : 'Non-aktif'}
                  </button>
                </div>
                {settingsForm.google_maps_enabled && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-gray-550 block font-semibold">API Key Google Maps (SDK Browser)</span>
                    <input
                      type="password"
                      placeholder="AIzaSyXXXXXXXXXXXXXXXXXX"
                      value={settingsForm.google_maps_api_key}
                      onChange={e => setSettingsForm({ ...settingsForm, google_maps_api_key: e.target.value })}
                      className="w-full p-1.5 border border-slate-200 bg-white rounded-lg text-[10.5px]"
                    />
                    <p className="text-[9px] text-slate-450 italic leading-snug">Berfungsi untuk menampilkan modul map interaktif ketika user mengarahkan alamat & titik koordinat Dusun pengiriman produk.</p>
                  </div>
                )}
              </div>

              {/* Shipping and logistics settings */}
              <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-2.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" /> Metode Pengiriman Toko
                </label>
                <div className="space-y-2 text-[10.5px]">
                  <p className="text-[9.5px] text-slate-500">Sesuaikan pilihan pengiriman aktif di checkout secara umum:</p>
                  <div className="space-y-1.5">
                    <textarea
                      rows={2}
                      value={settingsForm.shipping_methods}
                      onChange={e => setSettingsForm({ ...settingsForm, shipping_methods: e.target.value })}
                      placeholder='["Kurir Mandiri Vendor", "Ambil Sendiri ke Toko", "Cargo Tegalsari"]'
                      className="w-full p-1.5 border border-slate-200 bg-white rounded-lg font-mono text-[9.5px] text-slate-700"
                    />
                    <span className="text-[8.5px] text-slate-400 block font-mono">Format JSON Array strings (atau daftar dipisah koma)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700 font-medium">Nomor Kontak WhatsApp Pengurus (Format ID: 628...)</label>
                <input
                  type="text"
                  required
                  value={settingsForm.contact_phone}
                  onChange={e => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Mode Operasional Website</label>
                <select
                  value={settingsForm.website_mode}
                  onChange={e => setSettingsForm({ ...settingsForm, website_mode: e.target.value as AppSetting['website_mode'] })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs font-semibold"
                >
                  <option value="active">🟢 Active / Buka</option>
                  <option value="maintenance">🔴 Pemeliharaan / Maintenance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-750 flex items-center gap-1 text-emerald-800">
                  <Megaphone className="w-3.5 h-3.5 text-amber-500" /> Pengumuman Utama (Banner Atas)
                </label>
                <textarea
                  rows={2}
                  placeholder="Set pesan pengumuman bar atas..."
                  value={settingsForm.announcement}
                  onChange={e => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Teks Deskripsi 'Tentang Kami'</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Deskripsikan visi misi gerakan UMKM di Tegalsari ini..."
                  value={settingsForm.about_us}
                  onChange={e => setSettingsForm({ ...settingsForm, about_us: e.target.value })}
                  className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                />
              </div>

              {/* Dynamic Pages & Footer Customizer Group */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-4 shadow-2xs">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  ✨ Pengaturan Halaman Informasi & Footer
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">URL Gambar Banner Hero 'Tentang'</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... atau kosongkan untuk default"
                      value={settingsForm.about_us_hero_img}
                      onChange={e => setSettingsForm({ ...settingsForm, about_us_hero_img: e.target.value })}
                      className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Judul Sambutan 'Tentang Kami'</label>
                    <input
                      type="text"
                      placeholder="Mengapa Belanja di Pasar Tegalsari?"
                      value={settingsForm.about_us_welcome_heading}
                      onChange={e => setSettingsForm({ ...settingsForm, about_us_welcome_heading: e.target.value })}
                      className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Teks Sambutan 'Tentang Kami' (Lengkap)</label>
                  <textarea
                    rows={3}
                    placeholder="Teks penjelas gerakan UMKM..."
                    value={settingsForm.about_us_welcome_text}
                    onChange={e => setSettingsForm({ ...settingsForm, about_us_welcome_text: e.target.value })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block text-emerald-900">Teks Penjelas Kolom Pertama Footer</label>
                  <textarea
                    rows={2}
                    placeholder="Slogan atau visi misi program ketahanan pangan kecamatan..."
                    value={settingsForm.footer_text}
                    onChange={e => setSettingsForm({ ...settingsForm, footer_text: e.target.value })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Alamat Sekretariat (Footer Kolom 2)</label>
                  <input
                    type="text"
                    placeholder="Jl. Raya Tegalsari No. 1, Kecamatan Tegalsari, Banyuwangi"
                    value={settingsForm.footer_address}
                    onChange={e => setSettingsForm({ ...settingsForm, footer_address: e.target.value })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block text-emerald-900">Daftar Wilayah Mitra UMKM (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    placeholder="Desa Tegalsari, Desa Karangdoro, Desa Dasri, Desa Tamansari, Desa Karangmulyo"
                    value={settingsForm.about_us_villages}
                    onChange={e => setSettingsForm({ ...settingsForm, about_us_villages: e.target.value })}
                    className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs font-mono"
                  />
                  <p className="text-[9px] text-slate-400">Daftar desa/kelurahan cakupan program yang ditampilkan di halaman Tentang.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Teks Pernyataan Komitmen Bersama</label>
                    <input
                      type="text"
                      placeholder="Meningkatkan taraf ekonomi pedesaan berbasis teknologi mandiri..."
                      value={settingsForm.about_us_quote_text}
                      onChange={e => setSettingsForm({ ...settingsForm, about_us_quote_text: e.target.value })}
                      className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Pembuat Quote / Penandatangan</label>
                    <input
                      type="text"
                      placeholder="Kecamatan Tegalsari - Banyuwangi"
                      value={settingsForm.about_us_quote_author}
                      onChange={e => setSettingsForm({ ...settingsForm, about_us_quote_author: e.target.value })}
                      className="w-full p-2 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Banner Carousel Management Panel */}
              <div id="admin-carousel-banner-settings" className="p-3.5 bg-white border border-slate-100 rounded-xl space-y-3 shadow-xs">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-emerald-950 uppercase tracking-widest font-mono">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" /> Kelola Banner Carousel ({(settingsForm.banners || []).length})
                </label>
                <p className="text-[10px] text-slate-400">
                  Slide promosi berganti otomatis di modul jajaran atas katalog produk Anda.
                </p>

                {/* Panduan Ukuran Gambar Banner Carousel */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-slate-700 space-y-1.5 text-[10.5px] shadow-3xs">
                  <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Panduan Ukuran Gambar Banner Carousel (Slide Utama)
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[9.5px] text-slate-605 leading-relaxed">
                    <li><strong>Tampilan Desktop (PC/Laptop):</strong> Gunakan gambar lanskap dengan rasio <strong>2:1</strong> (Rekomendasi: <strong>1200 x 600 piksel</strong>). Ukuran ini paling presisi dan pas bersanding dengan banner samping slideshow.</li>
                    <li><strong>Tampilan Ponsel (Mobile):</strong> Gambar otomatis diskalakan secara responsif. Agar teks/subjek pada gambar tidak terpotong saat layar mengecil, letakkan konten utama di area <strong>tengah (centered area)</strong> gambar.</li>
                    <li><strong>Format File:</strong> Gunakan format <strong>WEBP, JPG, atau PNG</strong> dengan ukuran berkas di bawah 1MB agar pemuatan halaman terasa instan dan cepat.</li>
                  </ul>
                </div>

                {/* Carousel Badge Label & Link Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 flex items-center gap-1">
                      <span>Label Badge Utama Carousel</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Gerakan Beli Karya Tetangga"
                      value={settingsForm.carousel_badge_text}
                      onChange={e => setSettingsForm({ ...settingsForm, carousel_badge_text: e.target.value })}
                      className="w-full p-2 border border-slate-200 bg-white rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-950 flex items-center gap-1">
                      <span>Tautan URL Link Badge (opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/promo-desa"
                      value={settingsForm.carousel_badge_url}
                      onChange={e => setSettingsForm({ ...settingsForm, carousel_badge_url: e.target.value })}
                      className="w-full p-2 border border-slate-200 bg-white rounded text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Banners List */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {(settingsForm.banners || []).map((b, idx) => (
                    <div key={b.id || idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-150 space-y-2.5 transition">
                      <div className="flex gap-2.5 items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={b.image_url} alt="Slide preview" className="w-10 h-8 rounded object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-800 truncate">{b.text || 'Slide Promosi'}</p>
                            {b.subtitle && (
                              <p className="text-[8.5px] text-slate-500 italic truncate leading-tight">{b.subtitle}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {b.badge_text ? (
                                <span className="inline-block px-1.5 py-0.2 bg-amber-100 border border-amber-200 rounded text-[7.5px] font-bold text-amber-900">
                                  🏷️ {b.badge_text}
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-[7.5px] text-slate-500">Bawaan Badge</span>
                              )}
                              {b.link_url && (
                                <span className="inline-block px-1.5 py-0.2 bg-blue-50 border border-blue-150 rounded text-[7.5px] text-blue-600 font-mono">Link Carousel</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 items-center">
                          <button
                            type="button"
                            onClick={() => setEditingBannerId(editingBannerId === b.id ? null : b.id)}
                            className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold cursor-pointer transition ${
                              editingBannerId === b.id ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                            }`}
                          >
                            {editingBannerId === b.id ? 'Selesai' : 'Ubah / Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBannerStatus(b.id)}
                            className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold cursor-pointer transition ${
                              b.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {b.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBanner(b.id)}
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer transition"
                            title="Hapus Banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable editing panel for each banner */}
                      {editingBannerId === b.id && (
                        <div className="space-y-2 p-2.5 bg-white border border-emerald-150 rounded-md shadow-3xs animate-fade-in">
                          <p className="text-[10px] font-bold text-emerald-900 border-b border-emerald-50 pb-1">✏️ Edit slide & badge untuk banner ini</p>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <label className="text-[8.5px] text-slate-500 font-bold block">Teks / Judul</label>
                              <input
                                type="text"
                                value={b.text || ''}
                                onChange={e => handleUpdateBannerField(b.id, 'text', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[10px]"
                                placeholder="Judul utama banner"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[8.5px] text-slate-500 font-bold block">Deskripsi / Subtitle</label>
                              <input
                                type="text"
                                value={b.subtitle || ''}
                                onChange={e => handleUpdateBannerField(b.id, 'subtitle', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[10px]"
                                placeholder="Deskripsi bawah banner"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <label className="text-[8.5px] text-slate-500 font-bold block">Teks Label Badge Slide ini</label>
                              <input
                                type="text"
                                value={b.badge_text || ''}
                                placeholder="Gerakan Beli Karya Tetangga"
                                onChange={e => handleUpdateBannerField(b.id, 'badge_text', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[10px] font-semibold text-slate-800"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[8.5px] text-slate-500 font-bold block">Tautan URL Badge Slide ini</label>
                              <input
                                type="text"
                                value={b.badge_url || ''}
                                placeholder="https://example.com/promo-desaku"
                                onChange={e => handleUpdateBannerField(b.id, 'badge_url', e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[10px] font-mono text-slate-850"
                              />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8.5px] text-slate-500 font-bold block">Tautan URL Redirect Klik Slide</label>
                            <input
                              type="text"
                              value={b.link_url || ''}
                              placeholder="https://example.com/redirect-promo"
                              onChange={e => handleUpdateBannerField(b.id, 'link_url', e.target.value)}
                              className="w-full p-1 border border-slate-200 rounded text-[10px] font-mono text-slate-850"
                            />
                            <p className="text-[7.5px] text-slate-400">Tautan utama yang dibuka saat pengunjung mengeklik badan gambar banner slider ini.</p>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8.5px] text-slate-500 font-bold block">URL Link Gambar Slide</label>
                            <input
                              type="text"
                              value={b.image_url || ''}
                              onChange={e => handleUpdateBannerField(b.id, 'image_url', e.target.value)}
                              className="w-full p-1 border border-slate-200 rounded text-[10px] font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {(settingsForm.banners || []).length === 0 && (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">Belum ada banner tambahan. Menampilkan banner bawaan.</p>
                  )}
                </div>

                {/* Slider Duration in ms */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 pb-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-semibold text-slate-700">Durasi Slide (Milidetik)</label>
                    <input
                      type="number"
                      min={500}
                      step={500}
                      value={settingsForm.banner_duration}
                      onChange={e => setSettingsForm({ ...settingsForm, banner_duration: parseInt(e.target.value) || 3000 })}
                      className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                {/* ⚙️ Pengaturan Banner Samping Slideshow (Geser ke Bawah) */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-lg space-y-3 text-xs">
                    <p className="text-[11px] font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between font-display">
                      <span>⚙️ Pengaturan Banner Samping (Slideshow Vertikal)</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[8px] font-mono">Geser ke Bawah</span>
                    </p>
                    <p className="text-[8.5px] text-slate-500 leading-relaxed">
                      Atur slide banner samping yang berputar otomatis ke bawah (slide down). Anda bisa mengunggah file gambar atau video pendek tanpa suara (bisa base64 atau URL eksternal).
                    </p>

                    {/* Panduan Ukuran Gambar Banner Samping */}
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-slate-700 space-y-1.5 text-[10.5px] shadow-3xs">
                      <p className="font-bold text-blue-950 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        Panduan Ukuran Gambar Banner Samping (Slideshow Vertikal)
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-[9.5px] text-slate-605 leading-relaxed">
                        <li><strong>Tampilan Desktop (PC/Laptop):</strong> Gunakan gambar potret/vertikal dengan rasio <strong>2:3</strong> atau persegi <strong>1:1</strong> (Rekomendasi: <strong>600 x 900 piksel</strong> atau <strong>600 x 600 piksel</strong>). Format potret memberikan tampilan tinggi yang sangat pas di sisi kanan slider utama.</li>
                        <li><strong>Tampilan Ponsel (Mobile):</strong> Demi menjaga kesederhanaan dan menghemat ruang baca layar ponsel yang terbatas, <strong>Banner Samping ini secara otomatis disembunyikan sepenuhnya</strong> pada layar smartphone/tablet.</li>
                        <li><strong>Format File:</strong> Gambar berformat <strong>WEBP, PNG, atau JPG</strong> sangat direkomendasikan dengan optimasi kompresi agar ringan dimuat.</li>
                      </ul>
                    </div>

                    {/* List of Right Banners */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {(settingsForm.right_banners || []).map((rb, idx) => (
                        <div key={rb.id} className="p-2 bg-white rounded-lg border border-slate-200 shadow-3xs space-y-1.5">
                          <div className="flex items-start gap-2">
                            {/* Media Preview */}
                            <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {rb.media_type === 'video' ? (
                                <video src={rb.media_url} className="w-full h-full object-cover" muted playsInline loop />
                              ) : (
                                <img src={rb.media_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[10.5px] truncate text-slate-800">{rb.title || `Slide ${idx + 1}`}</p>
                              <p className="text-[8.5px] text-slate-450 truncate">{rb.subtitle || 'Tanpa deskripsi'}</p>
                              <div className="flex gap-1.5 mt-0.5 items-center">
                                <span className={`px-1 py-0.5 text-[7.5px] font-bold rounded ${rb.media_type === 'video' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {rb.media_type.toUpperCase()}
                                </span>
                                {rb.badge_text && (
                                  <span className="bg-slate-100 px-1 py-0.5 rounded text-[7.5px] font-mono text-slate-600 truncate max-w-[80px]">
                                    Badge: {rb.badge_text}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleRightBannerStatus(rb.id)}
                                className={`px-1.5 py-1 text-[8.5px] font-bold rounded transition cursor-pointer ${
                                  rb.status === 'active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {rb.status === 'active' ? 'Aktif' : 'Nonaktif'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRightBanner(rb.id)}
                                className="p-1 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus Slide Samping"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(settingsForm.right_banners || []).length === 0 && (
                        <p className="text-[10px] text-slate-400 italic text-center py-2 bg-white rounded border border-dashed">Belum ada slide samping. Menampilkan default.</p>
                      )}
                    </div>

                    {/* Right Banner Slide Duration in ms */}
                    <div className="space-y-1 pt-1.5">
                      <label className="text-[9.5px] font-semibold text-slate-700">Durasi Slide Samping (Milidetik)</label>
                      <input
                        type="number"
                        min={500}
                        step={500}
                        value={settingsForm.right_banner_duration || 3000}
                        onChange={e => setSettingsForm({ ...settingsForm, right_banner_duration: parseInt(e.target.value) || 3000 })}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-mono"
                      />
                    </div>

                    {/* Form to Add a New Right Banner Slide */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                      <span className="text-[9.5px] font-bold text-emerald-900 block border-b border-slate-100 pb-1">Tambah Slide Samping Baru</span>

                      {/* Local File Upload */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold flex justify-between">
                          <span>Unggah Gambar Samping Lokal</span>
                          <span className="text-[8px] text-emerald-600 font-normal">Mendukung format gambar (PNG, JPG, WEBP, GIF)</span>
                        </label>
                        <div className="relative border border-dashed border-slate-250 bg-slate-50 hover:border-emerald-500 rounded-lg p-1.5 text-center cursor-pointer group transition">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleRightBannerLocalUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <span className="text-[9px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                            <UploadCloud className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                            <span>Pilih File Gambar</span>
                          </span>
                        </div>
                      </div>

                      {/* Preview URL input */}
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Atau tempel URL gambar eksternal..."
                          value={newRBMediaUrl}
                          onChange={e => setNewRBMediaUrl(e.target.value)}
                          className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10px] font-mono"
                        />
                      </div>

                      {/* Preview Thumbnail if selected */}
                      {newRBMediaUrl && (
                        <div className="p-1 bg-slate-50 border border-slate-100 rounded flex items-center gap-2">
                          <div className="w-8 h-8 bg-black rounded overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={newRBMediaUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <span className="text-[8px] text-slate-500 truncate flex-1 font-mono">{newRBMediaUrl.substring(0, 50)}...</span>
                          <button type="button" onClick={() => setNewRBMediaUrl('')} className="text-slate-400 hover:text-rose-600 p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Text details for Right Banner */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          placeholder="Judul Slide (opsional)..."
                          value={newRBTitle}
                          onChange={e => setNewRBTitle(e.target.value)}
                          className="w-full p-1 border border-slate-200 bg-white rounded text-[9.5px]"
                        />
                        <input
                          type="text"
                          placeholder="Label Badge (opsional)..."
                          value={newRBBadgeText}
                          onChange={e => setNewRBBadgeText(e.target.value)}
                          className="w-full p-1 border border-slate-200 bg-white rounded text-[9.5px]"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Deskripsi singkat slide (opsional)..."
                        value={newRBSubtitle}
                        onChange={e => setNewRBSubtitle(e.target.value)}
                        className="w-full p-1 border border-slate-200 bg-white rounded text-[9.5px]"
                      />

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Link Klik Redirect (opsional)..."
                          value={newRBLinkUrl}
                          onChange={e => setNewRBLinkUrl(e.target.value)}
                          className="flex-1 p-1 border border-slate-200 bg-white rounded text-[9.5px] font-mono text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={handleAddRightBanner}
                          className="px-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-[9.5px] rounded transition flex items-center cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add dynamic Banner form */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-[10px] font-bold text-emerald-900 block border-b border-slate-200 pb-1">Tambah Slide Banner</span>
                  
                  {/* Local Upload */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold flex justify-between">
                      <span>Pilih Gambar Lokal</span>
                      <span className="text-[8px] text-emerald-600">Bisa upload instan</span>
                    </label>
                    <div className="relative border-2 border-dashed border-slate-200 bg-white hover:border-emerald-500 rounded-lg p-1.5 text-center cursor-pointer group transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerLocalUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 font-semibold flex items-center justify-center gap-1">
                        <UploadCloud className="w-3.5 h-3.5 text-slate-450 group-hover:text-emerald-600" />
                        <span>Pilih File Gambar Slide</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Atau tempel URL gambar eksternal..."
                      value={newBannerImgUrl}
                      onChange={e => setNewBannerImgUrl(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Judul / Teks Overlay Banner..."
                      value={newBannerText}
                      onChange={e => setNewBannerText(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Subtitle / Deskripsi Overlay Banner..."
                      value={newBannerSubtitle}
                      onChange={e => setNewBannerSubtitle(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Label Badge (Gerakan Beli Karya Tetangga)..."
                        value={newBannerBadgeText}
                        onChange={e => setNewBannerBadgeText(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10px] font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Tautan URL Link Badge (opsional)..."
                        value={newBannerBadgeUrl}
                        onChange={e => setNewBannerBadgeUrl(e.target.value)}
                        className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10px] font-mono text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Tautan URL redirect (opsional)..."
                      value={newBannerLinkUrl}
                      onChange={e => setNewBannerLinkUrl(e.target.value)}
                      className="flex-1 p-1.5 border border-slate-200 bg-white rounded text-[10px] font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddBanner}
                      className="px-3 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-[10.5px] rounded transition flex items-center cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* Membership Configuration Panel */}
              <div id="admin-membership-tier-settings" className="p-3.5 bg-white border border-slate-100 rounded-xl space-y-3 shadow-xs">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-emerald-950 uppercase tracking-widest font-mono">
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" /> Atur Biaya & Benefit Membership
                </label>
                <p className="text-[10px] text-slate-450 leading-relaxed">
                  Pasar UMKM mendukung 3 tingkatan (tier) membership yang bisa dipilih saat daftar vendor. Atur biaya tiap level serta batas maksimal upload produknya.
                </p>

                <div className="space-y-3">
                  {/* FREE TIER */}
                  <div className="p-2.5 border border-slate-200 bg-slate-50/50 rounded-lg space-y-2">
                    <div className="flex justify-between items-center bg-slate-100 px-2 py-0.5 rounded text-[10.5px] font-bold text-slate-705">
                      <span>MEMBERSHIP: FREE</span>
                      <span className="text-[9px] bg-slate-200 px-1 py-0.5 rounded font-mono font-bold tracking-wider">REGULER</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold">Biaya Pendaftaran (Rp)</label>
                        <input
                          type="number"
                          value={settingsForm.membership_settings?.free?.price ?? 0}
                          disabled
                          className="w-full p-1.5 border border-slate-200 rounded text-[10.5px] bg-slate-100 text-slate-400 cursor-not-allowed font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold">Maksimal Upload Produk</label>
                        <input
                          type="number"
                          value={settingsForm.membership_settings?.free?.max_products ?? 5}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setSettingsForm(prev => ({
                              ...prev,
                              membership_settings: {
                                ...prev.membership_settings,
                                free: { ...prev.membership_settings.free, max_products: val }
                              }
                            }));
                          }}
                          className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10.5px] font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PREMIUM TIER */}
                  <div className="p-2.5 border border-amber-100 bg-amber-50/10 rounded-lg space-y-2">
                    <div className="flex justify-between items-center bg-amber-100/30 px-2 py-0.5 rounded text-[10.5px] font-bold text-amber-900 border border-amber-100/40">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> MEMBERSHIP: PREMIUM
                      </span>
                      <span className="text-[9px] bg-amber-250 text-amber-950 px-1 py-0.5 rounded font-mono font-bold tracking-wider">HOT BRAND</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold">Biaya Pendaftaran (Rp)</label>
                        <input
                          type="number"
                          value={settingsForm.membership_settings?.premium?.price ?? 50000}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setSettingsForm(prev => ({
                              ...prev,
                              membership_settings: {
                                ...prev.membership_settings,
                                premium: { ...prev.membership_settings.premium, price: val }
                              }
                            }));
                          }}
                          className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10.5px] font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold">Maksimal Upload Produk</label>
                        <input
                          type="number"
                          value={settingsForm.membership_settings?.premium?.max_products ?? 25}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setSettingsForm(prev => ({
                              ...prev,
                              membership_settings: {
                                ...prev.membership_settings,
                                premium: { ...prev.membership_settings.premium, max_products: val }
                              }
                            }));
                          }}
                          className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10.5px] font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* VIP TIER */}
                  <div className="p-2.5 border border-purple-100 bg-purple-50/10 rounded-lg space-y-2">
                    <div className="flex justify-between items-center bg-purple-100/30 px-2 py-0.5 rounded text-[10.5px] font-bold text-purple-900 border border-purple-100/40">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-purple-500 animate-bounce" /> MEMBERSHIP: VIP
                      </span>
                      <span className="text-[9px] bg-purple-250 text-purple-950 px-1 py-0.5 rounded font-mono font-bold tracking-wider">DESA EXCLUSIVE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold">Biaya Pendaftaran (Rp)</label>
                        <input
                          type="number"
                          value={settingsForm.membership_settings?.vip?.price ?? 150000}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setSettingsForm(prev => ({
                              ...prev,
                              membership_settings: {
                                ...prev.membership_settings,
                                vip: { ...prev.membership_settings.vip, price: val }
                              }
                            }));
                          }}
                          className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10.5px] font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-bold">Maksimal Upload Produk</label>
                        <input
                          type="number"
                          value={settingsForm.membership_settings?.vip?.max_products ?? 1000}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setSettingsForm(prev => ({
                              ...prev,
                              membership_settings: {
                                ...prev.membership_settings,
                                vip: { ...prev.membership_settings.vip, max_products: val }
                              }
                            }));
                          }}
                          className="w-full p-1.5 border border-slate-200 bg-white rounded text-[10.5px] font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Commission Settings Panel */}
              <div id="admin-commission-settings" className="p-3.5 bg-white border border-slate-100 rounded-xl space-y-3 shadow-xs">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-emerald-950 uppercase tracking-widest font-mono">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" /> Setelan Komisi Administrasi
                </label>
                <p className="text-[10px] text-slate-450 leading-relaxed">
                  Komisi administrasi dipotong secara otomatis dari harga produk ketika pesanan selesai, lalu sisanya disalurkan ke saldo vendor.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold">Komisi Persentase (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settingsForm.admin_commission_percent ?? 5}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setSettingsForm(prev => ({
                            ...prev,
                            admin_commission_percent: isNaN(val) ? 0 : val
                          }));
                        }}
                        className="w-full p-1.5 pr-6 border border-slate-200 bg-white rounded text-[10.5px] font-mono font-semibold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-[10px]">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold">Komisi Flat per Transaksi (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[9px] font-mono">Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={settingsForm.admin_commission_flat ?? 0}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setSettingsForm(prev => ({
                            ...prev,
                            admin_commission_flat: isNaN(val) ? 0 : val
                          }));
                        }}
                        className="w-full p-1.5 pl-7 border border-slate-200 bg-white rounded text-[10.5px] font-mono font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all w-full cursor-pointer shadow-sm hover:translate-y-[-1px]"
              >
                Simpan Setelan Global
              </button>
            </form>
          </div>

          {/* Quick Info */}
          <div className="p-4 bg-emerald-50 rounded-2xl flex gap-2.5 text-[11px] text-emerald-950 border border-emerald-100">
            <Info className="w-5.5 h-5.5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Info Admin</p>
              <p className="text-emerald-800 leading-normal">
                Gunakan pengaturan di atas untuk mengubah tata kelola, kategori produk, setup pemetaan Google Maps, dan aktivasi gerbang pembayaran Pakasir Banyuwangi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
