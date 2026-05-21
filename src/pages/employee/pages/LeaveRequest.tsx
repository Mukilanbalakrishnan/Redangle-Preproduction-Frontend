import { Calendar, ChevronDown, CheckCircle2, Clock } from 'lucide-react'

const leaveHistory = [
    { type: 'Sick Leave', duration: 'Jan 10 - Jan 11, 2024', reason: 'Fever and cold', status: 'Approved', statusColor: 'bg-green-100 text-green-700 icon-green' },
    { type: 'Casual Leave', duration: 'Jan 5 - Jan 11, 2024', reason: 'Personal Work', status: 'Approved', statusColor: 'bg-green-100 text-green-700 icon-green' },
    { type: 'Vacation', duration: 'Feb 10 - Jan 11, 2024', reason: 'Family Vacation', status: 'Pending', statusColor: 'bg-orange-100 text-orange-700 icon-orange' }
]

export default function LeaveRequest() {
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

                    <form className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-800">Leave Type</label>
                            <div className="relative">
                                <select className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-300 appearance-none text-gray-500 font-medium">
                                    <option value="">Select leave type</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="casual">Casual Leave</option>
                                    <option value="vacation">Vacation</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-800">Start Date</label>
                                <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden flex items-center">
                                    <Calendar size={16} className="text-gray-400 ml-4 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Pick a date"
                                        className="w-full px-3 py-3.5 outline-none text-sm placeholder-gray-400 font-medium text-gray-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-800">End Date</label>
                                <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden flex items-center">
                                    <Calendar size={16} className="text-gray-400 ml-4 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Pick a date"
                                        className="w-full px-3 py-3.5 outline-none text-sm placeholder-gray-400 font-medium text-gray-700"
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
                            ></textarea>
                        </div>

                        <button className="w-full bg-purple-400 text-white py-3.5 rounded-xl text-sm font-bold shadow-sm hover:bg-purple-500 transition-colors">
                            Apply Leave
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
                        {leaveHistory.map((leave, index) => (
                            <div key={index} className="border border-gray-100 rounded-2xl p-6 hover:shadow-sm hover:border-purple-100 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-900 text-[15px]">{leave.type}</h3>
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${leave.statusColor}`}>
                                        {leave.status === 'Approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {leave.status}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
                                        <Calendar size={14} /> {leave.duration}
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
