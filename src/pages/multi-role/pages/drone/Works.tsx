import { useState, useEffect } from 'react'
import { ExternalLink, Plane } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

interface WorkItem {
    lead_employee_id: number
    lead_id: number
    lead_code: string
    name: string
    client?: string
    type: string
    task_name: string
    priority: string
    deadline: string
    created_at?: string
    upload_link?: string
    task_key?: string
}

const getPriorityStyle = (p: string) => {
    switch (p?.toLowerCase()) {
        case 'high': return 'bg-red-50 text-red-700'
        case 'medium': return 'bg-orange-50 text-orange-700'
        case 'low': return 'bg-green-50 text-green-700'
        default: return 'bg-gray-50 text-gray-600'
    }
}

const timeValue = (value?: string) => {
    if (!value) return Number.MIN_SAFE_INTEGER
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? Number.MIN_SAFE_INTEGER : parsed
}

const sortNewestFirst = (items: WorkItem[]) =>
    [...items].sort((a, b) =>
        timeValue(b.created_at) - timeValue(a.created_at)
        || timeValue(b.deadline) - timeValue(a.deadline)
        || String(a.lead_code || '').localeCompare(String(b.lead_code || ''))
    )

export default function DroneWorks() {
    const [works, setWorks] = useState<WorkItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const raw = localStorage.getItem('ra_user')
        if (!raw) return
        const user = JSON.parse(raw)
        const empId = user?.employee_id
        if (!empId) return

        fetch(`${API_URL}/employee/${empId}/my-work`)
            .then(r => r.json())
            .then(result => {
                if (result.success) {
                    const filtered = (result.data || []).filter((w: WorkItem) => {
                        const key = w.task_key || '';
                        return key === 'drone-coverage' || key === 'secondary-drone-coverage' || key.startsWith('additional-staff');
                    });
                    setWorks(sortNewestFirst(filtered))
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            <div className="mb-5">
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Plane size={20} className="text-teal-600" /> Drone - Works
                </h1>
                <p className="text-sm text-gray-500">All your drone work items</p>
            </div>

            {loading ? (
                <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
            ) : works.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center bg-white rounded-xl border border-gray-100">No work items found</p>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Lead ID</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Task</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Deadline</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {works.map(w => (
                                <tr key={w.lead_employee_id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 font-medium text-teal-600">{w.lead_code || `LD-${w.lead_id}`}</td>
                                    <td className="px-4 py-3 text-gray-900">{w.client || w.name}</td>
                                    <td className="px-4 py-3 text-gray-600 flex items-center gap-1"><Plane size={13} className="text-teal-500" /> {w.task_name || w.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{w.type}</td>
                                    <td className="px-4 py-3 text-gray-600">{w.deadline || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityStyle(w.priority)}`}>
                                            {w.priority || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {w.upload_link ? (
                                            <button
                                                type="button"
                                                onClick={() => window.open(w.upload_link, '_blank', 'noopener,noreferrer')}
                                                className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                                            >
                                                <ExternalLink size={13} /> View Files
                                            </button>
                                        ) : (
                                            <span className="text-xs font-semibold text-gray-300">No upload</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
