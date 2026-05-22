import { User, HardDrive, Package, Truck, UserCheck, Upload, CheckCircle2 } from 'lucide-react'

export default function ClientDelivery() {
    return (
        <div className="space-y-6 max-w-[1200px] animate-in fade-in zoom-in-95 duration-300 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Client Delivery</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">Manage hard disk delivery to clients</p>
                </div>
            </div>

            <div className="space-y-6">

                {/* Panel 1: Client Details */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <User size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Client Details</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Delivery recipient information</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900 flex items-center gap-2"><User size={14} className="text-gray-400" /> Client Name</label>
                            <input
                                type="text"
                                defaultValue="Smith & Jones"
                                className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900 flex items-center gap-2"><span className="text-gray-400 text-[14px]">✉</span> Email</label>
                            <input
                                type="email"
                                defaultValue="smith@gmail.com"
                                className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900 flex items-center gap-2"><span className="text-gray-400 text-[14px]">📞</span> Phone</label>
                            <input
                                type="text"
                                defaultValue="+91 90008 80009"
                                className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Panel 2: Hard Disk Details */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <HardDrive size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Hard Disk Details</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Storage device information</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Disk ID</label>
                            <input
                                type="text"
                                className="w-[80%] bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Storage Size</label>
                            <input
                                type="text"
                                className="w-[80%] bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-xl p-6 bg-gray-50/30">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[13px] font-bold text-orange-700 flex items-center gap-2"><Package size={16} className="text-orange-500" /> Copy Progress</span>
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[11px] font-bold">78%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-green-700 w-[78%] rounded-full"></div>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400">Copying 156.8 GB to hard disk..</span>
                    </div>
                </div>

                {/* Panel 3: Delivery Tracking */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm relative pb-24">
                    <div className="flex items-center gap-3 mb-6">
                        <Package size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Delivery Tracking</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Shipping and handover details</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Delivery Method</label>
                            <div className="grid grid-cols-2 gap-6 w-3/4">
                                <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#dfd5f6] hover:bg-gray-50 transition-colors">
                                    <Truck size={18} className="text-gray-600" />
                                    <div>
                                        <h4 className="text-[13px] font-bold text-gray-900">Courier</h4>
                                        <p className="text-[11px] text-gray-500 font-medium">Professional delivery service</p>
                                    </div>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#dfd5f6] hover:bg-gray-50 transition-colors">
                                    <UserCheck size={18} className="text-gray-600" />
                                    <div>
                                        <h4 className="text-[13px] font-bold text-gray-900">In-Person Handover</h4>
                                        <p className="text-[11px] text-gray-500 font-medium">Direct client pickup</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-gray-900">Delivery Date</label>
                            <input
                                type="date"
                                defaultValue="2025-12-30"
                                className="w-full bg-white border border-gray-200 text-gray-900 text-[13px] font-semibold rounded-xl px-4 py-3 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6 items-end">
                            <div className="border border-gray-200 rounded-xl p-5 flex gap-4 items-center">
                                <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center shrink-0 mt-0.5 border border-purple-200">
                                    {/* checked state placeholder */}
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-bold text-gray-900">Client Acknowledgement</h4>
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">Client has acknowledged receipt of delivery</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-900">Signature Upload</label>
                                <div className="border border-dashed border-gray-300 rounded-xl p-4 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                                    <Upload size={18} className="text-gray-400" />
                                    <p className="text-[11px] font-medium text-gray-500">Click to upload or drag and drop PNG, JPG, upto 5MB</p>
                                </div>
                            </div>
                        </div>
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
