# Supabase SQL (run order)

Jalankan file-file ini di Supabase SQL Editor (urutannya penting):

1. `00_core_schema.sql`
2. `24_warehouses_variants.sql` (opsional: multi lokasi + variant fields)
3. `25_seller_availability.sql` (opsional: pre-order/cutoff/libur)
4. `20_addresses.sql` (kalau pakai checkout alamat)
5. `26_saved_carts.sql` (opsional: buyer save/load cart)
6. `27_coupons.sql` (opsional: kupon/voucher)
7. `29_subscriptions.sql` (opsional: repeat order/subscription)
8. `31_product_events.sql` (opsional: analytics conversion)
9. `10_rls_profiles.sql`
10. `11_rls_items.sql`
11. `12_rls_orders.sql`
12. `13_rls_shipments.sql`
13. `21_wishlists.sql`
14. `22_chat.sql`
15. `23_reviews.sql`
16. `orders_stock_triggers.sql` (stok auto berkurang + auto-hide stok 0)
17. `28_orders_stock_and_coupons.sql` (opsional: upgrade kupon + stok)
18. `32_logistics_payments_upgrade.sql` (opsional: POD, refund/escrow, invoice, ongkir meta)
19. `33_disputes.sql` (opsional: dispute center)
20. `34_seller_verification.sql` (opsional: KYC ringan + badge)
21. `35_chat_anti_spam.sql` (opsional: rate limit chat)
22. `37_admin_cms.sql` (opsional: kategori + banner promo)
23. `38_listing_moderation.sql` (opsional: approve/reject listing)
24. `30_admin_audit.sql` (opsional: audit logs table)
25. `36_audit_logs_triggers.sql` (opsional: audit triggers)
26. `39_admin_anomalies.sql` (opsional: RPC anomaly dashboard)
27. `40_harden_signup_role.sql` (recommended: cegah signup set role=admin)
28. `41_profiles_guard_role.sql` (recommended: cegah user ubah role sendiri)
29. `42_soft_delete_orders.sql` (opsional: soft delete riwayat order buyer)

Catatan:
- Kalau kamu sudah punya tabel dengan nama sama tapi struktur beda, file `00_core_schema.sql` tidak akan mengubah tipe kolom lama (harus migrasi manual).
