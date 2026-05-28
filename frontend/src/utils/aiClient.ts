import axios from 'axios';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ResponseFormat =
    | { type: 'json_object' }
    | { type: 'json_schema'; json_schema: unknown }
    | Record<string, unknown>;

const getApiBaseUrl = () => {
    const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
    return raw ? String(raw).replace(/\/+$/, '') : '';
};

export const chatCompletion = async (payload: {
    model: string;
    messages: ChatMessage[];
    response_format?: ResponseFormat;
    format?: unknown; // Ollama native /api/chat format (e.g. "json" or JSON schema)
}) => {
    const apiBase = getApiBaseUrl();
    if (apiBase) {
        const res = await axios.post(`${apiBase}/api/ai/chat`, payload);
        return res.data;
    }

    throw new Error('API base URL missing. Set VITE_API_BASE_URL to your backend (recommended).');
};

export const serperSearch = async (query: string) => {
    const apiBase = getApiBaseUrl();
    if (apiBase) {
        try {
            const res = await axios.post(`${apiBase}/api/search`, { q: query });
            return res.data;
        } catch (err: any) {
            // Fallback to client-side Serper key for dev if server proxy is not configured.
            const serverMsg = err?.response?.data?.error;
            console.warn('Server Serper proxy failed, falling back to client key (dev only).', serverMsg || err?.message);
        }
    }

    const SERPER_API_KEY = (import.meta as any).env?.VITE_SERPER_API_KEY as string | undefined;
    if (!SERPER_API_KEY) {
        throw new Error('Serper API key missing. Set VITE_API_BASE_URL (recommended) atau VITE_SERPER_API_KEY (dev only).');
    }

    const res = await axios.post(
        'https://google.serper.dev/search',
        { q: query },
        { headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' } }
    );
    return res.data;
};

export const serperImages = async (query: string) => {
    const apiBase = getApiBaseUrl();
    if (apiBase) {
        try {
            const res = await axios.post(`${apiBase}/api/search/images`, { q: query });
            return res.data;
        } catch (err: any) {
            const serverMsg = err?.response?.data?.error;
            console.warn('Server Serper images proxy failed, falling back to client key (dev only).', serverMsg || err?.message);
        }
    }

    const SERPER_API_KEY = (import.meta as any).env?.VITE_SERPER_API_KEY as string | undefined;
    if (!SERPER_API_KEY) {
        throw new Error('Serper API key missing. Set VITE_API_BASE_URL (recommended) atau VITE_SERPER_API_KEY (dev only).');
    }

    const res = await axios.post(
        'https://google.serper.dev/images',
        { q: query },
        { headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' } }
    );
    return res.data;
};
