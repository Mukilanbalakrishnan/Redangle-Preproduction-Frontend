import { Check, X, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

type Leave = {
    id: number
    emp: string
    role: string
    level: string
    priority: string
    project: string
    type: string
    from_date: string
    to_date: string
    no_of_days: number
    status: string
    reason: string
}

const formatDateRange = (from: string, to: string) => {
    if (!from || !to) return '—'

    // Check if dates are already formatted or strings like "27 Feb"
    if (!from.includes('-') && !from.includes('/')) {
        if (from === to) return from
        return `${from} – ${to}`
    }

    try {
        const d1 = new Date(from).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
        const d2 = new Date(to).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
        if (d1 === d2) return d1
        return `${d1} – ${d2}`
    } catch {
        return `${from} – ${to}`
    }
}

const levelColors: Record<string, { bg: string; color: string }> = {
    Senior: { bg: '#DBEAFE', color: '#2563EB' },
    Junior: { bg: '#D1FAE5', color: '#059669' },
    Low: { bg: '#F3F4F6', color: '#6B7280' },
}

const priorityColors: Record<string, { bg: string; color: string }> = {
    High: { bg: '#FEE2E2', color: '#DC2626' },
    Med: { bg: '#FEF9C3', color: '#CA8A04' },
    Low: { bg: '#D1FAE5', color: '#059669' },
}

const statusColors: Record<string, { bg: string; color: string }> = {
    Pending: { bg: '#FEF9C3', color: '#CA8A04' },
    Approved: { bg: '#D1FAE5', color: '#059669' },
    Accepted: { bg: '#D1FAE5', color: '#059669' },
    Rejected: { bg: '#FEE2E2', color: '#DC2626' },
}

export default function LeaveManagement() {
    const [leaves, setLeaves] = useState<Leave[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('All Roles')
    const [priorityFilter, setPriorityFilter] = useState('All Priorities')
    const [statusFilter, setStatusFilter] = useState('All Status')

    useEffect(() => {
        fetchLeaves()
    }, [])

    const fetchLeaves = async () => {
        setLoading(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const res = await axios.get(`${API_URL}/leave?role=crm`)
            if (res.data?.success) {
                const formatted = res.data.data.map((l: any) => ({
                    id: l.leave_request_id,
                    emp: l.employee_name || l.employee_id || 'Unknown',
                    role: l.role || 'Employee',
                    level: 'Senior', // Backend doesn't have level, defaulting
                    priority: 'Med', // Backend doesn't have priority for leave, defaulting
                    project: 'General', // Backend doesn't link leaves to project, defaulting
                    type: l.leave_type || 'Leave',
                    from_date: l.from_date,
                    to_date: l.to_date,
                    no_of_days: l.no_of_days || 1,
                    status: l.status === 'Approved' ? 'Accepted' : l.status,
                    reason: l.reason || ''
                }))
                setLeaves(formatted)
            }
        } catch (err) {
            console.error("Error fetching leaves:", err)
        } finally {
            setLoading(false)
        }
    }

    const pending = leaves.filter(l => l.status === 'Pending').length
    const approved = leaves.filter(l => l.status === 'Accepted' || l.status === 'Approved').length
    const highPriority = leaves.filter(l => l.priority === 'High').length

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            // API expects 'Approved' or 'Rejected'
            const apiStatus = newStatus === 'Accepted' ? 'Approved' : newStatus
            await axios.put(`${API_URL}/leave/${id}/status`, { status: apiStatus })
            setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
        } catch (err) {
            console.error("Error updating leave status:", err)
            alert("Failed to update status")
        }
    }

    const handleAccept = (id: number) => handleUpdateStatus(id, 'Accepted')
    const handleReject = (id: number) => handleUpdateStatus(id, 'Rejected')

    const filteredLeaves = leaves.filter(l => {
        const matchesSearch = l.emp.toLowerCase().includes(searchQuery.toLowerCase()) || l.project.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === 'All Roles' || l.role === roleFilter
        const matchesPriority = priorityFilter === 'All Priorities' || l.priority === priorityFilter
        const matchesStatus = statusFilter === 'All Status' || l.status === statusFilter
        return matchesSearch && matchesRole && matchesPriority && matchesStatus
    })

    const handleDownloadReport = () => {
        if (filteredLeaves.length === 0) return;
        
        const headers = ['Employee', 'Role', 'Level', 'Priority', 'Project', 'Type', 'Dates', 'Days', 'Status', 'Reason'];
        const csvRows = filteredLeaves.map(l => [
            l.emp, l.role, l.level, l.priority, l.project, l.type, formatDateRange(l.from_date, l.to_date), l.no_of_days, l.status, l.reason
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const d = new Date();
        const dateStr = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
        
        link.setAttribute("href", url);
        link.setAttribute("download", `leave_management_${dateStr}.csv`);
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const roles = ['All Roles', ...Array.from(new Set(leaves.map(l => l.role)))]
    const priorities = ['All Priorities', 'High', 'Med', 'Low']
    const statuses = ['All Status', 'Pending', 'Accepted', 'Rejected']

    if (loading) {
        return <div className="p-10 text-gray-500">Loading leave requests...</div>
    }

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Leave Management</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Manage employee leave requests</p>
                </div>
                <div className="flex items-center gap-3">
                    {[
                        { icon: '📋', label: 'Pending', value: pending, bg: '#EDE9FE', color: '#5B5FC7' },
                        { icon: '✓', label: 'Approved', value: approved, bg: '#DCFCE7', color: '#16A34A' },
                        { icon: '⚠', label: 'High Priority', value: highPriority, bg: '#FEE2E2', color: '#DC2626' },
                    ].map(s => (
                        <div key={s.label} className="crm-card flex items-center gap-2 px-4 py-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                                style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                            <div>
                                <div className="text-xs" style={{ color: '#9CA3AF' }}>{s.label}</div>
                                <div className="text-sm font-bold" style={{ color: '#111827' }}>{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-1"
                    style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input type="text" placeholder="Search employee or project ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-transparent outline-none text-sm flex-1" style={{ color: '#374151' }} />
                </div>
                <div className="flex gap-2">
                    {[
                        { value: roleFilter, setter: setRoleFilter, options: roles },
                        { value: priorityFilter, setter: setPriorityFilter, options: priorities },
                        { value: statusFilter, setter: setStatusFilter, options: statuses }
                    ].map((filter, i) => (
                        <div key={i} className="relative">
                            <select
                                value={filter.value}
                                onChange={e => filter.setter(e.target.value)}
                                className="crm-card flex items-center gap-1 pl-3 pr-7 py-2.5 text-xs cursor-pointer appearance-none outline-none bg-white border-0"
                                style={{ color: '#374151' }}
                            >
                                {filter.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#374151' }}>
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={handleDownloadReport}
                    disabled={filteredLeaves.length === 0}
                    className="crm-card flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-3 bg-white" 
                    style={{ color: '#6B7280' }}
                >
                    <Download size={14} /> Download report
                </button>
            </div>

            {/* Table */}
            <div className="crm-table-wrap">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                            {['Employee', 'Role', 'Level', 'Priority', 'Project', 'Type', 'Dates', 'Days', 'Status', 'Reason', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#374151' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaves.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>
                                    <div className="flex flex-col items-center gap-2">
                                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                        </svg>
                                        <span>No leave requests found</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredLeaves.map((l, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                                            style={{ background: '#F3F4F6', color: '#374151' }}>{l.emp?.[0] || '?'}</div>
                                        <div>
                                            <div className="text-xs font-medium" style={{ color: '#111827' }}>{l.emp}</div>
                                            <div className="text-xs" style={{ color: '#9CA3AF' }}>{l.role}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px',
                                        fontSize: '12px', fontWeight: 500, background: '#F3F4F6', color: '#374151',
                                        border: '1px solid #E5E7EB'
                                    }}>{l.role || '—'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px',
                                        fontSize: '12px', fontWeight: 500,
                                        background: levelColors[l.level]?.bg || '#F3F4F6', color: levelColors[l.level]?.color || '#6B7280'
                                    }}>{l.level || '—'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px',
                                        fontSize: '12px', fontWeight: 500,
                                        background: priorityColors[l.priority]?.bg || '#F3F4F6', color: priorityColors[l.priority]?.color || '#6B7280'
                                    }}>{l.priority || '—'}</span>
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: '#5B5FC7' }}>{l.project || '—'}</td>
                                <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{l.type}</td>
                                <td className="px-4 py-3 text-xs" style={{ color: '#374151' }}>{formatDateRange(l.from_date, l.to_date)}</td>
                                <td className="px-4 py-3 text-xs font-medium" style={{ color: '#111827' }}>{l.no_of_days}</td>
                                <td className="px-4 py-3">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px',
                                        fontSize: '12px', fontWeight: 500,
                                        background: statusColors[l.status]?.bg || '#F3F4F6', color: statusColors[l.status]?.color || '#6B7280'
                                    }}>{l.status}</span>
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: '#6B7280', maxWidth: '150px' }}>
                                    <span className="truncate block">{l.reason || '—'}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2" style={{ color: '#9CA3AF' }}>
                                        {l.status === 'Pending' && <>
                                            <button onClick={() => handleAccept(l.id)} style={{ color: '#22c55e' }}><Check size={14} /></button>
                                            <button onClick={() => handleReject(l.id)} style={{ color: '#ef4444' }}><X size={14} /></button>
                                        </>}
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
