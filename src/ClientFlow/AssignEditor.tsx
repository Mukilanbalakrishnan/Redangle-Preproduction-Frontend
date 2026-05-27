import { useState, useEffect } from "react";
import axios from 'axios';
import { Calendar, Video, Edit3, Users, Bell, Camera, Image, Film } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { EmployeePicker, type Employee } from './assignTeamShared';
import { getCurrentUserDisplayName, getCurrentUserRole } from '../utils/currentUser';

function TagInput({ label, icon, tags, onAdd, onRemove }: {
    label: string, icon: React.ReactNode, tags: string[], onAdd: (v: string) => void, onRemove: (v: string) => void
}) {
    const [input, setInput] = useState("");
    const handleAdd = () => {
        const t = input.trim();
        if (t && !tags.includes(t)) { onAdd(t); setInput(""); }
    };
    return (
        <div className="rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex items-center gap-2 mb-5">{icon}<h3 className="text-sm font-bold text-gray-900">{label}</h3></div>
            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder={`Type ${label.toLowerCase()} name...`}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none focus:border-purple-400"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700"
                >Add</button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#EDE9FE', color: '#5B21B6' }}>
                            {tag}
                            <button type="button" onClick={() => onRemove(tag)} className="hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

type FieldKey =
    | 'saveTheDate' | 'saveTheVideo' | 'retouching'
    | 'traditionalVideo' | 'traditionalPhoto' | 'albumDesign' | 'candidVideo'

type FieldDef = {
    key: FieldKey
    label: string
    role: string
    icon: any
    optional?: boolean
}

type ExistingAssignment = {
    project_type: string
    employee_id: string
}

export default function AssignEditor() {
    const navigate = useNavigate();
    const location = useLocation();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    const clientName = location.state?.client || location.state?.clientName || '—';
    const leadId = location.state?.lead_id;
    const isPostProduction =
        location.state?.context === 'post_production' ||
        location.pathname.startsWith('/operational-manager') ||
        location.pathname.startsWith('/post-production-crm');

    const fieldDefs: FieldDef[] = isPostProduction
        ? [
            { key: 'traditionalVideo', label: 'Traditional Video Editor', role: 'Traditional Video Editor', icon: <Video size={18} className="text-gray-500" /> },
            { key: 'traditionalPhoto', label: 'Retouch Editor', role: 'Retouch Editor', icon: <Camera size={18} className="text-gray-500" />, optional: true },
            { key: 'albumDesign', label: 'Album Designer', role: 'Album Designer', icon: <Image size={18} className="text-gray-500" /> },
            { key: 'candidVideo', label: 'Candid Video Editor', role: 'Candid Video Editor', icon: <Film size={18} className="text-gray-500" />, optional: true },
        ]
        : [
            { key: 'saveTheDate', label: 'Save the Date', role: 'Save the Date Post', icon: <Calendar size={18} className="text-gray-500" /> },
            { key: 'saveTheVideo', label: 'Save the Video', role: 'Save the Date Video', icon: <Video size={18} className="text-gray-500" /> },
            { key: 'retouching', label: 'Retouching', role: 'Retouch Photo', icon: <Edit3 size={18} className="text-gray-500" /> },
        ];

    const initialEditorData: Record<string, string> = {};
    fieldDefs.forEach(f => { initialEditorData[f.key] = '' });
    const [editorData, setEditorData] = useState<Record<string, string>>(initialEditorData);
    const [assistants, setAssistants] = useState<string[]>([]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/employees`);
                setEmployees(res.data.data || []);
            } catch (error) {
                console.error("Employee fetch failed", error);
                toast.error('Failed to load employees');
            } finally {
                setLoadingEmployees(false);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (!leadId) return;

        const projectTypeToKey: Record<string, FieldKey> = {
            'Save the Date': 'saveTheDate',
            'Save the Video': 'saveTheVideo',
            'Retouching': 'retouching',
            'Traditional Video Editing': 'traditionalVideo',
            'Retouch Editing': 'traditionalPhoto',
            'Album Design': 'albumDesign',
            'Candid Video Editing': 'candidVideo',
        };

        const fetchExistingAssignments = async () => {
            try {
                const projectId = `CRM-${leadId}`;
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/employee-projects/project/${encodeURIComponent(projectId)}`
                );
                const assignments: ExistingAssignment[] = res.data?.data || [];

                const nextEditorData: Record<string, string> = { ...initialEditorData };
                const nextAssistants: string[] = [];

                assignments.forEach(assignment => {
                    if (assignment.project_type === 'Assistant') {
                        if (assignment.employee_id && !nextAssistants.includes(assignment.employee_id)) {
                            nextAssistants.push(assignment.employee_id);
                        }
                        return;
                    }

                    const key = projectTypeToKey[assignment.project_type];
                    if (key && key in nextEditorData) {
                        nextEditorData[key] = assignment.employee_id;
                    }
                });

                setEditorData(nextEditorData);
                setAssistants(nextAssistants);
            } catch (error) {
                console.error('Existing editor assignments fetch failed', error);
                toast.error('Failed to load saved editor assignments');
            }
        };

        fetchExistingAssignments();
    }, [leadId, isPostProduction]);

    const employeeMatchesRole = (emp: any, role: string) => {
        if (emp.role === role) return true
        if (Array.isArray(emp.roles) && emp.roles.includes(role)) return true
        return false
    }

    const renderDropdown = (def: FieldDef) => {
        const filtered = employees.filter(emp => employeeMatchesRole(emp, def.role)) as Employee[]
        const pickerLabel = def.optional ? `${def.label} (Optional)` : def.label
        return (
            <EmployeePicker
                key={def.key}
                label={pickerLabel}
                icon={def.icon}
                value={editorData[def.key] || ''}
                placeholder={loadingEmployees ? 'Loading editors...' : `Select ${def.label.toLowerCase()}`}
                options={filtered}
                onChange={(value) => setEditorData(prev => ({ ...prev, [def.key]: value }))}
            />
        )
    }

    const handleSave = async () => {
        if (!leadId) {
            toast.error("Missing Lead ID, cannot assign editors.");
            return;
        }

        const requiredKeys = fieldDefs.filter(f => !f.optional).map(f => f.key);
        const missingRequired = requiredKeys.some(k => !editorData[k]);
        if (missingRequired) {
            toast.error("Please select an editor for every required role before saving.");
            return;
        }

        try {
            const payload = {
                external_lead_id: leadId,
                project_name: clientName || 'Unknown Client',
                editors: editorData,
                assistants,
                phase: isPostProduction ? 'post_production' : 'pre_production',
                assigned_by_name: getCurrentUserDisplayName(),
                assigned_by_role: getCurrentUserRole(isPostProduction ? 'operational-manager' : 'crm'),
            };

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/employee-projects/batch`, payload);
            if (res.data.success) {
                toast.success('Editors assigned successfully');
                navigate(-1);
            } else {
                toast.error(res.data.message || 'Failed to assign editors');
            }
        } catch (error) {
            console.error('Failed to assign editors:', error);
            toast.error('Failed to assign editors');
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Assign Editors</h1>
                {clientName && clientName !== '—' && (
                    <p className="text-sm text-gray-500 font-medium">
                        Client: <span className="font-semibold text-purple-600">{clientName}</span>
                        {leadId && <span className="ml-3 text-gray-400">#{leadId}</span>}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
                {fieldDefs.map(def => renderDropdown(def))}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
                <TagInput
                    label="Assistants (Editors)"
                    icon={<Users size={18} className="text-gray-500" />}
                    tags={assistants}
                    onAdd={t => setAssistants([...assistants, t])}
                    onRemove={t => setAssistants(assistants.filter(a => a !== t))}
                />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl text-sm font-medium border hover:bg-gray-50 transition-colors" style={{ borderColor: '#E5E7EB', color: '#374151' }}>
                    Cancel
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-100 transition-colors" style={{ background: '#EDE9FE' }}>
                    <Bell size={16} /> Notify Team
                </button>
                <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-md transition-opacity hover:opacity-90" style={{ background: '#5B5FC7' }}>
                    Save
                </button>
            </div>
        </div>
    );
}
