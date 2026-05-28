export type RefundStatus = 'requested' | 'approved' | 'rejected' | 'refunded';

export interface RefundRequest {
    id: string;
    order_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    reason: string;
    status: RefundStatus | string;
    seller_note: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
}

