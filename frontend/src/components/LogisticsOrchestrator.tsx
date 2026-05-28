import React, { useMemo, useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { Truck, Package, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

import type { LogisticsData } from '../types';

interface LogisticsOrchestratorProps {
    data: LogisticsData | null;
    isLoading: boolean;
    suppliers: any[];
    buyers?: any[];
    onRouteStatsChange?: (stats: { distance_km: number; duration_mins: number; waypoint_order: number[] | null }) => void;
}

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const center = {
    lat: -6.9175,
    lng: 107.6191
};

const LogisticsOrchestrator: React.FC<LogisticsOrchestratorProps> = ({ data, isLoading, suppliers, buyers = [], onRouteStatsChange }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [avoidMajorRoads, setAvoidMajorRoads] = useState(true);
    const [optimizeWaypoints, setOptimizeWaypoints] = useState(true);
    const [expandedRouteOptions, setExpandedRouteOptions] = useState<Record<number, boolean>>({});
    const [expandedBatchOptions, setExpandedBatchOptions] = useState<Record<number, boolean>>({});
    
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey
    });

    const isValidCoord = (value: any) => typeof value === 'number' && Number.isFinite(value);

    const supplierPositions = useMemo(() => (
        suppliers
            .map(s => ({
                name: s?.name ?? 'Supplier',
                lat: Number(s?.lat),
                lng: Number(s?.lng),
                type: 'supplier'
            }))
            .filter(pos => isValidCoord(pos.lat) && isValidCoord(pos.lng))
    ), [suppliers]);

    const buyerPositions = useMemo(() => (
        buyers
            .map(b => ({
                name: b?.name ?? 'Buyer',
                lat: Number(b?.lat),
                lng: Number(b?.lng),
                type: 'buyer'
            }))
            .filter(pos => isValidCoord(pos.lat) && isValidCoord(pos.lng))
    ), [buyers]);

    const getRouteTotals = (route: google.maps.DirectionsRoute) => {
        let dist = 0;
        let dur = 0;
        if (route.legs) {
            route.legs.forEach(leg => {
                dist += leg.distance?.value || 0;
                dur += leg.duration?.value || 0;
            });
        }
        return { distance: dist, duration: dur };
    };

    const routeStats = useMemo(() => {
        if (!directions?.routes?.length) return { distance_km: 0, duration_mins: 0, waypoint_order: null as number[] | null };
        const route = directions.routes[selectedRouteIndex] || directions.routes[0];
        const totals = getRouteTotals(route);
        const waypointOrderRaw = (route as any)?.waypoint_order;
        return {
            distance_km: Number(((totals.distance || 0) / 1000).toFixed(1)),
            duration_mins: Math.round((totals.duration || 0) / 60),
            waypoint_order: Array.isArray(waypointOrderRaw) ? (waypointOrderRaw as number[]) : null
        };
    }, [directions, selectedRouteIndex]);

    const totalDistance = routeStats.distance_km.toFixed(1);
    const totalDuration = routeStats.duration_mins;

    useEffect(() => {
        if (!onRouteStatsChange) return;
        onRouteStatsChange(routeStats);
    }, [onRouteStatsChange, routeStats]);

    const defaultData: LogisticsData = {
        batches: [
            {
                batch_id: 1,
                sequence: ["Gudang Anda", "Jakarta", "Bogor", "Bekasi"],
                total_load: 350,
                reasoning: "Garis di peta sekarang mengikuti rute jalan asli (Real Directions) untuk akurasi pengiriman maksimal."
            }
        ]
    };

    const isLogisticsData = (value: any): value is LogisticsData => {
        return !!value && Array.isArray(value.batches);
    };

    const activeData = isLogisticsData(data) ? data : defaultData;

    useEffect(() => {
        if (!Array.isArray(activeData.batches) || activeData.batches.length === 0) {
            setSelectedBatchId(null);
            return;
        }
        const hasSelected = selectedBatchId !== null && activeData.batches.some(batch => batch.batch_id === selectedBatchId);
        if (!hasSelected) {
            setSelectedBatchId(activeData.batches[0].batch_id);
        }
    }, [activeData, selectedBatchId]);

    const normalizeName = (name?: string) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const positionMap = useMemo(() => {
        const map = new Map<string, { lat: number; lng: number }>();

        supplierPositions.forEach((pos, idx) => {
            map.set(normalizeName(pos.name), { lat: pos.lat, lng: pos.lng });
            if (idx === 0) {
                map.set(normalizeName('Gudang Anda'), { lat: pos.lat, lng: pos.lng });
            }
        });

        buyerPositions.forEach(pos => {
            map.set(normalizeName(pos.name), { lat: pos.lat, lng: pos.lng });
        });

        return map;
    }, [supplierPositions, buyerPositions]);

    const selectedBatch = useMemo(() => {
        if (!Array.isArray(activeData.batches) || activeData.batches.length === 0) return null;
        return activeData.batches.find(batch => batch.batch_id === selectedBatchId) || activeData.batches[0];
    }, [activeData, selectedBatchId]);

    const routeOptions = useMemo(() => {
        if (!directions?.routes?.length) {
            return [];
        }

        return directions.routes.map((route, index) => {
            const totals = getRouteTotals(route);
            return {
                index,
                summary: route.summary || `Jalur ${index + 1}`,
                distanceMeters: totals.distance,
                durationSeconds: totals.duration,
                legs: route.legs || []
            };
        });
    }, [directions]);

    const fastestRouteIndex = useMemo(() => {
        if (routeOptions.length === 0) return null;
        let bestIndex = routeOptions[0].index;
        let bestDuration = routeOptions[0].durationSeconds;
        routeOptions.forEach(option => {
            if (option.durationSeconds < bestDuration) {
                bestDuration = option.durationSeconds;
                bestIndex = option.index;
            }
        });
        return bestIndex;
    }, [routeOptions]);

    const shortestRouteIndex = useMemo(() => {
        if (routeOptions.length === 0) return null;
        let bestIndex = routeOptions[0].index;
        let bestDistance = routeOptions[0].distanceMeters;
        routeOptions.forEach(option => {
            if (option.distanceMeters < bestDistance) {
                bestDistance = option.distanceMeters;
                bestIndex = option.index;
            }
        });
        return bestIndex;
    }, [routeOptions]);

    const toggleRouteOption = (index: number) => {
        setExpandedRouteOptions(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const toggleBatchOption = (batchId: number) => {
        setExpandedBatchOptions(prev => ({ ...prev, [batchId]: !prev[batchId] }));
    };

    useEffect(() => {
        if (!directions?.routes?.length) {
            setSelectedRouteIndex(0);
            return;
        }
        if (selectedRouteIndex >= directions.routes.length) {
            setSelectedRouteIndex(0);
        }
    }, [directions, selectedRouteIndex]);

    const activeSequence = useMemo(() => {
        const sequence = selectedBatch?.sequence || [];
        const normalized = sequence.map(s => String(s || '').trim()).filter(Boolean);
        if (normalized.length >= 2) return normalized;
        if (supplierPositions.length > 0 && buyerPositions.length > 0) {
            return ['Gudang Anda', ...buyerPositions.map(b => b.name)];
        }
        return [];
    }, [buyerPositions, selectedBatch, supplierPositions]);

    const activeSequenceStops = useMemo(() => {
        const stops = activeSequence
            .map((step) => {
                const coords = positionMap.get(normalizeName(String(step || '')));
                if (!coords) return null;
                return { name: step, lat: coords.lat, lng: coords.lng };
            })
            .filter((x): x is { name: string; lat: number; lng: number } => !!x);

        if (stops.length >= 2) return stops;

        if (supplierPositions.length > 0 && buyerPositions.length > 0) {
            return [
                { name: 'Gudang Anda', lat: supplierPositions[0].lat, lng: supplierPositions[0].lng },
                ...buyerPositions.map(p => ({ name: p.name, lat: p.lat, lng: p.lng }))
            ];
        }

        return [];
    }, [activeSequence, buyerPositions, positionMap, supplierPositions]);

    const activeSequencePoints = useMemo(() => activeSequenceStops.map(s => ({ lat: s.lat, lng: s.lng })), [activeSequenceStops]);

    const displayedStopNames = useMemo(() => {
        if (activeSequenceStops.length < 2) return [];
        const origin = activeSequenceStops[0];
        const destination = activeSequenceStops[activeSequenceStops.length - 1];
        const waypoints = activeSequenceStops.slice(1, -1);

        if (!optimizeWaypoints || !routeStats.waypoint_order || waypoints.length === 0) {
            return activeSequenceStops.map(s => s.name);
        }

        const ordered = routeStats.waypoint_order
            .map(idx => waypoints[idx])
            .filter((x): x is { name: string; lat: number; lng: number } => !!x);

        return [origin, ...ordered, destination].map(s => s.name);
    }, [activeSequenceStops, optimizeWaypoints, routeStats.waypoint_order]);

    const mapCenter = useMemo(() => {
        if (activeSequencePoints.length > 0) return activeSequencePoints[0];
        if (supplierPositions.length > 0) {
            return { lat: supplierPositions[0].lat, lng: supplierPositions[0].lng };
        }
        return center;
    }, [activeSequencePoints, supplierPositions]);

    useEffect(() => {
        if (!isLogisticsData(data)) {
            setDirections(null);
            return;
        }
        if (!isLoaded || activeSequencePoints.length < 2) {
            setDirections(null);
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        const origin = activeSequencePoints[0];
        const destination = activeSequencePoints[activeSequencePoints.length - 1];
        const waypoints = activeSequencePoints.slice(1, -1).map(point => ({
            location: new google.maps.LatLng(point.lat, point.lng),
            stopover: true
        }));

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: optimizeWaypoints && waypoints.length > 1,
                provideRouteAlternatives: true,
                avoidTolls: avoidMajorRoads,
                avoidHighways: avoidMajorRoads,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                    setSelectedRouteIndex(0);
                } else {
                    console.error(`error fetching directions ${result}`);
                }
            }
        );
    }, [data, isLoaded, activeSequencePoints, avoidMajorRoads, optimizeWaypoints]);



    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} mnt`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}j ${m}mnt`;
    };

    if (isLoading) {
        return (
            <GlassCard className="h-full">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-[320px] sm:h-[380px] lg:h-[420px] xl:h-[520px] bg-slate-200 rounded-xl"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="text-emerald-500" size={20} />
                        Real-Route Orchestrator
                    </h3>
                    <p className="text-[10px] text-slate-400">Navigasi jalan asli berbasis Google Maps API.</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                            <MapPin size={8} /> {totalDistance} km
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                            <Clock size={8} /> {formatDuration(totalDuration)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                            {buyers.length} Titik Antar
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full animate-pulse">
                            OPSI RUTE
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    <input
                        type="checkbox"
                        checked={avoidMajorRoads}
                        onChange={(e) => setAvoidMajorRoads(e.target.checked)}
                        className="accent-emerald-500"
                    />
                    Hindari tol/jalan nasional
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    <input
                        type="checkbox"
                        checked={optimizeWaypoints}
                        onChange={(e) => setOptimizeWaypoints(e.target.checked)}
                        className="accent-emerald-500"
                    />
                    Optimasi urutan multi-drop
                </label>
            </div>

            {displayedStopNames.length > 1 && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Urutan Drop-off</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {displayedStopNames.map((name, idx) => (
                            <span
                                key={`${idx}-${name}`}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                    idx === 0
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : idx === displayedStopNames.length - 1
                                            ? 'bg-sky-50 text-sky-700 border-sky-100'
                                            : 'bg-slate-50 text-slate-700 border-slate-100'
                                }`}
                            >
                                {idx + 1}. {name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="h-[320px] sm:h-[380px] lg:h-[420px] xl:h-[520px] rounded-xl overflow-hidden border border-slate-200 mb-6 z-0 relative">
                {!apiKey ? (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs text-center px-4">
                        Google Maps API key belum diatur.
                    </div>
                ) : loadError ? (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs text-center px-4">
                        Peta tidak bisa dimuat. Nonaktifkan adblock/shield untuk localhost atau izinkan maps.googleapis.com.
                    </div>
                ) : isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={10}
                        options={{
                            disableDefaultUI: true,
                            styles: [
                                { "featureType": "all", "elementType": "geometry.fill", "stylers": [{ "weight": "2.00" }] },
                                { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] }
                            ]
                        }}
                    >
                        {directions && (
                            <DirectionsRenderer 
                                directions={directions}
                                options={{
                                    routeIndex: selectedRouteIndex,
                                    suppressMarkers: false,
                                    polylineOptions: {
                                        strokeColor: "#10b981",
                                        strokeWeight: 5,
                                        strokeOpacity: 0.8
                                    }
                                }}
                            />
                        )}

                        {/* Fallback markers if directions not loaded yet */}
                        {!directions && activeSequencePoints.map((p, i) => (
                            <Marker key={`route-${i}`} position={{ lat: p.lat, lng: p.lng }} icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />
                        ))}
                    </GoogleMap>
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        Loading Real Navigation...
                    </div>
                )}
                
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md p-2 rounded-lg border border-slate-200 shadow-sm text-[8px] space-y-1">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span>Real Road Path</span>
                    </div>
                </div>
            </div>

            {routeOptions.length > 0 && (
                <div className="mb-6 space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pilihan Jalur (Klik untuk pilih)</div>
                    <div className="space-y-2">
                        {routeOptions.map(option => {
                            const isSelected = option.index === selectedRouteIndex;
                            const isFastest = fastestRouteIndex === option.index;
                            const isShortest = shortestRouteIndex === option.index;
                            const distanceKm = (option.distanceMeters / 1000).toFixed(1);
                            const durationMins = Math.round(option.durationSeconds / 60);
                            const isExpanded = !!expandedRouteOptions[option.index];

                            return (
                                <div
                                    key={option.index}
                                    className={`bg-white border rounded-xl ${isSelected ? 'border-emerald-500 shadow-sm' : 'border-slate-100'}`}
                                >
                                    <div className="flex items-start justify-between gap-2 px-3 py-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRouteIndex(option.index)}
                                            className="flex-1 text-left"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-bold text-slate-900">{option.summary}</span>
                                                {isFastest && (
                                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                        Tercepat
                                                    </span>
                                                )}
                                                {isShortest && (
                                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                        Terdekat
                                                    </span>
                                                )}
                                                {isSelected && (
                                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                        Dipilih
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400">{distanceKm} km • {durationMins} mnt</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleRouteOption(option.index)}
                                            className="shrink-0 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            aria-label={isExpanded ? 'Tutup detail rute' : 'Buka detail rute'}
                                        >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <div className="px-3 pb-3 pt-1 space-y-1 text-[10px] text-slate-500">
                                            {option.legs.map((leg, idx) => (
                                                <div key={idx} className="flex items-start justify-between gap-2">
                                                    <span className="flex-1">{leg.start_address} → {leg.end_address}</span>
                                                    <span className="whitespace-nowrap">{leg.distance?.text} • {leg.duration?.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {activeData.batches.map((batch) => {
                    const isSelected = batch.batch_id === selectedBatch?.batch_id;
                    const isExpanded = !!expandedBatchOptions[batch.batch_id];
                    const firstStop = batch.sequence?.[0] || 'Gudang Anda';
                    const lastStop = batch.sequence?.[batch.sequence.length - 1] || 'Tujuan';
                    return (
                    <div
                        key={batch.batch_id}
                        className={`bg-slate-50 border rounded-xl ${isSelected ? 'border-emerald-500' : 'border-slate-100'}`}
                    >
                        <div className="flex items-start justify-between gap-2 px-3 py-2">
                            <button
                                type="button"
                                onClick={() => setSelectedBatchId(batch.batch_id)}
                                className="flex-1 text-left"
                            >
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                                    <Package size={14} className="text-emerald-500" />
                                    Opsi Rute #{batch.batch_id}
                                </div>
                                <div className="text-[10px] text-slate-400">{firstStop} → {lastStop}</div>
                                <div className="text-[10px] text-slate-400">
                                    {batch.est_distance_km || '?'} km • {batch.est_time_mins || '?'} mnt • {batch.sequence?.length || 0} titik
                                </div>
                            </button>
                            <div className="flex items-center gap-1">
                                {isSelected && (
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                        Dipilih
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => toggleBatchOption(batch.batch_id)}
                                    className="shrink-0 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    aria-label={isExpanded ? 'Tutup detail rute' : 'Buka detail rute'}
                                >
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="px-3 pb-3 pt-1 space-y-2">
                                <div className="space-y-1">
                                    {batch.sequence.map((step, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full mt-1 ${idx === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                                {idx !== batch.sequence.length - 1 && <div className="w-0.5 h-3 bg-slate-200"></div>}
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-[10px] font-bold text-slate-700">{step}</span>
                                                <span className="text-[8px] text-slate-400">{idx === 0 ? 'Titik Mulai' : 'Tujuan Pengiriman'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {batch.comparison_summary && (
                                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                        <p className="text-[9px] text-blue-700 leading-tight">
                                            <span className="font-bold">Analisis Banding Rute:</span> {batch.comparison_summary}
                                        </p>
                                    </div>
                                )}

                                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                    <p className="text-[9px] text-emerald-700 italic leading-tight">
                                        <span className="font-bold not-italic">AI Decision:</span> {batch.reasoning}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>
        </GlassCard>
    );
};

export default LogisticsOrchestrator;
