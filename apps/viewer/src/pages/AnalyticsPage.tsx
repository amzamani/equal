import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AnalyticsPage() {
    const [threshold, setThreshold] = useState(0.9);
    const [service, setService] = useState('');
    const [metadataFilters, setMetadataFilters] = useState<Record<string, string>>({});
    const [newFilterKey, setNewFilterKey] = useState('');
    const [newFilterValue, setNewFilterValue] = useState('');

    // Query for high drop traces
    const { data: highDropData, isLoading, refetch } = useQuery({
        queryKey: ['high-drop-traces', threshold, service, metadataFilters],
        queryFn: () => api.getHighDropTraces(threshold, service || undefined, 50, metadataFilters),
        enabled: false, // Only run when user clicks Search
    });

    // Query for drop reasons
    const { data: dropReasonsData } = useQuery({
        queryKey: ['drop-reasons', service, metadataFilters],
        queryFn: () => api.getDropReasons(service || undefined, undefined, metadataFilters),
    });

    const handleSearch = () => {
        refetch();
    };

    const addMetadataFilter = () => {
        if (newFilterKey && newFilterValue) {
            setMetadataFilters({ ...metadataFilters, [newFilterKey]: newFilterValue });
            setNewFilterKey('');
            setNewFilterValue('');
        }
    };

    const removeMetadataFilter = (key: string) => {
        const updated = { ...metadataFilters };
        delete updated[key];
        setMetadataFilters(updated);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-muted-foreground mt-2">
                    Query decision events across all pipelines and services
                </p>
            </div>

            {/* Filters Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </CardTitle>
                    <CardDescription>
                        Find traces where filtering eliminated a high percentage of candidates
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Threshold and Service */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Drop Rate Threshold</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={threshold}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThreshold(parseFloat(e.target.value))}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">
                                    ({Math.round(threshold * 100)}%)
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Service (optional)</label>
                            <Input
                                placeholder="e.g., competitor-search-ui"
                                value={service}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setService(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Metadata Filters */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Metadata Filters</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Key (e.g., domain)"
                                value={newFilterKey}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFilterKey(e.target.value)}
                                className="flex-1"
                            />
                            <Input
                                placeholder="Value (e.g., fraud)"
                                value={newFilterValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFilterValue(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={addMetadataFilter} variant="outline">
                                Add Filter
                            </Button>
                        </div>
                        {Object.keys(metadataFilters).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(metadataFilters).map(([key, value]) => (
                                    <Badge key={key} variant="secondary" className="gap-1">
                                        {key}: {value}
                                        <button
                                            onClick={() => removeMetadataFilter(key)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button onClick={handleSearch} className="w-full gap-2">
                        <Search className="w-4 h-4" />
                        Search High Drop Rate Traces
                    </Button>
                </CardContent>
            </Card>

            {/* Results */}
            {highDropData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>
                            Found {highDropData.count} traces with drop rate ≥ {Math.round(threshold * 100)}%
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {highDropData.traces && highDropData.traces.length > 0 ? (
                            <div className="rounded-md border">
                                <div className="grid grid-cols-6 p-4 font-medium bg-secondary/50 text-sm">
                                    <div className="col-span-2">Trace ID</div>
                                    <div>Service</div>
                                    <div>Input</div>
                                    <div>Output</div>
                                    <div>Drop Rate</div>
                                </div>
                                <div className="divide-y">
                                    {highDropData.traces.map((trace: any) => (
                                        <Link
                                            key={trace.trace_id}
                                            to={`/events/${trace.trace_id}`}
                                            className="grid grid-cols-6 p-4 items-center hover:bg-muted/50 transition-colors text-sm group"
                                        >
                                            <div className="col-span-2 font-mono text-xs truncate pr-4 group-hover:text-primary">
                                                {trace.trace_id}
                                            </div>
                                            <div>
                                                <Badge variant="outline">{trace.service || 'unknown'}</Badge>
                                            </div>
                                            <div className="text-muted-foreground">{trace.input_count}</div>
                                            <div className="text-muted-foreground">{trace.output_count}</div>
                                            <div>
                                                <DropRateBadge rate={trace.drop_rate_percent} />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {isLoading ? 'Searching...' : 'No traces found matching criteria'}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Drop Reasons Summary */}
            {dropReasonsData && dropReasonsData.reasons && dropReasonsData.reasons.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Drop Reasons Across All Traces</CardTitle>
                        <CardDescription>
                            Aggregated reasons why candidates were dropped
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <div className="grid grid-cols-4 p-4 font-medium bg-secondary/50 text-sm">
                                <div className="col-span-2">Reason</div>
                                <div>Total Count</div>
                                <div>Avg %</div>
                            </div>
                            <div className="divide-y">
                                {dropReasonsData.reasons.map((reason: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-4 p-4 items-center text-sm">
                                        <div className="col-span-2">
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {reason.reason}
                                            </code>
                                        </div>
                                        <div className="text-muted-foreground">{reason.total_count}</div>
                                        <div className="text-muted-foreground">
                                            {reason.avg_percentage ? `${reason.avg_percentage}%` : 'N/A'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function DropRateBadge({ rate }: { rate: number }) {
    if (rate >= 90) return <Badge variant="destructive">{rate}%</Badge>;
    if (rate >= 70) return <Badge className="bg-yellow-500">{rate}%</Badge>;
    return <Badge variant="secondary">{rate}%</Badge>;
}
