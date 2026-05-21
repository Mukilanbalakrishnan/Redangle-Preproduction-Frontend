import { CheckCircle2, AlertCircle, XCircle, FileVideo, ImagePlus, EyeOff, Send } from 'lucide-react'

const projects = [
    { title: 'Wedding - Smith & Jones', id: 'PRJ-2024-0156', files: '1247 files', size: '156.8 GB', active: true },
    { title: 'Corporate - TechCorp', id: 'PRJ-2024-0155', files: '456 files', size: '42.8 GB', active: false },
    { title: 'Birthday - Alex K.', id: 'PRJ-2024-0154', files: '326 files', size: '24.8 GB', active: false }
]

const validations = [
    { title: 'Clip / Image Count Verification', status: 'Passed', icon: CheckCircle2, iconBg: 'bg-green-100/50', iconColor: 'text-green-600', textColor: 'text-green-700' },
    { title: 'File Format Validation', status: 'Passed', icon: CheckCircle2, iconBg: 'bg-green-100/50', iconColor: 'text-green-600', textColor: 'text-green-700' },
    { title: 'Blur Detection', status: 'Warning', icon: AlertCircle, iconBg: 'bg-orange-100', iconColor: 'text-orange-500', textColor: 'text-orange-700' }
]

export default function QcValidation() {
    return (
        <div className="space-y-6 max-w-[1200px] animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">QC Validation</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">Quality control checks for Raw Footage</p>
                </div>
            </div>

            <div className="space-y-6">

                {/* Panel 1: Project Selection */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <h2 className="text-[14px] font-bold text-gray-900">Project Selection</h2>
                    <p className="text-[11px] text-gray-500 font-medium mb-6">Select a project to perform QC Validation</p>

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

                {/* Panel 2: Validation Checks */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <h2 className="text-[14px] font-bold text-gray-900">Validation Checks</h2>
                    <p className="text-[11px] text-gray-500 font-medium mb-6">Automated Quality verification and results</p>

                    <div className="space-y-4 border border-gray-100 rounded-xl p-2 bg-gray-50/30">
                        {validations.map((check, idx) => {
                            const Icon = check.icon
                            return (
                                <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-50 rounded text-gray-600">
                                            {idx === 0 ? <FileVideo size={16} /> : idx === 1 ? <ImagePlus size={16} /> : <EyeOff size={16} />}
                                        </div>
                                        <h3 className="text-[13px] font-bold text-gray-900">{check.title}</h3>
                                    </div>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${check.iconBg}`}>
                                        <span className={`text-[11px] font-bold ${check.textColor}`}>{check.status}</span>
                                        <Icon size={14} className={check.iconColor} strokeWidth={3} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Panel 3: QC Checks */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm relative pb-24">
                    <h2 className="text-[14px] font-bold text-gray-900">QC Checks</h2>
                    <p className="text-[11px] text-gray-500 font-medium mb-6">Select the final validation status</p>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="border border-green-200 bg-green-50 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm">
                            <CheckCircle2 size={24} className="text-green-600" />
                            <span className="text-[13px] font-bold text-green-900">Approved</span>
                        </div>
                        <div className="border border-gray-200 hover:border-orange-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors">
                            <AlertCircle size={24} className="text-orange-500" />
                            <span className="text-[13px] font-bold text-gray-700">Issues Found</span>
                        </div>
                        <div className="border border-gray-200 hover:border-red-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors">
                            <XCircle size={24} className="text-gray-400 hover:text-red-500" />
                            <span className="text-[13px] font-bold text-gray-700">Rejected</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[12px] font-bold text-gray-900">QC Remarks</label>
                        <textarea
                            className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all min-h-[80px]"
                            placeholder="Add any notes or abbreviations about the footage quality..."
                        ></textarea>
                    </div>

                    <div className="absolute bottom-6 right-8">
                        <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm flex items-center gap-2">
                            <Send size={14} /> Submit Footage Quality
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
