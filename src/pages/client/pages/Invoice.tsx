import { useState } from 'react'
import { CheckCircle2, MessageCircle, AlertCircle, XCircle, FileText, IndianRupee } from 'lucide-react'

// Dummy data for Invoice
const invoiceData = {
    id: 'INV-2026-089',
    date: 'Mar 15, 2026',
    dueDate: 'Mar 20, 2026',
    status: 'unpaid', // unpaid, paid, queried
    amountDue: 37500, // 50% advance
    description: 'Advance Payment for Event Production (50%)',
    totalProjectValue: 75000
}

export default function Invoice() {
    const [status, setStatus] = useState(invoiceData.status)
    const [showQueryModal, setShowQueryModal] = useState(false)
    const [queryText, setQueryText] = useState('')

    const handleApproveAndPay = () => {
        // Here we'd typically redirect to a payment gateway
        alert("Redirecting to secure payment gateway...")
        setStatus('paid')
    }

    const handleReject = () => {
        if(window.confirm("Are you sure you want to reject this invoice?")) {
            setStatus('rejected')
        }
    }

    const handleViewInvoice = () => {
        alert("Opening PDF viewer...")
    }

    const handleQuerySubmit = () => {
        if(!queryText.trim()) return alert("Please enter your query.")
        alert("Your invoice query has been submitted to the billing team.")
        setStatus('queried')
        setShowQueryModal(false)
        setQueryText('')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoice Details</h1>
                    <p className="text-slate-500 mt-1">Review your billing and make payments securely.</p>
                </div>
                {status === 'unpaid' && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-sm font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertCircle size={16} /> Payment Due
                    </span>
                )}
                {status === 'paid' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 size={16} /> Paid
                    </span>
                )}
                {status === 'queried' && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-full uppercase tracking-wider">
                        Query Under Review
                    </span>
                )}
                {status === 'rejected' && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 text-sm font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                        <XCircle size={16} /> Rejected
                    </span>
                )}
            </div>

            <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm p-8">
                <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-indigo-950 mb-1">INVOICE</h2>
                        <p className="text-slate-500 font-medium">#{invoiceData.id}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-slate-500"><span className="font-semibold text-slate-700">Issued:</span> {invoiceData.date}</p>
                        <p className="text-slate-500"><span className="font-semibold text-slate-700">Due:</span> {invoiceData.dueDate}</p>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                    <h3 className="font-bold text-slate-800 mb-2">Description</h3>
                    <p className="text-slate-600 font-medium text-base">{invoiceData.description}</p>
                </div>

                <div className="flex justify-between items-end">
                    <div className="text-slate-500 text-xs">
                        * Total project value: ₹{invoiceData.totalProjectValue.toLocaleString('en-IN')}
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-xs">Amount Due</p>
                        <p className="text-4xl font-black text-slate-900">₹{invoiceData.amountDue.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <button 
                    onClick={handleViewInvoice}
                    className="px-5 py-2.5 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm font-semibold rounded-lg flex items-center gap-2 transition-all mr-auto text-sm"
                >
                    <FileText size={18} /> View Authentic Invoice
                </button>

                {(status === 'unpaid' || status === 'queried') && (
                    <>
                        <button 
                            onClick={handleReject}
                            className="px-5 py-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold rounded-lg flex items-center gap-2 transition-all text-sm shadow-sm"
                        >
                            <XCircle size={18} /> Reject
                        </button>
                        <button 
                            onClick={() => setShowQueryModal(true)}
                            className="px-5 py-2.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 font-semibold rounded-lg flex items-center gap-2 transition-all text-sm shadow-sm"
                        >
                            <MessageCircle size={18} /> Raise Query
                        </button>
                        <button 
                            onClick={handleApproveAndPay}
                            className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm"
                        >
                            <IndianRupee size={18} /> Approve & Pay Now
                        </button>
                    </>
                )}
            </div>

            {/* Query Modal */}
            {showQueryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Raise an Invoice Query</h3>
                        <p className="text-sm text-slate-500 mb-4">If you notice an issue with this invoice, let us know.</p>
                        
                        <textarea 
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            placeholder="Describe the discrepancy..."
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
