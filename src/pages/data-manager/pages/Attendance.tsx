import { Calendar, Users, LogIn, LogOut, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useEmployeeId } from '../../../hooks/useEmployeeId'

export default function Attendance() {
    const employeeId = useEmployeeId()
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [stats, setStats] = useState({ totalDays: 0, present: 0, absent: 0, percentage: 0 })
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (employeeId) fetchAttendance()
    }, [employeeId])

    const fetchAttendance = async () => {
        setLoading(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const res = await axios.get(`${API_URL}/employee/${employeeId}/attendance`)
            if (res.data?.success) {
                setAttendanceData(res.data.data.records || [])
                setStats(res.data.data.stats || { totalDays: 0, present: 0, absent: 0, percentage: 0 })
            }
        } catch (err) {
            console.error("Failed to fetch attendance:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleClockIn = async () => {
        setActionLoading(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            await axios.post(`${API_URL}/employee/${employeeId}/punch-in`)
            alert('Punched In successfully')
            fetchAttendance()
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to Punch In')
        } finally {
            setActionLoading(false)
        }
    }

    const handleClockOut = async () => {
        setActionLoading(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            await axios.post(`${API_URL}/employee/${employeeId}/punch-out`)
            alert('Punched Out successfully')
            fetchAttendance()
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to Punch Out')
        } finally {
            setActionLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        } catch {
            return dateStr
        }
    }

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '--'
        try {
            if (timeStr.includes('-') || timeStr.includes('/') || timeStr.includes('T')) {
                const date = new Date(timeStr)
                if (!isNaN(date.getTime())) {
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                }
            }
            const [hours, minutes] = timeStr.split(':')
            const date = new Date()
            date.setHours(parseInt(hours, 10))
            date.setMinutes(parseInt(minutes, 10))
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        } catch {
            return timeStr
        }
    }

    const todayStr = new Date().toLocaleDateString('en-CA')
    const todayRecord = attendanceData.find(record => {
        if (!record.date) return false
        const rDateStr = record.date.includes('T') ? record.date.split('T')[0] : record.date
        return rDateStr === todayStr
    })
    const hasPunchedInToday = !!todayRecord?.check_in
    const hasPunchedOutToday = !!todayRecord?.check_out

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">My Attendance</h1>
                    <p className="text-sm text-gray-500 font-medium">Track your attendance and work hours</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleClockIn}
                        disabled={actionLoading || hasPunchedInToday}
                        className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <LogIn size={18} />
                        Punch In
                    </button>
                    <button
                        onClick={handleClockOut}
                        disabled={actionLoading || !hasPunchedInToday || hasPunchedOutToday}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <LogOut size={18} />
                        Punch Out
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-wide text-gray-500 mb-2">Total Working Days</p>
                        <h3 className="text-2xl font-bold text-green-500">{stats.totalDays}</h3>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-500 shrink-0">
                        <Users size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-wide text-gray-500 mb-2">Present</p>
                        <h3 className="text-2xl font-bold text-blue-500">{stats.present}</h3>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                        <Clock size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-wide text-gray-500 mb-2">Absent</p>
                        <h3 className="text-2xl font-bold text-orange-400">{stats.absent}</h3>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                        <Users size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-wide text-gray-500 mb-2">Attendance %</p>
                        <h3 className="text-2xl font-bold text-purple-500">{stats.percentage}%</h3>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
                        <Users size={20} />
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Attendance History</h2>
                    <div className="bg-purple-100/50 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-3 cursor-pointer">
                        dd-mm-yyyy <Calendar size={16} className="text-gray-500" />
                    </div>
                </div>
                <div className="p-4">
                    <table className="w-full">
                        <thead>
                            <tr className="text-center border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-indigo-600">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-indigo-600">Login time</th>
                                <th className="px-6 py-4 text-xs font-bold text-indigo-600">Logout time</th>
                                <th className="px-6 py-4 text-xs font-bold text-indigo-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="py-8 text-center text-gray-500">Loading attendance...</td></tr>
                            ) : attendanceData.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-gray-500">No attendance records found. Clock in to get started!</td></tr>
                            ) : (
                                attendanceData.map((record) => (
                                    <tr key={record.id || record.date} className="text-center hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-5 text-sm font-semibold text-gray-600 flex items-center justify-center gap-2">
                                            <Calendar size={16} className="text-pink-400" /> {formatDate(record.date)}
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-gray-700">
                                            <div className="flex items-center justify-center gap-2">
                                                <LogIn size={16} className={record.check_in ? 'text-green-500' : 'text-gray-400'} />
                                                {formatTime(record.check_in)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-bold text-gray-700">
                                            <div className="flex items-center justify-center gap-2">
                                                <LogOut size={16} className={record.check_out ? 'text-red-500' : 'text-gray-400'} />
                                                {formatTime(record.check_out)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-5 py-1.5 rounded-full text-xs font-semibold ${record.status?.toLowerCase() === 'absent' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                }`}>
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
