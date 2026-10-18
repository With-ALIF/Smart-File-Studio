'use client';

const ENDPOINT = '/api/gemini';

const requestAnalysis = async (
    body: Record<string, unknown>,
    fallbackError: string,
): Promise<string> => {
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    let payload: { text?: string; error?: string } = {};
    try {
        payload = await response.json();
    } catch {
        // A non-JSON body still needs to surface as a clean failure below.
    }

    if (!response.ok) {
        throw new Error(payload.error || fallbackError);
    }

    return payload.text || '';
};

export const describeImage = async (
    base64Data: string,
    mimeType: string,
    userQuestion?: string,
): Promise<string> => {
    try {
        const text = await requestAnalysis(
            { base64Data, mimeType, userQuestion: userQuestion ?? '' },
            'Failed to analyze image using Gemini.',
        );
        return text || 'No analysis generated.';
    } catch (error) {
        console.error('Gemini request failed:', error);
        throw new Error('Failed to analyze image using Gemini.');
    }
};

export const translateText = async (
    text: string,
    target: 'Bengali' | 'English',
): Promise<string> => {
    try {
        return (
            (await requestAnalysis(
                { text, target },
                'Failed to translate text.',
            )) || text
        );
    } catch (error) {
        console.error('Translate request failed:', error);
        throw new Error('Failed to translate text.');
    }
};