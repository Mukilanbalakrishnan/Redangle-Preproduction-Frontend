import { useState } from 'react'
import { Filter, Download, Plus, Eye, Pencil, Trash2, X, Check } from 'lucide-react'
import AddEmployee from './AddEmployee'

type EmployeeItem = {
    id: string
    name: string
    role: string
    email: string
    phone: string
    status: 'Active' | 'On Leave'
}

export default function Employee() {
    const [employees, setEmployees] = useState<EmployeeItem[]>([
        { id: 'EMP-01', name: 'John Doe', role: 'Photographer', email: 'john@redangle.com', phone: '+91 9876543210', status: 'Active' },
        { id: 'EMP-02', name: 'Sarah Smith', role: 'Videographer', email: 'sarah@redangle.com', phone: '+91 9876543211', status: 'Active' },
        { id: 'EMP-03', name: 'Rahul Kumar', role: 'Editor', email: 'rahul@redangle.com', phone: '+91 9876543212', status: 'On Leave' },
        { id: 'EMP-04', name: 'Priya Sharma', role: 'Assistant', email: 'priya@redangle.com', phone: '+91 9876543213', status: 'Active' },
    ])

    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [viewEmployee, setViewEmployee] = useState<EmployeeItem | null>(null)
    const [editEmployee, setEditEmployee] = useState<EmployeeItem | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const filtered = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase())
    )

    const handleDelete = (id: string) => {
        setEmployees(prev => prev.filter(e => e.id !== id))
        setDeleteConfirm(null)
    }

    const handleEditSave = () => {
        if (!editEmployee) return
        setEmployees(prev => prev.map(e => e.id === editEmployee.id ? editEmployee : e))
        setEditEmployee(null)
    }

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Employee Directory</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Manage CRM staff resource allocation</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-medium border transition-colors shadow-sm"
                        style={{ borderColor: '#E5E7EB', color: '#374151' }}>
                        <Download size={16} /> Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
                        style={{ background: '#5B5FC7' }}>
                        <Plus size={16} /> Add Employee
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">Total Employees</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{employees.length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">Active Today</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{employees.filter(e => e.status === 'Active').length}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">On Leave</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{employees.filter(e => e.status === 'On Leave').length}</h3>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[24px] shadow-sm border p-6" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex justify-between items-center mb-6">
                    <div className="relative">
                        <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-[#F9FAFB] text-sm w-[300px] pl-11 pr-4 py-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#5B5FC7]/20 transition-all font-medium placeholder:font-normal placeholder:text-gray-400 text-gray-700"
                        />
                    </div>
                    <div className="flex gap-2 text-sm font-medium">
                        <button className="px-4 py-2 border rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors" style={{ borderColor: '#E5E7EB', color: '#4B5563' }}>
                            All Roles <Filter size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b" style={{ borderColor: '#F3F4F6' }}>
                                <th className="pb-4 px-2 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Employee ID</th>
                                <th className="pb-4 px-4 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Employee Name</th>
                                <th className="pb-4 px-4 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="pb-4 px-4 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Email ID</th>
                                <th className="pb-4 px-4 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Contact number</th>
                                <th className="pb-4 px-4 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="pb-4 px-2 text-[12px] font-semibold text-gray-400 uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-2">
                                        <span className="text-sm font-bold text-gray-900">{emp.id}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-sm font-bold text-gray-700">{emp.name}</span>
                                    </td>
                                    <td className="py-4 px-4 text-sm font-medium text-gray-600">{emp.role}</td>
                                    <td className="py-4 px-4 text-sm font-medium text-gray-500">{emp.email}</td>
                                    <td className="py-4 px-4 text-sm font-medium text-gray-500">{emp.phone}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => setViewEmployee(emp)}
                                                className="p-1.5 text-gray-400 hover:text-[#5B5FC7] hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditEmployee({ ...emp })}
                                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(emp.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Employee Modal */}
            <AddEmployee
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={(newEmp) => setEmployees([...employees, newEmp])}
                nextId={`EMP-${String(employees.length > 0 ? Math.max(...employees.map(e => parseInt((e.id || '').replace(/\D/g, '')) || 0)) + 1 : 1).padStart(2, '0')}`}
            />

            {/* View Employee Modal */}
            {viewEmployee && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Employee Details</h2>
                            <button onClick={() => setViewEmployee(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-purple-200 flex items-center justify-center text-lg font-black text-purple-700">
                                {viewEmployee.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <p className="font-black text-gray-900 text-base">{viewEmployee.name}</p>
                                <p className="text-sm text-gray-500 font-medium">{viewEmployee.id}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Role', value: viewEmployee.role },
                                { label: 'Email', value: viewEmployee.email },
                                { label: 'Contact', value: viewEmployee.phone },
                                { label: 'Status', value: viewEmployee.status },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">{label}</span>
                                    <span className="text-sm font-bold text-gray-700">{value}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setViewEmployee(null)} className="mt-6 w-full py-2.5 bg-[#5B5FC7] text-white rounded-xl text-sm font-bold hover:bg-[#4a4ea8] transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {editEmployee && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-[24px] w-full max-w-lg shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900">Edit Employee</h2>
                            <button onClick={() => setEditEmployee(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Employee Name', key: 'name', type: 'text' },
                                { label: 'Employee ID', key: 'id', type: 'text' },
                                { label: 'Email', key: 'email', type: 'email' },
                                { label: 'Contact', key: 'phone', type: 'tel' },
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">{label}</label>
                                    <input
                                        type={type}
                                        value={(editEmployee as any)[key]}
                                        onChange={(e) => setEditEmployee({ ...editEmployee, [key]: e.target.value } as EmployeeItem)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FC7]/20 focus:border-[#5B5FC7] transition-all font-medium"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Role</label>
                                <select
                                    value={editEmployee.role}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, role: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FC7]/20 focus:border-[#5B5FC7] transition-all font-medium"
                                >
                                    {['Photographer', 'Videographer', 'Editor', 'Assistant', 'Manager', 'Accountant'].map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Status</label>
                                <select
                                    value={editEmployee.status}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, status: e.target.value as 'Active' | 'On Leave' })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FC7]/20 focus:border-[#5B5FC7] transition-all font-medium"
                                >
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button onClick={() => setEditEmployee(null)} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleEditSave} className="px-5 py-2.5 bg-[#5B5FC7] text-white rounded-xl text-sm font-bold hover:bg-[#4a4ea8] transition-colors flex items-center gap-2">
                                <Check size={16} strokeWidth={3} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-[24px] w-full max-w-sm shadow-xl p-8 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Employee?</h2>
                        <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The employee record will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
