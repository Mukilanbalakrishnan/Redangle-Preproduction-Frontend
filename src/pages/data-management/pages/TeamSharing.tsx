import { Building2, Users, Flame, Equal, ArrowDown, Send, CheckCircle2 } from 'lucide-react'

const projects = [
    { title: 'Wedding - Smith & Jones', id: 'PRJ-2024-0156', files: '1247 files', size: '156.8 GB', active: true },
    { title: 'Corporate - TechCorp', id: 'PRJ-2024-0155', files: '456 files', size: '42.8 GB', active: false },
    { title: 'Birthday - Alex K.', id: 'PRJ-2024-0154', files: '326 files', size: '24.8 GB', active: false }
]

const teamMembers = [
    { name: 'David Chen', role: 'Editor', active: true },
    { name: 'Sarah Miller', role: 'Colorist', active: false },
    { name: 'Mike Johnson', role: 'Audio Engineer', active: false },
    { name: 'Alex Wong', role: 'VFX Specialist', active: true },
]

export default function TeamSharing() {
    return (
        <div className="space-y-6 max-w-[1200px] animate-in fade-in zoom-in-95 duration-300 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Assign Project to Team</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">Select editors, colorist, or VFX artist for the project</p>
                </div>
            </div>

            <div className="space-y-6">

                {/* Panel 1: Project Selection */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Project Selection</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Select a project to perform QC Validation</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {projects.map((project, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-5 rounded-xl border transition-all cursor-pointer
                                ${project.active ? 'border-green-300 bg-green-50/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div>
                                    <h3 className="text-[13px] font-bold text-gray-900">{project.title}</h3>
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{project.id}</p>
                                </div>
                                <div className="text-right">
                                    <h4 className="text-[13px] font-bold text-gray-900">{project.files}</h4>
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">{project.size}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panel 2: Select Team Members */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Users size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Select Team Members</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Assign specific roles to team members</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        {teamMembers.map((member, idx) => (
                            <div key={idx} className={`border rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
                                ${member.active ? 'border-purple-300 bg-[#dfd5f6]/20 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="w-14 h-14 rounded-full bg-gray-200 object-cover overflow-hidden mb-1">
                                    <img src={`https://i.pravatar.cc/150?u=${member.name}`} alt={member.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-center">
                                    <h4 className={`text-[13px] font-bold ${member.active ? 'text-purple-900' : 'text-gray-900'}`}>{member.name}</h4>
                                    <p className={`text-[11px] font-medium mt-0.5 ${member.active ? 'text-purple-600' : 'text-gray-500'}`}>{member.role}</p>
                                </div>
                                {member.active && (
                                    <div className="absolute top-3 right-3 text-purple-600">
                                        <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panel 3: Assignment Details */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm relative pb-24">
                    <h2 className="text-[14px] font-bold text-gray-900 mb-1">Assignment Details</h2>
                    <p className="text-[11px] text-gray-500 font-medium mb-6">Set priority and add specific instructions</p>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Priority Level</label>
                            <div className="grid grid-cols-3 gap-6 w-2/3 mb-8">
                                <div className="border border-red-200 bg-red-50/50 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                                    <Flame size={16} className="text-red-500" />
                                    <span className="text-[13px] font-bold text-red-900">High</span>
                                </div>
                                <div className="border border-gray-200 hover:border-orange-200 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                    <Equal size={16} className="text-orange-500" />
                                    <span className="text-[13px] font-bold text-gray-700">Medium</span>
                                </div>
                                <div className="border border-gray-200 hover:border-green-200 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                    <ArrowDown size={16} className="text-green-500" />
                                    <span className="text-[13px] font-bold text-gray-700">Low</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Internal Notes</label>
                            <textarea
                                className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all min-h-[100px]"
                                placeholder="Add instructions or specific requirements for the team..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="absolute bottom-6 right-8">
                        <button className="bg-[#2a6d45] hover:bg-green-800 text-white px-6 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm flex items-center gap-2">
                            <Send size={14} /> Confirm Assignment
                        </button>
                    </div>

                </div>

            </div>
        </div>
    )
}
