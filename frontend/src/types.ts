export interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'SUCCESS' | 'ERROR' | 'AI';
    message: string;
    payload?: any;
}

export interface PriceData {
    recommended_price: number;
    middleman_price_est: number;
    market_retail_price: number;
    extra_profit_per_kg: number;
    rationale: string;
    sources?: Array<{ title: string; link: string; price_rp_per_kg: number | null }>;
}

export interface Batch {
    batch_id: number;
    sequence: string[];
    total_load: number;
    reasoning: string;
    est_distance_km?: number;
    est_time_mins?: number;
    comparison_summary?: string;
}

export interface LogisticsData {
    batches: Batch[];
}

export interface OutreachData {
    formal_draft: string;
    casual_draft: string;
    security_status: string;
    packing_tip: string;
}

export interface User {
    id: string;
    username: string;
    role: 'buyer' | 'seller' | 'admin';
    location?: string;
    business_name?: string | null;
    business_address?: string | null;
    tax_id?: string | null;
    is_verified?: boolean | null;
}

export interface Product {
    id: string;
    umkm_name: string;
    commodity: string;
    stock: number;
    price: number;
    location: string;
    image_url: string;
    seller_id: string;
    is_active?: boolean;
    category?: string | null;
    discount_per_kg?: number | null;
    min_stock?: number | null;
    sku?: string | null;
    variant_grade?: string | null;
    variant_size?: string | null;
    variant_packaging?: string | null;
    warehouse_id?: string | null;
    moderation_status?: 'approved' | 'pending' | 'rejected' | string | null;
    moderation_reason?: string | null;
    moderated_by?: string | null;
    moderated_at?: string | null;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Order {
    id: string;
    buyer_id: string;
    seller_id: string;
    item_id: string;
    quantity: number;
    total_price: number;
    status: string;
    created_at: string;
    commodity?: string;
    image_url?: string;
    seller_name?: string;
    seller_location?: string;
    buyer_name?: string;
    buyer_location?: string;
    payment_status?: 'paid' | 'unpaid' | string;
    notes?: string | null;
    shipping_address_id?: string | null;
    coupon_code?: string | null;
    discount_total?: number | null;
    delivered_at?: string | null;
    receiver_name?: string | null;
    pod_photo_url?: string | null;
    pod_signature_url?: string | null;
    vehicle_type?: string | null;
    shipping_cost_total?: number | null;
    shipping_cost_breakdown?: any;
    escrow_status?: string | null;
    escrow_amount?: number | null;
    released_at?: string | null;
    invoice_no?: string | null;
    is_deleted_by_buyer?: boolean | null;
}

export interface Shipment {
    id: string;
    seller_id: string;
    route_data: any;
    created_at: string;
    vehicle_type?: string | null;
    shipping_cost_total?: number | null;
    shipping_cost_breakdown?: any;
    route_distance_km?: number | null;
    route_duration_mins?: number | null;
    waypoint_order?: number[] | null;
}

export interface Stakeholder {
    id: string;
    name: string;
    location: string;
    capacity: number;
    type: 'warehouse' | 'distributor' | 'market' | 'supplier';
    category?: string;
    demand_weight?: number;
    lat?: number;
    lng?: number;
}

export interface Warehouse {
    id: string;
    seller_id: string;
    name: string;
    location: string;
    is_default: boolean;
    created_at: string;
}

export interface SellerAvailability {
    seller_id: string;
    allows_preorder: boolean;
    lead_days: number;
    cutoff_time: string | null;
    closed_weekdays: number[];
    holidays: string[];
    timezone: string;
    updated_at: string;
}

export type CouponDiscountType = 'percent' | 'fixed_per_kg' | 'shipping_fixed';

export interface Coupon {
    id: string;
    seller_id: string | null;
    code: string;
    discount_type: CouponDiscountType;
    amount: number;
    min_qty: number;
    max_uses: number | null;
    used_count: number;
    is_active: boolean;
    valid_from: string | null;
    valid_to: string | null;
    created_at: string;
}

export interface SavedCart {
    id: string;
    buyer_id: string;
    name: string;
    cart: any;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface Subscription {
    id: string;
    buyer_id: string;
    item_id: string;
    quantity: number;
    frequency: SubscriptionFrequency;
    day_of_week: number | null;
    day_of_month: number | null;
    next_run_at: string | null;
    is_active: boolean;
    shipping_address_id: string | null;
    notes: string | null;
    coupon_code: string | null;
    created_at: string;
    updated_at: string;
}
