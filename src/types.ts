/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  email: string;
  role: 'buyer' | 'vendor' | 'admin';
  name: string;
  phone: string;
  address: string;
  kecamatan: string;
  village: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Vendor {
  id: string; // matches UserProfile.id
  business_name: string;
  logo_url: string;
  banner_url: string;
  ktp_url?: string; // ID Card upload for registration validation
  description: string;
  address: string;
  kecamatan: string;
  village: string;
  phone: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: 'pending' | 'approved' | 'rejected';
  membership_tier?: 'FREE' | 'PREMIUM' | 'VIP';
  memb_pay_method?: 'pakasir' | 'transfer_manual';
  memb_pay_status?: 'unpaid' | 'paid' | 'pending';
  memb_pay_proof?: string;
  rajaongkir_enabled?: boolean;
  rajaongkir_couriers?: string[]; // e.g. ["jne", "pos", "tiki"]
  rajaongkir_origin_id?: string; // origin city ID for RajaOngkir
  rajaongkir_origin_name?: string; // origin city name for RajaOngkir
  rajaongkir_origin_province_id?: string;
  rajaongkir_origin_province_name?: string;
  rajaongkir_origin_district_id?: string;
  rajaongkir_origin_district_name?: string;
  shipping_engine?: 'binderbyte' | 'smartengine';
  payment_methods?: string[];
  created_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  image_url: string;
  brand: string;
  variants: string[]; // e.g. ["Pedas", "Original"]
  price: number;
  discount_price: number | null;
  weight: number; // in grams
  description: string;
  pirt: string; // PIRT certification number
  pkrt: string; // PKRT certification number
  bpom: string; // BPOM certification number
  category: string;
  stock: number;
  created_at: string;
}

export interface Courier {
  id: string;
  vendor_id: string;
  name: string;
  phone: string;
  vehicle_type: 'Motor' | 'Mobil' | 'Tricycle';
  price_per_km: number;
  base_fare: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface AffiliateRelation {
  id: string;
  affiliator_vendor_id: string; // Vendor who promotes
  owner_vendor_id: string; // Vendor who owns product
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface CommissionSetting {
  id: string;
  vendor_id: string;
  product_id: string | null; // null means applies to all products of this vendor
  commission_percentage: number;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  variant: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  vendor_id: string;
  vendor_name: string;
  vendor_phone: string;
  courier_id: string | null;
  courier_name: string | null;
  courier_phone: string | null;
  items: OrderItem[];
  total_amount: number;
  shipping_fee: number;
  distance_km: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  payment_method: string;
  shipping_address: string;
  shipping_latitude: number;
  shipping_longitude: number;
  awb_number?: string; // BinderByte Nomor Resi
  courier_code?: string; // e.g. 'jne', 'sicepat', 'jnt', etc.

  affiliator_vendor_id: string | null; // vendor who gets commission
  commission_amount: number;
  created_at: string;
}

export interface AppSetting {
  id: string;
  app_name: string;
  logo_url: string;
  banner_url: string;
  contact_phone: string;
  website_mode: 'active' | 'maintenance';
  announcement: string;
  about_us: string;
  about_us_welcome_heading?: string;
  about_us_welcome_text?: string;
  about_us_hero_img?: string;
  about_us_villages?: string;
  about_us_quote_text?: string;
  about_us_quote_author?: string;
  carousel_badge_text?: string;
  carousel_badge_url?: string;
  footer_text?: string;
  footer_address?: string;
  // Dynamic Categories (e.g. Makanan Ringan, Batik)
  categories?: string[];
  // Pakasir Payment Gateway
  pakasir_enabled?: boolean;
  pakasir_api_key?: string;
  pakasir_merchant_id?: string;
  // Google Maps coordinate credentials
  google_maps_enabled?: boolean;
  google_maps_api_key?: string;
  // Payment methods accepted (e.g. ['COD', 'Pakasir QRIS', 'Transfer Bank'])
  payment_methods?: string[];
  // Shipping configurations
  shipping_methods?: string; // JSON string representing active channels
  // Banner Carousel settings
  banners?: Array<{
    id: string;
    image_url: string;
    text?: string;
    subtitle?: string;
    link_url?: string;
    badge_text?: string;
    badge_url?: string;
    status: 'active' | 'inactive';
  }>;
  banner_duration?: number;
  banner_layout_desktop?: 'full' | 'split';
  right_banner_img?: string;
  right_banner_title?: string;
  right_banner_subtitle?: string;
  right_banner_link?: string;
  right_banner_badge?: string;
  right_banners?: Array<{
    id: string;
    media_url: string;
    media_type: 'image' | 'video';
    title?: string;
    subtitle?: string;
    link_url?: string;
    badge_text?: string;
    status: 'active' | 'inactive';
  }>;
  right_banner_duration?: number;
  // Vendor Membership config
  membership_settings?: {
    free: { price: number; max_products: number; name: string };
    premium: { price: number; max_products: number; name: string };
    vip: { price: number; max_products: number; name: string };
  };
  // Admin Commission Configuration
  admin_commission_percent?: number;
  admin_commission_flat?: number;
}

export interface BalanceTransaction {
  id: string;
  vendor_id: string;
  amount: number; // positive for income, negative for withdrawal
  type: 'sales' | 'commission' | 'withdrawal' | 'refund';
  description: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  vendor_id: string;
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  completed_at?: string;
}
