import { supabase } from '../../supabase';

export type ProductEventType = 'view' | 'click' | 'add_to_cart' | 'checkout';

export const trackProductEvent = async (args: { buyerId: string; itemId: string; eventType: ProductEventType }) => {
    try {
        const { error } = await supabase.from('product_events').insert([
            { buyer_id: args.buyerId, item_id: args.itemId, event_type: args.eventType }
        ]);
        if (error) {
            // Ignore missing table / policy noise
            if (String((error as any)?.code || '').toUpperCase() !== '42P01') {
                console.warn('trackProductEvent error:', error.message);
            }
        }
    } catch {
        // ignore
    }
};

