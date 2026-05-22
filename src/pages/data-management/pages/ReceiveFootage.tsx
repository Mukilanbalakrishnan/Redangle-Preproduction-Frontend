import { Building2, User, HardDrive, CheckCircle2, Image as ImageIcon, Video, FileImage, Database } from 'lucide-react'

export default function ReceiveFootage() {
    return (
        <div className="space-y-6 max-w-[1200px] animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Receive Footage</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">Log incoming raw media from shoots</p>
                </div>
            </div>

            <div className="space-y-6">

                {/* Panel 1: Project Details */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Project Details</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Information about the shoot and project</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">CRM Project ID</label>
                            <select className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all appearance-none">
                                <option>PRJ-2024-0156</option>
                                <option>PRJ-2024-0157</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Client Name</label>
                            <input type="text" defaultValue="Smith & Jones" className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Event Type</label>
                            <input type="text" defaultValue="Wedding" className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Shoot Date</label>
                            <input type="date" defaultValue="2024-12-28" className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Panel 2: Shooter Details */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <User size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Shooter Details</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Photographer/Videographer information</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Photo/videographer Name</label>
                            <input type="text" defaultValue="John Davidson" className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Upload Date</label>
                            <input type="date" defaultValue="2024-12-30" className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Panel 3: Media Details */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm relative pb-24">
                    <div className="flex items-center gap-3 mb-6">
                        <HardDrive size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Media Details</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Information about the upload media</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Media Type</label>
                            <div className="flex gap-2">
                                <button className="flex-1 py-3 text-[12px] font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Images</button>
                                <button className="flex-1 py-3 text-[12px] font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Videos</button>
                                <button className="flex-1 py-3 text-[12px] font-bold rounded-xl border-transparent bg-green-700 text-white shadow-sm">Mixed</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Total files</label>
                            <input type="text" defaultValue="1,247" className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Total size</label>
                            <input type="text" defaultValue="15.68" className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                            <ImageIcon size={20} className="text-orange-500" />
                            <div>
                                <h4 className="text-[14px] font-black text-gray-900">867</h4>
                                <p className="text-[11px] font-bold text-gray-500">RAW Images</p>
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                            <FileImage size={20} className="text-green-600" />
                            <div>
                                <h4 className="text-[14px] font-black text-gray-900">400</h4>
                                <p className="text-[11px] font-bold text-gray-500">JPG Images</p>
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 border-green-200 bg-green-50/50">
                            <Video size={20} className="text-green-600" />
                            <div>
                                <h4 className="text-[14px] font-black text-gray-900">24</h4>
                                <p className="text-[11px] font-bold text-gray-500">Video clips</p>
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                            <Database size={20} className="text-orange-500" />
                            <div>
                                <h4 className="text-[14px] font-black text-gray-900">15.6 GB</h4>
                                <p className="text-[11px] font-bold text-gray-500">Total Size</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions mapped inside bounds per reference */}
                    <div className="absolute bottom-6 right-8">
                        <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm flex items-center gap-2">
                            <CheckCircle2 size={16} /> Confirm Footage Received
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
