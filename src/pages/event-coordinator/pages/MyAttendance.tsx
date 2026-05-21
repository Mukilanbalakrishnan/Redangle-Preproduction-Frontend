import { useState, useEffect } from 'react'
import { Calendar, LogIn, LogOut, Clock, ChevronDown, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useEmployeeId } from '../../../hooks/useEmployeeId'

interface LeaveRecord {
    leave_request_id: number
    leave_type: string
    from_date: string
    to_date: string
    no_of_days: number
    status: string
    reason: string
    created_at: string
}

const getStatusStyle = (s: string) => {
    switch (s?.toLowerCase()) {
        case 'present': case 'approved': return { background: '#E8F5E9', color: '#2E7D32' }
        case 'absent': case 'rejected': return { background: '#FCE4EC', color: '#C2185B' }
        case 'late': case 'pending': return { background: '#FFF3E0', color: '#E65100' }
        default: return { background: '#F3F4F6', color: '#6B7280' }
    }
}

const formatDate = (d: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) } catch { return d }
}

const formatTime = (t: string) => {
    if (!t) return '--'
    try {
        const d = new Date(t)
        if (isNaN(d.getTime())) return t
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
        return t
    }
}

export default function MyAttendance() {
    const employeeId = useEmployeeId()
    const [today, setToday] = useState({ check_in: null as string | null, check_out: null as string | null })
    const [punching, setPunching] = useState(false)
    const [leaves, setLeaves] = useState<LeaveRecord[]>([])
    const [submittingLeave, setSubmittingLeave] = useState(false)
    const [leaveForm, setLeaveForm] = useState({ leaveType: '', startDate: '', endDate: '', reason: '' })

    const fetchTodayAttendance = async () => {
        if (!employeeId || String(employeeId).includes('NaN')) return
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const res = await axios.get(`${API_URL}/employee/${employeeId}/attendance/today`)
            if (res.data?.success && res.data.data) {
                setToday({ check_in: res.data.data.check_in, check_out: res.data.data.check_out })
            }
        } catch (err) {
            console.error("Failed to fetch today's attendance:", err)
        }
    }

    const fetchLeaves = async () => {
        if (!employeeId || String(employeeId).includes('NaN')) return
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const res = await axios.get(`${API_URL}/employee/${employeeId}/leave-requests`)
            if (res.data?.success) {
                setLeaves(res.data.data || [])
            }
        } catch (err) {
            console.error("Failed to fetch leaves:", err)
        }
    }

    useEffect(() => {
        if (employeeId && !String(employeeId).includes('NaN')) {
            fetchTodayAttendance()
            fetchLeaves()
        }
    }, [employeeId])

    const handlePunchIn = async () => {
        if (!employeeId || String(employeeId).includes('NaN')) return;
        setPunching(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            await axios.post(`${API_URL}/employee/${employeeId}/punch-in`)
            toast.success('Punched in successfully!')
            fetchTodayAttendance()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to punch in')
        } finally {
            setPunching(false)
        }
    }

    const handlePunchOut = async () => {
        if (!employeeId || String(employeeId).includes('NaN')) return;
        setPunching(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            await axios.post(`${API_URL}/employee/${employeeId}/punch-out`)
            toast.success('Punched out successfully!')
            fetchTodayAttendance()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to punch out')
        } finally {
            setPunching(false)
        }
    }

    const handleLeaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeId || String(employeeId).includes('NaN')) return;
        if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate) {
            toast.error('Please fill all required fields')
            return
        }
        setSubmittingLeave(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            await axios.post(`${API_URL}/employee/${employeeId}/leave-requests`, {
                leaveType: leaveForm.leaveType,
                fromDate: leaveForm.startDate,
                toDate: leaveForm.endDate,
                reason: leaveForm.reason
            })
            toast.success('Leave request submitted successfully!')
            setLeaveForm({ leaveType: '', startDate: '', endDate: '', reason: '' })
            fetchLeaves()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit leave request')
        } finally {
            setSubmittingLeave(false)
        }
    }

    const canPunchIn = !today.check_in
    const canPunchOut = !!today.check_in && !today.check_out
    const doneForDay = !!today.check_in && !!today.check_out

    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1 font-sans">My Attendance</h1>
                <p className="text-[13px] text-gray-500 font-medium">Punch in/out and request leaves from your personal portal</p>
            </div>

            {/* Top Row: Punch In/Out */}
            <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                            background: doneForDay ? '#E8F5E9' : canPunchOut ? '#FFF3E0' : '#F5F3FF',
                            color: doneForDay ? '#2E7D32' : canPunchOut ? '#E65100' : '#5B5FC7'
                        }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">
                            {doneForDay ? 'Work day completed' : canPunchOut ? 'Currently working' : 'Ready to start your day'}
                        </p>
                        <p className="text-[13px] text-gray-500 mt-1 font-medium">{currentDate} • {currentTime}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    {today.check_in && (
                        <div className="flex items-center gap-5 mr-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Punch In</p>
                                <p className="text-[13px] font-bold text-green-700">{formatTime(today.check_in)}</p>
                            </div>
                            {today.check_out && (
                                <div className="text-center border-l border-gray-200 pl-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Punch Out</p>
                                    <p className="text-[13px] font-bold text-rose-700">{formatTime(today.check_out)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {canPunchIn && (
                        <button
                            onClick={handlePunchIn}
                            disabled={punching}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                            style={{ background: '#5B5FC7', color: '#fff' }}
                        >
                            <LogIn size={18} /> {punching ? 'Punching...' : 'Punch In Now'}
                        </button>
                    )}
                    {canPunchOut && (
                        <button
                            onClick={handlePunchOut}
                            disabled={punching}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                            style={{ background: '#C2185B', color: '#fff' }}
                        >
                            <LogOut size={18} /> {punching ? 'Punching...' : 'Punch Out'}
                        </button>
                    )}
                    {doneForDay && (
                        <div className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                            ✓ Shift Completed
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Leave Application section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                {/* Leave Form */}
                <div className="lg:col-span-3 bg-white rounded-[24px] border border-gray-200 shadow-sm p-6">
                    <p className="text-[15px] font-bold flex items-center gap-2 mb-6" style={{ color: '#111827' }}>
                        <Calendar size={18} className="text-gray-400" /> Leave Application
                    </p>
                    <form className="space-y-5" onSubmit={handleLeaveSubmit}>
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Leave Type</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] appearance-none font-medium outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                                    style={{ color: leaveForm.leaveType ? '#111827' : '#9CA3AF' }}
                                    value={leaveForm.leaveType}
                                    onChange={e => setLeaveForm(p => ({ ...p, leaveType: e.target.value }))}
                                >
                                    <option value="" disabled>Select leave type</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="casual">Casual Leave</option>
                                    <option value="vacation">Vacation</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">Start Date</label>
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-200 transition-all">
                                    <Calendar size={16} className="ml-4 shrink-0 text-gray-400" />
                                    <input type="date" className="w-full px-3 py-3 bg-transparent outline-none text-[13px] font-medium text-gray-900"
                                        value={leaveForm.startDate} onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-700">End Date</label>
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-200 transition-all">
                                    <Calendar size={16} className="ml-4 shrink-0 text-gray-400" />
                                    <input type="date" className="w-full px-3 py-3 bg-transparent outline-none text-[13px] font-medium text-gray-900"
                                        value={leaveForm.endDate} onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-gray-700">Reason</label>
                            <textarea rows={4} placeholder="Briefly describe your reason for leave"
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-[13px] resize-none font-medium outline-none focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                                value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}></textarea>
                        </div>
                        <button type="submit" disabled={submittingLeave}
                            className="w-full py-3.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50 hover:opacity-90 shadow-sm"
                            style={{ background: '#5B5FC7', color: '#fff' }}>
                            {submittingLeave ? 'Submitting...' : 'Apply Leave'}
                        </button>
                    </form>
                </div>

                {/* Leave Status / History */}
                <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col h-full min-h-[400px]">
                    <p className="text-[15px] font-bold flex items-center gap-2 mb-6" style={{ color: '#111827' }}>
                        <Clock size={18} className="text-gray-400" /> Recent Leave Requests
                    </p>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                        {leaves.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 text-center">
                                <div className="bg-gray-50 p-4 rounded-full mb-3"><Calendar size={24} className="opacity-50" /></div>
                                <p className="text-[13px] font-medium">No leave requests found</p>
                            </div>
                        ) : (
                            leaves.map((leave) => (
                                <div key={leave.leave_request_id} className="p-4 rounded-[16px] bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-[13px] font-bold capitalize text-gray-900">{leave.leave_type} Leave</p>
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wide">
                                                <Clock size={12} /> {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={getStatusStyle(leave.status)}>
                                            {leave.status === 'approved' && <CheckCircle2 size={12} />}{leave.status}
                                        </span>
                                    </div>
                                    <p className="text-[12px] font-medium text-gray-600 line-clamp-2">{leave.reason || 'No reason provided'}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
