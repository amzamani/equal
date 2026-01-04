import { XRayLogger } from '@xray/sdk';
import { MOCK_PRODUCTS, type Product } from './data';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const XRAY_ENDPOINT = import.meta.env.VITE_XRAY_ENDPOINT || 'http://localhost:3000';

const xray = new XRayLogger({
    service: 'competitor-search-ui',
    endpoint: XRAY_ENDPOINT,
    debug: true
});

interface SearchCriteria {
    productName: string;
    maxPrice: number;
}

interface SearchResult {
    competitors: Product[];
    reasoning: string;
    stats: {
        total: number;
        filtered: number;
        final: number;
    };
    traceId: string;
}

export async function searchCompetitors(criteria: SearchCriteria): Promise<SearchResult> {
    const traceId = xray.createTrace();
    const startTime = Date.now();

    try {
        // Step 1: Use LLM to generate search keywords
        const llmStart = Date.now();
        const prompt = `Given the product name "${criteria.productName}", generate a list of relevant search keywords and identify the broad category to find best competitor products.
        
        Return a JSON object with format: {"keywords": ["keyword1", "keyword2"], "category": "headphones"}`;

        // Use Znapai Responses API to get reasoning
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
                text: {
                    format: {
                        type: 'json_object'
                    }
                }
            })
        });

        const responseData = await response.json();
        const llmDuration = Date.now() - llmStart;

        // Parse Responses API output
        const outputItems = responseData.output || [];
        const messageItem = outputItems.find((i: any) => i.type === 'message');
        const reasoningItem = outputItems.find((i: any) => i.type === 'reasoning');

        const responseText = messageItem?.content?.[0]?.text || '{}';
        const generatedData = JSON.parse(responseText);
        const keywords = generatedData.keywords || [];
        const detectedCategory = generatedData.category || '';

        // Extract reasoning from response
        const reasoning = reasoningItem?.summary?.[0]?.text || 'No reasoning available';

        // Log LLM event (Keyword Generation)
        await xray.logLLM({
            trace_id: traceId,
            timestamp: new Date().toISOString(),
            duration_ms: llmDuration,
            service: 'competitor-search-ui',
            reasoning: {
                summary: reasoning,
                effort: 'medium',
                strategy: 'keyword_expansion',
                confidence: 0.9,
                decision_factors: ['product_name', 'domain_knowledge'],
                alternatives_considered: ['exact_match']
            },
            model: {
                provider: 'openai',
                name: 'gpt-5'
            },
            params: {
                temperature: 0.7,
                response_format: 'json_object'
            },
            input: {
                raw_prompt: prompt,
                input_tokens: responseData.usage?.input_tokens || 0
            },
            output: {
                response_text: responseText,
                output_tokens: responseData.usage?.output_tokens || 0,
                finish_reason: responseData.status
            },
            metrics: {
                latency_ms: llmDuration,
                cost_usd: 0.0005
            }
        });

        // Step 2: Search MOCK_PRODUCTS using generated keywords
        const searchStart = Date.now();
        let keptByMatch = 0;
        let droppedByMatch = 0;
        let droppedByPrice = 0;
        let droppedByStock = 0;

        // Simple keyword matching logic
        const scoredProducts = MOCK_PRODUCTS.map(product => {
            let matchScore = 0;
            const productText = `${product.name} ${product.brand} ${product.category} ${product.features.join(' ')}`.toLowerCase();

            // Category match bonus
            if (inputMatch(product.category, detectedCategory) || inputMatch(detectedCategory, product.category)) {
                matchScore += 5;
            }

            // Keyword matches
            keywords.forEach((kw: string) => {
                if (productText.includes(kw.toLowerCase())) {
                    matchScore += 1;
                }
            });

            return { ...product, relevanceScore: matchScore };
        });

        const filtered = scoredProducts.filter(product => {
            // Check Match Score (must have at least 1 keyword match or category match)
            if (product.relevanceScore! < 1) {
                droppedByMatch++;
                return false;
            }
            keptByMatch++;

            // Check price
            if (product.price > criteria.maxPrice) {
                droppedByPrice++;
                return false;
            }

            // Check stock
            if (!product.inStock) {
                droppedByStock++;
                return false;
            }

            return true;
        });

        const searchDuration = Date.now() - searchStart;

        // Separate rejected items by reason for metadata
        const rejectedByMatch = scoredProducts.filter(p => p.relevanceScore! < 1);
        const rejectedByPriceList = scoredProducts.filter(p =>
            p.relevanceScore! >= 1 && p.price > criteria.maxPrice
        );
        const rejectedByStockList = scoredProducts.filter(p =>
            p.relevanceScore! >= 1 && p.price <= criteria.maxPrice && !p.inStock
        );

        // Log decision event (Search Results) with rejected/selected items in metadata
        await xray.logDecision({
            trace_id: traceId,
            timestamp: new Date().toISOString(),
            duration_ms: searchDuration,
            service: 'competitor-search-ui',
            decision: {
                input_count: MOCK_PRODUCTS.length,
                output_count: filtered.length,
                kept: [
                    { count: filtered.length, reason: 'matches_keywords_and_price' }
                ],
                dropped: [
                    { count: droppedByMatch, reason: 'no_keyword_match' },
                    { count: droppedByPrice, reason: 'price_too_high' },
                    { count: droppedByStock, reason: 'out_of_stock' }
                ]
            },
            criteria: {
                max_price: criteria.maxPrice,
                keywords: keywords,
                category: detectedCategory,
                must_be_in_stock: true
            },
            // ✅ Add rejected and selected items in metadata
            metadata: {
                // Selected items with details
                selected_items: filtered.map(p => ({
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    price: p.price,
                    category: p.category,
                    relevance_score: p.relevanceScore,
                    in_stock: p.inStock
                })),
                // Rejected items grouped by reason
                rejected_items: {
                    no_keyword_match: rejectedByMatch.map(p => ({
                        id: p.id,
                        name: p.name,
                        brand: p.brand,
                        price: p.price,
                        category: p.category,
                        relevance_score: p.relevanceScore,
                        rejection_reason: 'no_keyword_match',
                        rejection_details: `Score ${p.relevanceScore} below threshold 1`
                    })),
                    price_too_high: rejectedByPriceList.map(p => ({
                        id: p.id,
                        name: p.name,
                        brand: p.brand,
                        price: p.price,
                        category: p.category,
                        relevance_score: p.relevanceScore,
                        rejection_reason: 'price_too_high',
                        rejection_details: `Price $${p.price} exceeds max $${criteria.maxPrice}`
                    })),
                    out_of_stock: rejectedByStockList.map(p => ({
                        id: p.id,
                        name: p.name,
                        brand: p.brand,
                        price: p.price,
                        category: p.category,
                        relevance_score: p.relevanceScore,
                        rejection_reason: 'out_of_stock',
                        rejection_details: 'Product not available'
                    }))
                },
                // Summary stats
                rejection_summary: {
                    total_rejected: droppedByMatch + droppedByPrice + droppedByStock,
                    by_reason: {
                        no_keyword_match: droppedByMatch,
                        price_too_high: droppedByPrice,
                        out_of_stock: droppedByStock
                    }
                },
                // Search context
                search_context: {
                    product_name: criteria.productName,
                    max_price: criteria.maxPrice,
                    generated_keywords: keywords,
                    detected_category: detectedCategory
                }
            }
        });

        // Sort by match score
        const final = filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

        return {
            competitors: final,
            reasoning: `Generated keywords: ${keywords.join(', ')}. Found ${final.length} matching products.`,
            stats: {
                total: MOCK_PRODUCTS.length,
                filtered: MOCK_PRODUCTS.length - final.length,
                final: final.length
            },
            traceId
        };
    } catch (error) {
        console.error('Search failed:', error);
        throw error;
    }
}

function inputMatch(a: string, b: string) {
    return a && b && a.toLowerCase().includes(b.toLowerCase());
}
