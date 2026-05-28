import type { SellerAvailability } from '../../types';

const pad2 = (n: number) => String(n).padStart(2, '0');

export const todayIsoDate = (date = new Date()) => {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export type SellerOpenState = 'open' | 'cutoff' | 'closed' | 'holiday' | 'unknown';

export const computeSellerOpenState = (availability: SellerAvailability | null, now = new Date()) => {
    if (!availability) return { state: 'unknown' as const, label: 'N/A' };

    const weekday = now.getDay(); // 0..6
    const isHoliday = (availability.holidays || []).includes(todayIsoDate(now));
    if (isHoliday) return { state: 'holiday' as SellerOpenState, label: 'Libur' };

    const closedDays = new Set((availability.closed_weekdays || []) as number[]);
    if (closedDays.has(weekday)) return { state: 'closed' as SellerOpenState, label: 'Tutup' };

    if (availability.cutoff_time) {
        const [h, m] = String(availability.cutoff_time).split(':').map(x => parseInt(x, 10));
        if (Number.isFinite(h) && Number.isFinite(m)) {
            const cutoff = new Date(now);
            cutoff.setHours(h, m, 0, 0);
            if (now.getTime() > cutoff.getTime()) {
                return { state: 'cutoff' as SellerOpenState, label: 'Cut-off' };
            }
        }
    }

    return { state: 'open' as SellerOpenState, label: 'Buka' };
};

export const badgeForSellerState = (args: {
    availability: SellerAvailability | null;
    now?: Date;
}) => {
    const now = args.now || new Date();
    const { state, label } = computeSellerOpenState(args.availability, now);
    const allowsPreorder = Boolean(args.availability?.allows_preorder);

    if (state === 'open') return { label: 'OPEN', tone: 'emerald' as const };
    if (state === 'unknown') return { label: 'STATUS?', tone: 'slate' as const };

    if (allowsPreorder) {
        const lead = Number(args.availability?.lead_days || 0);
        return { label: lead > 0 ? `PREORDER +${lead}d` : 'PREORDER', tone: 'amber' as const };
    }

    return { label: label.toUpperCase(), tone: 'rose' as const };
};

