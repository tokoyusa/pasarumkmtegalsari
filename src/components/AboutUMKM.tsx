/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Leaf, ShieldCheck, MapPin, Truck, BadgeDollarSign } from 'lucide-react';
import { AppSetting } from '../types';

interface AboutUMKMProps {
  appSettings: AppSetting | null;
}

export default function AboutUMKM({ appSettings }: AboutUMKMProps) {
  const heroImage = appSettings?.about_us_hero_img || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200';
  const appName = appSettings?.app_name || 'PASAR UMKM TEGALSARI';
  const aboutUsSub = appSettings?.about_us || 'Menghubungkan warga dengan produsen lokal di tingkat desa untuk memajukan ekonomi kerakyatan Kecamatan Tegalsari, Kabupaten Banyuwangi.';
  const welcomeHeading = appSettings?.about_us_welcome_heading || 'Mengapa Belanja di Pasar Tegalsari?';
  const welcomeText = appSettings?.about_us_welcome_text || 'Kecamatan Tegalsari memiliki potensi luar biasa mulai dari hasil tani hortikultura di Desa Dasri, aneka kripik buatan ibu-ibu terampil Desa Karangdoro, hingga kerajinan bernilai tinggi di Desa Tegalsari Centro. Pasar digital ini hadir agar warga dapat memesan produk secara langsung tanpa perantara, dengan ongkos kirim murah yang diantarkan langsung oleh kurir lokal buatan para pelaku usaha itu sendiri.';
  
  const villagesList = appSettings?.about_us_villages
    ? appSettings.about_us_villages.split(',').map(v => v.trim()).filter(Boolean)
    : ['Desa Tegalsari', 'Desa Karangdoro', 'Desa Dasri', 'Desa Tamansari', 'Desa Karangmulyo'];

  const quoteText = appSettings?.about_us_quote_text || 'Meningkatkan taraf ekonomi pedesaan berbasis teknologi mandiri, menjaga silaturahmi lokal, dan bangga menggunakan karya tetangga sendiri.';
  const quoteAuthor = appSettings?.about_us_quote_author || 'Kecamatan Tegalsari - Banyuwangi';

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      {/* Hero Banner */}
      <div 
        className="relative h-48 bg-emerald-800 flex items-center justify-center text-center p-6 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        <div className="absolute inset-0 bg-emerald-950/80" />
        <div className="relative z-10 max-w-xl text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight">
            About {appName}
          </h2>
          <p className="text-emerald-200 text-xs md:text-sm">
            {aboutUsSub}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-6 md:p-8 space-y-8">
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <h3 className="text-xl font-bold text-emerald-950 font-display">{welcomeHeading}</h3>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {welcomeText}
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Leaf className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-emerald-900 text-sm">Produk Lokal Berkualitas</h4>
            <p className="text-gray-600 text-xs leading-relaxed">
              Semua produk dijamin segar, otentik, dan dibuat langsung di desa-desa Kecamatan Tegalsari oleh tangan-tangan kreatif lokal mitra kami.
            </p>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-emerald-900 text-sm">Berijin & Aman Konsumsi</h4>
            <p className="text-gray-600 text-xs leading-relaxed">
              Kami mendorong para vendor menyertakan nomor perijinan resmi seperti PIRT (Pangan Industri Rumah Tangga), PKRT, ataupun BPOM demi kenyamanan Anda.
            </p>
          </div>

          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-emerald-900 text-sm">Kurir Mandiri & COD</h4>
            <p className="text-gray-600 text-xs leading-relaxed">
              Pengiriman diantarkan langsung menggunakan kurir internal vendor dengan kalkulasi jarak akurat, dibayar Tunai di Tempat (COD) saat barang sampai.
            </p>
          </div>
        </div>

        {/* Affiliate Pillar */}
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-950 text-sm flex items-center gap-1.5">
              <BadgeDollarSign className="w-4 h-4 text-amber-700" />
              Sistem Kemitraan Affiliate Lokasi Desa
            </h4>
            <p className="text-amber-800 text-xs max-w-2xl leading-relaxed">
              Sesama pelaku UMKM Desa Tegalsari bisa saling bahu-membahu menjualkan produk vendor lainnya! Ajukan pendaftaran affiliate ke toko tetangga, sepakati komisi, promosikan link katalognya, dan nikmati penghasilan tambahan mandiri.
            </p>
          </div>
          <div className="bg-amber-100 px-3 py-1 text-xs text-amber-800 font-semibold rounded-lg font-mono flex items-center shrink-0">
            Komisi s.d 15%
          </div>
        </div>

        {/* Village list mapping */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="font-bold text-center text-emerald-950 font-display text-base mb-4">Cakupan Wilayah Mitra UMKM</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs">
            {villagesList.map((item, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200/60 p-2.5 rounded-lg flex items-center justify-center gap-1.5 font-medium text-emerald-900 shadow-3xs hover:bg-emerald-50/40 transition">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Commitment Statement */}
        <div className="text-center bg-emerald-950 text-white rounded-xl p-5 space-y-2">
          <p className="text-xs tracking-wider uppercase font-semibold text-emerald-400">Pernyataan Komitmen Bersama</p>
          <Quote text={quoteText} author={quoteAuthor} />
        </div>
      </div>
    </div>
  );
}

function Quote({ text, author }: { text: string; author: string }) {
  return (
    <div className="space-y-1.5 italic font-sans max-w-xl mx-auto">
      <p className="text-sm">" {text} "</p>
      <p className="text-[10px] text-emerald-300 font-mono not-italic uppercase tracking-widest">— {author}</p>
    </div>
  );
}
