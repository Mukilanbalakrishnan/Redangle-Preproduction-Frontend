import { useState, useEffect } from 'react'
import { Filter, Download, Plus, Eye, Pencil, Trash2, X, Check } from 'lucide-react'
import AddEmployee, { ROLE_GROUPS } from '../../crm/pages/AddEmployee'

import { getEmployees, deleteEmployee, updateEmployee } from "../../../api/employee.api"

type EmployeeItem = {
    id: string
    name: string
    role: string
    roles?: string[]
    email: string
    phone: string
    status: 'Active' | 'On Leave'
    profileImage?: string | null
    identityDocument?: string | null
}

export default function Employee() {
    const [employees, setEmployees] = useState<EmployeeItem[]>([])

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

    useEffect(() => {

        const loadEmployees = async () => {

            try {

                const res = await getEmployees()

                const data = res.data.data

                const formatted = data.map((emp: any) => ({
                    id: emp.employee_id,
                    name: emp.first_name + " " + emp.last_name,
                    role: emp.roles ? emp.roles.join(', ') : emp.role,
                    roles: emp.roles || (emp.role ? [emp.role] : []),
                    email: emp.email,
                    phone: emp.contact_number,
                    status: emp.status,
                    profileImage: emp.profile_image || null,
                    identityDocument: emp.identity_document || null,
                }))

                setEmployees(formatted)

            } catch (error) {
                console.error("Failed to load employees", error)
            }

        }

        loadEmployees()

    }, [])

    const handleDelete = async (id: string) => {
        try {
            await deleteEmployee(id)
            setEmployees(prev => prev.filter(e => e.id !== id))
        } catch (error) {
            console.error("Failed to delete employee", error)
            alert("Failed to delete employee")
        }
        setDeleteConfirm(null)
    }

    const handleEditSave = async () => {
        if (!editEmployee) return
        try {
            await updateEmployee(editEmployee.id, {
                first_name: editEmployee.name.split(' ')[0] || '',
                last_name: editEmployee.name.split(' ').slice(1).join(' ') || '',
                email: editEmployee.email,
                contact_number: editEmployee.phone,
                role: editEmployee.role,
                roles: JSON.stringify(editEmployee.roles || [])
            })
            setEmployees(prev => prev.map(e => e.id === editEmployee.id ? editEmployee : e))
            setEditEmployee(null)
        } catch (error) {
            console.error("Failed to update employee", error)
            alert("Failed to update employee")
        }
    }

    return (
        <div className="p-8 pb-24 h-[calc(100vh-80px)] overflow-y-auto hidden-scrollbar">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Employee Directory</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage your agency's staff and resource allocation</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <Download size={16} /> Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#5B5FC7] text-white rounded-xl text-sm font-bold hover:bg-[#4a4ea8] transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Add Employee
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">Total Employees</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{employees.length}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">Active Today</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{employees.filter(e => e.status === 'Active').length}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1">On Leave</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{employees.filter(e => e.status === 'On Leave').length}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FC7]/20 focus:border-[#5B5FC7] transition-all w-[280px] font-medium placeholder:font-normal"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="text-xs font-bold text-gray-600">All Roles</span>
                            <Filter size={14} className="text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="text-xs font-bold text-gray-600">All Status</span>
                            <Filter size={14} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white border-b border-gray-100">
                                <th className="text-left py-4 px-6 text-[11px] font-black uppercase tracking-wider text-gray-400">Employee ID</th>
                                <th className="text-left py-4 px-6 text-[11px] font-black uppercase tracking-wider text-gray-400">Employee Name</th>
                                <th className="text-left py-4 px-6 text-[11px] font-black uppercase tracking-wider text-gray-400">Role</th>
                                <th className="text-left py-4 px-6 text-[11px] font-black uppercase tracking-wider text-gray-400">Email ID</th>
                                <th className="text-left py-4 px-6 text-[11px] font-black uppercase tracking-wider text-gray-400">Contact Number</th>
                                <th className="text-left py-4 px-6 text-[11px] font-black uppercase tracking-wider text-gray-400">Status</th>
                                <th className="text-center py-4 px-6 text-[11px] font-black uppercase tracking-wider text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6 text-sm font-bold text-gray-900">{emp.id}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            {emp.profileImage ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${emp.profileImage}`}
                                                    alt={emp.name}
                                                    className="w-8 h-8 rounded-full object-cover border border-purple-200"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                                                    {emp.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                            )}
                                            <span className="text-sm font-bold text-gray-700">{emp.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">{emp.role}</span>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-500">{emp.email}</td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-500">{emp.phone}</td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${emp.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewEmployee(emp)}
                                                className="p-1.5 text-gray-400 hover:text-[#5B5FC7] hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye size={16} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() => setEditEmployee({ ...emp })}
                                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(emp.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
                    <span className="font-medium">Showing 1 to {filtered.length} of {employees.length} entries</span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white font-medium transition-colors">Previous</button>
                        <button className="px-3 py-1.5 bg-[#5B5FC7] text-white rounded-lg font-bold shadow-sm">1</button>
                        <button className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white font-medium transition-colors">Next</button>
                    </div>
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
                            {/* Profile picture or initials */}
                            {viewEmployee.profileImage ? (
                                <img
                                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${viewEmployee.profileImage}`}
                                    alt="Profile"
                                    className="w-14 h-14 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 border-2 border-purple-200 flex items-center justify-center text-lg font-black text-purple-700">
                                    {viewEmployee.name.split(' ').map(n => n[0]).join('')}
                                </div>
                            )}
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
                            {/* Identity Document */}
                            {viewEmployee.identityDocument && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">ID Document</span>
                                    <a
                                        href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${viewEmployee.identityDocument}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-bold text-[#5B5FC7] hover:underline"
                                    >
                                        View / Download
                                    </a>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setViewEmployee(null)} className="mt-6 w-full py-2.5 bg-[#5B5FC7] text-white rounded-xl text-sm font-bold hover:bg-[#4a4ea8] transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {editEmployee && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 backdrop-blur-sm">
                    <div className="bg-white rounded-[24px] w-full max-w-3xl shadow-xl overflow-hidden flex max-h-[calc(100dvh-2rem)] flex-col sm:max-h-[calc(100dvh-3rem)]">
                        <div className="flex items-center justify-between gap-4 p-5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-900">Edit Employee</h2>
                            <button onClick={() => setEditEmployee(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FC7]/20 focus:border-[#5B5FC7] transition-all font-medium"
                                    />
                                </div>
                            ))}
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Roles *</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {ROLE_GROUPS.map(group => (
                                        <div key={group.title} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
                                            <div className="mb-2 flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-wider text-[#5B5FC7]">
                                                        {group.title}
                                                    </p>
                                                    <p className="text-[11px] font-semibold text-gray-500">
                                                        {group.description}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-gray-500">
                                                    {group.roles.filter(role => (editEmployee.roles || []).includes(role)).length}/{group.roles.length}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {group.roles.map(r => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentRoles = editEmployee.roles || [];
                                                            const newRoles = currentRoles.includes(r)
                                                                ? currentRoles.filter(x => x !== r)
                                                                : [...currentRoles, r];
                                                            setEditEmployee({ ...editEmployee, roles: newRoles, role: newRoles.join(', ') });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${(editEmployee.roles || []).includes(r)
                                                            ? 'bg-[#5B5FC7] text-white border-[#5B5FC7] shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Status</label>
                                <select
                                    value={editEmployee.status}
                                    onChange={(e) => setEditEmployee({ ...editEmployee, status: e.target.value as 'Active' | 'On Leave' })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FC7]/20 focus:border-[#5B5FC7] transition-all font-medium"
                                >
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 flex-shrink-0">
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
