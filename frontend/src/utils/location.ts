export interface ParsedCoordinates {
    lat: number;
    lng: number;
}

export interface LocationCandidate {
    coords: string;
    displayName: string;
}

interface ProviderResult {
    results: LocationCandidate[];
    errorMessage: string;
    status?: string;
}

const parseMapsUrlQuery = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return trimmed;

    try {
        const url = new URL(trimmed);

        const queryParam = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('ll');
        if (queryParam) {
            return queryParam.replace(/\+/g, ' ').trim();
        }

        const path = url.pathname;
        if (path.includes('/maps/search/')) {
            return path.split('/maps/search/')[1].split('/')[0].replace(/\+/g, ' ').trim();
        }
        if (path.includes('/maps/place/')) {
            return path.split('/maps/place/')[1].split('/')[0].replace(/\+/g, ' ').trim();
        }
    } catch {
        // Not a valid URL, continue with plain parsing.
    }

    if (rawInput.includes('google.com/maps/search/')) {
        return rawInput.split('google.com/maps/search/')[1].split('/')[0].replace(/\+/g, ' ');
    }
    if (rawInput.includes('google.com/maps/place/')) {
        return rawInput.split('google.com/maps/place/')[1].split('/')[0].replace(/\+/g, ' ');
    }
    return rawInput.trim();
};

export const parseCoordinatesFromInput = (input: string): ParsedCoordinates | null => {
    const mapsRegex = /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/;
    const mapsMatch = input.match(mapsRegex);
    if (mapsMatch) {
        return { lat: parseFloat(mapsMatch[1]), lng: parseFloat(mapsMatch[2]) };
    }

    const plainRegex = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/;
    const plainMatch = input.trim().match(plainRegex);
    if (plainMatch) {
        return { lat: parseFloat(plainMatch[1]), lng: parseFloat(plainMatch[2]) };
    }

    return null;
};

const geocodeWithGoogle = async (query: string, apiKey: string | undefined): Promise<ProviderResult> => {
    if (!apiKey) {
        return { results: [], errorMessage: '' };
    }

    try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`);
        if (!res.ok) {
            return { results: [], errorMessage: `Google Geocoding HTTP ${res.status}`, status: `HTTP_${res.status}` };
        }

        const data = await res.json();
        if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
            const results = data.results.map((result: any) => ({
                coords: `${result.geometry.location.lat}, ${result.geometry.location.lng}`,
                displayName: result.formatted_address
            })) as LocationCandidate[];

            return {
                results,
                errorMessage: '',
                status: 'OK'
            };
        }

        if (data.status === 'ZERO_RESULTS') {
            return { results: [], errorMessage: '', status: 'ZERO_RESULTS' };
        }

        if (data.status === 'REQUEST_DENIED') {
            return {
                results: [],
                errorMessage: 'Google Geocoding belum aktif di API key ini.',
                status: data.status
            };
        }

        const details = data.error_message ? `${data.status}: ${data.error_message}` : data.status;
        return { results: [], errorMessage: `Google Geocoding gagal (${details})`, status: data.status };
    } catch {
        return { results: [], errorMessage: 'Google Geocoding gagal (network/adblock).', status: 'NETWORK_ERROR' };
    }
};

const geocodeWithNominatim = async (query: string, limit = 5): Promise<LocationCandidate[]> => {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&q=${encodeURIComponent(query)}`, {
            headers: { 'Accept-Language': 'id,en' }
        });
        if (!res.ok) {
            return [];
        }

        const rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => ({
            coords: `${parseFloat(row.lat)}, ${parseFloat(row.lon)}`,
            displayName: row.display_name || query
        })) as LocationCandidate[];
    } catch {
        return [];
    }
};

const buildNominatimCandidates = (query: string) => {
    const normalized = query.replace(/\s+/g, ' ').trim();
    const tokens = normalized.split(/[,\s]+/).filter(Boolean);

    const candidates = new Set<string>();
    candidates.add(normalized);

    if (!normalized.toLowerCase().includes('indonesia')) {
        candidates.add(`${normalized}, Indonesia`);
    }

    if (tokens.length >= 2) {
        candidates.add(`${tokens.slice(-2).join(' ')}, Indonesia`);
    }

    if (tokens.length >= 1) {
        candidates.add(`${tokens[tokens.length - 1]}, Indonesia`);
    }

    return [...candidates];
};

const geocodeWithOpenFallbacks = async (query: string) => {
    const candidates = buildNominatimCandidates(query);
    let aggregate: LocationCandidate[] = [];

    for (const candidate of candidates) {
        const results = await geocodeWithNominatim(candidate, 5);
        if (results.length > 0) {
            aggregate = [...aggregate, ...results];
        }
        if (aggregate.length >= 5) {
            break;
        }
    }
    return aggregate;
};

const dedupeCandidates = (candidates: LocationCandidate[]) => {
    const seen = new Set<string>();
    const deduped: LocationCandidate[] = [];

    for (const item of candidates) {
        if (seen.has(item.coords)) continue;
        seen.add(item.coords);
        deduped.push(item);
    }

    return deduped;
};

export const searchLocationCandidates = async (rawInput: string, apiKey?: string, limit = 5) => {
    const query = parseMapsUrlQuery(rawInput);
    if (!query) {
        throw new Error('Lokasi tidak boleh kosong.');
    }

    const directCoords = parseCoordinatesFromInput(rawInput);
    if (directCoords) {
        return [{
            coords: `${directCoords.lat}, ${directCoords.lng}`,
            displayName: 'Koordinat dari input'
        }];
    }

    const google = await geocodeWithGoogle(query, apiKey);
    const open = await geocodeWithOpenFallbacks(query);

    const merged = dedupeCandidates([...google.results, ...open]).slice(0, limit);
    if (merged.length > 0) {
        return merged;
    }

    if (google.status === 'REQUEST_DENIED') {
        throw new Error('Google Geocoding belum aktif, dan pencarian alternatif tidak menemukan lokasi. Coba kata kunci lebih umum seperti "Bogor".');
    }

    if (google.errorMessage) {
        throw new Error(google.errorMessage);
    }

    throw new Error('Lokasi tidak ditemukan. Coba kata kunci lebih umum (contoh: nama kota/kecamatan).');
};

export const geocodeLocation = async (rawInput: string, apiKey?: string) => {
    const candidates = await searchLocationCandidates(rawInput, apiKey, 1);
    return candidates[0];
};
