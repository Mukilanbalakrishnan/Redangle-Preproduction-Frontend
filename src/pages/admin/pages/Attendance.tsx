import { Search, Filter, Users, UserCheck, UserX } from 'lucide-react'

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Attendance() {
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('All Roles')
    const [statusFilter, setStatusFilter] = useState('All Status')

    useEffect(() => {
        fetchAttendance()
    }, [])

    const fetchAttendance = async () => {
        setLoading(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const res = await axios.get(`${API_URL}/crm/attendance`)
            if (res.data?.success) {
                setAttendanceData(res.data.data || [])
            }
        } catch (err) {
            console.error("Failed to fetch aggregate attendance:", err)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '--'
        try {
            const [hours, minutes] = timeStr.split(':')
            const date = new Date()
            date.setHours(parseInt(hours, 10))
            date.setMinutes(parseInt(minutes, 10))
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        } catch {
            return timeStr
        }
    }

    const filteredData = attendanceData.filter(record => {
        const matchesSearch = record.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === 'All Roles' || record.role === roleFilter
        const matchesStatus = statusFilter === 'All Status' || record.status === statusFilter
        return matchesSearch && matchesRole && matchesStatus
    })

    const roles = ['All Roles', ...Array.from(new Set(attendanceData.map(r => r.role).filter(Boolean)))]
    const statuses = ['All Status', ...Array.from(new Set(attendanceData.map(r => r.status).filter(Boolean)))]

    const totalEmployees = attendanceData.length
    const presentToday = attendanceData.filter(r => r.status?.toLowerCase() === 'present').length
    const absentToday = attendanceData.filter(r => r.status?.toLowerCase() === 'absent').length

    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'present': return 'bg-green-100 text-green-700'
            case 'absent': return 'bg-red-100 text-red-700'
            case 'late': return 'bg-orange-100 text-orange-600'
            case 'leave': return 'bg-sky-100 text-sky-600'
            default: return 'bg-gray-100 text-gray-700'
        }
    }
    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in zoom-in-95 duration-300">
            <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1 font-sans">Overall Attendance</h1>
                <p className="text-[13px] text-gray-500 font-medium">CRM Attendance</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[13px] font-bold text-gray-700 mb-3 block font-sans">Total Employees</p>
                        <h3 className="text-3xl font-black text-gray-900">{totalEmployees}</h3>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        <Users size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[13px] font-bold text-gray-700 mb-3 block font-sans">Present Today</p>
                        <h3 className="text-3xl font-black text-gray-900">{presentToday}</h3>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl text-gray-600 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                        <UserCheck size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[13px] font-bold text-gray-700 mb-3 block font-sans">Absent Today</p>
                        <h3 className="text-3xl font-black text-gray-900">{absentToday}</h3>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl text-gray-600 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
                        <UserX size={20} />
                    </div>
                </div>
            </div>

            {/* Attendance Table Box */}
            <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm">

                {/* Table Header/Toolbar */}
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-[15px] font-bold text-gray-900 font-sans">Employee Attendance</h2>
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-[260px] pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium text-gray-700 shadow-sm"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm outline-none"
                            >
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none flex items-center gap-2 pl-4 pr-10 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm outline-none"
                            >
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100/50">
                                <th className="px-8 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Employee Name</th>
                                <th className="px-8 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Role</th>
                                <th className="px-8 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Login Time</th>
                                <th className="px-8 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Logout Time</th>
                                <th className="px-8 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center text-gray-500 font-medium tracking-wide">
                                        Loading attendance data...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center text-gray-500 font-medium tracking-wide">
                                        No attendance records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((record, index) => (
                                    <tr key={index} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6 text-[13px] font-bold text-gray-800">{record.name}</td>
                                        <td className="px-8 py-6 text-[13px] font-medium text-gray-600">{record.role || '—'}</td>
                                        <td className="px-8 py-6 text-[13px] font-bold text-gray-900">{formatTime(record.login)}</td>
                                        <td className="px-8 py-6 text-[13px] font-bold text-gray-900">{formatTime(record.logout)}</td>
                                        <td className="px-8 py-6">
                                            <span className={`px-5 py-1.5 rounded-lg text-[11px] font-bold text-center inline-block min-w-[70px] ${getStatusStyle(record.status)}`}>
                                                {record.status || 'Present'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    )
}
