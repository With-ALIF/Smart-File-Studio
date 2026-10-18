export type TargetLang = 'bn' | 'en';

const chunk = (text: string, max: number): string[] => {
    const chunks: string[] = [];
    let current = '';
    for (const line of text.split('\n')) {
        if (line.length > max) {
            if (current) { chunks.push(current); current = ''; }
            for (let i = 0; i < line.length; i += max) chunks.push(line.slice(i, i + max));
            continue;
        }
        const candidate = current ? `${current}\n${line}` : line;
        if (candidate.length > max) {
            chunks.push(current);
            current = line;
        } else {
            current = candidate;
        }
    }
    if (current) chunks.push(current);
    return chunks.length ? chunks : [''];
};

const googleTranslate = async (text: string, target: TargetLang): Promise<string> => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`translate http ${res.status}`);
    const data = await res.json();
    const segments = (data?.[0] ?? []) as unknown[];
    return segments
        .map((seg) => (Array.isArray(seg) ? String(seg[0] ?? '') : ''))
        .join('');
};

const myMemory = async (text: string, target: TargetLang): Promise<string> => {
    const source = target === 'bn' ? 'en' : 'bn';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`mymemory http ${res.status}`);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (typeof translated !== 'string') throw new Error('mymemory empty');
    return translated;
};

export const translateTextTo = async (text: string, target: TargetLang): Promise<string> => {
    if (!text.trim()) return text;

    const parts = chunk(text, 1500);
    const out: string[] = [];
    for (const part of parts) {
        let translated = '';
        try {
            translated = await googleTranslate(part, target);
        } catch {
            const fallbackParts = chunk(part, 450);
            const acc: string[] = [];
            for (const fp of fallbackParts) acc.push(await myMemory(fp, target));
            translated = acc.join('\n');
        }
        out.push(translated);
    }
    return out.join('\n');
};
