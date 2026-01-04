import { useQuery } from '@tanstack/react-query';
import { api, Trace } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function Dashboard() {
    const { data: traces, isLoading, error, refetch } = useQuery<Trace[]>({
        queryKey: ['traces'],
        queryFn: () => api.getTraces(),
    });

    if (isLoading) return <div className="p-8">Loading dashboard...</div>;
    if (error) return <div className="p-8 text-red-500">Error loading traces</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Recent Traces</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="grid grid-cols-5 p-4 font-medium bg-secondary/50 text-sm">
                            <div className="col-span-2">Trace Name / ID</div>
                            <div>Service</div>
                            <div>Status</div>
                            <div>Steps</div>
                        </div>
                        <div className="divide-y">
                            {traces?.map((trace) => {
                                // Check if this is an event-based trace (has 0 steps)
                                const isEventBased = (trace.steps?.length || 0) === 0;
                                const linkPath = isEventBased ? `/events/${trace.id}` : `/traces/${trace.id}`;

                                return (
                                    <Link
                                        key={trace.id}
                                        to={linkPath}
                                        className="grid grid-cols-5 p-4 items-center hover:bg-muted/50 transition-colors text-sm group"
                                    >
                                        <div className="col-span-2 space-y-1">
                                            <div className="font-medium group-hover:text-primary flex items-center gap-2">
                                                {trace.name}
                                                {isEventBased && <Badge variant="secondary" className="text-xs">Events</Badge>}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono truncate pr-4">{trace.id}</div>
                                        </div>
                                        <div>
                                            <Badge variant="outline">{trace.service}</Badge>
                                        </div>
                                        <div>
                                            <StatusBadge status={trace.status} />
                                        </div>
                                        <div className="text-muted-foreground">
                                            {isEventBased ? 'Events' : `${trace.steps?.length || 0} steps`}
                                        </div>
                                    </Link>
                                );
                            })}
                            {traces?.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No traces found. Run the SDK example to generate data.
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'completed') return <Badge variant="success">Completed</Badge>;
    if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">Running</Badge>;
}
