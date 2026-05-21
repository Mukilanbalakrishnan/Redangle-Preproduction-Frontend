import { Folder, Image as ImageIcon, Video, HardDrive, UploadCloud, CheckCircle2, Clock, CheckCircle, Database } from 'lucide-react'

const trackingFiles = [
    { title: 'DSC_001.RAW', size: '45.2 MB', status: 'Uploaded', statusBg: 'bg-green-100/50', statusText: 'text-green-600', icon: CheckCircle2 },
    { title: 'DSC_002.RAW', size: '45.2 MB', status: 'Uploading', statusBg: 'bg-orange-100', statusText: 'text-orange-500', icon: Clock },
    { title: 'DSC_003.RAW', size: '45.2 MB', status: 'Pending', statusBg: 'bg-gray-100', statusText: 'text-gray-500', icon: '' },
]

export default function ServerStorage() {
    return (
        <div className="space-y-6 max-w-[1200px] animate-in fade-in zoom-in-95 duration-300 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-[18px] font-bold text-gray-900 font-sans tracking-tight">Server Storage</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-1">Manage file storage and Backups</p>
                </div>
            </div>

            <div className="space-y-6">

                {/* Panel 1: Folder Management */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Folder size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Folder Management</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Auto-generated project folder structure</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <label className="text-[12px] font-bold text-gray-900 flex items-center gap-2"><HardDrive size={14} /> Server Path</label>
                        <input
                            readOnly
                            defaultValue="/media/projects/2024/PRJ-2024-0156_Smith-Jones-Wedding/"
                            className="w-full bg-gray-50/50 border border-gray-200 text-purple-600 text-[12px] font-semibold rounded-xl px-4 py-3 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="border border-gray-100 rounded-xl p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2 text-gray-900 text-[13px] font-bold">
                                <Folder size={16} /> Raw
                            </div>
                            <h4 className="text-[15px] font-black text-gray-900">847</h4>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">files • 124.5 GB</p>
                        </div>
                        <div className="border border-gray-100 rounded-xl p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2 text-gray-900 text-[13px] font-bold">
                                <ImageIcon size={16} /> JPEG
                            </div>
                            <h4 className="text-[15px] font-black text-gray-900">400</h4>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">files • 8.2 GB</p>
                        </div>
                        <div className="border border-gray-100 rounded-xl p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2 text-gray-900 text-[13px] font-bold">
                                <Video size={16} /> Videos
                            </div>
                            <h4 className="text-[15px] font-black text-gray-900">24</h4>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">files • 24.2 GB</p>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Upload Tracking */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <UploadCloud size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Upload Tracking</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Monitor file upload progress</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-gray-500">Overall Progress</span>
                            <span className="text-[12px] font-black text-gray-900">67%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-green-700 w-[67%] rounded-full"></div>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400">834 of 1,247 files Uploaded</span>
                    </div>

                    <div className="space-y-3">
                        {trackingFiles.map((file, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-white">
                                <div className="flex items-center gap-3 text-gray-900">
                                    <HardDrive size={16} className="text-gray-400" />
                                    <div>
                                        <h4 className="text-[12px] font-bold text-gray-900 tracking-tight">{file.title}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{file.size}</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full flex items-center gap-1.5 ${file.statusBg} ${file.statusText}`}>
                                    {file.icon && <file.icon size={12} strokeWidth={3} />}
                                    <span className="text-[11px] font-bold">{file.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panel 3: Backup Status */}
                <div className="bg-white border border-gray-200 rounded-[20px] p-8 shadow-sm relative pb-24">
                    <div className="flex items-center gap-3 mb-6">
                        <Database size={18} className="text-gray-900" />
                        <div>
                            <h2 className="text-[14px] font-bold text-gray-900">Backup Status</h2>
                            <p className="text-[11px] text-gray-500 font-medium">Secondary storage backup progress</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="flex justify-between items-center p-5 border border-green-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-500" />
                                <div>
                                    <h4 className="text-[13px] font-bold text-gray-900">Primary Backup</h4>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">NAS Server 01</p>
                                </div>
                            </div>
                            <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                                <CheckCircle size={12} strokeWidth={3} /> Completed
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-5 border border-orange-200 rounded-xl bg-orange-50/30">
                            <div className="flex items-center gap-3">
                                <Clock size={20} className="text-orange-500" />
                                <div>
                                    <h4 className="text-[13px] font-bold text-gray-900">Cloud Backup</h4>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">AWS S3 Bucket</p>
                                </div>
                            </div>
                            <div className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                                <Clock size={12} strokeWidth={3} /> In Progress
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-6 right-8">
                        <button className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm flex items-center gap-2">
                            <CheckCircle2 size={16} /> Confirm Storage & Backup
                        </button>
                    </div>

                </div>

            </div>
        </div>
    )
}
