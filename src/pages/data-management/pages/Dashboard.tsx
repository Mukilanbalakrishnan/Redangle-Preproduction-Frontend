import { Folder, PlaySquare, ShieldCheck, Truck, ArrowUpRight, UploadCloud, Users, Clock } from 'lucide-react'

const statsData = [
    {
        title: 'Total Projects',
        value: '156',
        subtitle: '+12% vs last week',
        subtitleColor: 'text-green-500',
        icon: Folder,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
    },
    {
        title: 'Footage Received',
        value: '42',
        subtitle: '+8% vs last week',
        subtitleColor: 'text-green-500',
        icon: PlaySquare,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-500',
    },
    {
        title: 'QC Pending',
        value: '18',
        subtitle: '',
        subtitleColor: '',
        icon: ShieldCheck,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-500',
    },
    {
        title: 'Delivered to Client',
        value: '124',
        subtitle: '+5% vs last week',
        subtitleColor: 'text-green-500',
        icon: Truck,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
    }
]

const quickActions = [
    { title: 'Receive Footage', desc: 'Log new raw footage', icon: UploadCloud, iconColor: 'text-green-600', iconBg: 'bg-green-100' },
    { title: 'Start QC Validation', desc: 'Validate media quality', icon: ShieldCheck, iconColor: 'text-green-600', iconBg: 'bg-green-100' },
    { title: 'Assign Team', desc: 'Assign editors & artists', icon: Users, iconColor: 'text-green-600', iconBg: 'bg-green-100' },
    { title: 'Share Delivery Link', desc: 'Generate client links', icon: Truck, iconColor: 'text-green-600', iconBg: 'bg-green-100' }
]

const recentActivity = [
    { title: 'Raw footage uploaded', subtitle: 'Wedding - Smith & Jones', time: '5 min ago' },
    { title: 'QC completed', subtitle: 'Corporate Event - TechCorp', time: '15 min ago' },
    { title: 'Delivered to client', subtitle: 'Birthday - Alex K.', time: '1 hour ago' },
    { title: 'Team assigned', subtitle: 'Music Video - Indie Band', time: '2 hour ago' }
]

export default function Dashboard() {
    return (
        <div className="space-y-6 max-w-[1200px] animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Dashboard</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">Welcome back, Data Manager</p>
                </div>
            </div>

            {/* Top Alert */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                        <UploadCloud size={16} />
                    </div>
                    <div>
                        <h4 className="text-[13px] font-bold text-gray-900">New raw footage uploaded by Photographer / Videographer</h4>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">Wedding - Smith & Jones • 2.4 GB</p>
                    </div>
                </div>
                <button className="bg-[#dfd5f6] text-purple-900 hover:bg-[#d0c3ef] px-6 py-2 rounded-lg text-[12px] font-bold transition-colors flex items-center gap-2">
                    Review Now <ArrowUpRight size={14} />
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-6">
                {statsData.map((stat, idx) => {
                    const Icon = stat.icon
                    return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-[12px] font-bold text-gray-900 mb-2 tracking-wide">{stat.title}</h3>
                                    <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                                </div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}>
                                    <Icon size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                            {stat.subtitle && (
                                <div className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${stat.subtitleColor}`}>
                                    <ArrowUpRight size={14} /> {stat.subtitle}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
                <h2 className="text-[14px] font-bold text-gray-900 mb-1">Quick Actions</h2>
                <p className="text-[12px] font-medium text-gray-500 mb-6">Common workflows at your fingertips</p>

                <div className="grid grid-cols-4 gap-6">
                    {quickActions.map((action, idx) => {
                        const Icon = action.icon
                        return (
                            <div key={idx} className="border border-gray-200 rounded-[16px] p-5 hover:border-[#dfd5f6] hover:bg-gray-50 cursor-pointer transition-all group">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${action.iconBg} ${action.iconColor}`}>
                                    <Icon size={16} strokeWidth={3} />
                                </div>
                                <h4 className="text-[13px] font-bold text-gray-900">{action.title}</h4>
                                <p className="text-[11px] font-medium text-gray-500 mt-1">{action.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
                <h2 className="text-[14px] font-bold text-gray-900 mb-1">Recent Activity</h2>
                <p className="text-[12px] font-medium text-gray-500 mb-6">Latest updates from your team</p>

                <div className="space-y-4 relative">
                    {recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                </div>
                                <div>
                                    <h4 className="text-[12px] font-bold text-gray-900">{activity.title}</h4>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">{activity.subtitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Clock size={12} />
                                <span className="text-[11px] font-semibold">{activity.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
