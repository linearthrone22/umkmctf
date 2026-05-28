const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const SERPER_API_KEY = process.env.SERPER_API_KEY || '';
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const DISABLE_OPENROUTER = String(process.env.DISABLE_OPENROUTER || '0') === '1';

app.use(cors());
app.use(express.json());

// Simple in-memory rate limit (per IP)
const createRateLimiter = ({ windowMs, max }) => {
    const hits = new Map();
    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };
        if (now > entry.resetAt) {
            entry.count = 0;
            entry.resetAt = now + windowMs;
        }
        entry.count += 1;
        hits.set(key, entry);
        if (entry.count > max) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again.' });
        }
        return next();
    };
};

// GLOBAL REQUEST LOGGER
app.use((req, res, next) => {
    console.log(`[REQUEST] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

// Initialize DB
initDb();

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- TEST ENDPOINT ---
app.get('/api/ping', (req, res) => res.json({ message: 'pong', time: new Date() }));

// --- AI PROXY (SECURE) ---
const aiLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30 });

const isOllamaModel = (model) => {
    if (!model || typeof model !== 'string') return false;
    return model.startsWith('ollama:') || model.startsWith('ollama/');
};

const toOllamaModelName = (model) => {
    if (!isOllamaModel(model)) return null;
    return model.replace(/^ollama[:/]/, '');
};

const abortableFetchJson = async (url, options, timeoutMs) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        const text = await res.text();
        let json;
        try {
            json = text ? JSON.parse(text) : null;
        } catch {
            json = null;
        }
        return { res, text, json };
    } finally {
        clearTimeout(t);
    }
};

const callOpenRouterChatCompletion = async ({ model, messages, response_format }) => {
    if (DISABLE_OPENROUTER) {
        return { status: 400, data: { error: 'OpenRouter is disabled on this server. Use an Ollama model like "ollama:qwen2.5-coder:1.5b".' } };
    }
    if (!OPENROUTER_API_KEY) {
        return { status: 500, data: { error: 'OPENROUTER_API_KEY is not configured on the server.' } };
    }

    const payload = { model, messages };
    if (response_format) payload.response_format = response_format;

    const { res, json, text } = await abortableFetchJson(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        },
        120_000
    );

    return { status: res.status, data: json ?? { error: 'Invalid upstream JSON response', raw: text } };
};

const callOllamaChatCompletion = async ({ model, messages, format }) => {
    const ollamaModel = toOllamaModelName(model);
    if (!ollamaModel) {
        return { status: 400, data: { error: 'Invalid Ollama model format. Use model "ollama:<modelName>".' } };
    }

    const payload = { model: ollamaModel, messages, stream: false };
    if (format) payload.format = format;

    const { res, json, text } = await abortableFetchJson(
        `${OLLAMA_BASE_URL}/api/chat`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        },
        120_000
    );

    if (!json) {
        return { status: res.status, data: { error: 'Invalid Ollama JSON response', raw: text } };
    }

    const content = json?.message?.content ?? '';
    const wrapped = {
        id: `ollama-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: `ollama:${ollamaModel}`,
        choices: [
            {
                index: 0,
                message: { role: 'assistant', content },
                finish_reason: json?.done_reason || (json?.done ? 'stop' : null)
            }
        ]
    };

    return { status: res.status, data: wrapped };
};

// --- PIHPS (Bank Indonesia) price fetch ---
const normalizeToken = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/cabe/g, 'cabai')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

let pihpsCommodityCache = { fetchedAt: 0, items: [] };

const fetchPihpsCommodities = async () => {
    const now = Date.now();
    if (pihpsCommodityCache.items.length > 0 && now - pihpsCommodityCache.fetchedAt < 6 * 60 * 60 * 1000) {
        return pihpsCommodityCache.items;
    }

    const { res, json, text } = await abortableFetchJson(
        'https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetRefCommodityAndCategory',
        { method: 'GET' },
        15_000
    );

    if (!res.ok || !json?.data || !Array.isArray(json.data)) {
        throw new Error(`Failed to fetch PIHPS commodities (status ${res.status}).`);
    }

    const items = json.data.filter((x) => x && typeof x.id === 'string' && x.id.startsWith('com_'));
    pihpsCommodityCache = { fetchedAt: now, items };
    return items;
};

const bestMatchPihpsCommodityId = (items, query) => {
    const q = normalizeToken(query);
    if (!q) return null;

    const qTokens = q.split(/\s+/).filter(Boolean);
    if (qTokens.length === 0) return null;

    let best = null;
    for (const item of items) {
        const name = normalizeToken(item.name);
        if (!name) continue;
        const score = qTokens.reduce((sum, t) => sum + (name.includes(t) ? 1 : 0), 0);
        if (!best || score > best.score) {
            best = { id: item.id, name: item.name, score };
        }
        if (score === qTokens.length) break;
    }

    if (!best || best.score <= 0) return null;
    return best;
};

const formatIsoDate = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const parseDmy = (s) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '').trim());
    if (!m) return null;
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
    return new Date(year, month - 1, day);
};

const parsePriceString = (value) => {
    if (value == null) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    // "54,600" -> 54600, "12.500" -> 12500
    const n = parseInt(raw.replace(/[,\\.]/g, ''), 10);
    return Number.isFinite(n) ? n : null;
};

app.get('/api/market/pihps', aiLimiter, async (req, res) => {
    const q = String(req.query.q || req.query.commodity || '').trim();
    const daysRaw = Number(req.query.days || 7);
    const days = Number.isFinite(daysRaw) ? Math.min(30, Math.max(1, Math.floor(daysRaw))) : 7;

    if (!q) return res.status(400).json({ error: 'Missing query. Provide ?q=<commodity>' });

    try {
        const items = await fetchPihpsCommodities();
        const match = bestMatchPihpsCommodityId(items, q);
        if (!match) {
            return res.status(404).json({
                ok: false,
                reason: 'commodity_not_supported_by_pihps',
                q
            });
        }

        const end = new Date();
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

        const qs = new URLSearchParams({
            price_type_id: '1',
            comcat_id: match.id,
            province_id: '',
            regency_id: '',
            showKota: 'false',
            showPasar: 'false',
            tipe_laporan: '1',
            start_date: formatIsoDate(start),
            end_date: formatIsoDate(end)
        });

        const url = `https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetGridDataKomoditas?${qs.toString()}`;
        const { res: upstream, json } = await abortableFetchJson(url, { method: 'GET' }, 20_000);
        if (!upstream.ok || !json?.data || !Array.isArray(json.data)) {
            return res.status(upstream.status || 502).json({ error: 'PIHPS upstream error.' });
        }

        const row = json.data.find((r) => String(r?.name || '').toLowerCase().includes('semua provinsi')) || json.data[0];
        const keys = Object.keys(row || {}).filter((k) => !['no', 'name', 'level'].includes(k));

        const datedKeys = keys
            .map((k) => ({ key: k, date: parseDmy(k) }))
            .filter((x) => x.date instanceof Date && !Number.isNaN(x.date.getTime()))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        const latest = datedKeys[datedKeys.length - 1];
        const price = latest ? parsePriceString(row?.[latest.key]) : null;

        return res.json({
            ok: true,
            commodity: { id: match.id, name: match.name },
            date: latest?.key || null,
            price_rp_per_kg: price,
            source: { title: 'PIHPS Nasional (Bank Indonesia)', link: 'https://www.bi.go.id/hargapangan' }
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch PIHPS data.' });
    }
});

app.post('/api/ai/chat', aiLimiter, async (req, res) => {
    const { model, messages, response_format, format } = req.body || {};
    if (!model || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid payload. Expected { model, messages }.' });
    }

    try {
        const result = isOllamaModel(model)
            ? await callOllamaChatCompletion({ model, messages, format })
            : await callOpenRouterChatCompletion({ model, messages, response_format });
        return res.status(result.status).json(result.data);
    } catch (err) {
        const message = err?.name === 'AbortError' ? 'AI request timed out.' : 'Upstream AI request failed.';
        return res.status(500).json({ error: message });
    }
});

// Optional: list local models from Ollama (useful for debugging)
app.get('/api/ai/ollama/tags', aiLimiter, async (_req, res) => {
    try {
        const { res: upstream, json, text } = await abortableFetchJson(
            `${OLLAMA_BASE_URL}/api/tags`,
            { method: 'GET' },
            10_000
        );
        return res.status(upstream.status).json(json ?? { error: 'Invalid Ollama JSON response', raw: text });
    } catch (err) {
        const message = err?.name === 'AbortError' ? 'Ollama request timed out.' : 'Ollama request failed.';
        return res.status(500).json({ error: message });
    }
});

app.post('/api/search', aiLimiter, async (req, res) => {
    if (!SERPER_API_KEY) {
        return res.status(500).json({ error: 'SERPER_API_KEY is not configured on the server.' });
    }
    const { q } = req.body || {};
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Invalid payload. Expected { q }.' });
    }
    try {
        const upstream = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q })
        });
        const data = await upstream.json();
        return res.status(upstream.status).json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Upstream search request failed.' });
    }
});

app.post('/api/search/images', aiLimiter, async (req, res) => {
    if (!SERPER_API_KEY) {
        return res.status(500).json({ error: 'SERPER_API_KEY is not configured on the server.' });
    }
    const { q } = req.body || {};
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Invalid payload. Expected { q }.' });
    }
    try {
        const upstream = await fetch('https://google.serper.dev/images', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q })
        });
        const data = await upstream.json();
        return res.status(upstream.status).json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Upstream images request failed.' });
    }
});

// --- AUTH ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User not found' });
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY);
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
});

// --- GEOCODE ---
app.get('/api/geocode', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });
    let searchQuery = q;
    if (q.includes('google.com/maps/search/')) searchQuery = q.split('google.com/maps/search/')[1].split('/')[0].replace(/\+/g, ' ');
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY is not configured on the server.' });
        }
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`);
        const data = await response.json();
        if (data.status === 'OK') {
            const result = data.results[0];
            res.json({ lat: result.geometry.location.lat, lon: result.geometry.location.lng, display_name: result.formatted_address });
        } else {
            res.status(404).json({ error: 'Location not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Geocoding failed' });
    }
});

// --- ORDERS (PRIORITY) ---
app.get('/api/orders/buyer', authenticateToken, (req, res) => {
    const buyer_id = req.user.id;
    console.log(`[TARGET_MATCH] Found /api/orders/buyer for ID: ${buyer_id}`);
    const query = `
        SELECT o.*, i.commodity, i.image_url, u.username as seller_name
        FROM orders o
        LEFT JOIN items i ON o.item_id = i.id
        LEFT JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ?
        ORDER BY o.created_at DESC
    `;
    db.all(query, [buyer_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/orders/seller', authenticateToken, (req, res) => {
    const seller_id = req.user.id;
    const query = `
        SELECT o.*, u.username as buyer_name, u.location as buyer_location, i.commodity 
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        LEFT JOIN items i ON o.item_id = i.id
        WHERE o.seller_id = ?
        ORDER BY o.created_at DESC
    `;
    db.all(query, [seller_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- ITEMS ---
app.get('/api/items', (req, res) => {
    db.all(`SELECT * FROM items`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/items', authenticateToken, (req, res) => {
    const { commodity, price, stock, location, image_url, umkm_name } = req.body;
    db.run(`INSERT INTO items (commodity, price, stock, location, image_url, umkm_name, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [commodity, price, stock, location, image_url, umkm_name, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
});

app.put('/api/items/:id/stock', authenticateToken, (req, res) => {
    const { stock } = req.body;
    db.run(`UPDATE items SET stock = ? WHERE id = ? AND seller_id = ?`, [stock, req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Stock updated' });
    });
});

app.delete('/api/items/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM items WHERE id = ? AND seller_id = ?`, [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Item deleted' });
    });
});

// --- OTHER ORDER ACTIONS ---
app.post('/api/orders', authenticateToken, async (req, res) => {
    const { items } = req.body;
    try {
        for (const item of items) {
            const product = await new Promise((resolve, reject) => {
                db.get(`SELECT seller_id, price FROM items WHERE id = ?`, [item.id], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            if (product) {
                const total_price = product.price * (item.quantity || 1);
                await new Promise((resolve, reject) => {
                    db.run(`INSERT INTO orders (buyer_id, seller_id, item_id, quantity, total_price) VALUES (?, ?, ?, ?, ?)`,
                        [req.user.id, product.seller_id, item.id, item.quantity || 1, total_price],
                        (err) => { if (err) reject(err); else resolve(); }
                    );
                });
            }
        }
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
    db.run(`UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?`, [req.body.status, req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated' });
    });
});

// --- SHIPMENTS ---
app.post('/api/shipments', authenticateToken, (req, res) => {
    db.run(`INSERT INTO shipments (seller_id, route_data) VALUES (?, ?)`, [req.user.id, JSON.stringify(req.body.route_data)], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.get('/api/shipments', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM shipments WHERE seller_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({ ...row, route_data: JSON.parse(row.route_data) })));
    });
});

app.get('/api/stakeholders', (req, res) => {
    db.all(`SELECT * FROM stakeholders`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- CATCH ALL ---
app.use((req, res) => {
    console.log(`[FINAL_404] ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/api/`);
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other process using it, then retry.`);
        process.exit(1);
    }
});
