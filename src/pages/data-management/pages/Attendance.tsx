import { Calendar as CalendarIcon, Clock, LogIn, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useEmployeeId } from '../../../hooks/useEmployeeId'

export default function Attendance() {
    const employeeId = useEmployeeId()
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [stats, setStats] = useState({ totalDays: 0, present: 0, absent: 0, percentage: 0 })
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    
    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

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
            // alert('Punched In successfully')
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
            // alert('Punched Out successfully')
            fetchAttendance()
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to Punch Out')
        } finally {
            setActionLoading(false)
        }
    }

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '--'
        try {
            const date = new Date(timeStr)
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase()
            }
            return timeStr
        } catch {
            return timeStr
        }
    }

    const todayStr = new Date().toLocaleDateString('en-CA')
    const todayRecord = attendanceData.find(record => {
        if (!record.date) return false
        const localDateStr = new Date(record.date).toLocaleDateString('en-CA')
        return localDateStr === todayStr
    })
    
    const hasPunchedInToday = !!todayRecord?.check_in
    const hasPunchedOutToday = !!todayRecord?.check_out

    // Computed Stats
    const computedStats = useMemo(() => {
        let totalHours = 0
        let lateArrivals = 0
        const cutoffTime = 10 * 60 // 10:00 AM

        attendanceData.forEach(record => {
            if (record.check_in && record.check_out) {
                const inDate = new Date(record.check_in)
                const outDate = new Date(record.check_out)
                const diffHrs = (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60)
                totalHours += diffHrs
            }
            if (record.check_in) {
                const inDate = new Date(record.check_in)
                const mins = inDate.getHours() * 60 + inDate.getMinutes()
                if (mins > cutoffTime) lateArrivals++
            }
        })
        
        return {
            totalHours: totalHours.toFixed(1),
            lateArrivals
        }
    }, [attendanceData])

    // Today's Hours Calculation
    let todayHours = '0.00 hrs'
    if (todayRecord?.check_in && todayRecord?.check_out) {
        const inDate = new Date(todayRecord.check_in)
        const outDate = new Date(todayRecord.check_out)
        const diffHrs = (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60)
        todayHours = `${diffHrs.toFixed(2)} hrs`
    } else if (todayRecord?.check_in) {
        todayHours = '-- hrs'
    }

    // Calendar Data Generation
    const getDaysInMonth = (month: number, year: number) => {
        const date = new Date(year, month, 1)
        const days = []
        
        // Add empty cells for starting day of week
        for (let i = 0; i < date.getDay(); i++) {
            days.push(null)
        }
        
        while (date.getMonth() === month) {
            days.push(new Date(date))
            date.setDate(date.getDate() + 1)
        }
        
        return days
    }

    const calendarDays = useMemo(() => getDaysInMonth(currentMonth, currentYear), [currentMonth, currentYear])
    
    const getDayRecord = (date: Date) => {
        const dStr = date.toLocaleDateString('en-CA')
        return attendanceData.find(record => {
            if (!record.date) return false
            return new Date(record.date).toLocaleDateString('en-CA') === dStr
        })
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

    return (
        <div className="max-w-[1200px] w-full animate-in fade-in zoom-in-95 duration-300 mx-auto bg-[#fafafa] min-h-screen p-6 -m-6">
            <div className="mb-6">
                <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Attendance</h1>
                <p className="text-[15px] text-gray-500 font-medium mt-1">Track your daily attendance and work hours.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Today's Status */}
                <div className="bg-white rounded-[16px] p-6 lg:p-8 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <Clock className="text-gray-800" size={20} strokeWidth={2.5} />
                        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Today's Status</h2>
                    </div>
                    
                    <div className="space-y-6 text-[14px]">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <span className="text-gray-500 font-medium">Status</span>
                            <span className="bg-[#e6f7ef] text-[#10b981] px-3 py-1 rounded-md text-[11px] font-extrabold tracking-widest uppercase">
                                {hasPunchedInToday ? 'Present' : '---'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                <LogIn size={15} className="text-gray-400" /> Punch-in
                            </span>
                            <span className="font-bold text-gray-900">
                                {todayRecord?.check_in ? formatTime(todayRecord.check_in) : '--'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                <LogOut size={15} className="text-gray-400" /> Punch-out
                            </span>
                            <span className="font-bold text-gray-900">
                                {todayRecord?.check_out ? formatTime(todayRecord.check_out) : '--'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium flex items-center gap-2">
                                <Clock size={15} className="text-gray-400" /> Hours
                            </span>
                            <span className="font-bold text-gray-900">{todayHours}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-[16px] p-6 lg:p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-[17px] font-bold text-gray-900 tracking-tight mb-2">Quick Actions</h2>
                    <p className="text-[13.5px] text-gray-500 font-medium mb-8">Mark your attendance for today</p>
                    
                    <div className="space-y-4">
                        <button 
                            onClick={handleClockIn}
                            disabled={actionLoading || hasPunchedInToday}
                            className={`w-full py-3.5 rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold transition-all ${
                                hasPunchedInToday 
                                    ? 'bg-[#c4b5fd] text-white cursor-not-allowed border border-[#c4b5fd]'
                                    : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-sm hover:shadow border border-[#a855f7]'
                            }`}
                        >
                            <LogIn size={18} />
                            {hasPunchedInToday ? 'Already Punched In' : 'Punch In'}
                        </button>
                        
                        <button 
                            onClick={handleClockOut}
                            disabled={actionLoading || !hasPunchedInToday || hasPunchedOutToday}
                            className={`w-full py-3.5 rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold transition-all border ${
                                !hasPunchedInToday || hasPunchedOutToday
                                    ? 'bg-[#fafafa] text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
                            }`}
                        >
                            <LogOut size={18} />
                            {hasPunchedOutToday ? 'Punched Out' : 'Punch Out'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[
                    { label: 'Days Present', value: stats.present, color: 'text-[#10b981]' },
                    { label: 'Days Absent', value: stats.absent, color: 'text-[#ef4444]' },
                    { label: 'Late Arrivals', value: computedStats.lateArrivals, color: 'text-[#f97316]' },
                    { label: 'Total Hours', value: computedStats.totalHours, color: 'text-[#3b82f6]' }
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-[16px] p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className={`text-[28px] font-bold mb-2 ${stat.color}`}>
                            {stat.value}
                        </div>
                        <div className="text-[12px] text-gray-500 font-semibold tracking-wide">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Monthly View Calendar */}
            <div className="bg-white rounded-[16px] p-6 lg:p-8 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="text-gray-800" size={20} strokeWidth={2.5} />
                        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">Monthly View</h2>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select 
                                value={currentMonth} 
                                onChange={e => setCurrentMonth(Number(e.target.value))}
                                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-[13px] font-semibold text-gray-700 outline-none hover:border-gray-300 focus:border-[#a855f7] cursor-pointer shadow-sm transition-colors"
                            >
                                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                value={currentYear} 
                                onChange={e => setCurrentYear(Number(e.target.value))}
                                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-[13px] font-semibold text-gray-700 outline-none hover:border-gray-300 focus:border-[#a855f7] cursor-pointer shadow-sm transition-colors"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-[12px] font-semibold text-gray-500 pb-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        {calendarDays.map((date, index) => {
                            if (!date) return <div key={`empty-${index}`} className="bg-white min-h-[90px]" />
                            
                            const isToday = date.toDateString() === new Date().toDateString()
                            const record = getDayRecord(date)
                            let badge = null
                            
                            if (record) {
                                const status = record.status?.toLowerCase() || 'present'
                                if (status === 'present') {
                                    badge = <div className="mt-2 text-[9px] font-bold bg-[#e6f7ef] text-[#10b981] px-2 py-0.5 rounded border border-[#10b981]/20 uppercase tracking-widest inline-block">Present</div>
                                } else if (status === 'absent') {
                                    badge = <div className="mt-2 text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 uppercase tracking-widest inline-block">Absent</div>
                                }
                            } else if (date < new Date() && date.getDay() !== 0) {
                                badge = <div className="mt-2 text-[9px] font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-widest inline-block">--</div>
                            }
                            
                            return (
                                <div key={date.toISOString()} className="bg-white min-h-[90px] p-2.5 lg:p-3.5 transition-colors hover:bg-gray-50">
                                    <div className={`text-[13px] font-bold w-6 h-6 flex items-center justify-center rounded-md ${
                                        isToday ? 'bg-[#f3e8ff] text-[#9333ea]' : 'text-gray-700'
                                    }`}>
                                        {date.getDate()}
                                    </div>
                                    {badge}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

