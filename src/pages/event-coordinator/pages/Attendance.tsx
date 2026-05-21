import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import axios from 'axios'
import Badge from '../../crm/components/ui/Badge'

type Attendee = {
    id: string
    name: string
    role: string
    login: string | null
    logout: string | null
    status: string
    date: string
}

const today = new Date().toISOString().split('T')[0]

const statConfigs = [
    { label: 'Present', dot: '#22c55e', dotBg: '#dcfce7' },
    { label: 'Absent', dot: '#ef4444', dotBg: '#fee2e2' },
    { label: 'Late', dot: '#eab308', dotBg: '#fef9c3' },
    { label: 'Half-day', dot: '#3b82f6', dotBg: '#dbeafe' },
]

const formatTime = (t: string | null) => {
    if (!t) return '—'
    try {
        const d = new Date(t)
        if (isNaN(d.getTime())) return t
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
        return t
    }
}

export default function Attendance() {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterDate, setFilterDate] = useState('')
    const [attendees, setAttendees] = useState<Attendee[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true)
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
                const endpoint = filterDate
                    ? `${API_URL}/crm/attendance?date=${filterDate}`
                    : `${API_URL}/crm/attendance`

                const res = await axios.get(endpoint)
                if (res.data?.success) {
                    const formatted = res.data.data.map((a: any) => ({
                        id: a.employee_id || a.attendance_id?.toString() || '',
                        name: a.name || 'Unknown',
                        role: a.role || 'Employee',
                        login: a.login,
                        logout: a.logout,
                        status: a.status || 'Unknown',
                        date: filterDate || today
                    }))
                    setAttendees(formatted)
                }
            } catch (err) {
                console.error("Error fetching attendance:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchAttendance()
    }, [filterDate])

    const filteredAttendees = attendees.filter(a => {
        const matchesSearch =
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.role.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch

    })

    const counts: Record<string, number> = { Present: 0, Absent: 0, Late: 0, 'Half-day': 0 }
    attendees.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })

    if (loading) {
        return <div className="p-10 text-gray-500">Loading attendance data...</div>
    }

    const handleDownloadReport = () => {
        const headers = ['Employee ID', 'Employment Name', 'Role', 'Date', 'Login Time', 'Logout Time', 'Status']
        const csvRows = filteredAttendees.map(a =>
            [a.id, a.name, a.role, a.date, a.login, a.logout, a.status].join(',')
        )
        const csvContent = [headers.join(','), ...csvRows].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `attendance_report_${filterDate || today}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Employee Attendance</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Track daily attendance of all employees</p>
                </div>
                <button onClick={handleDownloadReport} className="crm-card flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50 bg-white" style={{ color: '#6B7280' }}>
                    <Download size={14} /> Download report
                </button>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-4 gap-4 mb-5">
                {statConfigs.map(s => (
                    <div key={s.label} className="crm-card flex items-center justify-between p-4">
                        <div>
                            <div className="text-xs font-medium mb-1" style={{ color: '#6B7280' }}>{s.label}</div>
                            <div className="text-2xl font-bold" style={{ color: '#111827' }}>{counts[s.label] ?? 0}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.dotBg }}>
                            <div className="w-3 h-3 rounded-full" style={{ background: s.dot }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Date filter */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-1"
                    style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input type="text" placeholder="Search by employee name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent outline-none text-sm flex-1" style={{ color: '#374151' }} />
                </div>
                <div className="crm-card flex items-center gap-2 px-4 py-2.5 text-sm bg-white" style={{ minWidth: '160px', color: '#6B7280' }}>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent outline-none flex-1 text-sm text-gray-700 font-medium"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="crm-table-wrap">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                            {['Employee ID', 'Employment name', 'Role', 'Login time', 'Logout time', 'Status'].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#5B5FC7' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAttendees.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>
                                    <div className="flex flex-col items-center gap-2">
                                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                        </svg>
                                        <span>No attendance records found for this date/search</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredAttendees.map((a, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                                <td className="px-5 py-3 text-sm font-medium" style={{ color: '#5B5FC7' }}>{a.id}</td>
                                <td className="px-5 py-3 text-sm font-medium" style={{ color: '#111827' }}>{a.name}</td>
                                <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{a.role || '—'}</td>
                                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{formatTime(a.login)}</td>
                                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{formatTime(a.logout)}</td>
                                <td className="px-5 py-3"><Badge status={a.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
