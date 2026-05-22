import { Link as LinkIcon, Copy, Eye, Download, Calendar, Shield, XCircle, CheckCircle2 } from 'lucide-react'

const activeLinks = [
    {
        title: 'Wedding - Smith & Jonas',
        url: 'https://drive.redangle/s/xyz123',
        access: 'Download',
        created: 'Created Dec 28, 2024',
        expires: 'Expires: Jan 28, 2025',
        status: 'Viewed',
        statusBg: 'bg-green-100',
        statusText: 'text-green-700'
    },
    {
        title: 'Corporate - TechCorp',
        url: 'https://drive.redangle/s/abc908',
        access: 'View Only',
        created: 'Created Dec 25, 2024',
        expires: 'Expires: Jan 25, 2025',
        status: 'Shared',
        statusBg: 'bg-orange-100',
        statusText: 'text-orange-700'
    }
]

export default function LinkSharing() {
    return (
        <div className="space-y-6 max-w-[1200px] animate-in fade-in zoom-in-95 duration-300 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Generate Link</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">Create a shareable link for client access</p>
                </div>
            </div>

            <div className="space-y-6">

                {/* Panel 1: Generate New Link */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <LinkIcon size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Generate New Link</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Create a shareable link for client access</p>
                        </div>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Cloud / Drive Link</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    defaultValue="https://drive.orchids.ai/s/new-link-here"
                                    className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 pr-10 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                                />
                                <Copy size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Access Control</label>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="border border-purple-200 bg-[#dfd5f6]/20 rounded-xl p-4 flex items-center gap-3 cursor-pointer shadow-sm">
                                    <Eye size={18} className="text-purple-600" />
                                    <div>
                                        <h4 className="text-[13px] font-bold text-gray-900">View Only</h4>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Preview without downloading</p>
                                    </div>
                                </div>
                                <div className="border border-gray-200 hover:border-purple-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-[#fafafb] transition-colors">
                                    <Download size={18} className="text-gray-600" />
                                    <div>
                                        <h4 className="text-[13px] font-bold text-gray-900">Download Allowed</h4>
                                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Full access to files</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900 flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> Expiry Date</label>
                            <input
                                type="date"
                                className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                    </div>

                    <button className="w-full bg-[#2a6d45] hover:bg-green-800 text-white py-3.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm flex items-center justify-center gap-2">
                        <LinkIcon size={16} /> Generate Share Link
                    </button>
                </div>

                {/* Panel 2: Active Share Links */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm relative pb-24">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Active Share Links</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Manage existing shared links</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activeLinks.map((link, idx) => (
                            <div key={idx} className="flex justify-between items-center p-5 border border-gray-100 rounded-xl bg-white hover:border-purple-200 transition-colors">
                                <div className="space-y-2">
                                    <div>
                                        <h4 className="text-[13px] font-bold text-gray-900">{link.title}</h4>
                                        <p className="text-[11px] font-medium text-gray-400 mt-0.5">{link.url}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-400">
                                        <span className="flex items-center gap-1.5"><Download size={12} /> {link.access}</span>
                                        <span>{link.created}</span>
                                        <span>{link.expires}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-bold ${link.statusBg} ${link.statusText}`}>
                                        {link.status}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5">
                                            <Copy size={12} /> Copy
                                        </button>
                                        <button className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm flex items-center gap-1.5">
                                            <XCircle size={12} /> Revoke
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-6 right-8">
                        <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm flex items-center gap-2">
                            <CheckCircle2 size={16} /> Confirm Delivery
                        </button>
                    </div>

                </div>

            </div>
        </div>
    )
}
