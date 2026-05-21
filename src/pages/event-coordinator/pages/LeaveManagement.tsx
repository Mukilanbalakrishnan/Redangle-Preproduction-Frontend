import { Check, X, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

type Leave = {
    id: number
    emp: string
    role: string
    type: string
    dates: string
    status: string
}

const statusColors: Record<string, { bg: string; color: string }> = {
    Pending: { bg: '#FEF9C3', color: '#CA8A04' },
    Accepted: { bg: '#D1FAE5', color: '#059669' },
    Approved: { bg: '#D1FAE5', color: '#059669' },
    Rejected: { bg: '#FEE2E2', color: '#DC2626' },
}

export default function LeaveManagement() {
    const [leaves, setLeaves] = useState<Leave[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('All Roles')
    const [statusFilter, setStatusFilter] = useState('All Status')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchLeaves()
    }, [])

    const fetchLeaves = async () => {
        setLoading(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const res = await axios.get(`${API_URL}/leave?role=event-coordinator`)
            if (res.data?.success) {
                const fetched = res.data.data.map((l: any) => ({
                    id: l.leave_request_id,
                    emp: l.employee_name || l.employee_id,
                    role: l.role || 'Employee',
                    type: l.leave_type,
                    dates: `${new Date(l.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(l.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                    status: l.status
                }))
                setLeaves(fetched)
            }
        } catch (err) {
            console.error("Fetch error:", err)
        } finally {
            setLoading(false)
        }
    }

    const pending = leaves.filter(l => l.status === 'Pending').length
    const approved = leaves.filter(l => l.status === 'Accepted' || l.status === 'Approved').length

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            await axios.put(`${API_URL}/leave/${id}/status`, { status: newStatus })
            alert(`Request ${newStatus} successfully`)
            fetchLeaves()
        } catch (err) {
            console.error("Update error:", err)
            alert("Failed to update status")
        }
    }

    const filteredLeaves = leaves.filter(l => {
        const matchesSearch = l.emp.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === 'All Roles' || l.role === roleFilter
        const matchesStatus = statusFilter === 'All Status' || l.status === statusFilter
        return matchesSearch && matchesRole && matchesStatus
    })

    const handleDownloadReport = () => {
        if (filteredLeaves.length === 0) return;
        
        const headers = ['Employee', 'Role', 'Type', 'Dates', 'Status'];
        const csvRows = filteredLeaves.map(l => [
            l.emp, l.role, l.type, l.dates, l.status
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
    const statuses = ['All Status', 'Pending', 'Accepted', 'Rejected', 'Approved']

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
                    ].map(s => (
                        <div key={s.label} className="crm-card flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
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
                    <input type="text" placeholder="Search employee..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-transparent outline-none text-sm flex-1" style={{ color: '#374151' }} />
                </div>
                <div className="flex gap-2">
                    {[
                        { value: roleFilter, setter: setRoleFilter, options: roles },
                        { value: statusFilter, setter: setStatusFilter, options: statuses }
                    ].map((filter, i) => (
                        <div key={i} className="relative">
                            <select
                                value={filter.value}
                                onChange={e => filter.setter(e.target.value)}
                                className="flex items-center gap-1 pl-3 pr-7 py-2.5 text-xs cursor-pointer appearance-none outline-none border border-gray-200 bg-white rounded-xl"
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
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                            {['Employee', 'Role', 'Leave Type', 'Dates', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-4 text-xs font-semibold" style={{ color: '#374151' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center px-5 py-12 text-sm text-gray-500">Loading requests...</td>
                            </tr>
                        ) : filteredLeaves.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>
                                    <div className="flex flex-col items-center gap-2">
                                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                        </svg>
                                        <span>No leave requests found</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredLeaves.map((l, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ background: '#F3F4F6', color: '#374151' }}>{l.emp[0].toUpperCase()}</div>
                                        <div>
                                            <div className="text-[13px] font-bold" style={{ color: '#111827' }}>{l.emp}</div>
                                            <div className="text-xs font-medium text-gray-500">{l.role}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: '9999px',
                                        fontSize: '11px', fontWeight: 600, background: '#F3F4F6', color: '#374151',
                                        border: '1px solid #E5E7EB'
                                    }}>{l.role}</span>
                                </td>
                                <td className="px-4 py-4 text-sm font-semibold" style={{ color: '#374151' }}>{l.type}</td>
                                <td className="px-4 py-4 text-sm font-semibold" style={{ color: '#374151' }}>{l.dates}</td>
                                <td className="px-4 py-4">
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: '9999px',
                                        fontSize: '11px', fontWeight: 700,
                                        background: statusColors[l.status]?.bg || '#F3F4F6', color: statusColors[l.status]?.color || '#374151'
                                    }}>{l.status}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        {l.status === 'Pending' && <>
                                            <button onClick={() => handleUpdateStatus(l.id, 'Approved')} className="p-1.5 rounded-lg border border-green-200 hover:bg-green-50 text-green-600 transition-colors" title="Approve">
                                                <Check size={16} strokeWidth={2.5} />
                                            </button>
                                            <button onClick={() => handleUpdateStatus(l.id, 'Rejected')} className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition-colors" title="Reject">
                                                <X size={16} strokeWidth={2.5} />
                                            </button>
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
