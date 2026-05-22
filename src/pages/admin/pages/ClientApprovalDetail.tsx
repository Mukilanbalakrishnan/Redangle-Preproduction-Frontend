import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, ExternalLink, Send, CheckCircle2, Clock } from 'lucide-react'
import axios from 'axios'

const typeConfig: Record<string, { bg: string, color: string }> = {
  'Save the Date': { bg: '#FCE7F3', color: '#DB2777' }, // Pink
  'Save the Video': { bg: '#E0E7FF', color: '#4F46E5' }, // Indigo
  'Candid': { bg: '#FEF3C7', color: '#D97706' }, // Amber
  'Retouching': { bg: '#D1FAE5', color: '#059669' }, // Emerald
}

export default function AdminClientApprovalDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.get(`${API_URL}/employee-projects/project/${projectId}/approved-links`)
      if (res.data?.success) {
        setLinks(res.data.data)
      }
    } catch (err) {
      console.error('Error fetching approved links:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const handleSendToClient = async () => {
    if (!window.confirm("Are you sure you want to send all these deliverables to the client portal?")) return;
    setSending(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      await axios.put(`${API_URL}/employee-projects/project/${projectId}/send-to-client`)
      alert("Deliverables successfully sent to the Client Portal!")
      fetchData()
    } catch (err) {
      console.error("Error sending to client", err)
      alert("Failed to send deliverables. Please try again.")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-gray-500">Loading client deliverables...</div>
  }

  const clientName = links.length > 0 ? links[0].project_name : "Unknown Client"
  const allSent = links.length > 0 && links.every(link => link.sent_to_client === true)

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back to Client Approval
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{clientName}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            Project ID: <span className="font-semibold text-gray-700">{projectId}</span>
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          {allSent ? (
            <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200">
              <CheckCircle2 size={18} /> Sent to Client Portal
            </div>
          ) : (
            <button
              onClick={handleSendToClient}
              disabled={sending || links.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              <Send size={18} /> Send to Client Portal
            </button>
          )}
        </div>
      </div>

      {links.length === 0 ? (
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-gray-500 font-medium">No approved deliverables found for this client.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {links.map((link) => (
            <div key={link.id} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              {/* Card Header Strip */}
              <div
                className="h-2 w-full absolute top-0 left-0"
                style={{ background: typeConfig[link.project_type]?.color || '#9CA3AF' }}
              />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-6 pt-2">
                  <h3 className="text-lg font-bold text-gray-900">{link.project_type}</h3>
                  <div className="flex items-center gap-2">
                     {link.sent_to_client && (
                       <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                         <CheckCircle2 size={12} /> Delivered
                       </span>
                     )}
                     <span
                       className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                       style={{ 
                         background: typeConfig[link.project_type]?.bg || '#F3F4F6', 
                         color: typeConfig[link.project_type]?.color || '#4B5563' 
                       }}
                     >
                       Approved
                     </span>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  {/* Editor Info */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200">
                      <User size={14} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Editor</p>
                      <p className="text-sm font-semibold text-gray-900">{link.employee_name || link.employee_id}</p>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <Clock size={14} className="text-gray-400" />
                        <div>
                           <span className="block text-[10px] uppercase tracking-wider text-gray-400">Edited On</span>
                           {new Date(link.created_at).toLocaleDateString()}
                        </div>
                     </div>
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <div>
                           <span className="block text-[10px] uppercase tracking-wider text-gray-400">Approved By</span>
                           {link.approved_by || 'Admin'}
                        </div>
                     </div>
                  </div>

                  {/* Drive Link */}
                  <div className="pt-4 mt-2 border-t border-gray-100">
                     <a
                        href={link.upload_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-colors border border-indigo-100"
                     >
                        <ExternalLink size={16} /> View Final File
                     </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
