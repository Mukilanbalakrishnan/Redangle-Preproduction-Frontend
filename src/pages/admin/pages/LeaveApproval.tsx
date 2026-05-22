import { useState, useEffect } from 'react'
import { ClipboardList, Clock, CheckCircle, Check, X } from 'lucide-react'
import axios from 'axios'

export default function LeaveApproval() {
    const [leaveRequests, setLeaveRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLeaveRequests()
    }, [])

    const fetchLeaveRequests = async () => {
        setLoading(true)
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            const res = await axios.get(`${API_URL}/leave?role=admin`)
            if (res.data?.success) {
                setLeaveRequests(res.data.data)
            }
        } catch (err) {
            console.error("Failed to fetch leave requests:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
            await axios.put(`${API_URL}/leave/${id}/status`, { status: newStatus })
            alert(`Request ${newStatus} successfully`)
            fetchLeaveRequests()
        } catch (err: any) {
            console.error("Failed to update status:", err)
            alert(err.response?.data?.message || "Failed to update status")
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
        } catch {
            return dateStr
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved':
            case 'Accepted':
                return 'bg-green-200 text-green-700'
            case 'Rejected':
                return 'bg-red-500 text-white'
            default:
                return 'bg-orange-100 text-orange-600'
        }
    }

    const getTypeColor = (type: string) => {
        if (type.toLowerCase().includes('sick')) return 'bg-orange-100 text-orange-600'
        if (type.toLowerCase().includes('vacation')) return 'bg-blue-100 text-blue-600'
        return 'bg-green-100 text-green-700'
    }

    const totalRequests = leaveRequests.length
    const pendingRequests = leaveRequests.filter(l => l.status === 'Pending').length
    const approvedRequests = leaveRequests.filter(l => l.status === 'Approved' || l.status === 'Accepted').length

    return (
        <div className="space-y-6 max-w-7xl animate-in fade-in zoom-in-95 duration-300">
            <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1 font-sans">Leave Approval</h1>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[13px] font-bold text-gray-700 mb-3 block font-sans">Total Requests</p>
                        <h3 className="text-3xl font-black text-gray-900">{totalRequests}</h3>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl text-gray-600 group-hover:bg-gray-200 transition-colors">
                        <ClipboardList size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[13px] font-bold text-gray-700 mb-3 block font-sans">Pending</p>
                        <h3 className="text-3xl font-black text-gray-900">{pendingRequests}</h3>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                        <Clock size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[13px] font-bold text-gray-700 mb-3 block font-sans">Approved</p>
                        <h3 className="text-3xl font-black text-gray-900">{approvedRequests}</h3>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl text-gray-600 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                        <CheckCircle size={20} />
                    </div>
                </div>
            </div>

            {/* Leave Requests Table Window */}
            <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-8">

                <div className="mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-[15px] font-bold text-gray-900 font-sans">Leave Requests</h2>
                    <p className="text-[12px] text-gray-500 font-medium">Review and manage employee leave requests</p>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-6 text-gray-500">Loading leave requests...</div>
                    ) : leaveRequests.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">No leave requests found.</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100/50">
                                    <th className="px-6 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Employee Name</th>
                                    <th className="px-6 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Leave Type</th>
                                    <th className="px-6 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Leave Dates</th>
                                    <th className="px-6 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Reason</th>
                                    <th className="px-6 py-5 text-[12px] font-bold text-purple-600 tracking-wide">Status</th>
                                    <th className="px-6 py-5 text-[12px] font-bold text-purple-600 tracking-wide text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveRequests.map((leave, i) => (
                                    <tr key={leave.leave_request_id || i} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-6 text-[13px] font-bold text-gray-800">{leave.employee_name || leave.employee_id} {leave.role ? `(${leave.role})` : ''}</td>
                                        <td className="px-6 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold ${getTypeColor(leave.leave_type)}`}>
                                                {leave.leave_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-[13px] font-bold text-gray-900">
                                            {formatDate(leave.from_date)} - {formatDate(leave.to_date)} ({leave.no_of_days}d)
                                        </td>
                                        <td className="px-6 py-6 text-[13px] font-bold text-gray-800">{leave.reason}</td>
                                        <td className="px-6 py-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold min-w-[80px] text-center inline-block ${getStatusColor(leave.status)}`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {leave.status === 'Pending' && (
                                                <div className="flex justify-center items-center gap-3">
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave.leave_request_id, 'Approved')}
                                                        className="bg-[#2ecc71] text-white p-2 rounded-lg shadow hover:bg-[#27ae60] transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check size={16} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave.leave_request_id, 'Rejected')}
                                                        className="bg-[#e74c3c] text-white p-2 rounded-lg shadow hover:bg-[#c0392b] transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={16} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    )
}
