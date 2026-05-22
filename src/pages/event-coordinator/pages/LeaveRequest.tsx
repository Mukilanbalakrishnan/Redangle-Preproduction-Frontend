import { useState, useEffect } from 'react'
import { Calendar, ChevronDown, CheckCircle2, Clock } from 'lucide-react'
import axios from 'axios'
import { useEmployeeId } from '../../../hooks/useEmployeeId'

export default function LeaveRequest() {
    const employeeId = useEmployeeId()
    const [leaveHistory, setLeaveHistory] = useState<any[]>([])
    const [formData, setFormData] = useState({
        leave_type: '',
        from_date: '',
        to_date: '',
        reason: ''
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (employeeId) {
            fetchHistory()
        }
    }, [employeeId])

    const fetchHistory = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const res = await axios.get(`${API_URL}/leave/employee/${employeeId}`)
            if (res.data?.success) {
                setLeaveHistory(res.data.data)
            }
        } catch (err) {
            console.error("Error fetching leave history:", err)
        }
    }

    const calculateDays = (start: string, end: string) => {
        const d1 = new Date(start)
        const d2 = new Date(end)
        const diff = Math.abs(d2.getTime() - d1.getTime())
        return Math.ceil(diff / (1000 * 3600 * 24)) + 1
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeId) return alert("Employee ID not found. Please log in again.")
        if (!formData.leave_type || !formData.from_date || !formData.to_date || !formData.reason) {
            return alert("Please fill all fields")
        }

        const days = calculateDays(formData.from_date, formData.to_date)
        if (isNaN(days) || days < 1) {
            return alert("Invalid date range")
        }

        setLoading(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const payload = {
                employee_id: employeeId.toString(),
                leave_type: formData.leave_type,
                from_date: formData.from_date,
                to_date: formData.to_date,
                no_of_days: days,
                reason: formData.reason
            }
            await axios.post(`${API_URL}/leave`, payload)
            alert("Leave request submitted successfully!")
            setFormData({ leave_type: '', from_date: '', to_date: '', reason: '' })
            fetchHistory()
        } catch (err: any) {
            console.error("Error submitting leave:", err)
            alert(err.response?.data?.message || "Failed to submit request")
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
        } catch {
            return dateStr
        }
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Approved':
            case 'Accepted':
                return 'bg-green-100 text-green-700'
            case 'Rejected':
                return 'bg-red-100 text-red-700'
            default:
                return 'bg-orange-100 text-orange-700'
        }
    }

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Apply Leave</h1>
                <p className="text-sm text-gray-500 font-medium">Request time off from work</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Form Column */}
                <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-8">
                        <span className="text-gray-500"><Calendar size={18} /></span>
                        Leave Application
                    </h2>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-800">Leave Type</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-300 appearance-none text-gray-500 font-medium"
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                >
                                    <option value="">Select leave type</option>
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Vacation">Vacation</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-800">Start Date</label>
                                <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden flex items-center">
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3.5 outline-none text-sm font-medium text-gray-700"
                                        value={formData.from_date}
                                        onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-800">End Date</label>
                                <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden flex items-center">
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3.5 outline-none text-sm font-medium text-gray-700"
                                        value={formData.to_date}
                                        onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-800">Reason</label>
                            <textarea
                                rows={5}
                                placeholder="Describe Your reason for Leave"
                                className="w-full p-4 bg-white border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 rounded-xl text-sm transition-all resize-none font-medium placeholder-gray-400 text-gray-700"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            ></textarea>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-purple-400 text-white py-3.5 rounded-xl text-sm font-bold shadow-sm hover:bg-purple-500 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Apply Leave'}
                        </button>
                    </form>
                </div>

                {/* Status Column */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-8">
                        <span className="text-gray-500"><Clock size={18} /></span>
                        Leave Status
                    </h2>

                    <div className="space-y-4">
                        {leaveHistory.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm py-4">No leave history found</div>
                        ) : leaveHistory.map((leave, index) => (
                            <div key={index} className="border border-gray-100 rounded-2xl p-6 hover:shadow-sm hover:border-purple-100 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-900 text-[15px]">{leave.leave_type}</h3>
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${getStatusStyles(leave.status)}`}>
                                        {leave.status === 'Approved' || leave.status === 'Accepted' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {leave.status}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
                                        <Calendar size={14} /> {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                                    </div>
                                    <p className="text-gray-800 font-semibold text-xs pt-1">{leave.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
