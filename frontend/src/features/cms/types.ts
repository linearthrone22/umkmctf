export interface MarketplaceCategory {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

export interface PromoBanner {
    id: string;
    title: string;
    subtitle: string | null;
    image_url: string | null;
    link_url: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
}

