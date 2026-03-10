import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { AIProvider } from '@/types/commercial-system';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface GeminiImageRequest {
    tenant_id: string;
    prompt: string;
    aspect_ratio?: '1:1' | '4:5' | '9:16' | '16:9';
    style?: string;
    request_type?: string;
    related_entity_id?: string;
    requested_by?: string;
}

export interface GeminiImageResponse {
    image_url: string;
    image_data: string; // base64 data URI
    ai_request_id: string;
    cost_usd: number;
}

/**
 * Gera imagem usando Gemini 2.0 Flash Experimental (geração nativa de imagens)
 * Requer GOOGLE_AI_API_KEY configurada no .env
 */
export async function generateImage(params: GeminiImageRequest): Promise<GeminiImageResponse> {
    const startTime = Date.now();
    const supabase = await createClient();
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY não configurada');

    let status: 'success' | 'error' | 'timeout' = 'success';
    let error_message: string | null = null;
    let image_data = '';
    let image_url = '';

    // Step 1: Otimizar prompt para geração de imagem
    let optimized_prompt = params.prompt;
    try {
        optimized_prompt = await optimizeImagePrompt(
            params.prompt,
            `Aspect ratio: ${params.aspect_ratio || '1:1'}. Style: ${params.style || 'professional real estate photography, premium, high-end'}`
        );
    } catch {
        // Continua com prompt original
    }

    // Step 2: Gerar imagem com Gemini 2.0 Flash Experimental
    const fullPrompt = `${optimized_prompt}. 
Real estate photography, premium quality, professional lighting, high resolution.
Aspect ratio: ${params.aspect_ratio || '1:1'}.
Style: ${params.style || 'architectural photography, clean, sophisticated, luxury real estate in Recife Brazil'}.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: fullPrompt }]
                    }],
                    generationConfig: {
                        responseModalities: ['IMAGE', 'TEXT'],
                        candidateCount: 1,
                    }
                })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const parts: any[] = data.candidates?.[0]?.content?.parts || [];

        // Encontra a parte de imagem na resposta
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
        if (!imagePart?.inlineData) {
            throw new Error('Gemini não retornou imagem — verifique se o modelo suporta image generation');
        }

        const { mimeType, data: b64 } = imagePart.inlineData;
        image_data = `data:${mimeType};base64,${b64}`;
        image_url = ''; // será preenchido após upload no storage

    } catch (err: any) {
        status = 'error';
        error_message = err.message;
        // Fallback para placeholder visual
        const dims: Record<string, [number, number]> = {
            '1:1': [1080, 1080], '4:5': [1080, 1350], '9:16': [1080, 1920], '16:9': [1920, 1080],
        };
        const [w, h] = dims[params.aspect_ratio || '1:1'] || [1080, 1080];
        image_url = `https://placehold.co/${w}x${h}/0d1117/486581?text=Gemini+Image+Gen&font=montserrat`;
        image_data = `data:image/jpeg;base64,/9j/4AAQSkZJRg==`; // minimal placeholder base64
        console.error('Gemini image generation failed, using placeholder:', err.message);
    }

    const latency_ms = Date.now() - startTime;
    const cost_usd = status === 'success' ? 0.02 : 0;

    // Log no banco
    const { data: aiRequest } = await supabase
        .from('ai_requests')
        .insert({
            tenant_id: params.tenant_id,
            provider: 'google' as AIProvider,
            model: 'gemini-2.0-flash-exp',
            prompt: params.prompt,
            system_prompt: `Optimized: ${optimized_prompt}`,
            response: image_url || 'base64_image',
            raw_response: { optimized_prompt, aspect_ratio: params.aspect_ratio, status },
            cost_usd,
            latency_ms,
            status,
            error_message,
            request_type: params.request_type || 'generate_image',
            related_entity_type: 'content_item',
            related_entity_id: params.related_entity_id,
            requested_by: params.requested_by,
        })
        .select('id')
        .single();

    return {
        image_url,
        image_data,
        ai_request_id: aiRequest?.id || '',
        cost_usd,
    };
}

/**
 * Upload de imagem gerada para Supabase Storage
 */
export async function uploadGeneratedImage(
    tenant_id: string,
    content_item_id: string,
    image_data: string,
    format: 'png' | 'jpg' = 'jpg'
): Promise<string> {
    const supabase = await createClient();

    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
    if (!base64Data || base64Data === '/9j/4AAQSkZJRg==') {
        return image_data.startsWith('http') ? image_data : '';
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${tenant_id}/content/${content_item_id}_${Date.now()}.${format}`;

    const { data, error } = await supabase.storage
        .from('media')
        .upload(filename, buffer, {
            contentType: `image/${format}`,
            upsert: false,
        });

    if (error) throw new Error(`Failed to upload image: ${error.message}`);

    const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
}

export { optimizeImagePrompt };

/**
 * Otimiza prompt de imagem usando Gemini Flash
 */
async function optimizeImagePrompt(original_prompt: string, context?: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
        contents: [{
            role: 'user',
            parts: [{
                text: `Optimize this image generation prompt for high-quality real estate photography:

"${original_prompt}"

${context ? `Context: ${context}` : ''}

Return ONLY the optimized prompt in English. Include: composition, lighting, style, atmosphere, technical quality.
Focus on luxury real estate in tropical coastal city (Recife, Brazil). Max 200 words.`,
            }],
        }],
    });

    return result.response.text().trim();
}
