import { Users, Clock, CheckCircle, AlertCircle, Download, Calendar, Search } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import StatCard from '../../crm/components/ui/StatCard'
import { useEffect, useState } from "react";
import axios from "axios";
import EventStageClientView from '../components/EventStageClientView';

type View = 'dashboard' | 'assignTeam';

export default function Dashboard() {
    const API_URL = import.meta.env.VITE_API_URL;

    // ✅ ALL HOOKS MUST BE HERE
    const [recentLeads, setRecentLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('dashboard');
    const [selectedClient, setSelectedClient] = useState<any>(null);

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

    useEffect(() => {

        const fetchLeads = async () => {
            try {
                const res = await axios.get(
                    `${API_URL}/event-coordinator/dashboard/leads`
                );

                const leads = (res.data.data || []).filter((lead: any) => lead.currentPhase === 'event');

                // ================= TABLE DATA =================
                const formattedLeads = leads.map((lead: any) => ({
                    id: lead.serialNumber || String(lead.id),
                    rawId: lead.id,
                    name: lead.leadName ?? "-",
                    email: lead.email ?? "-",
                    phone: lead.phone ?? "-",
                    location: lead.location ?? "—",
                    eventDate: lead.eventDate ?? "15-11-2024",
                    shootType: lead.eventType ?? "-",
                    status:
                        lead.status === "pending"
                            ? "New"
                            : lead.status === "inprogress"
                                ? "In progress"
                                : lead.status === "completed"
                                    ? "Completed"
                                    : "New",
                }));

                setRecentLeads(formattedLeads);
                setAllLeadsCache(leads); // Cache for chart filtering

                // ================= STATS =================
                setStats({
                    total: leads.length,
                    pending: leads.filter((l: any) => l.status === "pending").length,
                    completed: leads.filter((l: any) => l.status === "completed").length,
                    followUps: leads.filter((l: any) => (l.followUpCount ?? 0) > 0).length,
                });

            } catch (err) {
                console.error("Dashboard fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeads();
    }, [dateRange, customDates]); // Re-run when standard or custom dates change

    useEffect(() => {
        if (!allLeadsCache.length) return;

        let filteredLeads = allLeadsCache;
        const now = new Date();

        // 1. FILTER
        if (dateRange === 'Yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            filteredLeads = allLeadsCache.filter((lead: any) => {
                if (!lead.createdAt) return false;
                const d = new Date(lead.createdAt);
                return d.toDateString() === yesterday.toDateString();
            });
        } else if (dateRange === 'Last week') {
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            filteredLeads = allLeadsCache.filter((lead: any) => {
                if (!lead.createdAt) return false;
                return new Date(lead.createdAt) >= lastWeek;
            });
        } else if (dateRange === 'Last month') {
            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);
            filteredLeads = allLeadsCache.filter((lead: any) => {
                if (!lead.createdAt) return false;
                return new Date(lead.createdAt) >= lastMonth;
            });
        } else if (dateRange === 'Last year') {
            const lastYear = new Date(now);
            lastYear.setFullYear(now.getFullYear() - 1);
            filteredLeads = allLeadsCache.filter((lead: any) => {
                if (!lead.createdAt) return false;
                return new Date(lead.createdAt) >= lastYear;
            });
        } else if (dateRange === 'Custom') {
            if (customDates.start && customDates.end) {
                const start = new Date(customDates.start);
                const end = new Date(customDates.end);
                end.setHours(23, 59, 59, 999);
                filteredLeads = allLeadsCache.filter((lead: any) => {
                    if (!lead.createdAt) return false;
                    const d = new Date(lead.createdAt);
                    return d >= start && d <= end;
                });
            }
        }

        // 2. GROUPING
        const groupedData: Record<string, any> = {};

        filteredLeads.forEach((lead: any) => {
            if (!lead.createdAt) return;
            const date = new Date(lead.createdAt);

            let labelKey = "";

            if (dateRange === 'Last year' || dateRange === 'Custom') {
                // Broad custom dates might be better as months depending on length, but group by month for 'Last year'
                labelKey = date.toLocaleString("default", { month: "short", year: "numeric" });
            } else if (dateRange === 'Yesterday') {
                // Group by hour
                labelKey = date.toLocaleString("default", { hour: '2-digit', minute: '2-digit' });
            } else {
                // Group by Day
                labelKey = date.toLocaleString("default", { weekday: "short", day: "numeric", month: "short" });
            }

            if (!groupedData[labelKey]) {
                groupedData[labelKey] = { month: labelKey, newLeads: 0, completedLeads: 0, _rawDate: date };
            }

            if (lead.status === "pending") groupedData[labelKey].newLeads++;
            if (lead.status === "completed") groupedData[labelKey].completedLeads++;
        });

        const chartData = Object.values(groupedData);

        // Sort chronologically
        chartData.sort((a: any, b: any) => {
            return a._rawDate.getTime() - b._rawDate.getTime();
        });

        setPerformanceData(chartData);
    }, [allLeadsCache, dateRange, customDates]);

    const handleDownloadReport = () => {
        const headers = ['Lead ID', 'Client Name', 'E-mail ID', 'Contact number', 'Location', 'Event date', 'Event type', 'Status'];
        const csvRows = recentLeads.map(lead => 
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
            const phaseRes = await axios.get(`${API_URL}/crm/leads/${lookupId}/phase-info`).catch(() => null);
            const currentPhase = phaseRes?.data?.data?.current_phase;
            if (currentPhase !== 'event') {
                alert('This lead is not in the event phase yet.');
                return;
            }
            setSelectedClient(client);
            setView('assignTeam');
        } catch {
            alert('Failed to open event-stage client.');
        }
    };

    if (view === 'assignTeam' && selectedClient) {
        return <EventStageClientView client={selectedClient} onBack={() => setView('dashboard')} onNext={() => setView('dashboard')} />;
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
                />

                <StatCard
                    title="Pending client"
                    value={stats.pending}
                    change="Live"
                    positive
                    iconBg="#FFF3E0"
                    icon={<Clock size={17} style={{ color: '#F57C00' }} />}
                />

                <StatCard
                    title="Completed projects"
                    value={stats.completed}
                    change="Live"
                    positive
                    iconBg="#E8F5E9"
                    icon={<CheckCircle size={17} style={{ color: '#2E7D32' }} />}
                />

                <StatCard
                    title="Pending follow-ups"
                    value={stats.followUps}
                    change="Live"
                    positive={false}
                    iconBg="#FCE4EC"
                    icon={<AlertCircle size={17} style={{ color: '#C2185B' }} />}
                />

            </div>

            {/* Performance Analysis Chart */}
            <div className="crm-card p-5 mb-5 relative">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold" style={{ color: '#111827' }}>Performance Analysis</p>
                    <div className="flex items-center gap-2 relative">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="text-xs rounded-lg px-3 py-1.5 outline-none crm-card cursor-pointer bg-white border border-gray-100 font-medium" style={{ color: '#6B7280' }}>
                            <option value="Yesterday">Yesterday</option>
                            <option value="Last week">Last week</option>
                            <option value="Last month">Last month</option>
                            <option value="Last year">Last year</option>
                            {dateRange === 'Custom' && <option value="Custom" className="hidden">Custom Date</option>}
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
                {performanceData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center" style={{ height: '210px', color: '#9CA3AF' }}>
                        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="mb-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l4-4 4 4 4-6 4 4" />
                        </svg>
                        <p className="text-sm">No performance data yet</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={210}>
                        <LineChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '11px' }} />
                            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
                            <Line
                                type="monotone"
                                dataKey="newLeads"
                                name="New Leads"
                                stroke="#FF7B7B"
                                strokeWidth={2}
                                dot={false}
                            />

                            <Line
                                type="monotone"
                                dataKey="completedLeads"
                                name="Completed"
                                stroke="#5B5FC7"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* New Clients Table */}
            <div className="crm-table-wrap">
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <p className="text-sm font-semibold" style={{ color: '#111827' }}>New Clients</p>
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
                                <td colSpan={7} className="text-center px-5 py-10 text-sm" style={{ color: '#9CA3AF' }}>
                                    No clients yet
                                </td>
                            </tr>
                        ) : recentLeads
                            .filter(lead => {
                                const q = searchQuery.toLowerCase();
                                const nameMatch = lead.name?.toLowerCase().includes(q);
                                const dateMatch = lead.createdAt?.toLowerCase().includes(q) || lead.eventDate?.toLowerCase().includes(q); // Assuming fallback to eventDate string format
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

                                    <td className="px-5 py-3 text-sm" style={{ color: '#9CA3AF' }}>
                                        <div className="flex gap-3">
                                            <button style={{ color: '#9CA3AF' }}><svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                            <button style={{ color: '#9CA3AF' }}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                            <button style={{ color: '#9CA3AF' }}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
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
