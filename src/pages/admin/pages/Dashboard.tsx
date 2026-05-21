import { useEffect, useState } from 'react'
import { Users, Clock, CheckCircle2, IndianRupee, TrendingUp, Activity, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
    totalClients: number
    pendingClients: number
    completedClients: number
    totalRevenue: number
    recentActivity: {
        external_id: number
        lead_name: string
        status: string
        created_at: string
    }[]
}

function formatRevenue(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount}`
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
    const days = Math.floor(hrs / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard-stats`)
                const json = await res.json()
                if (json.success) {
                    setStats(json.data)
                } else {
                    setError('Failed to load dashboard data')
                }
            } catch (e) {
                setError('Could not connect to server')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    // Computed performance stats
    const conversionRate = stats && stats.totalClients > 0
        ? Math.round((stats.completedClients / stats.totalClients) * 100)
        : 0
    const pendingRate = stats && stats.totalClients > 0
        ? Math.round((stats.pendingClients / stats.totalClients) * 100)
        : 0
    const revenuePerLead = stats && stats.completedClients > 0
        ? stats.totalRevenue / stats.completedClients
        : 0
    // Normalise revenuePerLead to a 0-100 bar (assuming ₹5L per lead = 100%)
    const revenueBarPct = Math.min(100, Math.round(revenuePerLead / 5000))

    const performanceStats = [
        { label: 'Client Conversion Rate', value: `${conversionRate}%`, progress: conversionRate },
        { label: 'Lead Fill Rate', value: `${pendingRate}%`, progress: pendingRate },
        { label: 'Revenue per Lead', value: formatRevenue(revenuePerLead), progress: revenueBarPct },
    ]

    return (
        <div className="space-y-6 max-w-[1400px] animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1 font-sans">Dashboard</h1>
                <p className="text-[13px] text-gray-500 font-medium">Welcome back, Admin</p>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Clients */}
                <div 
                    onClick={() => navigate('/admin/client')}
                    className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm hover:border-green-300 transition-all group cursor-pointer hover:shadow-md"
                >
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[13px] font-bold text-gray-700 font-sans">Total client</p>
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                            <Users size={16} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                            {loading ? '—' : (stats?.totalClients ?? 0).toLocaleString()}
                        </h3>
                        <p className="text-[11px] font-bold text-green-500 mt-2">All time</p>
                    </div>
                </div>

                {/* Pending Clients */}
                <div 
                    onClick={() => navigate('/admin/client', { state: { statusFilter: 'Pending' } })}
                    className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm hover:border-orange-300 transition-all group cursor-pointer hover:shadow-md"
                >
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[13px] font-bold text-gray-700 font-sans">Pending client</p>
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                            {loading ? '—' : (stats?.pendingClients ?? 0).toLocaleString()}
                        </h3>
                        <p className="text-[11px] font-bold text-orange-500 mt-2">Active leads</p>
                    </div>
                </div>

                {/* Completed Clients */}
                <div 
                    onClick={() => navigate('/admin/client', { state: { statusFilter: 'Completed' } })}
                    className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm hover:border-blue-300 transition-all group cursor-pointer hover:shadow-md"
                >
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[13px] font-bold text-gray-700 font-sans">Completed client</p>
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                            {loading ? '—' : (stats?.completedClients ?? 0).toLocaleString()}
                        </h3>
                        <p className="text-[11px] font-bold text-blue-500 mt-2">
                            {conversionRate}% conversion rate
                        </p>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm hover:border-purple-300 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[13px] font-bold text-gray-700 font-sans">Total Revenue</p>
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                            <IndianRupee size={16} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                            {loading ? '—' : formatRevenue(stats?.totalRevenue ?? 0)}
                        </h3>
                        <p className="text-[11px] font-bold text-purple-500 mt-2">From paid invoices</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium rounded-xl px-4 py-3">
                    {error}
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Performance Overview */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
                        <h2 className="text-[15px] font-bold text-gray-900 font-sans flex items-center gap-2">
                            <TrendingUp size={18} className="text-gray-700" /> Performance Overview
                        </h2>
                    </div>

                    <div className="space-y-8 flex-1">
                        {performanceStats.map((stat, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-[13px] font-bold text-gray-700 mb-3">
                                    <span>{stat.label}</span>
                                    <span>{loading ? '—' : stat.value}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-[#2ecc71] h-2 rounded-full transition-all duration-1000"
                                        style={{ width: loading ? '0%' : `${stat.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm">
                    <h2 className="text-[15px] font-bold text-gray-900 font-sans flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                        <Activity size={18} className="text-gray-700" /> Recent Activity
                    </h2>

                    <div className="space-y-6">
                        {loading ? (
                            <p className="text-[13px] text-gray-400 font-medium">Loading activity...</p>
                        ) : stats?.recentActivity?.length ? (
                            stats.recentActivity.map((activity) => (
                                <div key={activity.external_id} className="flex gap-4 items-start group">
                                    <div className="p-3 rounded-xl bg-gray-100 text-gray-600 group-hover:scale-110 transition-transform shrink-0">
                                        <UserPlus size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-gray-900 truncate">
                                            New client synced
                                        </p>
                                        <p className="text-[12px] font-medium text-gray-500 mt-0.5 truncate">
                                            {activity.lead_name}
                                            {activity.status ? ` · ${activity.status}` : ''}
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap pt-1">
                                        {timeAgo(activity.created_at)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-[13px] text-gray-400 font-medium">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
