import { Download, Search, Filter, Clock, CheckCircle, PhoneCall } from 'lucide-react'
import StatCard from '../../crm/components/ui/StatCard'

const historyData = [
    { id: 'TSK-001', client: 'John Daber', date: 'Jan 22, 2025', assignedBy: 'Sarah Johnson', status: 'Pending' },
    { id: 'TSK-002', client: 'Emma William', date: 'Jan 10, 2025', assignedBy: 'Mike Chen', status: 'In-Progress' },
    { id: 'TSK-003', client: 'Kemy Elisa', date: 'Feb 19, 2025', assignedBy: 'Lisa Park', status: 'In-Progress' },
    { id: 'TSK-004', client: 'Sarah David', date: 'Feb 25, 2025', assignedBy: 'David Kim', status: 'Pending' },
    { id: 'TSK-005', client: 'Joble Durai', date: 'Mar 05, 2025', assignedBy: 'Ayush Bae', status: 'In-Progress' },
    { id: 'TSK-006', client: 'Lara Benny', date: 'Apr 01, 2025', assignedBy: 'Liam Ney', status: 'Pending' },
    { id: 'TSK-007', client: 'Ayush Gitzz', date: 'Apr 05, 2024', assignedBy: 'Amenda Boly', status: 'Completed' },
    { id: 'TSK-008', client: 'Liam Warns', date: 'Apr 10, 2024', assignedBy: 'Kimey White', status: 'Completed' },
]

export default function AssignedHistory() {
    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Assigned Data History</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Track all data assignments to CRM</p>
                </div>
                <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium" style={{ color: '#6B7280' }}>
                    <Download size={14} /> Download report
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <StatCard title="Pending" value="3" change="-4% from last week" positive={false} iconBg="#Fce4ec"
                    icon={<Clock size={17} style={{ color: '#C2185B' }} />} />
                <StatCard title="In-Progress" value="4" change="+5% from last week" positive iconBg="#E3F2FD"
                    icon={<PhoneCall size={17} style={{ color: '#1976D2' }} />} />
                <StatCard title="Completed" value="2" change="+5% from last week" positive iconBg="#E8F5E9"
                    icon={<CheckCircle size={17} style={{ color: '#2E7D32' }} />} />
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by employee, client name or task ID..."
                        className="w-full pl-10 pr-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200 transition-colors">
                    <Filter size={16} /> Filter
                </button>
            </div>

            <div className="crm-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 text-center">
                            {['CRM Project ID', 'Client Name', 'Assigned Date', 'Assigned By', 'Status'].map((h) => (
                                <th key={h} className="px-6 py-4 text-xs font-bold text-indigo-600">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {historyData.map((row) => (
                            <tr key={row.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors text-center">
                                <td className="px-6 py-4 text-xs text-gray-500">{row.id}</td>
                                <td className="px-6 py-4 text-xs font-semibold text-gray-900">{row.client}</td>
                                <td className="px-6 py-4 text-xs font-semibold text-gray-900">{row.date}</td>
                                <td className="px-6 py-4 text-xs font-semibold text-gray-900">{row.assignedBy}</td>
                                <td className="px-6 py-4 flex justify-center">
                                    <span className={`inline-block px-4 py-1.5 text-[10px] font-bold rounded-lg ${row.status === 'Pending' ? 'bg-orange-100 text-orange-500' :
                                        row.status === 'In-Progress' ? 'bg-blue-100 text-blue-500' :
                                            'bg-green-100 text-green-500'
                                        }`}>
                                        {row.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
