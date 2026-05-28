export type CsvRecord = Record<string, string>;

const escapeCell = (value: any) => {
    const raw = value == null ? '' : String(value);
    if (raw.includes('"') || raw.includes(',') || raw.includes('\n') || raw.includes('\r')) {
        return `"${raw.replace(/\"/g, '""')}"`;
    }
    return raw;
};

export const toCsv = (headers: string[], rows: Array<Record<string, any>>) => {
    const lines: string[] = [];
    lines.push(headers.map(escapeCell).join(','));
    for (const row of rows) {
        lines.push(headers.map(h => escapeCell((row as any)[h])).join(','));
    }
    return lines.join('\n');
};

// Minimal CSV parser (supports quoted cells with commas/newlines)
export const parseCsv = (text: string): CsvRecord[] => {
    const rows: string[][] = [];
    let cur: string[] = [];
    let cell = '';
    let inQuotes = false;

    const pushCell = () => {
        cur.push(cell);
        cell = '';
    };
    const pushRow = () => {
        rows.push(cur);
        cur = [];
    };

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const next = text[i + 1];
        if (inQuotes) {
            if (ch === '"' && next === '"') {
                cell += '"';
                i++;
                continue;
            }
            if (ch === '"') {
                inQuotes = false;
                continue;
            }
            cell += ch;
            continue;
        }

        if (ch === '"') {
            inQuotes = true;
            continue;
        }
        if (ch === ',') {
            pushCell();
            continue;
        }
        if (ch === '\r') {
            continue;
        }
        if (ch === '\n') {
            pushCell();
            pushRow();
            continue;
        }
        cell += ch;
    }
    pushCell();
    pushRow();

    const nonEmpty = rows.filter(r => r.some(c => String(c ?? '').trim() !== ''));
    if (nonEmpty.length === 0) return [];
    const headers = nonEmpty[0].map(h => String(h || '').trim());
    const records: CsvRecord[] = [];
    for (const r of nonEmpty.slice(1)) {
        const rec: CsvRecord = {};
        for (let j = 0; j < headers.length; j++) {
            rec[headers[j]] = r[j] ?? '';
        }
        if (Object.values(rec).some(v => String(v).trim() !== '')) {
            records.push(rec);
        }
    }
    return records;
};

