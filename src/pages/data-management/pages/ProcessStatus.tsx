import { Activity, CheckCircle2, PlayCircle, Clock, Flame, Equal, ArrowDown, Folder, ShieldCheck, Database, Users, Truck } from 'lucide-react'

const steps = [
    { title: 'Footage Received', desc: 'Logged and verified by Data Manager', status: 'completed', icon: Folder },
    { title: 'Quality Control', desc: 'Automated and manual QC passed', status: 'completed', icon: ShieldCheck },
    { title: 'Backed Up', desc: 'Primary and cloud backup secured', status: 'completed', icon: Database },
    { title: 'Assigned to Team', desc: 'In progress with David Chen', status: 'active', icon: Users },
    { title: 'Delivered', desc: 'Awaiting client delivery', status: 'upcoming', icon: Truck },
]

const activeTasks = [
    { title: 'Wedding Highlight Edit', role: 'Editor', priority: 'High', icon: Flame, color: 'text-red-500', bg: 'bg-red-50' },
    { title: 'Color Grading', role: 'Colorist', priority: 'Medium', icon: Equal, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Audio Sync', role: 'Audio Engineer', priority: 'Low', icon: ArrowDown, color: 'text-green-500', bg: 'bg-green-50' },
]

const activityLog = [
    { text: 'Project assigned to David Chen', time: '2 hours ago' },
    { text: 'Backup completed on NAS-01', time: '5 hours ago' },
    { text: 'QC Validation passed', time: '1 day ago' },
]

export default function ProcessStatus() {
    return (
        <div className="space-y-6 max-w-[1200px] animate-in fade-in zoom-in-95 duration-300 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Process Status</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">Track workflow progress and team tasks</p>
                </div>
            </div>

            <div className="flex gap-6">

                {/* Left Column: Workflow Progress */}
                <div className="flex-1 bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <Activity size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Workflow Progress</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Current stage in the production pipeline</p>
                        </div>
                    </div>

                    <div className="relative space-y-8 pl-4">
                        {/* Connecting Line */}
                        <div className="absolute top-5 bottom-8 left-[35px] w-0.5 bg-gray-100 -z-0">
                            <div className="w-full bg-green-500 h-[60%] transition-all duration-1000"></div>
                        </div>

                        {steps.map((step, idx) => {
                            const StepIcon = step.icon

                            let StatusIcon
                            let iconBg
                            let borderStyle

                            if (step.status === 'completed') {
                                StatusIcon = <CheckCircle2 size={16} className="text-white" />
                                iconBg = 'bg-green-500'
                                borderStyle = 'border-transparent'
                            } else if (step.status === 'active') {
                                StatusIcon = <PlayCircle size={16} className="text-purple-600" />
                                iconBg = 'bg-purple-100'
                                borderStyle = 'border-4 border-white shadow-sm ring-2 ring-purple-200'
                            } else {
                                StatusIcon = <Clock size={16} className="text-gray-400" />
                                iconBg = 'bg-gray-100'
                                borderStyle = 'border-4 border-white'
                            }

                            return (
                                <div key={idx} className="flex gap-6 relative z-10 group">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${iconBg} ${borderStyle}`}>
                                        {StatusIcon}
                                    </div>
                                    <div className={`flex-1 border rounded-xl p-5 flex items-center gap-4 transition-all
                                        ${step.status === 'active' ? 'border-purple-200 bg-[#dfd5f6]/10' : 'border-gray-100 group-hover:border-gray-200 bg-white'}`}>
                                        <div className={`p-3 rounded-lg ${step.status === 'active' ? 'bg-[#dfd5f6]/50 text-purple-700' : 'bg-gray-50 text-gray-500'}`}>
                                            <StepIcon size={20} />
                                        </div>
                                        <div>
                                            <h4 className={`text-[13px] font-bold ${step.status === 'active' ? 'text-gray-900' : step.status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {step.title}
                                            </h4>
                                            <p className={`text-[11px] font-medium mt-0.5 ${step.status === 'active' || step.status === 'completed' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right Column: Tasks & Activity */}
                <div className="w-[400px] flex flex-col gap-6">

                    {/* Active Tasks Box */}
                    <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-1">Active Tasks</h2>
                        <p className="text-[11px] text-gray-500 font-medium mb-6">Current priority assignments</p>

                        <div className="space-y-3">
                            {activeTasks.map((task, idx) => (
                                <div key={idx} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center bg-gray-50/50 hover:bg-white transition-colors cursor-default">
                                    <div>
                                        <h4 className="text-[12px] font-bold text-gray-900">{task.title}</h4>
                                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">{task.role}</p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.bg} ${task.color}`}>
                                        <task.icon size={16} strokeWidth={2.5} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Process Activity Box */}
                    <div className="bg-white border border-gray-200 rounded-[20px] p-6 shadow-sm flex-1">
                        <h2 className="text-[14px] font-bold text-gray-900 mb-1">Process Activity</h2>
                        <p className="text-[11px] text-gray-500 font-medium mb-6">Latest timeline events</p>

                        <div className="space-y-4">
                            {activityLog.map((log, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5 text-gray-500">
                                        <Activity size={12} />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-bold text-gray-900">{log.text}</h4>
                                        <p className="text-[10px] font-semibold text-gray-400 mt-1">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}
