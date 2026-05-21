import { useState, useEffect, useMemo } from 'react'
import {
    Upload, Clock, Send, ArrowRight, Download, History, Calendar,
    Users, CheckCircle, AlertCircle, HardDrive, Trash2
} from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import StatCard from '../../crm/components/ui/StatCard'
import axios from 'axios'



const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string; }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl flex flex-col gap-2">
                {payload.map((entry: { color: string; name: string; value: number }, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        {entry.name === 'pending' ? 'Pending Uploads' : 'Data Received'}
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export default function Dashboard() {
    const API_URL = import.meta.env.VITE_API_URL;
    const [dateRange, setDateRange] = useState('Last year')

    const [incomingData, setIncomingData] = useState<any[]>([]);

    // Filters
    const [category, setCategory] = useState('All')
    const [subCategory, setSubCategory] = useState('All')
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    const [pixofficeStats, setPixofficeStats] = useState({ completed: 0, pending: 0 });
    const [hardDiskStats, setHardDiskStats] = useState({ handover_count: 0, receive_count: 0, closure_count: 0 });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await axios.get(`${API_URL}/data-manager/incoming`);
                if (res.data.success && res.data.data) {
                    setIncomingData(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            }
        };
        const fetchPixofficeStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/pixoffice/stats`);
                if (res.data.success && res.data.data) {
                    setPixofficeStats(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch pixoffice stats", err);
            }
        };

        const fetchHardDiskStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/data-manager/hard-disk-stats`);
                if (res.data.success && res.data.data) {
                    setHardDiskStats(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch hard disk stats", err);
            }
        };

        fetchDashboardData();
        fetchPixofficeStats();
        fetchHardDiskStats();
    }, [API_URL]);

    // Derived Stats
    const stats = useMemo(() => {
        const uniqueClients = new Set(incomingData.map(d => d.client));
        const pendingCount = incomingData.filter(d => d.status === 'Pending').length;
        return {
            totalClients: uniqueClients.size,
            dataReceived: incomingData.length,
            dataPending: pendingCount
        };
    }, [incomingData]);

    const recentActivity = useMemo(() => {
        return incomingData.slice(0, 5).map(item => ({
            title: item.client || 'Unknown Client',
            role: item.photographer ? 'Photographer' : (item.videographer ? 'Videographer' : 'Team'),
            project: item.title || 'Project',
            status: item.status || 'Pending'
        }));
    }, [incomingData]);

    const quickActions = [
        { title: 'New raw files received', desc: `${incomingData.length} files total`, icon: <Upload size={16} className="text-orange-600" />, bg: 'bg-orange-100' },
        { title: 'Files pending Verification', desc: `${stats.dataPending} files ready to review`, icon: <Send size={16} className="text-blue-600" />, bg: 'bg-blue-100' },
        { title: 'Check the assigned history', desc: 'Show all the history details', icon: <History size={16} className="text-red-600" />, bg: 'bg-red-100' },
    ];

    const currentData = useMemo(() => {
        if (!incomingData.length) return [];
        let filtered = incomingData;
        const now = new Date();

        if (dateRange === 'Yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            filtered = incomingData.filter((d: any) => {
                if (!d.date) return false;
                const dt = new Date(d.date);
                return dt.toDateString() === yesterday.toDateString();
            });
        } else if (dateRange === 'Last week') {
            const lastWeek = new Date(now);
            lastWeek.setDate(now.getDate() - 7);
            filtered = incomingData.filter((d: any) => {
                if (!d.date) return false;
                return new Date(d.date) >= lastWeek;
            });
        } else if (dateRange === 'Last month') {
            const lastMonth = new Date(now);
            lastMonth.setMonth(now.getMonth() - 1);
            filtered = incomingData.filter((d: any) => {
                if (!d.date) return false;
                return new Date(d.date) >= lastMonth;
            });
        } else if (dateRange === 'Last year') {
            const lastYear = new Date(now);
            lastYear.setFullYear(now.getFullYear() - 1);
            filtered = incomingData.filter((d: any) => {
                if (!d.date) return false;
                return new Date(d.date) >= lastYear;
            });
        } else if (dateRange === 'Custom' && customDates.start && customDates.end) {
            const start = new Date(customDates.start);
            const end = new Date(customDates.end);
            end.setHours(23, 59, 59, 999);
            filtered = incomingData.filter((d: any) => {
                if (!d.date) return false;
                const dt = new Date(d.date);
                return dt >= start && dt <= end;
            });
        }

        const grouped: Record<string, any> = {};
        filtered.forEach((d: any) => {
            if (!d.date) return;
            const dt = new Date(d.date);
            let labelKey = "";

            if (dateRange === 'Last year' || dateRange === 'Custom') {
                labelKey = dt.toLocaleString("default", { month: "short", year: "numeric" });
            } else if (dateRange === 'Yesterday') {
                labelKey = dt.toLocaleString("default", { hour: '2-digit', minute: '2-digit' });
            } else {
                labelKey = dt.toLocaleString("default", { weekday: "short", day: "numeric", month: "short" });
            }

            if (!grouped[labelKey]) {
                grouped[labelKey] = { month: labelKey, pending: 0, received: 0, _rawDate: dt };
            }

            if (d.status === 'Pending') grouped[labelKey].pending++;
            else grouped[labelKey].received++;
        });

        const chartData = Object.values(grouped).sort((a: any, b: any) => a._rawDate.getTime() - b._rawDate.getTime());
        return chartData;
    }, [incomingData, dateRange, customDates]);

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Dashboard</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Welcome back !.. Here's your overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            setSubCategory('All'); // Reset sub on category change
                        }}
                        className="px-4 py-2 rounded-xl text-sm border outline-none bg-white"
                        style={{ borderColor: '#E5E7EB', color: '#374151' }}>
                        <option value="All">All Categories</option>
                        <option value="Pre Production">Pre Production</option>
                        <option value="Post production">Post production</option>
                        <option value="Outdoor Shoot">Outdoor Shoot</option>
                    </select>

                    {category === 'Outdoor Shoot' && (
                        <select
                            value={subCategory}
                            onChange={(e) => setSubCategory(e.target.value)}
                            className="px-4 py-2 rounded-xl text-sm border outline-none bg-white"
                            style={{ borderColor: '#E5E7EB', color: '#374151' }}>
                            <option value="All">All Sub-categories</option>
                            <option value="Pre wedding shoot">Pre wedding shoot</option>
                            <option value="Post wedding shoot">Post wedding shoot</option>
                        </select>
                    )}

                    <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium" style={{ color: '#6B7280' }}>
                        <Download size={14} /> Download report
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Clients" value={stats.totalClients} change="Live" positive iconBg="#EDE9FE"
                    icon={<Users size={17} style={{ color: '#7C3AED' }} />} />
                <StatCard title="Data Received" value={stats.dataReceived} change="Live" positive iconBg="#E3F2FD"
                    icon={<Clock size={17} style={{ color: '#1976D2' }} />} />
                <StatCard title="Data Pending" value={stats.dataPending} change="Live" positive={false} iconBg="#FFF3E0"
                    icon={<AlertCircle size={17} style={{ color: '#F57C00' }} />} />
                <StatCard title="Pixoffice Completed" value={pixofficeStats.completed} change="Live" positive iconBg="#E8F5E9"
                    icon={<CheckCircle size={17} style={{ color: '#2E7D32' }} />} />
                <StatCard title="Pixoffice Pending" value={pixofficeStats.pending} change="Live" positive={false} iconBg="#Fce4ec"
                    icon={<Clock size={17} style={{ color: '#C2185B' }} />} />
                <StatCard title="Hard disk Received" value={hardDiskStats.receive_count} change="Live" positive iconBg="#E0F2FE"
                    icon={<HardDrive size={17} style={{ color: '#0369A1' }} />} />
                <StatCard title="Hard disk Hand over" value={hardDiskStats.handover_count} change="Live" positive iconBg="#FEF3C7"
                    icon={<Send size={17} style={{ color: '#D97706' }} />} />
                <StatCard title="Closure (Footage Deletion)" value={hardDiskStats.closure_count} change="Live" positive iconBg="#FEE2E2"
                    icon={<Trash2 size={17} style={{ color: '#DC2626' }} />} />
            </div>

            {/* Performance Analysis Chart */}
            <div className="rounded-[24px] p-6 mb-6 bg-white" style={{ border: '1px solid #E5E7EB' }}>
                <div className="flex items-center justify-between mb-8">
                    <p className="text-[15px] font-bold" style={{ color: '#111827' }}>Performance Analysis</p>
                    <div className="flex items-center gap-2 relative">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="text-xs rounded-lg px-3 py-1.5 outline-none border bg-white cursor-pointer font-medium"
                            style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>
                            <option value="Yesterday">Yesterday</option>
                            <option value="Last week">Last week</option>
                            <option value="Last month">Last month</option>
                            <option value="Last year">Last year</option>
                            {dateRange === 'Custom' && <option value="Custom" className="hidden">Custom Date</option>}
                        </select>
                        <div
                            className="border p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-gray-50 bg-white transition-colors cursor-pointer relative"
                            style={{ borderColor: '#E5E7EB' }}
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
                {currentData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center w-full" style={{ height: '250px', color: '#9CA3AF' }}>
                        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="mb-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l4-4 4 4 4-6 4 4" />
                        </svg>
                        <p className="text-sm">No performance data yet</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={currentData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF0F6" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Line type="monotone" dataKey="pending" stroke="#FF7A59" strokeWidth={3} dot={false} />
                            <Line type="monotone" dataKey="received" stroke="#605BFF" strokeWidth={3} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-2 gap-5">
                {/* Today's Activity */}
                <div className="crm-card p-5">
                    <p className="text-sm font-semibold text-gray-900">Today's Activity</p>
                    <p className="text-xs text-gray-500 mb-4">Recent raw data collections</p>
                    <div className="flex flex-col gap-3">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-5 text-gray-500 text-sm">No recent activity</div>
                        ) : recentActivity.map((task, i) => (
                            <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 bg-white">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{task.role} • {task.project}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-4 py-1.5 rounded-md ${task.status === 'Verified' ? 'bg-green-50 text-green-600' :
                                    task.status === 'Pending' ? 'bg-orange-50 text-orange-500' :
                                        'bg-blue-50 text-blue-500'
                                    }`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="crm-card p-5">
                    <p className="text-sm font-semibold text-gray-900">Quick Actions</p>
                    <p className="text-xs text-gray-500 mb-4">Common tasks at glance</p>
                    <div className="flex flex-col gap-3">
                        {quickActions.map((action, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white cursor-pointer hover:border-gray-200 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.bg}`}>
                                    {action.icon}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900">{action.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
                                </div>
                                <ArrowRight size={16} className="text-gray-400" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
