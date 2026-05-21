import { useState } from 'react'
import { CheckCircle2, XCircle, MessageCircle, FileText } from 'lucide-react'

// Dummy data for quotation
const quotationData = {
    id: 'QT-2026-045',
    date: 'Mar 10, 2026',
    status: 'pending', // pending, approved, rejected
    eventDetails: {
        name: 'Corporate Brand Anthem',
        location: 'Tamil Nadu',
        date: '12-05-2026'
    },
    services: [
        { name: 'Traditional Photography & Videography', qty: 1, price: 40000 },
        { name: 'Candid Photography', qty: 1, price: 25000 },
        { name: 'Drone Coverage', qty: 1, price: 15000 }
    ],
    deliverables: [
        { name: 'Synthetic Premium Album (250 Photos)', qty: 1 },
        { name: 'Cinematic Highlights (3-5 mins)', qty: 1 }
    ],
    totalAmount: 80000,
    discount: 5000,
    finalAmount: 75000
}

export default function Quotation() {
    const [status, setStatus] = useState(quotationData.status)
    const [showQueryModal, setShowQueryModal] = useState(false)
    const [queryText, setQueryText] = useState('')

    const handleApprove = () => {
        if (window.confirm("Are you sure you want to approve this quotation?")) {
            setStatus('approved')
            // In a real app, API call goes here
        }
    }

    const handleReject = () => {
        if (window.confirm("Are you sure you want to reject this quotation?")) {
            setStatus('rejected')
            // In a real app, API call goes here
        }
    }

    const handleQuerySubmit = () => {
        if (!queryText.trim()) return alert("Please enter your query.")
        alert("Your query has been submitted to the sales team.")
        setShowQueryModal(false)
        setQueryText('')
    }

    const handleViewQuotation = () => {
        alert("Opening PDF viewer...")
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Quotation</h1>
                    <p className="text-slate-500 mt-1">Review the proposed services and deliverables for your event.</p>
                </div>
                {status === 'pending' && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-full uppercase tracking-wider">
                        Awaiting Approval
                    </span>
                )}
                {status === 'approved' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 size={16} /> Approved
                    </span>
                )}
                {status === 'rejected' && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-sm font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                        <XCircle size={16} /> Rejected
                    </span>
                )}
            </div>

            <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm p-8">
                {/* Header Information */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-950 mb-1">Quotation #{quotationData.id}</h2>
                        <p className="text-slate-500">Date Issued: {quotationData.date}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-semibold text-slate-800">{quotationData.eventDetails.name}</h3>
                        <p className="text-slate-500">{quotationData.eventDetails.date} • {quotationData.eventDetails.location}</p>
                    </div>
                </div>

                {/* Services Table */}
                <div className="mb-8">
                    <h3 className="font-bold text-slate-800 mb-3 uppercase tracking-wider text-xs">Services Breakdown</h3>
                    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex bg-slate-50 font-semibold border-b border-slate-200 text-slate-600">
                            <div className="flex-1 p-3">Description</div>
                            <div className="w-24 p-3 text-center">Qty</div>
                            <div className="w-32 p-3 text-right">Amount</div>
                        </div>
                        {quotationData.services.map((item, i) => (
                            <div key={i} className="flex border-b last:border-0 border-slate-100 items-center">
                                <div className="flex-1 p-3 text-slate-700 font-medium">{item.name}</div>
                                <div className="w-24 p-3 text-center text-slate-500">{item.qty}</div>
                                <div className="w-32 p-3 text-right text-slate-700">₹{item.price.toLocaleString('en-IN')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Deliverables List */}
                <div className="mb-8">
                    <h3 className="font-bold text-slate-800 mb-3 uppercase tracking-wider text-xs">Included Deliverables</h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-600 font-medium">
                        {quotationData.deliverables.map((item, i) => (
                            <li key={i}>{item.name} (x{item.qty})</li>
                        ))}
                    </ul>
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{quotationData.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                            <span>Discount</span>
                            <span>- ₹{quotationData.discount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total Budget</span>
                            <span>₹{quotationData.finalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {status === 'pending' && (
                <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <button
                        onClick={handleViewQuotation}
                        className="px-5 py-2.5 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm font-semibold rounded-lg flex items-center gap-2 transition-all mr-auto text-sm"
                    >
                        <FileText size={18} /> View Authentic Quotation
                    </button>
                    <button
                        onClick={() => setShowQueryModal(true)}
                        className="px-5 py-2.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 font-semibold rounded-lg flex items-center gap-2 transition-all text-sm shadow-sm"
                    >
                        <MessageCircle size={18} /> Raise Query
                    </button>
                    <button
                        onClick={handleReject}
                        className="px-5 py-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold rounded-lg flex items-center gap-2 transition-all text-sm shadow-sm"
                    >
                        <XCircle size={18} /> Reject
                    </button>
                    <button
                        onClick={handleApprove}
                        className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm"
                    >
                        <CheckCircle2 size={18} /> Approve Quotation
                    </button>
                </div>
            )}

            {/* Query Modal */}
            {showQueryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Raise a Query</h3>
                        <p className="text-sm text-slate-500 mb-4">Have questions about the quotation? Send them to our team below.</p>

                        <textarea
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            placeholder="Type your query or requested changes here..."
                            rows={4}
                            className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none mb-4"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowQueryModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleQuerySubmit}
                                className="px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-sm transition-colors"
                            >
                                Submit Query
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
