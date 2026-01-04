import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api, Event, LLMEvent, DecisionEvent } from '@/lib/api';
import { formatDateTime, formatMs } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Brain, Activity, Zap, Filter, ArrowRight } from 'lucide-react';

export function EventsPage() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, error } = useQuery({
        queryKey: ['events', id],
        queryFn: () => api.getEvents(id!),
        enabled: !!id,
    });

    if (isLoading) return <div className="p-8">Loading events...</div>;
    if (error || !data) return <div className="p-8 text-red-500">Events not found</div>;

    const events = data.events || [];
    const llmEvents = events.filter(e => e.event_type === 'llm_call') as LLMEvent[];
    const customEvents = events.filter(e => e.event_type !== 'llm_call');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/">
                    <Button variant="outline" size="icon">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">Event Timeline</h1>
                        <Badge variant="outline">{events.length} events</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                        <span>Trace ID: {data.trace_id}</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{events.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">LLM Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{llmEvents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Custom Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customEvents.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Events Timeline */}
            <div className="space-y-4">
                {events.map((event) => (
                    <EventCard key={event.span_id} event={event} />
                ))}
            </div>
        </div>
    );
}

function EventCard({ event }: { event: Event }) {
    if (event.event_type === 'llm_call') {
        return <LLMEventCard event={event as LLMEvent} />;
    }
    if (event.event_type === 'decision') {
        return <DecisionEventCard event={event as DecisionEvent} />;
    }
    return <CustomEventCard event={event} />;
}

function DecisionEventCard({ event }: { event: DecisionEvent }) {
    const dropRate = event.decision.input_count > 0
        ? ((event.decision.input_count - event.decision.output_count) / event.decision.input_count * 100).toFixed(1)
        : '0';

    return (
        <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-orange-500" />
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Decision / Filter
                                <Badge variant="outline" className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                                    {dropRate}% Drop Rate
                                </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <span>{formatDateTime(new Date(event.timestamp).getTime())}</span>
                                <span>•</span>
                                <span>{formatMs(event.duration_ms)}</span>
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Funnel Visual */}
                <div className="flex items-center gap-4 text-sm bg-secondary/30 p-4 rounded-lg">
                    <div className="text-center">
                        <div className="font-bold text-lg">{event.decision.input_count}</div>
                        <div className="text-xs text-muted-foreground uppercase">Input</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="text-center">
                        <div className="font-bold text-green-600 text-lg">{event.decision.output_count}</div>
                        <div className="text-xs text-muted-foreground uppercase">Kept</div>
                    </div>
                    <div className="flex-1 border-l ml-4 pl-4 border-dashed">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">Outcomes</div>
                        <div className="space-y-1">
                            {event.decision.dropped.map((d, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span className="text-red-500 font-mono">{d.reason}</span>
                                    <span className="font-medium">{d.count} dropped</span>
                                </div>
                            ))}
                            {event.decision.kept.map((k, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span className="text-green-600 font-mono">{k.reason}</span>
                                    <span className="font-medium">{k.count} kept</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {event.criteria && (
                    <div className="text-xs text-muted-foreground">
                        <span className="font-semibold block mb-1">Criteria:</span>
                        <pre className="bg-secondary p-2 rounded overflow-auto">
                            {JSON.stringify(event.criteria, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Metadata: Selected and Rejected Items */}
                {(event as any).metadata && (
                    <div className="space-y-4 border-t pt-4">
                        <div className="font-semibold text-sm">Item Details</div>

                        {/* Selected Items */}
                        {(event as any).metadata.selected_items && (event as any).metadata.selected_items.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-xs font-medium text-green-600">
                                        ✓ Selected Items ({(event as any).metadata.selected_items.length})
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {(event as any).metadata.selected_items.map((item: any, i: number) => (
                                        <div key={i} className="bg-green-50 dark:bg-green-900/10 p-3 rounded border border-green-200 dark:border-green-800 text-xs">
                                            <div className="font-medium text-green-900 dark:text-green-100">{item.name}</div>
                                            <div className="text-muted-foreground mt-1 space-y-0.5">
                                                {item.brand && <div>Brand: {item.brand}</div>}
                                                {item.price !== undefined && <div>Price: ${item.price}</div>}
                                                {item.category && <div>Category: {item.category}</div>}
                                                {item.relevance_score !== undefined && (
                                                    <div>Relevance Score: {item.relevance_score}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rejected Items */}
                        {(event as any).metadata.rejected_items && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-xs font-medium text-red-600">
                                        ✗ Rejected Items
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries((event as any).metadata.rejected_items).map(([reason, items]: [string, any]) => (
                                        items.length > 0 && (
                                            <div key={reason}>
                                                <div className="text-xs font-medium text-muted-foreground mb-1 font-mono">
                                                    {reason} ({items.length})
                                                </div>
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {items.map((item: any, i: number) => (
                                                        <div key={i} className="bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-200 dark:border-red-800 text-xs">
                                                            <div className="font-medium text-red-900 dark:text-red-100">{item.name}</div>
                                                            <div className="text-muted-foreground mt-1 space-y-0.5">
                                                                {item.brand && <div>Brand: {item.brand}</div>}
                                                                {item.price !== undefined && <div>Price: ${item.price}</div>}
                                                                {item.rejection_details && (
                                                                    <div className="text-red-600 dark:text-red-400 italic">
                                                                        {item.rejection_details}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search Context (if available) */}
                        {(event as any).metadata.search_context && (
                            <div className="text-xs text-muted-foreground border-t pt-2">
                                <span className="font-semibold block mb-1">Search Context:</span>
                                <div className="bg-secondary p-2 rounded space-y-1">
                                    <div>Product: {(event as any).metadata.search_context.product_name}</div>
                                    <div>Max Price: ${(event as any).metadata.search_context.max_price}</div>
                                    {(event as any).metadata.search_context.generated_keywords && (
                                        <div>Keywords: {(event as any).metadata.search_context.generated_keywords.join(', ')}</div>
                                    )}
                                    {(event as any).metadata.search_context.detected_category && (
                                        <div>Category: {(event as any).metadata.search_context.detected_category}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function LLMEventCard({ event }: { event: LLMEvent }) {
    return (
        <Card className="border-l-4 border-l-violet-500">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-violet-500" />
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                LLM Call
                                <Badge variant="outline">{event.model.provider}/{event.model.name}</Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <span>{formatDateTime(new Date(event.timestamp).getTime())}</span>
                                <span>•</span>
                                <span>{formatMs(event.duration_ms)}</span>
                            </CardDescription>
                        </div>
                    </div>
                    <div className="text-right text-sm">
                        <div className="text-muted-foreground">Tokens</div>
                        <div className="font-mono">{event.input.input_tokens} → {event.output.output_tokens}</div>
                        {event.params?.temperature !== undefined && (
                            <div className="text-xs text-muted-foreground mt-1">
                                temp: <span className="font-mono">{event.params.temperature}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* REASONING - Most Prominent */}
                <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-md border border-violet-100 dark:border-violet-900/30">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-violet-600" />
                        <h3 className="font-semibold text-violet-900 dark:text-violet-100">Reasoning</h3>
                        {event.reasoning.effort && (
                            <Badge variant="secondary" className="text-xs">{event.reasoning.effort} effort</Badge>
                        )}
                        {event.reasoning.confidence !== undefined && (
                            <Badge variant="secondary" className="text-xs">
                                {Math.round(event.reasoning.confidence * 100)}% confidence
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {event.reasoning.summary}
                    </p>

                    {event.reasoning.strategy && (
                        <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-800">
                            <div className="text-xs text-muted-foreground">
                                <strong>Strategy:</strong> {event.reasoning.strategy}
                            </div>
                        </div>
                    )}

                    {event.reasoning.decision_factors && event.reasoning.decision_factors.length > 0 && (
                        <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">
                                <strong>Decision Factors:</strong>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {event.reasoning.decision_factors.map((factor, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">{factor}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input/Output - Enhanced Display */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="font-medium mb-1">Input</div>
                        {event.input.raw_prompt ? (
                            <div className="bg-secondary p-3 rounded-md text-xs whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                                {event.input.raw_prompt}
                            </div>
                        ) : (
                            <div className="text-muted-foreground font-mono text-xs">
                                Hash: {event.input.user_prompt_hash}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-medium mb-1">Output</div>
                        {event.output.response_text ? (
                            <div className="bg-secondary p-3 rounded-md text-xs whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                                {event.output.response_text}
                            </div>
                        ) : (
                            <div className="text-muted-foreground font-mono text-xs">
                                Hash: {event.output.response_hash}
                            </div>
                        )}
                    </div>
                </div>

                {/* Metadata */}
                {event.variability && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                        {event.variability.nondeterministic && (
                            <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Non-deterministic: {event.variability.reason}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function CustomEventCard({ event }: { event: Event }) {
    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                        <CardTitle>{event.event_type}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            <span>{formatDateTime(new Date(event.timestamp).getTime())}</span>
                            <span>•</span>
                            <span>{formatMs(event.duration_ms)}</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <pre className="text-xs bg-secondary p-3 rounded overflow-auto">
                    {JSON.stringify('data' in event ? event.data : event, null, 2)}
                </pre>
            </CardContent>
        </Card>
    );
}
