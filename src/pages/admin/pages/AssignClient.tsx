import { Building2, User, ChevronDown } from 'lucide-react'

const unassignedLeads = [
    { id: 'LD-001', name: 'Emma Watson', type: 'Wedding', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'LD-006', name: 'David Brown', type: 'Baby Shower', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
    { id: 'LD-007', name: 'Jennifer Lopez', type: 'Corporate', iconBg: 'bg-gray-200', iconColor: 'text-gray-700', active: true }
]

export default function AssignClient() {
    return (
        <div className="space-y-6 max-w-[1400px] animate-in fade-in zoom-in-95 duration-300">
            <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1 font-sans">Assign client</h1>
                <p className="text-[13px] text-gray-500 font-medium">Assign client to employees</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Assignment Form */}
                <div className="bg-white rounded-[24px] p-8 border border-gray-200 shadow-sm relative overflow-hidden">
                    <h2 className="text-[15px] font-bold text-gray-900 mb-1">Assign client</h2>
                    <p className="text-[12px] text-gray-500 font-medium mb-8">Select a client and assign it to an employee</p>

                    <div className="space-y-8">
                        {/* Select Lead Input */}
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-gray-800">Select Lead</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Building2 size={16} className="text-gray-500" />
                                </div>
                                <select className="w-full pl-12 pr-10 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-[13px] transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-300 appearance-none text-gray-700 font-bold cursor-pointer shadow-sm">
                                    <option value="LD-007">LD-007 - Jennifer Lopez</option>
                                    <option value="LD-001">LD-001 - Emma Watson</option>
                                    <option value="LD-006">LD-006 - David Brown</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Selected Lead Read-Only Details */}
                        <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 space-y-4">
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="font-bold text-gray-500">Lead ID</span>
                                <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-100">LD-007</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="font-bold text-gray-500">Client Name</span>
                                <span className="font-bold text-gray-900">Jennifer Lopez</span>
                            </div>
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="font-bold text-gray-500">Shoot Type</span>
                                <span className="font-bold text-gray-900">Corporate</span>
                            </div>
                        </div>

                        {/* Assign To Input */}
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-gray-800">Assign To</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <User size={16} className="text-gray-500" />
                                </div>
                                <select className="w-full pl-12 pr-10 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-[13px] transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-300 appearance-none text-gray-700 font-bold cursor-pointer shadow-sm">
                                    <option value="">Emily Chen - Photo Editor</option>
                                    <option value="">Mike Ross - Senior Photographer</option>
                                    <option value="">Alex Turner - Videographer</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4">
                            <button className="flex-1 bg-[#3b9c8b] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-[#2e7d6f] transition-colors shadow-sm">
                                Assign Lead
                            </button>
                            <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                Notify
                            </button>
                        </div>
                    </div>
                </div>

                {/* Unassigned Leads Queue */}
                <div className="bg-white rounded-[24px] p-8 border border-gray-200 shadow-sm relative min-h-[500px]">
                    <h2 className="text-[15px] font-bold text-gray-900 mb-1">Unassigned client</h2>
                    <p className="text-[12px] text-gray-500 font-medium mb-8">3 leads waiting for assignment</p>

                    <div className="space-y-4">
                        {unassignedLeads.map((lead, index) => (
                            <div key={index} className="relative">
                                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer shadow-sm
                                    ${lead.active ? 'border-gray-300 bg-gray-50/50 ring-1 ring-gray-200' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${lead.iconBg} ${lead.iconColor}`}>
                                            <Building2 size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] font-bold text-gray-900">{lead.name}</h3>
                                            <p className="text-[12px] text-gray-500 font-medium mt-0.5">{lead.type}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${lead.active ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-500'}`}>
                                        {lead.id}
                                    </span>
                                </div>
                                {/* Visual Separator/Connector style seen in mockup */}
                                {index < unassignedLeads.length - 1 && (
                                    <div className="flex justify-center -my-1 relative z-10 w-12 ml-2">
                                        <span className="text-gray-300 text-xs mt-1">•••</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
