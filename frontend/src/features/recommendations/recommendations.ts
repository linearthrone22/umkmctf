import type { Product } from '../../types';
import { parseCoordinatesFromInput } from '../../utils/location';
import { haversineKm } from '../../utils/geo';

const effectivePrice = (p: Product) => {
    const discount = Number(p.discount_per_kg || 0);
    return Math.max(0, Number(p.price || 0) - Math.max(0, discount));
};

export const recommendBestValue = (products: Product[], limit = 6) => {
    return [...products]
        .filter(p => p.is_active !== false)
        .filter(p => (Number(p.stock) || 0) > 0)
        .sort((a, b) => effectivePrice(a) - effectivePrice(b))
        .slice(0, limit);
};

export const recommendNearest = (products: Product[], buyerLocation: string, limit = 6) => {
    const buyerCoords = buyerLocation ? parseCoordinatesFromInput(buyerLocation) : null;
    if (!buyerCoords) return [];
    return [...products]
        .filter(p => p.is_active !== false)
        .filter(p => (Number(p.stock) || 0) > 0)
        .map(p => {
            const coords = p.location ? parseCoordinatesFromInput(p.location) : null;
            const km = coords ? haversineKm(buyerCoords, coords) : null;
            return { p, km };
        })
        .filter(x => x.km != null)
        .sort((a, b) => (a.km as number) - (b.km as number))
        .slice(0, limit)
        .map(x => x.p);
};

export const recommendSimilar = (products: Product[], seed: Product | null, limit = 6) => {
    if (!seed) return [];
    const seedCommodity = String(seed.commodity || '').toLowerCase();
    const seedCategory = String(seed.category || '').toLowerCase();
    return [...products]
        .filter(p => p.is_active !== false)
        .filter(p => (Number(p.stock) || 0) > 0)
        .filter(p => p.id !== seed.id)
        .filter(p => {
            const c = String(p.commodity || '').toLowerCase();
            const cat = String(p.category || '').toLowerCase();
            return (seedCategory && cat && cat === seedCategory) || (seedCommodity && c.includes(seedCommodity));
        })
        .slice(0, limit);
};

