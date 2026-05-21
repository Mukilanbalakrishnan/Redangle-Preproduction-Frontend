import { useState, useRef, useEffect } from 'react'
import { X, Upload, Check } from 'lucide-react'
import { createEmployee } from "../../../api/employee.api"

interface AddEmployeeProps {
    isOpen: boolean
    onClose: () => void
    onSave: (employee: any) => void
    nextId: string
}

const ROLES = [
    'Photographer',
    'Videographer',
    'Save the Date Post',
    'Save the Date Video',
    'Candid Photo',
    'Retouch Photo',
    'Data Manager',
    'Traditional Video Editor',
    'Retouch Editor',
    'Album Designer',
    'Candid Video Editor',
]

export default function AddEmployee({ isOpen, onClose, onSave, nextId }: AddEmployeeProps) {
    const profileRef = useRef<HTMLInputElement>(null)
    const documentRef = useRef<HTMLInputElement>(null)
    const [profileFile, setProfileFile] = useState<File | null>(null)
    const [documentFile, setDocumentFile] = useState<File | null>(null)

    const [form, setForm] = useState({
        employeeId: '',
        firstName: '',
        lastName: '',
        contactNumber: '',
        dob: '',
        address: '',
        workLocation: '',
        experience: '',
        dateOfJoin: '',
        description: '',
        createdBy: '',
        role: '',
        email: '',
        password: '',
        profileAttached: false,
        documentAttached: false,
    })

    // Auto-fill the Employee ID whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            setForm(f => ({ ...f, employeeId: nextId }))
        }
    }, [isOpen, nextId])

    if (!isOpen) return null

    const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

    const handleSave = async () => {

        try {

            if (!form.firstName || !form.employeeId || !form.role) return

            const formData = new FormData()

            formData.append("employee_id", form.employeeId)
            formData.append("first_name", form.firstName)
            formData.append("last_name", form.lastName)
            formData.append("email", form.email)
            formData.append("password", form.password)
            formData.append("contact_number", form.contactNumber)
            formData.append("dob", form.dob)
            formData.append("address", form.address)
            formData.append("work_location", form.workLocation)
            formData.append("experience", form.experience)
            formData.append("date_of_join", form.dateOfJoin)
            formData.append("description", form.description)
            formData.append("created_by", form.createdBy)
            formData.append("role", form.role)

            if (profileFile) {
                formData.append("profile_image", profileFile)
            }

            if (documentFile) {
                formData.append("identity_document", documentFile)
            }

            const res = await createEmployee(formData)

            const employee = res.data.data

            onSave({
                id: employee.employee_id,
                name: employee.first_name + " " + employee.last_name,
                role: employee.role,
                email: employee.email,
                phone: employee.contact_number,
                status: "Active"
            })

            onClose()

        } catch (error) {

            console.error("Employee creation failed", error)
            alert("Failed to create employee")

        }

    }

    const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FC7]/20 focus:border-[#5B5FC7] transition-all font-medium placeholder:text-gray-400 placeholder:font-normal"
    const labelCls = "block text-xs font-black text-gray-700 uppercase tracking-wider mb-2"

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-[24px] w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Add New Employee</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Fill in the details to register a new team member.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto p-6 space-y-6 flex-1">

                    {/* Section 1: Basic Info */}
                    <div>
                        <p className="text-xs font-black text-[#5B5FC7] uppercase tracking-widest mb-4">Basic Information</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Employee ID *</label>
                                <input type="text" value={form.employeeId} readOnly className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-500`} placeholder="e.g. EMP-05" />
                            </div>
                            <div>
                                <label className={labelCls}>First Name *</label>
                                <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} className={inputCls} placeholder="John" />
                            </div>
                            <div>
                                <label className={labelCls}>Last Name</label>
                                <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} className={inputCls} placeholder="Doe" />
                            </div>
                            <div>
                                <label className={labelCls}>Contact Number</label>
                                <input type="tel" value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} className={inputCls} placeholder="+91 00000 00000" />
                            </div>
                            <div>
                                <label className={labelCls}>Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => set('email', e.target.value)}
                                    className={inputCls}
                                    placeholder="employee@email.com"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Date of Birth</label>
                                <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Work Location</label>
                                <input type="text" value={form.workLocation} onChange={e => set('workLocation', e.target.value)} className={inputCls} placeholder="e.g. Chennai" />
                            </div>
                            <div className="col-span-3">
                                <label className={labelCls}>Address</label>
                                <input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} placeholder="Street, City, State" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Documents */}
                    <div>
                        <p className="text-xs font-black text-[#5B5FC7] uppercase tracking-widest mb-4">Documents</p>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Profile Image */}
                            <div>
                                <label className={labelCls}>Profile Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={profileRef}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setProfileFile(file)
                                            set('profileAttached', true)
                                        }
                                    }}
                                    className="hidden"
                                />
                                <div
                                    onClick={() => profileRef.current?.click()}
                                    className={`w-full px-4 py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all
                                        ${form.profileAttached ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-[#5B5FC7]/50 hover:bg-[#5B5FC7]/5'}`}
                                >
                                    {form.profileAttached
                                        ? <><Check size={16} /><span className="text-sm font-bold">Image Attached</span></>
                                        : <><Upload size={16} /><span className="text-sm font-bold">Upload Avatar</span></>
                                    }
                                </div>
                            </div>
                            {/* Identity Document */}
                            <div>
                                <label className={labelCls}>Identity Document</label>
                                <input
                                    type="file"
                                    ref={documentRef}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            setDocumentFile(file)
                                            set('documentAttached', true)
                                        }
                                    }}
                                    className="hidden"
                                />
                                <div
                                    onClick={() => documentRef.current?.click()}
                                    className={`w-full px-4 py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all
                                        ${form.documentAttached ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-[#5B5FC7]/50 hover:bg-[#5B5FC7]/5'}`}
                                >
                                    {form.documentAttached
                                        ? <><Check size={16} /><span className="text-sm font-bold">Document Attached</span></>
                                        : <><Upload size={16} /><span className="text-sm font-bold">Upload PDF / DOCX</span></>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Professional Details */}
                    <div>
                        <p className="text-xs font-black text-[#5B5FC7] uppercase tracking-widest mb-4">Professional Details</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Role *</label>
                                <select value={form.role} onChange={e => set('role', e.target.value)} className={inputCls}>
                                    <option value="" disabled>Select Role...</option>
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Password *</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    className={inputCls}
                                    placeholder="Enter password"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Experience</label>
                                <input type="text" value={form.experience} onChange={e => set('experience', e.target.value)} className={inputCls} placeholder="e.g. 3 years" />
                            </div>
                            <div>
                                <label className={labelCls}>Date of Join</label>
                                <input type="date" value={form.dateOfJoin} onChange={e => set('dateOfJoin', e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Created By</label>
                                <input type="text" value={form.createdBy} onChange={e => set('createdBy', e.target.value)} className={inputCls} placeholder="Admin name" />
                            </div>
                            <div className="col-span-3">
                                <label className={labelCls}>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    className={`${inputCls} resize-none`}
                                    rows={3}
                                    placeholder="Short description about the employee..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!form.firstName || !form.employeeId || !form.role}
                        className="px-5 py-2.5 bg-[#5B5FC7] text-white rounded-xl text-sm font-bold hover:bg-[#4a4ea8] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={16} strokeWidth={3} /> Register Employee
                    </button>
                </div>
            </div>
        </div>
    )
}
