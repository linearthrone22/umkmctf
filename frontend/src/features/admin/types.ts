export type AdminTab = 'overview' | 'cms' | 'moderation' | 'anomalies' | 'disputes' | 'verification' | 'audit';

export interface AdminStats {
    items?: number;
    orders?: number;
    reviews?: number;
    profiles?: number;
    disputes?: number;
    verifications?: number;
}

export interface AuditLogRow {
    id: string;
    actor_id: string | null;
    action: string;
    target_table: string | null;
    target_id: string | null;
    payload: any;
    created_at: string;
}

export interface AdminAnomalyRow {
    kind: string;
    severity: number;
    title: string;
    details: string;
    entity_table: string;
    entity_id: string;
    created_at: string;
}

export type SellerVerificationStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | string;

export interface SellerVerificationRow {
    seller_id: string;
    status: SellerVerificationStatus;
    doc_url: string | null;
    note: string | null;
    submitted_at: string | null;
    decided_at: string | null;
    decided_by: string | null;
    created_at: string;
    updated_at: string;
}

