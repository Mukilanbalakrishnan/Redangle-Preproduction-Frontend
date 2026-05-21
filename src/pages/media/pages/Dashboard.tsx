import { useRef, useState, useEffect } from 'react'
import { FileCheck, Clock, Calendar, CheckCircle, Download } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import StatCard from '../../crm/components/ui/StatCard'
import { useMediaRole } from '../../../hooks/useMediaRole'

const API_URL = import.meta.env.VITE_API_URL


const performanceData = {
    'Yesterday': [
        { month: '08:00', completionRate: 1, onTime: 1 },
        { month: '12:00', completionRate: 3, onTime: 2 },
        { month: '16:00', completionRate: 2, onTime: 2 },
        { month: '20:00', completionRate: 5, onTime: 4 },
    ],
    'Last week': [
        { month: 'Mon', completionRate: 4, onTime: 3 },
        { month: 'Tue', completionRate: 7, onTime: 5 },
        { month: 'Wed', completionRate: 6, onTime: 6 },
        { month: 'Thu', completionRate: 8, onTime: 7 },
        { month: 'Fri', completionRate: 5, onTime: 5 },
        { month: 'Sat', completionRate: 9, onTime: 8 },
        { month: 'Sun', completionRate: 6, onTime: 6 },
    ],
    'Last month': [
        { month: 'Week 1', completionRate: 14, onTime: 13 },
        { month: 'Week 2', completionRate: 17, onTime: 15 },
        { month: 'Week 3', completionRate: 20, onTime: 18 },
        { month: 'Week 4', completionRate: 18, onTime: 17 },
    ],
    'Last year': [
        { month: 'Oct 2021', completionRate: 3.5, onTime: 3 },
        { month: 'Nov 2021', completionRate: 6, onTime: 5 },
        { month: 'Dec 2021', completionRate: 4, onTime: 2.5 },
        { month: 'Jan 2022', completionRate: 6.5, onTime: 4.5 },
        { month: 'Feb 2022', completionRate: 4.5, onTime: 5.5 },
        { month: 'Mar 2022', completionRate: 6, onTime: 4.5 },
    ],
    'Custom': [
        { month: 'Morning', completionRate: 2, onTime: 2 },
        { month: 'Afternoon', completionRate: 5, onTime: 4 },
        { month: 'Evening', completionRate: 3, onTime: 3 },
    ]
}

interface DashboardStats {
    assigned: number
    pending: number
    submitted: number
    approved: number
}

interface RecentProject {
    lead_employee_id: number
    lead_id: number
    lead_code: string
    name: string
    type: string
    task_name: string
    priority: string
    deadline: string
}

const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'high': return { background: '#FCE4EC', color: '#C2185B' }
        case 'medium': return { background: '#FFF3E0', color: '#E65100' }
        case 'low': return { background: '#E8F5E9', color: '#2E7D32' }
        default: return { background: '#F3F4F6', color: '#6B7280' }
    }
}

export default function MediaDashboard() {
    const { employeeId } = useMediaRole()
    const dateInputRef = useRef<HTMLInputElement>(null)
    const [dateRange, setDateRange] = useState('Last year')
    const [stats, setStats] = useState<DashboardStats>({ assigned: 0, pending: 0, submitted: 0, approved: 0 })
    const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!employeeId) { setLoading(false); return }
        fetch(`${API_URL}/employee/${employeeId}/dashboard`)
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    setStats(result.data.stats)
                    setRecentProjects(result.data.recentProjects || [])
                }
            })
            .catch(err => console.error('Dashboard fetch error:', err))
            .finally(() => setLoading(false))
    }, [employeeId])

    const currentData = performanceData[dateRange as keyof typeof performanceData] || performanceData['Last year']

    const upcomingProjects = recentProjects.filter(p => {
        if (!p.deadline) return false
        return new Date(p.deadline) >= new Date()
    })

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Dashboard</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Welcome back! Here's your overview</p>
                </div>
                <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium" style={{ color: '#6B7280' }}>
                    <Download size={14} /> Download report
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Assigned" value={loading ? '...' : String(stats.assigned)} change="" positive iconBg="#Fce4ec"
                    icon={<FileCheck size={17} style={{ color: '#C2185B' }} />} />
                <StatCard title="Pending" value={loading ? '...' : String(stats.pending)} change="" positive={false} iconBg="#FFF3E0"
                    icon={<Clock size={17} style={{ color: '#F57C00' }} />} />
                <StatCard title="Submitted" value={loading ? '...' : String(stats.submitted)} change="" positive iconBg="#E3F2FD"
                    icon={<Calendar size={17} style={{ color: '#1976D2' }} />} />
                <StatCard title="Approved" value={loading ? '...' : String(stats.approved)} change="" positive iconBg="#E8F5E9"
                    icon={<CheckCircle size={17} style={{ color: '#2E7D32' }} />} />
            </div>

            <div className="crm-card p-5 mb-5 relative">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold" style={{ color: '#111827' }}>Performance Analysis</p>
                    <div className="flex items-center gap-2">
                        <select
                            className="text-xs rounded-lg px-3 py-1.5 outline-none crm-card cursor-pointer bg-white border border-gray-100 font-medium"
                            style={{ color: '#6B7280' }}
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="Yesterday">Yesterday</option>
                            <option value="Last week">Last week</option>
                            <option value="Last month">Last month</option>
                            <option value="Last year">Last year</option>
                            {dateRange === 'Custom' && <option value="Custom" className="hidden">Custom Date</option>}
                        </select>
                        <div
                            className="relative crm-card bg-white border border-gray-100 p-1.5 rounded-lg text-gray-400 hover:text-purple-600 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                            onClick={() => dateInputRef.current?.showPicker()}
                        >
                            <Calendar size={14} />
                            <input
                                ref={dateInputRef}
                                type="date"
                                className="absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none"
                                title="Select custom date"
                                onChange={(e) => {
                                    if (e.target.value) setDateRange('Custom')
                                }}
                            />
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={currentData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 12]} ticks={[0, 2, 4, 6, 8, 10, 12]} />
                        <Tooltip
                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', fontSize: '11px' }}
                            itemStyle={{ color: '#111827', fontWeight: 500 }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '11px', top: -30, right: 100 }}
                            layout="vertical"
                            verticalAlign="top"
                            align="right"
                        />
                        <Line type="basis" dataKey="completionRate" name="Task completion rate" stroke="#FF7B7B" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#FF7B7B', stroke: '#fff', strokeWidth: 2 }} />
                        <Line type="basis" dataKey="onTime" name="On-time delivery" stroke="#5B5FC7" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#5B5FC7', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="crm-card p-5">
                    <p className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Recent Projects</p>
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
                        ) : recentProjects.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No recent projects</p>
                        ) : (
                            recentProjects.map((project) => (
                                <div key={project.lead_employee_id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-white">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">{project.name} — {project.task_name || project.type}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{project.deadline || '—'}</p>
                                    </div>
                                    <span className="crm-badge" style={getPriorityStyle(project.priority)}>
                                        {project.priority || '—'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="crm-card p-5">
                    <p className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Upcoming Shoots</p>
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
                        ) : upcomingProjects.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No upcoming shoots</p>
                        ) : (
                            upcomingProjects.map((shoot) => (
                                <div key={shoot.lead_employee_id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 font-bold text-sm shrink-0">
                                            {shoot.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{shoot.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{shoot.type} • {shoot.deadline}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-purple-600">
                                        {shoot.lead_code || `LD-${shoot.lead_id}`}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
