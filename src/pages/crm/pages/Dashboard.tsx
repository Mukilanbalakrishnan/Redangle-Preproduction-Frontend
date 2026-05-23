import { Users, Clock, CheckCircle, AlertCircle, Download, Calendar, Search, Eye, Pencil, Phone } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import { useEffect, useState } from "react";
import axios from "axios";
import InitialCallDetails from '../../../ClientFlow/InitialCallDetails';
import AssignTeam from '../../../ClientFlow/AssignTeam';
import { isPreProductionPhase, resolveClientFlowView } from '../../../ClientFlow/flowRouting';

type View = 'dashboard' | 'callDetails' | 'assignTeam';

const parseDashboardDate = (value: any) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getLeadDate = (lead: any) => parseDashboardDate(lead.createdAt) || parseDashboardDate(lead.created_at) || parseDashboardDate(lead.eventDate);

const isCompletedLead = (lead: any) => {
    const status = String(lead.status).toLowerCase();
    const phaseStatus = String(lead.phaseStatus).toLowerCase();
    const currentPhase = String(lead.currentPhase).toLowerCase();
    return status === "completed" ||
        phaseStatus === "completed" ||
        currentPhase === "event" ||
        currentPhase === "post_production";
};

const startOfDay = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const buildPerformanceSeries = (leads: any[], dateRange: string, customDates: { start: string; end: string }) => {
    const datedLeads = leads
        .map(lead => ({ lead, date: getLeadDate(lead) }))
        .filter((item): item is { lead: any; date: Date } => Boolean(item.date));

    if (datedLeads.length === 0) return [];

    const now = new Date();
    let buckets: Array<{ key: string; month: string; start: Date }> = [];

    if (dateRange === 'Yesterday') {
        const yesterday = startOfDay(now);
        yesterday.setDate(yesterday.getDate() - 1);
        buckets = Array.from({ length: 4 }, (_, index) => {
            const start = new Date(yesterday);
            start.setHours(index * 6, 0, 0, 0);
            return {
                key: `${dayKey(yesterday)}-${index}`,
                month: start.toLocaleTimeString('default', { hour: '2-digit' }),
                start,
            };
        });
    } else if (dateRange === 'Last week') {
        const firstDay = startOfDay(now);
        firstDay.setDate(firstDay.getDate() - 6);
        buckets = Array.from({ length: 7 }, (_, index) => {
            const start = new Date(firstDay);
            start.setDate(firstDay.getDate() + index);
            return {
                key: dayKey(start),
                month: start.toLocaleDateString('default', { weekday: 'short', day: 'numeric' }),
                start,
            };
        });
    } else if (dateRange === 'Last month') {
        const firstDay = startOfDay(now);
        firstDay.setDate(firstDay.getDate() - 27);
        buckets = Array.from({ length: 4 }, (_, index) => {
            const start = new Date(firstDay);
            start.setDate(firstDay.getDate() + (index * 7));
            return {
                key: `week-${index}`,
                month: `Week ${index + 1}`,
                start,
            };
        });
    } else {
        const end = dateRange === 'Custom' && customDates.end ? parseDashboardDate(customDates.end) || now : now;
        const start = dateRange === 'Custom' && customDates.start
            ? parseDashboardDate(customDates.start) || datedLeads[datedLeads.length - 1].date
            : dateRange === 'Last year'
                ? new Date(end.getFullYear(), end.getMonth() - 11, 1)
                : new Date(Math.min(...datedLeads.map(item => item.date.getTime())));

        const startCursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const finalMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        let cursor = new Date(startCursor);
        while (cursor <= finalMonth) {
            buckets.push({
                key: monthKey(cursor),
                month: cursor.toLocaleDateString('default', { month: 'short', year: '2-digit' }),
                start: new Date(cursor),
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        // If only 1 month bucket, fall back to day-level view for that month
        if (buckets.length === 1) {
            buckets = [];
            const monthStart = new Date(startCursor);
            const monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0); // last day of month
            const totalDays = Math.min(monthEnd.getDate(), 30);
            for (let d = 0; d < totalDays; d++) {
                const day = new Date(monthStart);
                day.setDate(monthStart.getDate() + d);
                if (day > end) break;
                buckets.push({
                    key: dayKey(day),
                    month: day.toLocaleDateString('default', { day: 'numeric', month: 'short' }),
                    start: new Date(day),
                });
            }
        }
    }

    const bucketed = buckets.map(bucket => ({ ...bucket, newLeads: 0, completedLeads: 0 }));

    // Detect if buckets are day-level (key format: YYYY-MM-DD) or month-level
    const isDayLevel = bucketed.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(bucketed[0]?.key || '');

    datedLeads.forEach(({ lead, date }) => {
        let bucketKey = '';
        if (dateRange === 'Yesterday') {
            bucketKey = `${dayKey(startOfDay(date))}-${Math.min(3, Math.floor(date.getHours() / 6))}`;
        } else if (dateRange === 'Last week' || isDayLevel) {
            bucketKey = dayKey(startOfDay(date));
        } else if (dateRange === 'Last month') {
            const firstBucket = bucketed[0]?.start;
            if (!firstBucket) return;
            const dayOffset = Math.floor((startOfDay(date).getTime() - firstBucket.getTime()) / 86400000);
            bucketKey = `week-${Math.min(3, Math.max(0, Math.floor(dayOffset / 7)))}`;
        } else {
            bucketKey = monthKey(date);
        }

        const bucket = bucketed.find(item => item.key === bucketKey);
        if (!bucket) return;
        if (isCompletedLead(lead)) bucket.completedLeads += 1;
        else bucket.newLeads += 1;
    });

    return bucketed.map(({ month, newLeads, completedLeads }) => ({ month, newLeads, completedLeads }));
};

export default function Dashboard() {
    const API_URL = import.meta.env.VITE_API_URL;

    // ✅ ALL HOOKS MUST BE HERE
    const [recentLeads, setRecentLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('dashboard');
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [selectedPhaseStep, setSelectedPhaseStep] = useState<string | undefined>(undefined);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
        followUps: 0,
    });

    // Chart states
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState('Last week');
    const [allLeadsCache, setAllLeadsCache] = useState<any[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    // Table Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statFilter, setStatFilter] = useState('Total client');

    useEffect(() => {

        const fetchLeads = async () => {
            try {
                const res = await axios.get(
                    `${API_URL}/dashboard/leads`
                );

                const leads = res.data.data;
                console.log("Dashboard fetched leads:", leads.length, leads);
                setAllLeadsCache(leads); // Cache for filtering
            } catch (err) {
                console.error("Dashboard fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, []); // Run once on mount

    // ── Stats & Table: always use ALL leads regardless of chart date range ──
    useEffect(() => {
        if (!allLeadsCache.length) return;

        const isCompleted = (l: any) =>
            String(l.status).toLowerCase() === "completed" ||
            String(l.phaseStatus).toLowerCase() === "completed" ||
            String(l.currentPhase).toLowerCase() === "event" ||
            String(l.currentPhase).toLowerCase() === "post_production";

        const totalCount     = allLeadsCache.length;
        const completedCount = allLeadsCache.filter(isCompleted).length;
        const pendingCount   = allLeadsCache.filter((l: any) =>
            !isCompleted(l) && String(l.status).toLowerCase() !== "contacted"
        ).length;
        const followUpsCount = allLeadsCache.filter((l: any) =>
            !isCompleted(l) && String(l.status).toLowerCase() === "contacted"
        ).length;

        setStats({ total: totalCount, completed: completedCount, pending: pendingCount, followUps: followUpsCount });

        const formatted = allLeadsCache.map((lead: any) => ({
            id: lead.serialNumber || lead.lead_serial_number || String(lead.id),
            rawId: lead.id,
            name: lead.leadName ?? "-",
            email: lead.email ?? "-",
            phone: lead.phone ?? "-",
            location: lead.location ?? "—",
            eventDate: lead.eventDate ?? "-",
            shootType: lead.eventType ?? "-",
            status: isCompleted(lead) ? "Completed"
                : String(lead.status).toLowerCase() === "contacted" ? "Contacted"
                : "New",
        }));
        setRecentLeads(formatted);
    }, [allLeadsCache]);

    // ── Chart: date-range filtered subset ──
    useEffect(() => {
        if (!allLeadsCache.length) return;

        let chartLeads = allLeadsCache;
        const now = new Date();

        if (dateRange === 'Yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            chartLeads = allLeadsCache.filter((lead: any) => {
                const d = lead.createdAt || lead.created_at;
                if (!d) return false;
                return new Date(d).toDateString() === yesterday.toDateString();
            });
        } else if (dateRange === 'Last week') {
            const cutoff = new Date(now);
            cutoff.setDate(now.getDate() - 7);
            chartLeads = allLeadsCache.filter((lead: any) => {
                const d = lead.createdAt || lead.created_at;
                if (!d) return false;
                return new Date(d) >= cutoff;
            });
        } else if (dateRange === 'Last month') {
            const cutoff = new Date(now);
            cutoff.setMonth(now.getMonth() - 1);
            chartLeads = allLeadsCache.filter((lead: any) => {
                const d = lead.createdAt || lead.created_at;
                if (!d) return false;
                return new Date(d) >= cutoff;
            });
        } else if (dateRange === 'Last year') {
            const cutoff = new Date(now);
            cutoff.setFullYear(now.getFullYear() - 1);
            chartLeads = allLeadsCache.filter((lead: any) => {
                const d = lead.createdAt || lead.created_at;
                if (!d) return false;
                return new Date(d) >= cutoff;
            });
        } else if (dateRange === 'Custom') {
            if (customDates.start && customDates.end) {
                const start = new Date(customDates.start);
                const end = new Date(customDates.end);
                end.setHours(23, 59, 59, 999);
                chartLeads = allLeadsCache.filter((lead: any) => {
                    const d = lead.createdAt || lead.created_at;
                    if (!d) return false;
                    const date = new Date(d);
                    return date >= start && date <= end;
                });
            }
        }
        // 'All time' → chartLeads stays as allLeadsCache

        const chartData = buildPerformanceSeries(chartLeads, dateRange, customDates);
        setPerformanceData(chartData);
    }, [allLeadsCache, dateRange, customDates]);

    const handleDownloadReport = () => {
        const filtered = recentLeads
            .filter(lead => {
                if (statFilter === 'Pending client') return lead.status === 'New';
                if (statFilter === 'Completed projects') return lead.status === 'Completed';
                if (statFilter === 'Pending follow-ups') return lead.status === 'Contacted';
                return true;
            })
            .filter(lead => {
                const q = searchQuery.toLowerCase();
                return lead.name?.toLowerCase().includes(q) || lead.eventDate?.toLowerCase().includes(q);
            });

        const headers = ['Lead ID', 'Client Name', 'E-mail ID', 'Contact number', 'Location', 'Event date', 'Event type', 'Status'];
        const csvRows = filtered.map(lead =>
            [lead.id, lead.name, lead.email, lead.phone, lead.location, lead.eventDate, lead.shootType, lead.status]
                .map(field => `"${String(field).replace(/"/g, '""')}"`)
                .join(',')
        );
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleOpenClient = async (client: any) => {
        try {
            const lookupId = client.rawId ?? client.id;
            const [stageRes, phaseRes] = await Promise.all([
                axios.get(`${API_URL}/stage/${lookupId}`).catch(() => null),
                axios.get(`${API_URL}/crm/leads/${lookupId}/phase-info`).catch(() => null),
            ]);
            const phaseInfo = phaseRes?.data?.data;
            const freshStep = phaseInfo?.pre_production_step;
            setSelectedClient({ ...client, preProductionStep: freshStep, currentPhase: phaseInfo?.current_phase });
            setSelectedPhaseStep(freshStep);
            const currentPhase = phaseInfo?.current_phase;
            if (!isPreProductionPhase(currentPhase)) {
                setView('callDetails');
                return;
            }
            if (phaseInfo?.flow_type === 'post_wedding' || freshStep === 'editing') {
                setView('assignTeam');
                return;
            }
            const currentStage = stageRes?.data?.data?.current_stage;
            setView(resolveClientFlowView(currentStage));
        } catch {
            setSelectedClient(client);
            setSelectedPhaseStep(undefined);
            setView('callDetails');
        }
    };


    if (view === 'callDetails' && selectedClient) {
        return (
            <InitialCallDetails
                client={selectedClient}
                onBack={() => setView('dashboard')}
                onNext={() => setView('assignTeam')}
                expandCreativeSection={selectedPhaseStep === 'creative_confirmation'}
            />
        );
    }
    if (view === 'assignTeam' && selectedClient) {
        const stepHint = selectedPhaseStep ?? selectedClient.preProductionStep;
        const forceShoot = stepHint ? stepHint === 'shoot' : true;
        return <AssignTeam client={selectedClient} onBack={() => setView('callDetails')} onNext={() => setView('dashboard')} forceShootTeamOnly={forceShoot} />;
    }

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Dashboard</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Welcome back! Here's your overview</p>
                </div>
                <button onClick={handleDownloadReport} className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 bg-white" style={{ color: '#6B7280' }}>
                    <Download size={14} /> Download report
                </button>
            </div>

            {/* Stat Cards */}
            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">

                <StatCard
                    title="Total client"
                    value={stats.total}
                    change="Live"
                    positive
                    iconBg="#EDE9FE"
                    icon={<Users size={17} style={{ color: '#7C3AED' }} />}
                    onClick={() => setStatFilter('Total client')}
                    isActive={statFilter === 'Total client'}
                />

                <StatCard
                    title="Pending client"
                    value={stats.pending}
                    change="Live"
                    positive
                    iconBg="#FFF3E0"
                    icon={<Clock size={17} style={{ color: '#F57C00' }} />}
                    onClick={() => setStatFilter('Pending client')}
                    isActive={statFilter === 'Pending client'}
                />

                <StatCard
                    title="Completed projects"
                    value={stats.completed}
                    change="Live"
                    positive
                    iconBg="#E8F5E9"
                    icon={<CheckCircle size={17} style={{ color: '#2E7D32' }} />}
                    onClick={() => setStatFilter('Completed projects')}
                    isActive={statFilter === 'Completed projects'}
                />

                <StatCard
                    title="Pending follow-ups"
                    value={stats.followUps}
                    change="Live"
                    positive={false}
                    iconBg="#FCE4EC"
                    icon={<AlertCircle size={17} style={{ color: '#C2185B' }} />}
                    onClick={() => setStatFilter('Pending follow-ups')}
                    isActive={statFilter === 'Pending follow-ups'}
                />

            </div>

            {/* Performance Analysis Chart */}
            <div className="crm-card p-5 mb-5 relative">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold" style={{ color: '#111827' }}>Performance Analysis</p>
                    <div className="flex items-center gap-2 relative">
                        <select
                            value={dateRange}
                            onChange={(e) => {
                                const val = e.target.value;
                                setDateRange(val);
                                if (val !== 'Custom') setShowDatePicker(false);
                            }}
                            className="text-xs rounded-lg px-3 py-1.5 outline-none crm-card cursor-pointer bg-white border border-gray-100 font-medium" style={{ color: '#6B7280' }}>
                            <option value="Last week">Last week</option>
                            <option value="Yesterday">Yesterday</option>
                            <option value="Last month">Last month</option>
                            <option value="Last year">Last year</option>
                            <option value="All time">All time</option>
                            {dateRange === 'Custom' && <option value="Custom">Custom Date</option>}
                        </select>
                        <div
                            className="relative crm-card bg-white border border-gray-100 p-1.5 rounded-lg text-gray-400 hover:text-purple-600 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                            onClick={() => setShowDatePicker(!showDatePicker)}
                        >
                            <Calendar size={14} />
                        </div>

                        {showDatePicker && (
                            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl p-4 z-50 w-64 animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs font-semibold mb-3 text-gray-700">Custom Date Range</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-medium mb-1 block">Start Date</label>
                                        <input
                                            type="date"
                                            value={customDates.start}
                                            onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-medium mb-1 block">End Date</label>
                                        <input
                                            type="date"
                                            value={customDates.end}
                                            onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setDateRange('Custom');
                                            setShowDatePicker(false);
                                        }}
                                        disabled={!customDates.start || !customDates.end}
                                        className="w-full bg-purple-600 text-white text-xs font-semibold rounded-lg py-2 mt-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Apply Range
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {performanceData.length === 0 || performanceData.every(d => d.newLeads === 0 && d.completedLeads === 0) ? (
                    <div className="flex flex-col items-center justify-center" style={{ height: '210px', color: '#9CA3AF' }}>
                        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="mb-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l4-4 4 4 4-6 4 4" />
                        </svg>
                        <p className="text-sm font-medium">No performance data for this period</p>
                        <p className="text-xs mt-1">Try selecting a wider date range</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={performanceData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                                domain={[0, (dataMax: number) => Math.max(dataMax + 1, 4)]}
                                width={28}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #E5E7EB',
                                    fontSize: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    padding: '8px 12px',
                                }}
                                labelStyle={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}
                                cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                            />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="newLeads"
                                name="New Leads"
                                stroke="#FF7B7B"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#FF7B7B', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#FF7B7B', stroke: '#fff', strokeWidth: 2 }}
                                connectNulls={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="completedLeads"
                                name="Completed"
                                stroke="#5B5FC7"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#5B5FC7', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#5B5FC7', stroke: '#fff', strokeWidth: 2 }}
                                connectNulls={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* New Clients Table */}
            <div className="crm-table-wrap">
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <p className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {statFilter === 'Total client' ? 'Total Clients' : 
                         statFilter === 'Pending client' ? 'Pending Clients' : 
                         statFilter === 'Completed projects' ? 'Completed Clients' : 
                         'Clients with Follow-ups'}
                    </p>
                    <div className="flex bg-white border items-center px-3 py-1.5 rounded-xl w-64" style={{ borderColor: '#E5E7EB' }}>
                        <Search size={14} className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search by name or expected date..."
                            className="bg-transparent border-none outline-none text-xs w-full text-gray-700 placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#FAFAFA' }}>
                            {['Lead ID', 'Client Name', 'E-mail ID', 'Contact number', 'Location', 'Event date', 'Event type', 'Status', 'Action'].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="text-center px-5 py-10 text-sm" style={{ color: '#9CA3AF' }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : recentLeads
                            .filter(lead => {
                                // 1. Stat Filter
                                if (statFilter === 'Pending client') {
                                    return lead.status === 'New'; // Based on lead mapping: lead.status === "pending" ? "New"
                                }
                                if (statFilter === 'Completed projects') {
                                    return lead.status === 'Completed';
                                }
                                if (statFilter === 'Pending follow-ups') {
                                    return lead.status === 'Contacted'; 
                                }
                                return true;
                            })
                            .filter(lead => {
                                // 2. Search Query
                                const q = searchQuery.toLowerCase();
                                const nameMatch = lead.name?.toLowerCase().includes(q);
                                const dateMatch = lead.eventDate?.toLowerCase().includes(q);
                                return nameMatch || dateMatch;
                            })
                            .map((lead, i) => (
                                <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                                    <td className="px-5 py-3 text-sm font-medium" style={{ color: '#5B5FC7' }}>{lead.id}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>
                                        <span className="hover:underline" style={{ color: '#5B5FC7', cursor: 'pointer' }} onClick={() => handleOpenClient(lead)}>
                                            {lead.name}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{lead.email}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{lead.phone}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{lead.location}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{lead.eventDate}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{lead.shootType}</td>
                                    <td className="px-5 py-3"><span className="crm-badge" style={{ background: lead.status === 'New' ? '#FFF3E0' : lead.status === 'In progress' ? '#E8F0FE' : lead.status === 'Completed' ? '#E8F5E9' : '#FEF9C3', color: lead.status === 'New' ? '#E65100' : lead.status === 'In progress' ? '#1565C0' : lead.status === 'Completed' ? '#2E7D32' : '#CA8A04' }}>{lead.status}</span></td>
                                    <td className="px-5 py-3 text-sm">
                                        <div className="flex gap-3" style={{ color: '#9CA3AF' }}>
                                            <button onClick={() => handleOpenClient(lead)} title="View Details">
                                                <Eye size={15} className="hover:text-indigo-600 transition-colors" />
                                            </button>
                                            <button 
                                                disabled={lead.status === 'Completed'}
                                                className={`transition-colors ${lead.status === 'Completed' ? 'opacity-20 cursor-not-allowed' : 'hover:text-indigo-600'}`} 
                                                title={lead.status === 'Completed' ? "Cannot edit completed lead" : "Edit Client"}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button 
                                                disabled={lead.status === 'Completed'}
                                                className={`transition-colors ${lead.status === 'Completed' ? 'opacity-20 cursor-not-allowed' : 'hover:text-green-600'}`}
                                                title={lead.status === 'Completed' ? "Cannot call completed lead" : "Call Client"}
                                            >
                                                <Phone size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
