import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api, Step } from '@/lib/api';
import { formatDuration, formatDateTime, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ArrowRight, Brain, Filter, MousePointer, Database, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function TracePage() {
    const { id } = useParams<{ id: string }>();
    const { data: trace, isLoading, error } = useQuery({
        queryKey: ['trace', id],
        queryFn: () => api.getTrace(id!),
        enabled: !!id,
        refetchInterval: (t) => t?.state?.data?.status === 'running' ? 1000 : false,
    });

    const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const scrollToStep = (stepId: string) => {
        stepRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (isLoading) return <div className="p-8">Loading trace...</div>;
    if (error || !trace) return <div className="p-8 text-red-500">Trace not found</div>;

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
                        <h1 className="text-2xl font-bold truncate">{trace.name}</h1>
                        <StatusBadge status={trace.status} />
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        <span>ID: {trace.id}</span>
                        <span>Duration: {formatDuration(trace.startTime, trace.endTime)}</span>
                        <span>Started: {formatDateTime(trace.startTime)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right text-xs text-muted-foreground">
                        <div className="font-medium">UserId</div>
                        {trace.metadata?.user_id || 'N/A'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar: Timeline */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="sticky top-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-2">
                            {(trace.steps || []).map((step, index) => (
                                <button
                                    key={step.id}
                                    onClick={() => scrollToStep(step.id)}
                                    className="w-full text-left p-3 rounded-md hover:bg-secondary transition-colors flex items-center gap-3 group"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={cn("w-2 h-2 rounded-full", getStepColor(step))}></div>
                                        {index < (trace.steps || []).length - 1 && <div className="w-px h-full bg-border"></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate group-hover:text-primary">{step.name}</div>
                                        <div className="text-xs text-muted-foreground flex justify-between">
                                            <span>{step.type}</span>
                                            <span>{formatDuration(step.startTime, step.endTime)}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content: Step Details */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Funnel Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Decision Funnel & Drop Rates</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            <FunnelChart steps={trace.steps || []} />
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        {(trace.steps || []).map((step) => (
                            <div key={step.id} ref={el => { stepRefs.current[step.id] = el; }} className="scroll-mt-24">
                                <StepDetailCard step={step} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepDetailCard({ step }: { step: Step }) {
    const isLLM = step.type === 'generation';
    const inputCount = step.input?.count || 0;
    const outputCount = step.output?.count || 0;
    const droppedCount = step.decisions?.dropped?.count || 0;
    const dropRate = inputCount > 0 ? (droppedCount / inputCount) * 100 : 0;
    const hasDrops = droppedCount > 0;

    return (
        <Card className="border-l-4" style={{ borderLeftColor: getStepColorCode(step.type) }}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <StepIcon type={step.type} className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <CardTitle>{step.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{step.type}</Badge>
                                <span>{formatDuration(step.startTime, step.endTime)}</span>
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                            <div className="font-bold">{inputCount}</div>
                            <div className="text-xs text-muted-foreground">In</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div className="text-center">
                            <div className="font-bold">{outputCount}</div>
                            <div className="text-xs text-muted-foreground">Out</div>
                        </div>
                        {hasDrops && (
                            <Badge variant="destructive" className="ml-2">
                                -{Math.round(dropRate)}% drop
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* LLM Reasoning Section */}
                {isLLM && step.reasoning && (
                    <div className="bg-secondary/30 p-4 rounded-md border border-secondary">
                        <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                            <Brain className="w-4 h-4" />
                            AI Reasoning
                            <Badge variant="secondary" className="text-[10px] h-5">{step.reasoning.effort} effort</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.reasoning.summary}
                        </p>
                    </div>
                )}

                {/* Decisions Section - Dropped Items */}
                {droppedCount > 0 && step.decisions?.dropped?.reasons && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                            <Filter className="w-4 h-4" />
                            Dropped Items ({droppedCount})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {step.decisions.dropped.reasons.map((bucket, i) => (
                                <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-md p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-medium text-sm text-red-700 dark:text-red-400 font-mono">{bucket.reason}</div>
                                        <Badge variant="outline" className="text-xs bg-background">{bucket.count}</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        {bucket.examples.map((ex, j) => (
                                            <div key={j} className="text-xs text-muted-foreground truncate bg-background/50 p-1 rounded">
                                                {JSON.stringify(ex)}
                                            </div>
                                        ))}
                                    </div>
                                    {bucket.metadata && (
                                        <div className="mt-2 text-[10px] text-muted-foreground border-t pt-1 border-dashed border-red-200">
                                            Meta: {JSON.stringify(bucket.metadata)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sample Input/Output */}
                {/* <div className="grid grid-cols-2 gap-4">
                     <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Sample Input</h4>
                        <pre className="bg-secondary p-2 rounded text-xs font-mono overflow-auto max-h-32">
                            {JSON.stringify(step.input.sample, null, 2)}
                        </pre>
                     </div>
                     <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Sample Output</h4>
                        <pre className="bg-secondary p-2 rounded text-xs font-mono overflow-auto max-h-32">
                            {JSON.stringify(step.output.sample, null, 2)}
                        </pre>
                     </div>
                </div> */}
            </CardContent>
        </Card>
    );
}

function FunnelChart({ steps }: { steps: Step[] }) {
    const data = steps.map(s => ({
        name: s.name,
        input: s.input?.count || 0,
        output: s.output?.count || 0,
        dropped: s.decisions?.dropped?.count || 0
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} height={50} angle={-15} textAnchor='end' />
                <YAxis />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="output" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} name="Kept" />
                <Bar dataKey="dropped" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Dropped" />
            </BarChart>
        </ResponsiveContainer>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'completed') return <Badge variant="success">Completed</Badge>;
    if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">Running</Badge>;
}

function getStepColor(step: Step) {
    if (step.error) return "bg-destructive";
    if (step.decisions.dropped.count > 0 && step.type === 'filter') return "bg-orange-400";
    return "bg-primary";
}

function getStepColorCode(type: string) {
    switch (type) {
        case 'generation': return '#8b5cf6'; // Violet
        case 'retrieval': return '#3b82f6'; // Blue
        case 'filter': return '#f97316'; // Orange
        case 'selection': return '#10b981'; // Emerald
        default: return '#64748b'; // Slate
    }
}

function StepIcon({ type, className }: { type: string, className?: string }) {
    switch (type) {
        case 'generation': return <Brain className={className} />;
        case 'retrieval': return <Database className={className} />;
        case 'filter': return <Filter className={className} />;
        case 'selection': return <MousePointer className={className} />;
        default: return <Activity className={className} />;
    }
}
