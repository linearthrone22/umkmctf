export const slugify = (input: string) => {
    const raw = (input || '').trim().toLowerCase();
    if (!raw) return '';
    return raw
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

