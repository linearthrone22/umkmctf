import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PriceStrategistCard from '../../components/PriceStrategistCard';
import LogisticsOrchestrator from '../../components/LogisticsOrchestrator';
import OutreachAgent from '../../components/OutreachAgent';
import TerminalLogger from '../../components/TerminalLogger';
import { SYSTEM_PROMPTS } from '../../config/prompts';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { geocodeLocation, parseCoordinatesFromInput } from '../../utils/location';
import { chatCompletion, serperImages, serperSearch } from '../../utils/aiClient';

import type { LogEntry } from '../../types';
import type { SellerDashboardTab } from './types';
import SellerSidebar from './components/SellerSidebar';
import SellerHeader from './components/SellerHeader';
import SellerHeroCard from './components/SellerHeroCard';
import SellerMobileNav from './components/SellerMobileNav';
import SellerInventoryTab from './tabs/SellerInventoryTab';
import SellerLogisticsPanel from './tabs/SellerLogisticsPanel';
import SellerOrdersTab from './tabs/SellerOrdersTab';
import SellerPaymentsTab from './tabs/SellerPaymentsTab';
import SellerShipmentsTab from './tabs/SellerShipmentsTab';
import SellerChatTab from './tabs/SellerChatTab';
import SellerSettingsTab from './tabs/SellerSettingsTab';
import SellerAnalyticsTab from './tabs/SellerAnalyticsTab';
import { useToastStack } from '../notifications/useToastStack';
import ToastStack from '../notifications/ToastStack';
import { useOrderRealtimeToasts } from '../notifications/useOrderRealtimeToasts';
import { useDisputeRealtimeToasts } from '../notifications/useDisputeRealtimeToasts';
import ShipmentCostCard from '../logistics/components/ShipmentCostCard';
import { calculateShippingCost } from '../logistics/pricing';
import type { RouteStats, VehicleType } from '../logistics/types';
import { supabase } from '../../supabase';

const SellerDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const llmModel = import.meta.env.VITE_LLM_MODEL || 'ollama:qwen2.5-coder:1.5b';
    const llmIsOllama = llmModel.startsWith('ollama:') || llmModel.startsWith('ollama/');
    const apiBaseUrl = String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const {
        products,
        orders,
        stakeholders,
        shipments,
        refreshData,
        publishProduct,
        deleteProduct,
        updateProduct,
        updateOrderStatus,
        saveShipment,
        deleteShipment,
        clearShipmentHistory
    } = useApp();
    const { logout, user, updateProfile } = useAuth();

    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SellerDashboardTab>('dashboard');
    const [currentStep, setCurrentStep] = useState(1);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [shipmentConfirming, setShipmentConfirming] = useState(false);
    const [shipmentClearing, setShipmentClearing] = useState(false);
    const [shipmentDeletingId, setShipmentDeletingId] = useState<string | null>(null);
    const toast = useToastStack();

    useOrderRealtimeToasts(user, toast.push);
    useDisputeRealtimeToasts(user, toast.push);

    // Form State
    const [commodity, setCommodity] = useState('Cabai Merah');
    const [stock, setStock] = useState(250);
    const [location, setLocation] = useState(user?.location || 'Jakarta');
    const [imageUrl, setImageUrl] = useState('');
    const [locationSaving, setLocationSaving] = useState(false);
    const [imageSearching, setImageSearching] = useState(false);
    const [businessName, setBusinessName] = useState<string>((user as any)?.business_name || '');
    const [businessAddress, setBusinessAddress] = useState<string>((user as any)?.business_address || '');
    const [taxId, setTaxId] = useState<string>((user as any)?.tax_id || '');

    // AI Results State
    const [priceData, setPriceData] = useState<any>(null);
    const [logisticsData, setLogisticsData] = useState<any>(null);
    const [outreachData, setOutreachData] = useState<any>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
    const [vehicleType, setVehicleType] = useState<VehicleType>('motor');

    const shippableOrders = useMemo(() => orders.filter(order => order.status === 'pending'), [orders]);
    const selectedOrders = useMemo(
        () => shippableOrders.filter(o => selectedOrderIds.includes(o.id)),
        [selectedOrderIds, shippableOrders]
    );
    const selectedLoadKg = useMemo(
        () => selectedOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0),
        [selectedOrders]
    );

    const sellerBaseCoords = useMemo(
        () => parseCoordinatesFromInput(location) || { lat: -6.9175, lng: 107.6191 },
        [location]
    );

    const logisticsSuppliers = useMemo(
        () => [{ name: `Anda (${location})`, lat: sellerBaseCoords.lat, lng: sellerBaseCoords.lng }, ...stakeholders.filter(s => s.type === 'supplier')],
        [location, sellerBaseCoords.lat, sellerBaseCoords.lng, stakeholders]
    );

    const logisticsBuyers = useMemo(
        () =>
            shippableOrders
                .filter(o => selectedOrderIds.length === 0 || selectedOrderIds.includes(o.id))
                .map(o => {
                    const locationString = o.buyer_location || '-6.9, 107.6';
                    const [lat, lng] = locationString.split(',').map((c: string) => parseFloat(c.trim()));
                    return { name: o.buyer_name, lat: lat || -6.9, lng: lng || 107.6 };
                }),
        [shippableOrders, selectedOrderIds]
    );

    const toggleOrderSelection = (id: string) => {
        setSelectedOrderIds(prev => (prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]));
    };

    useEffect(() => {
        const validIds = new Set(shippableOrders.map(order => order.id));
        setSelectedOrderIds(prev => prev.filter(id => validIds.has(id)));
    }, [shippableOrders]);

    useEffect(() => {
        if (user?.location) {
            setLocation(user.location);
        }
    }, [user?.location]);

    useEffect(() => {
        setBusinessName(String((user as any)?.business_name || ''));
        setBusinessAddress(String((user as any)?.business_address || ''));
        setTaxId(String((user as any)?.tax_id || ''));
    }, [user?.id]);

    const addLog = (level: LogEntry['level'], message: string, payload?: any) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, level, message, payload }]);
    };

    const handleGeocode = async () => {
        if (!location) return;
        try {
            const parsed = parseCoordinatesFromInput(location);
            if (parsed) {
                const normalized = `${parsed.lat}, ${parsed.lng}`;
                setLocation(normalized);
                addLog('SUCCESS', 'Lokasi sudah berupa koordinat.');
                return;
            }

            const { coords, displayName } = await geocodeLocation(location, import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
            setLocation(coords);
            addLog('SUCCESS', `Lokasi ditemukan: ${displayName}`);
        } catch (err: any) {
            addLog('ERROR', err?.message || 'Geocoding gagal. Pastikan API Key valid.');
        }
    };

    const handleSaveLocation = async () => {
        const rawLocation = location.trim();
        if (!rawLocation) {
            alert('Lokasi tidak boleh kosong.');
            return;
        }

        setLocationSaving(true);
        try {
            const parsed = parseCoordinatesFromInput(rawLocation);
            let normalizedLocation = '';

            if (parsed) {
                normalizedLocation = `${parsed.lat}, ${parsed.lng}`;
            } else {
                const result = await geocodeLocation(rawLocation, import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
                if (!result || !result.coords) {
                    throw new Error('Lokasi tidak ditemukan. Coba masukkan alamat yang lebih spesifik.');
                }
                normalizedLocation = result.coords;
                addLog('INFO', `Lokasi dinormalisasi: ${result.displayName}`);
            }

            await updateProfile({
                location: normalizedLocation,
                business_name: businessName.trim() || null,
                business_address: businessAddress.trim() || null,
                tax_id: taxId.trim() || null
            } as any);
            setLocation(normalizedLocation);
            alert('Lokasi berhasil diperbarui di database!');
            addLog('SUCCESS', `Profil diperbarui. Lokasi baru: ${normalizedLocation}`);
        } catch (err: any) {
            const msg = err?.message || 'Terjadi kesalahan.';
            alert(`Gagal memperbarui lokasi: ${msg}`);
            addLog('ERROR', `Update lokasi gagal: ${msg}`);
        } finally {
            setLocationSaving(false);
        }
    };

    const handleAutoImage = async (opts?: { silent?: boolean }) => {
        const silent = !!opts?.silent;
        const q = (commodity || '').trim();
        if (!q) {
            if (!silent) {
                alert('Isi komoditas dulu untuk cari gambar.');
            }
            return null as string | null;
        }

        setImageSearching(true);
        try {
            const data = await serperImages(`${q} komoditas segar`);
            const candidate =
                data?.images?.[0]?.imageUrl ||
                data?.images?.[0]?.link ||
                data?.images?.[0]?.image ||
                data?.images?.[0]?.thumbnailUrl ||
                '';
            const url = typeof candidate === 'string' ? candidate.trim() : '';
            if (url) {
                setImageUrl(url);
                addLog('SUCCESS', 'Link gambar otomatis ditemukan.');
                return url;
            } else {
                const fallback = `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`;
                setImageUrl(fallback);
                addLog('INFO', 'Tidak ada hasil gambar, pakai fallback Unsplash.', { fallback });
                return fallback;
            }
        } catch (err: any) {
            const fallback = `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`;
            setImageUrl(fallback);
            addLog('ERROR', `Auto image gagal: ${err?.message || 'Terjadi kesalahan.'}`, err);
            if (!silent) {
                alert('Gagal cari gambar otomatis. Dipakai fallback sementara.');
            }
            return fallback;
        } finally {
            setImageSearching(false);
        }
    };

    const extractAiContent = (data: any, stepLabel: string) => {
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || content.trim().length === 0) {
            const apiError = data?.error?.message || data?.error?.code;
            throw new Error(`${stepLabel}: respon AI kosong${apiError ? ` (${apiError})` : ''}`);
        }
        return content.trim();
    };

    const extractJsonPayload = (raw: string, stepLabel: string) => {
        const cleaned = String(raw || '').replace(/```(?:json)?/gi, '').trim();
        try {
            const parsed = JSON.parse(cleaned);
            return JSON.stringify(parsed);
        } catch {
            // continue to regex extraction below
        }

        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        const objIndex = objMatch ? cleaned.indexOf(objMatch[0]) : Number.POSITIVE_INFINITY;
        const arrIndex = arrMatch ? cleaned.indexOf(arrMatch[0]) : Number.POSITIVE_INFINITY;
        const best = objIndex <= arrIndex ? objMatch?.[0] : arrMatch?.[0];
        if (!best) throw new Error(`${stepLabel}: format JSON tidak ditemukan.`);
        return best;
    };

    const trustedDomainScore = (link?: string) => {
        if (!link || typeof link !== 'string') return 0;
        try {
            const u = new URL(link);
            const host = u.hostname.toLowerCase();
            if (host === 'bps.go.id' || host.endsWith('.bps.go.id')) return 4;
            if (host === 'hargapangan.id') return 3;
            if (host === 'bi.go.id' || host.endsWith('.bi.go.id')) return 3;
            if (host === 'badanpangan.go.id' || host.endsWith('.badanpangan.go.id')) return 3;
            if (host === 'data.badanpangan.go.id' || host.endsWith('.data.badanpangan.go.id')) return 3;
            if (host === 'kemendag.go.id' || host.endsWith('.kemendag.go.id')) return 2;
            if (host === 'pertanian.go.id' || host.endsWith('.pertanian.go.id')) return 2;
            return 0;
        } catch {
            if (link.includes('bps.go.id')) return 4;
            if (link.includes('hargapangan.id')) return 3;
            if (link.includes('bi.go.id')) return 3;
            if (link.includes('badanpangan.go.id')) return 3;
            if (link.includes('kemendag.go.id')) return 2;
            if (link.includes('pertanian.go.id')) return 2;
            return 0;
        }
    };

    const normalizeToken = (value: string) =>
        String(value || '')
            .toLowerCase()
            .replace(/cabe/g, 'cabai')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

    const extractRpPrices = (text: string): number[] => {
        const raw = String(text || '');
        const results: number[] = [];

        // Rp39.731 per kg / Rp 58.306/kg / Rp 120000 per kilogram
        const rpRegex =
            /Rp\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,6})(?:\s*(?:\/\s*kg|per\s*kg|\/kg|per\s*kilogram|kg))?/gi;
        let m: RegExpExecArray | null;
        while ((m = rpRegex.exec(raw))) {
            const n = parseInt(String(m[1]).replace(/\./g, ''), 10);
            if (Number.isFinite(n)) results.push(n);
        }

        // 40 ribu/kg / 40 ribu per kg
        const ribuRegex = /([0-9]{1,3})\s*ribu\s*(?:\/\s*kg|per\s*kg|kg)?/gi;
        while ((m = ribuRegex.exec(raw))) {
            const n = parseInt(m[1], 10) * 1000;
            if (Number.isFinite(n)) results.push(n);
        }

        return results.filter(n => n > 0);
    };

    const extractCommodityPrices = (text: string, commodityName: string): number[] => {
        const raw = String(text || '');
        const commodity = normalizeToken(commodityName);
        if (!commodity) return [];

        const hay = normalizeToken(raw);
        const key = commodity.split(/\s+/).filter(Boolean).join(' ');
        if (!key) return extractRpPrices(raw);

        // If we can't find the commodity keyword, do not guess from unrelated numbers.
        if (!hay.includes(key)) return [];

        // Heuristic: pick prices closest to occurrences of the commodity keyword.
        const pricesWithPos: Array<{ value: number; pos: number }> = [];
        const rpRegex =
            /Rp\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,6})(?:\s*(?:\/\s*kg|per\s*kg|\/kg|per\s*kilogram|kg))?/gi;

        let m: RegExpExecArray | null;
        while ((m = rpRegex.exec(raw))) {
            const n = parseInt(String(m[1]).replace(/\./g, ''), 10);
            if (Number.isFinite(n)) pricesWithPos.push({ value: n, pos: m.index });
        }

        const ribuRegex = /([0-9]{1,3})\s*ribu\s*(?:\/\s*kg|per\s*kg|kg)?/gi;
        while ((m = ribuRegex.exec(raw))) {
            const n = parseInt(m[1], 10) * 1000;
            if (Number.isFinite(n)) pricesWithPos.push({ value: n, pos: m.index });
        }

        // Fallback: plain thousands with dot separators near commodity mention (e.g. "Semangka 9.000")
        // Only accept when the raw text already contains the commodity keyword to reduce false positives.
        const plainThousandRegex = /(^|[^0-9])([0-9]{1,3}(?:\.[0-9]{3})+)(?![0-9])/g;
        while ((m = plainThousandRegex.exec(raw))) {
            const n = parseInt(String(m[2]).replace(/\./g, ''), 10);
            if (Number.isFinite(n)) pricesWithPos.push({ value: n, pos: m.index });
        }

        if (pricesWithPos.length === 0) return [];

        // Locate positions of the commodity keyword in the original string by scanning the normalized version.
        // We'll approximate by using indexOf on the original raw string too, for distance scoring.
        const rawLower = raw.toLowerCase();
        const tokens = commodity.split(/\s+/).filter(Boolean);
        const primaryToken = tokens[0];
        if (!primaryToken) return pricesWithPos.map(p => p.value);

        const keyPositions: number[] = [];
        let idx = 0;
        while (idx < rawLower.length) {
            const found = rawLower.indexOf(primaryToken, idx);
            if (found === -1) break;
            keyPositions.push(found);
            idx = found + primaryToken.length;
        }
        if (keyPositions.length === 0) return pricesWithPos.map(p => p.value);

        const scored = pricesWithPos
            .map(p => ({
                value: p.value,
                score: Math.min(...keyPositions.map(kp => Math.abs(p.pos - kp)))
            }))
            .sort((a, b) => a.score - b.score);

        return scored.slice(0, 5).map(s => s.value);
    };

    const median = (nums: number[]) => {
        const a = nums.filter(n => Number.isFinite(n)).slice().sort((x, y) => x - y);
        if (a.length === 0) return null;
        const mid = Math.floor(a.length / 2);
        return a.length % 2 === 0 ? Math.round((a[mid - 1] + a[mid]) / 2) : a[mid];
    };

    const clamp = (value: number, minValue: number, maxValue: number) => Math.min(maxValue, Math.max(minValue, value));

    const buildSourcesFromSearch = (items: Array<{ title?: string; snippet?: string; link?: string }>) => {
        return items
            .map((s) => {
                const link = typeof s.link === 'string' ? s.link : '';
                const title = typeof s.title === 'string' ? s.title : link;
                const snippet = typeof s.snippet === 'string' ? s.snippet : '';
                const prices = extractCommodityPrices(`${title}\n${snippet}`, commodity);
                const price_rp_per_kg = prices.length > 0 ? prices[0] : null;
                return { title, link, price_rp_per_kg };
            })
            .filter((s) => s.link);
    };

    const parseAiJson = async <T,>(raw: string, stepLabel: string): Promise<T> => {
        const extracted = extractJsonPayload(raw, stepLabel);
        try {
            return JSON.parse(extracted) as T;
        } catch (err: any) {
            // Attempt one-shot repair using the same model in strict JSON mode (Ollama supports `format: 'json'`)
            const repairPayload: any = {
                model: llmModel,
                messages: [
                    {
                        role: 'user',
                        content:
                            `Perbaiki teks berikut menjadi JSON valid. Output HARUS hanya 1 JSON (tanpa markdown, tanpa komentar, tanpa trailing comma). ` +
                            `Gunakan double quotes untuk semua key dan string.\n\nINPUT:\n${raw}`
                    }
                ]
            };
            if (llmIsOllama) {
                repairPayload.format = 'json';
            } else {
                repairPayload.response_format = { type: 'json_object' };
            }

            const repairRes = await chatCompletion(repairPayload);
            const repairedRaw = extractAiContent(repairRes, `${stepLabel}: repair`);
            const repairedExtracted = extractJsonPayload(repairedRaw, `${stepLabel}: repair`);
            return JSON.parse(repairedExtracted) as T;
        }
    };

    const toIndonesian = async (text: string) => {
        const raw = String(text || '').trim();
        if (!raw) return raw;
        const res = await chatCompletion({
            model: llmModel,
            messages: [
                {
                    role: 'user',
                    content:
                        'Ubah teks berikut menjadi Bahasa Indonesia yang alami. Pertahankan makna dan angka apa adanya. Output hanya teks hasilnya.\n\n' +
                        raw
                }
            ]
        });
        return extractAiContent(res, 'Rationale translate');
    };

    const normalizeRouteOptions = (rawData: any, buyers: Array<{ name?: string; demand?: number }>) => {
        const buyerNames = buyers.map(b => b.name).filter(Boolean) as string[];
        const baseSequence = buyerNames.length > 0 ? ['Gudang Anda', ...buyerNames] : ['Gudang Anda'];
        const totalLoad = buyers.reduce((sum, buyer) => sum + (Number(buyer.demand) || 0), 0);

        const normalizeStep = (step: any) => {
            if (typeof step === 'string' || typeof step === 'number') {
                return String(step).trim();
            }
            if (step && typeof step === 'object') {
                if (typeof step.name === 'string') return step.name.trim();
                if (typeof step.label === 'string') return step.label.trim();
            }
            return '';
        };

        const normalizeSequence = (sequence: any[]) => {
            const normalized = sequence.map(normalizeStep).filter(Boolean);
            if (normalized.length === 0) {
                return baseSequence;
            }
            if (!normalized[0].toLowerCase().includes('gudang')) {
                return ['Gudang Anda', ...normalized];
            }
            return normalized;
        };

        const makeBatch = (sequence: string[], batchId: number, reasoning: string) => ({
            batch_id: batchId,
            sequence,
            total_load: totalLoad,
            reasoning
        });

        let batches: any[] = Array.isArray(rawData?.batches) ? rawData.batches : [];

        if (batches.length === 0) {
            batches = [makeBatch(baseSequence, 1, 'Rute dasar berdasarkan daftar buyer yang dipilih.')];
        }

        batches = batches
            .map((batch: any, index: number) => ({
                ...batch,
                batch_id: Number(batch.batch_id) || index + 1,
                sequence: normalizeSequence(Array.isArray(batch.sequence) ? batch.sequence : [])
            }))
            .filter((batch: any) => Array.isArray(batch.sequence) && batch.sequence.length > 0);

        if (batches.length < 2) {
            let altSequence = baseSequence;
            if (buyerNames.length >= 2) {
                if (buyerNames.length === 2) {
                    altSequence = ['Gudang Anda', buyerNames[1], buyerNames[0]];
                } else {
                    const alt = buyerNames.slice();
                    [alt[1], alt[2]] = [alt[2], alt[1]];
                    altSequence = ['Gudang Anda', ...alt];
                }
            }
            batches.push(makeBatch(altSequence, batches.length + 1, 'Alternatif rute dengan urutan pengantaran berbeda.'));
        }

        batches = batches.slice(0, 5).map((batch: any, idx: number) => ({
            ...batch,
            batch_id: idx + 1
        }));

        return { ...(rawData || {}), batches };
    };

    const handleRunAgent = async () => {
        setLoading(true);
        setCurrentStep(2);
        setLogs([]);
        addLog('INFO', `Starting Agentic Workflow for ${commodity}...`);

        try {
            if (!imageUrl.trim()) {
                addLog('INFO', 'Link gambar kosong, mencoba isi otomatis...');
                await handleAutoImage({ silent: true });
            }

            // PRE-STEP: MARKET RESEARCH (SERPER)
            addLog('AI', `Step 0: Conducting real-time market research for ${commodity}...`);
            let searchResults = 'No real-time data found.';
            let marketSources: Array<{ title?: string; snippet?: string; link?: string }> = [];
            let extractedMarketPrices: number[] = [];

            // Preferred trusted reference: PIHPS (Bank Indonesia) for strategic commodities
            try {
                if (apiBaseUrl) {
                    const resp = await fetch(`${apiBaseUrl}/api/market/pihps?q=${encodeURIComponent(commodity)}&days=10`);
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data?.ok && typeof data?.price_rp_per_kg === 'number' && Number.isFinite(data.price_rp_per_kg) && data.price_rp_per_kg > 0) {
                            extractedMarketPrices = [Math.round(data.price_rp_per_kg)];
                            marketSources = [
                                {
                                    title: `${data?.source?.title || 'PIHPS Nasional (BI)'}${data?.date ? ` — ${data.date}` : ''}`,
                                    snippet: `Harga referensi: Rp ${Math.round(data.price_rp_per_kg).toLocaleString('id-ID')}/kg`,
                                    link: data?.source?.link || 'https://www.bi.go.id/hargapangan'
                                }
                            ];
                            searchResults = JSON.stringify(marketSources);
                            addLog('SUCCESS', 'Referensi harga diambil dari PIHPS (Bank Indonesia).', marketSources);
                        }
                    }
                }
            } catch {
                // ignore, fall back to Serper
            }

            try {
                // If we already have a trusted numeric price from PIHPS, skip Serper to avoid noise.
                if (extractedMarketPrices.length > 0) {
                    throw new Error('skip_serper');
                }
                const queries = [
                    `site:bps.go.id \"Harga ${commodity}\" 1 kg ${location}`,
                    `site:bps.go.id \"Rata-rata Harga Eceran\" ${commodity}`,
                    `site:bps.go.id \"Rata-rata Harga Eceran Nasional\" ${commodity}`,
                    `site:hargapangan.id harga ${commodity} ${location}`,
                    `site:bi.go.id harga ${commodity} ${location}`,
                    `site:panelharga.badanpangan.go.id harga ${commodity} ${location}`,
                    `site:data.badanpangan.go.id harga ${commodity} ${location}`,
                    `site:kemendag.go.id harga ${commodity} ${location}`,
                    `harga ${commodity} ${location} Rp/kg`
                ];

                let best: { sources: Array<{ title?: string; snippet?: string; link?: string }>; prices: number[]; score: number } | null = null;

                for (const q of queries) {
                    const res = await serperSearch(q);
                    const organic = Array.isArray(res?.organic) ? res.organic : [];
                    if (organic.length === 0) continue;

                    const normalized = organic.map((s: any) => ({ title: s.title, snippet: s.snippet, link: s.link }));
                    const sorted = normalized.sort((a: any, b: any) => trustedDomainScore(b?.link) - trustedDomainScore(a?.link));
                    const candidateSources = sorted.slice(0, 5);
                    const candidatePrices = candidateSources.flatMap((s: any) =>
                        extractCommodityPrices(`${s?.title || ''}\n${s?.snippet || ''}`, commodity)
                    );

                    const bestDomainScore = Math.max(0, ...candidateSources.map((s: any) => trustedDomainScore(s?.link)));
                    const score = (bestDomainScore >= 3 ? 2 : bestDomainScore >= 2 ? 1 : 0) + (candidatePrices.length > 0 ? 1 : 0);

                    if (!best || score > best.score) {
                        best = { sources: candidateSources, prices: candidatePrices, score };
                    }

                    // Perfect match: trusted source + numeric prices extracted
                    if (score >= 3) break;
                }

                if (best) {
                    marketSources = best.sources;
                    extractedMarketPrices = best.prices;
                    searchResults = JSON.stringify(marketSources);
                    addLog('SUCCESS', 'Real-time market data retrieved via Serper (BPS prioritized).', marketSources.slice(0, 3));
                } else {
                    addLog('INFO', 'No Serper organic results found.');
                }
            } catch (err: any) {
                if (String(err?.message || '') !== 'skip_serper') {
                    addLog('INFO', 'Could not fetch real-time data, using AI knowledge base instead.');
                }
            }

            // STEP 1: AI MARKET ESTIMATION & PRICING
            addLog('AI', 'Step 1: Orchestrating Price Strategist Agent (Market Estimation Mode)...');
            const priceDataRes = await chatCompletion({
                model: llmModel,
                format: 'json',
                messages: [
                    {
                        role: 'user',
                        content: `${SYSTEM_PROMPTS.PRICE_STRATEGIST}\n\nDATA PASAR TERBARU (HASIL BROWSING): ${searchResults}\n\nAnalisis harga untuk komoditas ${commodity} di lokasi ${location} dengan stok ${stock}kg.`
                    }
                ]
            });

            const pRaw = extractAiContent(priceDataRes, 'Step 1');
            const pData = await parseAiJson<any>(pRaw, 'Step 1');

            const marketMedian = median(extractedMarketPrices);
            const safeMarketRetail = typeof pData?.market_retail_price === 'number' ? pData.market_retail_price : null;
            const marketRetail = marketMedian ?? safeMarketRetail ?? null;

            // If model outputs unrealistic values (e.g., 1000 for cabai), snap to market median when available.
            if (typeof marketRetail === 'number' && Number.isFinite(marketRetail) && marketRetail > 0) {
                const rec = Number(pData?.recommended_price);
                const mid = Number(pData?.middleman_price_est);
                const recIsBad = !Number.isFinite(rec) || rec <= 0 || rec < marketRetail * 0.25 || rec > marketRetail * 2.5;
                const midIsBad = !Number.isFinite(mid) || mid <= 0 || mid >= marketRetail * 1.2;

                if (recIsBad) {
                    // Competitive but still fair: slightly below retail
                    pData.recommended_price = Math.round(marketRetail * 0.92);
                }
                if (midIsBad) {
                    pData.middleman_price_est = Math.round(marketRetail * 0.75);
                }

                pData.market_retail_price = Math.round(marketRetail);
                pData.middleman_price_est = clamp(Math.round(pData.middleman_price_est), 0, Math.round(pData.recommended_price) - 1);
                pData.extra_profit_per_kg = Math.max(0, Math.round(pData.recommended_price - pData.middleman_price_est));

                if (Array.isArray(marketSources) && marketSources.length > 0) {
                    pData.sources = buildSourcesFromSearch(marketSources);
                }
            }

            if (typeof pData?.rationale === 'string') {
                const rationaleLower = pData.rationale.toLowerCase();
                const looksEnglish =
                    rationaleLower.includes('recommended price') ||
                    rationaleLower.includes('market retail') ||
                    rationaleLower.includes('middleman') ||
                    rationaleLower.includes('extra profit') ||
                    /the\s+\w+/.test(rationaleLower);
                if (looksEnglish) {
                    try {
                        pData.rationale = await toIndonesian(pData.rationale);
                    } catch {
                        // ignore translation failures
                    }
                }
            }

            setPriceData(pData);
            addLog('SUCCESS', 'Pricing strategy discovered.', pData);
            setCurrentStep(2);

            // STEP 2: LOGISTICS POOLING
            addLog('AI', 'Step 2: Orchestrating Logistics Route Orchestrator...');

            const dynamicSuppliers = [
                { name: 'Gudang Anda', lat: sellerBaseCoords.lat, lng: sellerBaseCoords.lng, type: 'perishable', weight: stock },
                ...stakeholders
                    .filter(s => s.type === 'supplier')
                    .map(s => ({ name: s.name, lat: s.lat, lng: s.lng, type: s.category, weight: s.demand_weight }))
            ];

            const dynamicBuyers = (shippableOrders || [])
                .filter(o => selectedOrderIds.length === 0 || selectedOrderIds.includes(o.id))
                .map(o => {
                    const loc = o.buyer_location || '-6.9, 107.6';
                    const [lat, lng] = loc.split(',').map((c: string) => parseFloat(c?.trim() || '0'));
                    return { name: o.buyer_name || 'Buyer', lat: lat || -6.9, lng: lng || 107.6, demand: o.quantity || 0 };
                });

            const routePrompt = (SYSTEM_PROMPTS.ROUTE_ORCHESTRATOR || '')
                .replace('{suppliers_data}', JSON.stringify(dynamicSuppliers))
                .replace('{buyers_data}', JSON.stringify(dynamicBuyers));

            const routeDataRes = await chatCompletion({
                model: llmModel,
                format: 'json',
                messages: [{ role: 'user', content: routePrompt }]
            });
            const rRaw = extractAiContent(routeDataRes, 'Step 2');
            const rData = await parseAiJson<any>(rRaw, 'Step 2');
            const normalizedRoutes = normalizeRouteOptions(rData, dynamicBuyers);
            setLogisticsData(normalizedRoutes);
            addLog('SUCCESS', 'Logistic routes optimized with 500kg capacity limit.', normalizedRoutes);

            setCurrentStep(3);

            // STEP 3: OUTREACH & SECURITY
            addLog('AI', 'Step 3: Orchestrating Dynamic Outreach Agent...');
            const outreachPrompt = (SYSTEM_PROMPTS.OUTREACH_SECURITY || '').replace(
                '{product_details}',
                `${commodity}, Price: ${pData.recommended_price}`
            );

            const outreachDataRes = await chatCompletion({
                model: llmModel,
                format: 'json',
                messages: [{ role: 'user', content: outreachPrompt }]
            });
            const oRaw = extractAiContent(outreachDataRes, 'Step 3');
            const oData = await parseAiJson<any>(oRaw, 'Step 3');
            setOutreachData(oData);
            addLog('SUCCESS', 'Outreach drafts generated with security clearance.', oData);
            addLog('SUCCESS', 'Full Agentic Supply Chain Workflow COMPLETED.');
        } catch (error: any) {
            addLog('ERROR', `Workflow failed: ${error.message}`);
            if (error.response) {
                addLog('ERROR', `API Response (${error.response.status}): ${JSON.stringify(error.response.data)}`);
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmShipment = async () => {
        if (selectedOrderIds.length === 0) {
            alert('Pilih minimal satu pesanan sebelum menandai pengiriman.');
            return;
        }
        if (!logisticsData) {
            alert('Rekomendasi rute belum tersedia.');
            return;
        }
        if (!routeStats || !Number.isFinite(routeStats.distance_km) || routeStats.distance_km <= 0) {
            alert('Rute belum berhasil dimuat (jarak 0 km). Pastikan Maps API key aktif dan peta berhasil memuat rute.');
            return;
        }

        setShipmentConfirming(true);
        try {
            const loadKg = Math.max(1, Math.round(selectedLoadKg || 0));
            const estimate = calculateShippingCost({
                vehicleType,
                distanceKm: routeStats.distance_km,
                durationMins: routeStats.duration_mins,
                loadKg
            });

            addLog('INFO', `Updating status+meta for ${selectedOrderIds.length} orders...`, { vehicleType, estimate });

            const ordersToUpdate = selectedOrders.length > 0 ? selectedOrders : shippableOrders.filter(o => selectedOrderIds.includes(o.id));
            const totalQty = ordersToUpdate.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0) || ordersToUpdate.length || 1;

            await Promise.all(
                ordersToUpdate.map(async (o) => {
                    const q = Number(o.quantity) || 1;
                    const share = Math.round(estimate.total * (q / totalQty));
                    const breakdown = {
                        ...estimate,
                        allocation: {
                            method: 'pro_rata_kg',
                            order_quantity_kg: q,
                            shipment_total_quantity_kg: totalQty,
                            order_shipping_cost: share,
                            shipment_shipping_cost: estimate.total
                        }
                    };

                    const { data, error } = await supabase
                        .from('orders')
                        .update({
                            status: 'shipped',
                            vehicle_type: vehicleType,
                            shipping_cost_total: share,
                            shipping_cost_breakdown: breakdown
                        })
                        .eq('id', o.id)
                        .select('id');

                    if (error) throw error;
                    if (!data || data.length === 0) {
                        throw new Error('Order tidak ditemukan atau tidak bisa diubah (cek RLS policy UPDATE orders).');
                    }
                })
            );

            await saveShipment({
                route_data: {
                    ...logisticsData,
                    meta: {
                        vehicle_type: vehicleType,
                        shipping_cost: estimate,
                        selected_order_ids: selectedOrderIds,
                        waypoint_order: routeStats.waypoint_order
                    }
                },
                vehicle_type: vehicleType,
                shipping_cost_total: estimate.total,
                shipping_cost_breakdown: estimate,
                route_distance_km: routeStats.distance_km,
                route_duration_mins: routeStats.duration_mins,
                waypoint_order: routeStats.waypoint_order
            } as any);

            await refreshData();
            addLog('SUCCESS', 'Shipment confirmed (status shipped + route saved).');
        } catch (err: any) {
            const msg = err?.message || 'Gagal memperbarui status pengiriman.';
            addLog('ERROR', msg);
            alert(msg);
        } finally {
            setShipmentConfirming(false);
        }
    };

    const handleClearShipmentHistory = async () => {
        if (shipments.length === 0) return;
        if (!confirm('Hapus semua riwayat pengiriman?')) return;
        setShipmentClearing(true);
        try {
            await clearShipmentHistory();
            alert('Riwayat pengiriman berhasil dihapus.');
        } catch (err: any) {
            alert(`Gagal menghapus riwayat pengiriman: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setShipmentClearing(false);
        }
    };

    const handleDeleteShipment = async (id: string) => {
        if (!confirm('Hapus riwayat pengiriman ini?')) return;
        setShipmentDeletingId(id);
        try {
            await deleteShipment(id);
            alert('Riwayat pengiriman berhasil dihapus.');
        } catch (err: any) {
            alert(`Gagal menghapus riwayat pengiriman: ${err?.message || 'Terjadi kesalahan.'}`);
        } finally {
            setShipmentDeletingId(null);
        }
    };

    const handleMarkDelivered = async (
        id: string,
        payload: { receiver_name: string; pod_photo_url: string; pod_signature_url: string }
    ) => {
        const safe = {
            receiver_name: payload.receiver_name?.trim() || null,
            pod_photo_url: payload.pod_photo_url?.trim() || null,
            pod_signature_url: payload.pod_signature_url?.trim() || null
        };

        const { data, error } = await supabase
            .from('orders')
            .update({
                status: 'delivered',
                receiver_name: safe.receiver_name,
                pod_photo_url: safe.pod_photo_url,
                pod_signature_url: safe.pod_signature_url
            })
            .eq('id', id)
            .select('id');

        if (error) throw error;
        if (!data || data.length === 0) {
            throw new Error('Order tidak ditemukan atau tidak bisa diubah (cek RLS policy UPDATE orders).');
        }

        await refreshData();
    };

    const handlePublish = async (overrides?: Partial<any>) => {
        if (!commodity || !location) {
            alert('Komoditas dan lokasi harus diisi.');
            return;
        }

        const isValidHttpUrl = (value: string) => {
            try {
                const url = new URL(value);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
                return false;
            }
        };

        setLoading(true);
        try {
            const overridePriceRaw = overrides?.price;
            const overridePrice = typeof overridePriceRaw === 'number' ? overridePriceRaw : Number(overridePriceRaw);
            const hasOverridePrice = Number.isFinite(overridePrice) && overridePrice > 0;

            const recommendedPrice = Number(priceData?.recommended_price) || 0;
            const safePrice = hasOverridePrice
                ? overridePrice
                : Number.isFinite(recommendedPrice) && recommendedPrice > 0
                    ? recommendedPrice
                    : 10000;

            let trimmedImageUrl = imageUrl.trim();
            if (!trimmedImageUrl) {
                const auto = await handleAutoImage({ silent: true });
                if (typeof auto === 'string') {
                    trimmedImageUrl = auto.trim();
                }
            }
            if (trimmedImageUrl && !isValidHttpUrl(trimmedImageUrl)) {
                alert('Link gambar tidak valid. Pastikan formatnya URL http/https.');
                return;
            }

            const newProduct = {
                umkm_name: user?.username || 'UMKM Anda',
                commodity,
                stock,
                price: safePrice,
                location,
                image_url:
                    trimmedImageUrl.length > 0
                        ? trimmedImageUrl
                        : `https://source.unsplash.com/400x300/?${encodeURIComponent(commodity)}`
                ,
                sku: overrides?.sku ?? null,
                variant_grade: overrides?.variant_grade ?? null,
                variant_size: overrides?.variant_size ?? null,
                variant_packaging: overrides?.variant_packaging ?? null,
                warehouse_id: overrides?.warehouse_id ?? null
            };

            await publishProduct(newProduct as any);
            addLog('SUCCESS', 'Product published to Buyer Marketplace!', newProduct);
            alert('Produk berhasil diterbitkan ke Marketplace!');
            setCommodity('');
            setStock(100);
            setImageUrl('');
            setCurrentStep(1);
        } catch (error: any) {
            const message = error?.message || 'Gagal mempublish produk.';
            alert(`Gagal mempublish produk: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExportLog = () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', `directroute-log-${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="flex min-h-dvh bg-slate-50 overflow-hidden font-sans">
            <ToastStack toasts={toast.toasts} onClose={toast.remove} />
            <SellerSidebar
                isOpen={isSidebarOpen}
                activeTab={activeTab}
                user={user}
                ordersCount={orders.length}
                onLogoClick={() => navigate('/')}
                onTabChange={setActiveTab}
                onClose={() => setSidebarOpen(false)}
                onLogout={() => {
                    setSidebarOpen(false);
                    void logout();
                }}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <SellerHeader user={user} onToggleSidebar={() => setSidebarOpen(prev => !prev)} />

                <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 pb-24 lg:pb-6">
                    {activeTab === 'dashboard' && (
                        <SellerHeroCard
                            commodity={commodity}
                            stock={stock}
                            location={location}
                            imageUrl={imageUrl}
                            imageSearching={imageSearching}
                            currentStep={currentStep}
                            loading={loading}
                            onCommodityChange={setCommodity}
                            onStockChange={setStock}
                            onLocationChange={setLocation}
                            onImageUrlChange={setImageUrl}
                            onGeocode={handleGeocode}
                            onAutoImage={handleAutoImage}
                            onRunAgent={handleRunAgent}
                            onPublish={handlePublish}
                        />
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {activeTab === 'inventory' && (
                            <SellerInventoryTab
                                products={products}
                                commodity={commodity}
                                stock={stock}
                                location={location}
                                imageUrl={imageUrl}
                                onCommodityChange={setCommodity}
                                onStockChange={setStock}
                                onLocationChange={setLocation}
                                onImageUrlChange={setImageUrl}
                                onGeocode={handleGeocode}
                                onPublish={handlePublish}
                                onUpdateProduct={updateProduct}
                                onDeleteProduct={deleteProduct}
                            />
                        )}

                        {activeTab === 'orders' && (
                            <SellerOrdersTab orders={orders} onUpdateStatus={updateOrderStatus} onMarkDelivered={handleMarkDelivered} />
                        )}

                        {activeTab === 'analytics' && <SellerAnalyticsTab orders={orders} products={products} />}

                        {activeTab === 'payments' && <SellerPaymentsTab orders={orders} />}

                        {activeTab === 'shipments' && (
                            <SellerShipmentsTab
                                shipments={shipments}
                                onDeleteShipment={handleDeleteShipment}
                                onOpenInLogistics={route => {
                                    setLogisticsData(route);
                                    setActiveTab('logistics');
                                }}
                            />
                        )}

                        {activeTab === 'chat' && <SellerChatTab />}

                        {activeTab === 'dashboard' && (
                            <div className="lg:col-span-3 animate-slide-up stagger-1">
                                <PriceStrategistCard data={priceData} isLoading={loading && currentStep === 2} stock={stock} />
                            </div>
                        )}

                        {activeTab === 'logistics' && (
                            <SellerLogisticsPanel
                                shippableOrders={shippableOrders}
                                selectedOrderIds={selectedOrderIds}
                                shipments={shipments}
                                loading={loading}
                                shipmentClearing={shipmentClearing}
                                shipmentDeletingId={shipmentDeletingId}
                                onToggleOrderSelection={toggleOrderSelection}
                                onRunAgent={handleRunAgent}
                                onClearShipmentHistory={handleClearShipmentHistory}
                                onDeleteShipment={id => void handleDeleteShipment(id)}
                                onSelectShipmentRoute={setLogisticsData}
                            />
                        )}

                        {(activeTab === 'dashboard' || activeTab === 'logistics') && (
                            <div
                                className={`${
                                    activeTab === 'dashboard'
                                        ? 'lg:col-span-3'
                                        : activeTab === 'logistics'
                                            ? 'lg:col-span-2'
                                            : 'lg:col-span-1'
                                } animate-slide-up stagger-2 space-y-6`}
                            >
                                <LogisticsOrchestrator
                                    data={logisticsData}
                                    isLoading={loading && currentStep === 2}
                                    suppliers={logisticsSuppliers}
                                    buyers={logisticsBuyers}
                                    onRouteStatsChange={setRouteStats}
                                />

                                {activeTab === 'logistics' && (
                                    <>
                                        <ShipmentCostCard
                                            routeStats={routeStats}
                                            loadKg={Math.max(0, selectedLoadKg)}
                                            vehicleType={vehicleType}
                                            onVehicleTypeChange={setVehicleType}
                                            disabled={shipmentConfirming}
                                        />

                                        {selectedOrderIds.length > 0 && !!logisticsData && (
                                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                                <div className="text-sm font-black text-slate-900">Konfirmasi Pengiriman</div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Tombol ini akan mengubah status order menjadi <span className="font-bold">shipped</span> dan menyimpan riwayat rute + ongkir.
                                                </p>
                                                <button
                                                    onClick={handleConfirmShipment}
                                                    disabled={shipmentConfirming}
                                                    className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-60"
                                                >
                                                    {shipmentConfirming ? 'MENANDAI DIKIRIM...' : 'TANDAI DIKIRIM'}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'dashboard' && (
                            <div className="lg:col-span-3 animate-slide-up stagger-3">
                                <OutreachAgent data={outreachData} isLoading={loading && currentStep === 2} />
                            </div>
                        )}
                    </div>

                    {activeTab === 'settings' && (
                        <SellerSettingsTab
                            user={user}
                            location={location}
                            businessName={businessName}
                            businessAddress={businessAddress}
                            taxId={taxId}
                            locationSaving={locationSaving}
                            onMapsLinkChange={val => {
                                if (val.includes('maps') || val.includes('goo.gl')) {
                                    setLocation(val);
                                }
                            }}
                            onLocationChange={setLocation}
                            onBusinessNameChange={setBusinessName}
                            onBusinessAddressChange={setBusinessAddress}
                            onTaxIdChange={setTaxId}
                            onNormalize={handleGeocode}
                            onSave={() => void handleSaveLocation()}
                        />
                    )}

                    <TerminalLogger logs={logs} onExport={handleExportLog} />
                </div>

                <footer className="mt-auto p-6 text-center text-slate-400 text-xs">
                    &copy; 2026 DirectRoute AI – Strategic & Secure Agentic Supply Chain Platform.
                </footer>
            </main>

            <SellerMobileNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};

export default SellerDashboardPage;
