import { XRayLogger } from '@xray/sdk';
import { TAXONOMY } from './data';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const XRAY_ENDPOINT = import.meta.env.VITE_XRAY_ENDPOINT || 'http://localhost:3000';

const xray = new XRayLogger({
    service: 'product-categorizer',
    endpoint: XRAY_ENDPOINT,
    debug: true
});

interface CategorizationResult {
    category: string;
    confidence: number;
    reasoning: string;
    candidates: {
        category: string;
        score: number;
    }[];
    traceId: string;
}

export async function categorizeProduct(title: string, description: string): Promise<CategorizationResult> {
    const traceId = xray.createTrace();

    try {
        // Step 1: Use LLM to extract keywords and predict category (without seeing valid list)
        const llmStart = Date.now();
        const prompt = `Analyze this product and identify its likely category path in a standard e-commerce taxonomy.

Product: ${title}
Description: ${description}

Task:
1. Extract 3-5 search keywords specific to the category (e.g. for "AirPods" -> "headphones", "audio", "wireless").
2. Predict the likely root and sub-category (e.g. "Electronics > Audio").

Return JSON: 
{
  "predicted_path": "Electronics > Audio > Headphones",
  "keywords": ["headphones", "wireless", "audio"], 
  "confidence": 0.95, 
  "reason": "Product description explicitly mentions 'wireless headphones'"
}`;

        const response = await fetch('https://api.znapai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-5',
                input: prompt,
                reasoning: {
                    effort: 'medium',
                    summary: 'auto'
                },
                text: { format: { type: 'json_object' } }
            })
        });

        const responseData = await response.json();
        const llmDuration = Date.now() - llmStart;

        const outputItems = responseData.output || [];
        const messageItem = outputItems.find((i: any) => i.type === 'message');
        const reasoningItem = outputItems.find((i: any) => i.type === 'reasoning');

        const responseText = messageItem?.content?.[0]?.text || '{}';
        const parsedData = JSON.parse(responseText);

        const keywords: string[] = parsedData.keywords || [];
        const predictedPath = parsedData.predicted_path || '';
        const confidence = parsedData.confidence || 0.5;
        const llmReasoning = parsedData.reason || 'No reasoning provided';
        const reasoningSummary = reasoningItem?.summary?.[0]?.text || llmReasoning;

        // Log LLM Event (Generation)
        await xray.logLLM({
            trace_id: traceId,
            timestamp: new Date().toISOString(),
            duration_ms: llmDuration,
            service: 'product-categorizer',
            reasoning: {
                summary: reasoningSummary,
                effort: 'medium',
                strategy: 'keyword_extraction',
                confidence: confidence
            },
            model: {
                provider: 'openai',
                name: 'gpt-5'
            },
            input: {
                raw_prompt: prompt,
                input_tokens: responseData.usage?.input_tokens || 0
            },
            output: {
                response_text: responseText,
                output_tokens: responseData.usage?.output_tokens || 0
            },
            params: {
                temperature: 0.7
            }
        });

        // Step 2: "RAG" - Search Taxonomy using generated keywords
        const processingStart = Date.now();

        // Simulating Vector Search / DB Query
        // We score each taxonomy item by how many keywords it matches
        const scoredCandidates = TAXONOMY.map(cat => {
            const catLower = cat.toLowerCase();
            let score = 0;
            // Boost for matching predicted path parts
            if (predictedPath && catLower.includes(predictedPath.toLowerCase().split(' > ')[0])) score += 0.5;

            // Score by keyword match
            keywords.forEach(k => {
                if (catLower.includes(k.toLowerCase())) score += 0.3;
            });
            return { category: cat, score };
        }).filter(c => c.score > 0) // Only keep relevant
            .sort((a, b) => b.score - a.score);

        const bestMatch = scoredCandidates[0];
        const selectedCategory = bestMatch?.category || 'Uncategorized';
        const finalConfidence = bestMatch ? Math.min(0.99, bestMatch.score) : 0;

        // Log Decision Event (Filtering/Selection)
        const totalTaxonomySize = TAXONOMY.length;
        const candidateCount = scoredCandidates.length; // Items retrieved
        const keptCount = candidateCount > 0 ? 1 : 0;
        const droppedLowerScoreCount = Math.max(0, candidateCount - 1);
        const droppedNoMatchCount = totalTaxonomySize - candidateCount;

        await xray.logDecision({
            trace_id: traceId,
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - processingStart,
            service: 'product-categorizer',
            decision: {
                input_count: totalTaxonomySize, // We technically considered the whole DB via search
                output_count: keptCount,
                kept: [
                    { count: keptCount, reason: 'best_keyword_match' }
                ],
                dropped: [
                    { count: droppedNoMatchCount, reason: 'no_keyword_match' }, // The "retrieval" drop
                    { count: droppedLowerScoreCount, reason: 'lower_score' } // The "ranking" drop
                ]
            },
            criteria: {
                keywords: keywords,
                predicted_path: predictedPath
            }
        });

        const finalCandidates = scoredCandidates.slice(0, 5);

        return {
            category: selectedCategory,
            confidence: finalConfidence,
            reasoning: `LLM predicted "${predictedPath}". Matched against taxonomy using keywords: [${keywords.join(', ')}].`,
            candidates: finalCandidates.length ? finalCandidates : [{ category: 'No Match', score: 0 }],
            traceId
        };
    } catch (error) {
        console.error('Categorization failed:', error);
        throw error;
    }
}
