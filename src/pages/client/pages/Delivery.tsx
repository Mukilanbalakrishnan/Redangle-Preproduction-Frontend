import { useState } from 'react'
import { Download, FolderArchive, Info, Film, Video, CheckCircle2, ArrowRight, XCircle, Send } from 'lucide-react'

export default function Delivery() {
    const [isRejecting, setIsRejecting] = useState(false)
    const [feedback, setFeedback] = useState('')

    const handleSubmitFeedback = () => {
        if (!feedback) {
            alert("Please provide reason or required corrections before submitting.")
            return
        }
        alert("Feedback submitted successfully!")
        setIsRejecting(false)
        setFeedback('')
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reviews & Delivery</h1>
                <p className="text-slate-500 mt-1">Review active edits, submit feedback, and download your final files.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* ACTIVE REVIEWS (Main Focus) */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Film className="text-purple-500" size={24} />
                                Active Reviews
                            </h2>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest rounded-full">Action Required</span>
                        </div>

                        <div className="space-y-4">
                            {/* Dummy Active Review Link */}
                            <div className="border border-slate-200 rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Video className="text-indigo-500" size={20} />
                                            Sangeet Highlights
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-500 mt-1">Version 1 Cut</p>
                                    </div>
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Pending Your Review</span>
                                </div>
                                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                    Uploaded on Nov 05, 2026. Please watch the video and compile a list of any required changes along with timestamps before our next review call.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button className="flex-1 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-indigo-200">
                                        <Film size={16} /> Open Drive Link
                                    </button>
                                    <button
                                        onClick={() => setIsRejecting(!isRejecting)}
                                        className="flex-1 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-rose-200"
                                    >
                                        <XCircle size={16} /> Request Changes
                                    </button>
                                    <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20">
                                        <CheckCircle2 size={16} /> Approve Final Cut
                                    </button>
                                </div>

                                {isRejecting && (
                                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Required Changes / Corrections</label>
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="E.g., Please trim the shot at 01:23 and remove the song at the end..."
                                            className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                                            rows={4}
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => setIsRejecting(false)}
                                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmitFeedback}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                                            >
                                                <Send size={16} /> Submit Feedback
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">Review History</h3>
                            <div className="space-y-3">
                                {/* Completed Item */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                            <CheckCircle2 size={14} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 text-sm">Pre-Wedding Teaser</h4>
                                            <p className="text-xs text-slate-500">Approved on Oct 28</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FINAL DELIVERABLES (Sidebar) */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                        <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-white/90">
                            <Download className="text-indigo-200" size={24} />
                            Final Deliverables
                        </h2>

                        <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-center">
                            <FolderArchive size={32} className="mx-auto text-indigo-200 mb-3" />
                            <h3 className="font-semibold text-white mb-2">Not Ready Yet</h3>
                            <p className="text-xs text-indigo-100/70">Source files and high-res exports will appear here once the final cut is approved and the remaining balance is paid.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Info size={20} className="text-slate-400" /> Need Raw Footage?
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            A hard drive containing all RAW files requires a separate buyout clause in your contract.
                        </p>
                        <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors mt-auto">
                            Request RAW Buyout
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
