export type DisputeStatus = 'open' | 'waiting_admin' | 'resolved' | 'rejected';

export interface Dispute {
    id: string;
    order_id: string;
    buyer_id: string;
    seller_id: string;
    subject: string;
    buyer_message: string;
    seller_response: string | null;
    admin_decision: string | null;
    admin_note: string | null;
    status: DisputeStatus | string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
}

