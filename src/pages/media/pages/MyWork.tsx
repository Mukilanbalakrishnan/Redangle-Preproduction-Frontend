import { useState, useEffect } from 'react'
import { Camera, Eye } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMediaRole } from '../../../hooks/useMediaRole'

const API_URL = import.meta.env.VITE_API_URL


interface WorkItem {
    lead_employee_id: number
    lead_id: number
    lead_code: string
    client: string
    type: string
    name: string
    priority: string
    deadline: string
    estimated_duration: string
    description: string
}

const getPriorityStyle = (s: string) => {
    switch (s?.toLowerCase()) {
        case 'high': return { background: '#FCE4EC', color: '#C2185B' }
        case 'medium': return { background: '#FFF3E0', color: '#E65100' }
        case 'low': return { background: '#E8F5E9', color: '#2E7D32' }
        default: return { background: '#F3F4F6', color: '#6B7280' }
    }
}

export default function MyWork() {
    const navigate = useNavigate()
    const location = useLocation()
    const { employeeId, isPhotographer, isVideographer, isDrone } = useMediaRole()
    const [workItems, setWorkItems] = useState<WorkItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!employeeId) { setLoading(false); return }
        fetch(`${API_URL}/employee/${employeeId}/my-work`)
            .then(res => res.json())
            .then(result => {
                if (result.success) setWorkItems(result.data)
            })
            .catch(err => console.error('My work fetch error:', err))
            .finally(() => setLoading(false))
    }, [employeeId])

    const basePath = location.pathname.startsWith('/multi-role/drone') ? '/multi-role/drone' : '/media'
    const roleWorkItems = workItems.filter(work => {
        const task = (work.name || '').toLowerCase()
        if (isDrone) return task.includes('drone')
        if (isVideographer) return task.includes('video')
        if (isPhotographer) return task.includes('photo')
        return true
    })

    return (
        <div>
            <div className="flex items-start justify-between mb-5"><div><h1 className="text-lg font-bold" style={{ color: '#111827' }}>My Work</h1><p className="text-sm" style={{ color: '#6B7280' }}>Manage your tasks and upload files</p></div></div>

            <div className="crm-table-wrap">
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #E5E7EB' }}><p className="text-sm font-semibold" style={{ color: '#111827' }}>Tasks</p></div>
                <table className="w-full">
                    <thead><tr style={{ background: '#FAFAFA' }}>{['Lead ID', 'Name', 'Type', 'Deadline', 'Priority', 'Action'].map(h => (<th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>))}</tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center px-5 py-10 text-sm" style={{ color: '#9CA3AF' }}>Loading...</td></tr>
                        ) : roleWorkItems.length === 0 ? (
                            <tr><td colSpan={6} className="text-center px-5 py-10 text-sm" style={{ color: '#9CA3AF' }}>No tasks assigned</td></tr>
                        ) : (
                            roleWorkItems.map((work) => (
                                <tr key={work.lead_employee_id} style={{ borderTop: '1px solid #F3F4F6' }}>
                                    <td className="px-5 py-3 text-sm font-medium" style={{ color: '#5B5FC7' }}>{work.lead_code || `LD-${work.lead_id}`}</td>
                                    <td className="px-5 py-3 text-sm font-medium" style={{ color: '#111827' }}>
                                        <div className="flex items-center gap-2"><Camera size={14} style={{ color: '#7C3AED' }} /> {work.name || work.type || '—'}</div>
                                    </td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{work.type}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{work.deadline || '—'}</td>
                                    <td className="px-5 py-3"><span className="crm-badge" style={getPriorityStyle(work.priority)}>{work.priority || '—'}</span></td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => navigate(`${basePath}/my-work-details`, {
                                                state: {
                                                    leadCode: work.lead_code || `LD-${work.lead_id}`,
                                                    leadId: work.lead_id,
                                                    leadEmployeeId: work.lead_employee_id,
                                                    name: work.name || work.type || '',
                                                    type: work.type,
                                                    deadline: work.deadline,
                                                    priority: work.priority,
                                                    description: work.description,
                                                    estimatedDuration: work.estimated_duration
                                                }
                                            })} className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-purple-600" style={{ color: '#9CA3AF' }}><Eye size={14} /> View</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
