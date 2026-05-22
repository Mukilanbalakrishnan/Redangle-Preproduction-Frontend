import { useState, useRef } from 'react'
import { Calendar, Send, CheckCircle2, X, Upload } from 'lucide-react'

export default function DesignPreview({ onBack }: { onBack: () => void }) {
    const [showModal, setShowModal] = useState(false)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <div className="space-y-6 max-w-6xl relative">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Design Preview</h1>
                <p className="text-sm text-gray-500 font-medium">Review your design before submitting for approval</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Col - Creative Output */}
                <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-6 font-sans">Final Creative Output</h2>

                    {/* The Template Preview Canvas */}
                    <div className="w-full aspect-[4/5] bg-[#DDAEAE] rounded-2xl flex flex-col items-center justify-center p-12 text-center text-[#4A4A4A] relative overflow-hidden shadow-inner">
                        <div className="space-y-4 z-10">
                            <h3 className="text-xs tracking-[0.3em] font-semibold text-gray-600/80">SAVE THE DATE</h3>
                            <h2 className="text-4xl font-[Satisfy,cursive] font-medium text-gray-800">Sarah & Michael</h2>
                            <div className="w-16 h-px bg-gray-500 mx-auto my-4"></div>
                            <p className="text-sm font-bold tracking-tight text-gray-800">Our Wedding Celebration</p>
                            <p className="text-xs font-semibold text-gray-600">December 26,2024</p>
                            <p className="text-xs font-medium text-gray-500">Grand Ballroom, Hotel Orchid</p>
                        </div>
                    </div>
                </div>

                {/* Right Col - Meta & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Version Info */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-900 mb-6 font-sans">Version Info</h2>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                                <span className="text-sm font-medium text-gray-400">Version Number</span>
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-200 text-gray-700">v1.0</span>
                            </div>
                            <div className="flex justify-between items-center pb-2">
                                <span className="text-sm font-medium text-gray-500">Last Editor Date</span>
                                <span className="text-xs font-bold text-gray-600 flex items-center gap-2">
                                    <Calendar size={14} /> Dec 18, 2025,09:58 AM
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Upload New File Section */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-6">
                        <h2 className="text-sm font-bold text-gray-900 mb-6 font-sans">Upload Deliverable</h2>
                        <div className="space-y-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-purple-200 rounded-xl text-purple-600 font-medium hover:bg-purple-50 transition-colors"
                            >
                                <Upload size={18} /> {uploadedFile ? uploadedFile.name : 'Click to Upload Final File'}
                            </button>
                            {uploadedFile && (
                                <p className="text-xs text-green-600 font-medium text-center">File ready for submission ✓</p>
                            )}
                        </div>
                    </div>

                    {/* Message */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-900 mb-6 font-sans">Message to CRM</h2>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700">Notes(optional)</label>
                            <textarea
                                rows={4}
                                placeholder="Add any notes or comments for the CRM team"
                                className="w-full p-4 bg-gray-50 border border-transparent focus:border-purple-200 focus:ring-2 focus:ring-purple-100 rounded-2xl text-sm transition-all resize-none font-medium placeholder-gray-400 text-gray-700"
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onBack}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            Edit Design
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            disabled={!uploadedFile}
                            className="flex-1 bg-[#2E7D51] text-white px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-[#23633e] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!uploadedFile ? "Please upload a file first" : ""}
                        >
                            <Send size={16} /> Submit to CRM
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl relative text-center">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Design Submitted Successfully!</h3>
                        <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
                            Your design has been submitted to CRM for verification<br />You'll be notified once it's reviewed
                        </p>
                        <button
                            onClick={onBack}
                            className="w-full bg-[#2E7D51] text-white py-4 rounded-2xl text-sm font-bold hover:bg-[#23633e] transition-colors shadow-md"
                        >
                            Back to My Work
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
