import { useState, useEffect } from 'react'
import { Search, CheckCircle, Users } from 'lucide-react'
import { createNotification } from '../../../api/notification.api'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL

interface AssignedLead {
    lead_employee_id: number | string
    lead_id: number
    lead_code: string
    name: string
    type: string
    task_name: string
    priority: string
    deadline: string
    description: string
    accepted?: boolean
    status?: string
}

const getPriorityStyle = (p: string) => {
    switch (p?.toLowerCase()) {
        case 'high': return 'bg-red-50 text-red-700'
        case 'medium': return 'bg-orange-50 text-orange-700'
        case 'low': return 'bg-green-50 text-green-700'
        default: return 'bg-gray-50 text-gray-600'
    }
}

export default function MRClients() {
    const [leads, setLeads] = useState<AssignedLead[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [acceptingId, setAcceptingId] = useState<number | null>(null)

    useEffect(() => {
        const rawUser = localStorage.getItem('ra_user')
        if (!rawUser) { setLoading(false); return }
        const user = JSON.parse(rawUser)
        const employeeId = user.employee_id
        if (!employeeId) { setLoading(false); return }

        // Fetch both legacy assignments and post-production assignments
        Promise.all([
            fetch(`${API_URL}/employee/${employeeId}/assigned-projects`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
            fetch(`${API_URL}/employee-projects/employee/${employeeId}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ])
        .then(([legacyResult, projectResult]) => {
            const legacyAssignments: AssignedLead[] = legacyResult.success ? legacyResult.data || [] : []
            const postProductionAssignments: AssignedLead[] = projectResult.success
                ? (projectResult.data || []).map((project: any) => ({
                    lead_employee_id: project.id,
                    lead_id: Number(String(project.project_id || '').replace(/^CRM-/, '').replace(/\D/g, '')) || 0,
                    lead_code: String(project.project_id || '').replace(/^CRM-/, '') || project.project_id,
                    name: project.project_name,
                    type: 'Post-production',
                    task_name: project.project_type,
                    priority: '',
                    deadline: project.created_at,
                    description: project.admin_notes || '',
                    accepted: String(project.status || '').toLowerCase() !== 'pending',
                    status: project.status,
                }))
                : []

            const combined = [...postProductionAssignments, ...legacyAssignments]
            setLeads(combined)
        })
        .catch(err => console.error('Assigned projects fetch error:', err))
        .finally(() => setLoading(false))

    }, [])

    const handleAccept = async (group: any) => {
        const rawUser = localStorage.getItem('ra_user')
        if (!rawUser) return
        const user = JSON.parse(rawUser)
        const employeeIdStr = user.employee_id
        const numericEmployeeId = parseInt(String(employeeIdStr).replace(/\D/g, ''), 10)

        if (Number.isNaN(numericEmployeeId)) {
            toast.error('Unable to determine your employee ID')
            return
        }

        setAcceptingId(group.lead_id)
        try {
            const lookupId = group.lead_code || group.lead_id
            const promises = group.original_leads.map((l: any) => {
                if (l.type === 'Post-production') {
                    return fetch(`${API_URL}/employee-projects/${l.lead_employee_id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Accepted' })
                    })
                } else {
                    return fetch(`${API_URL}/assign-team/${lookupId}/accept`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ employeeId: numericEmployeeId, taskName: l.task_name })
                    })
                }
            })
            
            const resArray = await Promise.all(promises)
            const allOk = resArray.every(res => res.ok)

            if (allOk) {
                toast.success('Assignment accepted successfully')
                setLeads(prev => prev.map(l => {
                    if ((l.lead_code || l.lead_id) === lookupId) {
                        return { ...l, accepted: true, status: 'accepted' }
                    }
                    return l
                }))
                
                try {
                    await createNotification({
                        type: 'assignment_accepted',
                        title: `Assignment Accepted for ${group.lead_code || group.lead_id}`,
                        detail: `Assignment for lead ${group.name} has been accepted.`,
                        lead_id: group.lead_id,
                        from_role: user.role || 'employee',
                        from_name: user.name || 'Employee',
                        target_roles: ['admin', 'post-production-crm']
                    })
                } catch(e) {}
            } else {
                toast.error('Failed to accept some assignments')
            }
        } catch (err) {
            console.error('Accept error:', err)
            toast.error('Failed to accept assignment')
        } finally {
            setAcceptingId(null)
        }
    }

    const filteredLeadsFlat = leads.filter(l => {
        const q = searchQuery.toLowerCase()
        return l.name?.toLowerCase().includes(q) || l.lead_code?.toLowerCase().includes(q) || l.type?.toLowerCase().includes(q) || l.task_name?.toLowerCase().includes(q)
    })

    const groupedLeads = Object.values(filteredLeadsFlat.reduce((acc, curr) => {
        const key = curr.lead_code || String(curr.lead_id)
        if (!acc[key]) {
            acc[key] = {
                ...curr,
                task_names: [curr.task_name],
                original_leads: [curr]
            }
        } else {
            if (!acc[key].task_names.includes(curr.task_name)) {
                acc[key].task_names.push(curr.task_name)
            }
            acc[key].original_leads.push(curr)
        }
        return acc
    }, {} as Record<string, any>))

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users size={20} className="text-purple-600" />
                        Clients
                    </h1>
                    <p className="text-sm text-gray-500">View your assigned clients and accept new assignments</p>
                </div>
            </div>

            <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search by name, code, or type..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
            </div>

            {loading ? (
                <p className="text-sm text-gray-400 py-8 text-center">Loading clients...</p>
            ) : groupedLeads.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No clients found</p>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Lead Code</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Task</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Event Type</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Deadline</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {groupedLeads.map((lead: any) => {
                                const isAccepted = lead.original_leads.every((l: any) => 
                                    l.accepted || String(l.status || '').toLowerCase() === 'accepted' || String(l.status || '').toLowerCase() === 'in progress' || String(l.status || '').toLowerCase() === 'completed'
                                )
                                return (
                                <tr key={lead.lead_id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 font-medium text-purple-600">{lead.lead_code || `LD-${lead.lead_id}`}</td>
                                    <td className="px-4 py-3 text-gray-900">{lead.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{lead.task_names.join(', ')}</td>
                                    <td className="px-4 py-3 text-gray-600">{lead.type}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {lead.deadline ? new Date(lead.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityStyle(lead.priority)}`}>
                                            {lead.priority || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {isAccepted ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                                                <CheckCircle size={12} /> Assigned
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isAccepted ? (
                                            <span className="text-xs text-gray-400 font-medium italic">Already accepted</span>
                                        ) : (
                                            <button
                                                onClick={() => handleAccept(lead)}
                                                disabled={acceptingId === lead.lead_id}
                                                className="px-4 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {acceptingId === lead.lead_id ? 'Accepting...' : 'Accept'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
