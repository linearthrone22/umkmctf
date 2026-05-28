import type { Order } from '../../../types';

export type PayoutPeriod = 'weekly' | 'monthly';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const startOfWeekMonday = (d: Date) => {
    const dd = startOfDay(d);
    const day = dd.getDay(); // 0 Sun ... 6 Sat
    const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
    dd.setDate(dd.getDate() + diff);
    return dd;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export const getPeriodRange = (period: PayoutPeriod, now = new Date()) => {
    const start = period === 'weekly' ? startOfWeekMonday(now) : startOfMonth(now);
    const end = new Date(now);
    return { start, end };
};

const isPaid = (o: Order) => String((o as any).payment_status || 'unpaid') === 'paid';
const isReleased = (o: Order) => String((o as any).escrow_status || '') === 'released';
const isHeld = (o: Order) => String((o as any).escrow_status || '') === 'held';

const getEventDate = (o: Order) => {
    const releasedAt = (o as any).released_at;
    const deliveredAt = (o as any).delivered_at;
    const createdAt = (o as any).created_at;
    const raw = releasedAt || deliveredAt || createdAt;
    const d = raw ? new Date(raw) : null;
    return d && Number.isFinite(d.getTime()) ? d : null;
};

export const computePayoutSummary = (orders: Order[], period: PayoutPeriod, now = new Date()) => {
    const { start, end } = getPeriodRange(period, now);
    const inRange = (d: Date) => d.getTime() >= start.getTime() && d.getTime() <= end.getTime();

    let releasedTotal = 0;
    let heldTotal = 0;
    let paidTotal = 0;
    let releasedCount = 0;

    for (const o of orders) {
        const total = Number(o.total_price) || 0;
        if (isPaid(o)) paidTotal += total;
        if (isHeld(o) && isPaid(o)) heldTotal += Number((o as any).escrow_amount) || total;

        const d = getEventDate(o);
        const eligibleReleased = (isReleased(o) || (String(o.status) === 'delivered' && isPaid(o))) && d && inRange(d);
        if (eligibleReleased) {
            releasedTotal += Number((o as any).escrow_amount) || total;
            releasedCount += 1;
        }
    }

    return {
        range: { start, end },
        releasedTotal,
        heldTotal,
        paidTotal,
        releasedCount
    };
};

