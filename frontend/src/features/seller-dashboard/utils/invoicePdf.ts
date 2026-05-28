import { jsPDF } from 'jspdf';
import type { Order, User } from '../../../types';

const formatCurrency = (value: number) => {
    try {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
    } catch {
        return `Rp ${value || 0}`;
    }
};

export const downloadInvoicePdf = (order: Order, seller: User | null) => {
    const doc = new jsPDF();

    const marginX = 14;
    let y = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('INVOICE', marginX, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y += 8;
    const invNo = (order as any).invoice_no || '-';
    doc.text(`Invoice No: ${invNo}`, marginX, y);
    y += 5;
    doc.text(`Invoice Date: ${new Date(order.created_at || Date.now()).toLocaleDateString('id-ID')}`, marginX, y);
    y += 5;
    doc.text(`Order ID: ${order.id}`, marginX, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Seller', marginX, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.text(`${seller?.business_name || seller?.username || order.seller_name || 'UMKM Seller'}`, marginX, y);
    if (seller?.business_address) {
        y += 5;
        doc.text(`Alamat: ${seller.business_address}`, marginX, y);
    } else if (seller?.location) {
        y += 5;
        doc.text(`Lokasi: ${seller.location}`, marginX, y);
    }
    if (seller?.tax_id) {
        y += 5;
        doc.text(`Tax ID: ${seller.tax_id}`, marginX, y);
    }

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Buyer', marginX, y);
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.text(`${order.buyer_name || order.buyer_id}`, marginX, y);
    if (order.buyer_location) {
        y += 5;
        doc.text(`Lokasi: ${order.buyer_location}`, marginX, y);
    }

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Detail', marginX, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Komoditas: ${order.commodity || '-'}`, marginX, y);
    y += 5;
    doc.text(`Quantity: ${order.quantity} kg`, marginX, y);
    y += 5;
    doc.text(`Total: ${formatCurrency(order.total_price)}`, marginX, y);
    y += 5;
    doc.text(`Status: ${order.status}`, marginX, y);

    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL DUE: ${formatCurrency(order.total_price)}`, marginX, y);

    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Catatan: Invoice sederhana untuk konfirmasi pembayaran (paid/unpaid).', marginX, y);

    doc.save(`invoice-${order.id}.pdf`);
};
