import { useState, useEffect } from 'react'
import { Filter, Download, Eye, Pencil, Phone, Trash } from 'lucide-react'
import Badge from '../components/ui/Badge'
import InitialCallDetails from '../../../ClientFlow/InitialCallDetails'
import axios from "axios";
import { isPreProductionPhase, resolveClientFlowView } from '../../../ClientFlow/flowRouting';

type Client = {
  id: string
  serialNumber?: string
  name: string
  email: string
  phone: string
  location: string
  eventDate: string
  shootType: string
  status: string
  executive: string
  currentPhase?: string
  phaseStatus?: string
  preProductionStep?: string
  flowType?: string
}

export type ClientWorkflowPhase = 'pre_production' | 'post_production' | 'event' | 'all'

interface ClientProps {
  workflowPhase?: ClientWorkflowPhase
  title?: string
  description?: string
}



import AssignTeam from '../../../ClientFlow/AssignTeam'

type View = 'list' | 'callDetails' | 'assignTeam'

const formatLeadStatus = (lead: any) => {
  const rawStatus = String(lead.status || '').trim().toLowerCase();
  const phaseStatus = String(lead.phaseStatus || '').trim().toLowerCase();
  const currentPhase = String(lead.currentPhase || '').trim().toLowerCase();

  if (rawStatus === 'completed' || phaseStatus === 'completed' || currentPhase === 'event' || currentPhase === 'post_production') {
    return 'Completed';
  }

  const statusMap: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    pending: 'Pending',
    in_progress: 'In Progress',
    assign_team: 'Assign Team',
    editing_in_progress: 'Editing In Progress',
  };

  return statusMap[rawStatus] ?? (rawStatus
    ? rawStatus.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : 'New');
};

export default function Client({
  workflowPhase = 'all',
  title,
  description,
}: ClientProps = {}) {

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventDateSearch, setEventDateSearch] = useState('');
  const [view, setView] = useState<View>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPhaseStep, setSelectedPhaseStep] = useState<string | undefined>(undefined);
  const [openCreativeSection, setOpenCreativeSection] = useState(false);

  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEditSave = async () => {
    if (!editClient) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/externalLeads/${editClient.id}`, editClient);
      setClients(prev => prev.map(c => c.id === editClient.id ? editClient : c));
      setEditClient(null);
    } catch (error) {
      console.error("Failed to update client", error);
      alert("Failed to update client");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/externalLeads/${id}`);
      setClients(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete client", error);
      alert("Failed to delete client");
    }
  };

  // ✅ HOOK ALWAYS EXECUTES
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/dashboard/leads`
        );

        const formatted = (res.data.data || []).map((lead: any) => ({
          id: String(lead.id),
          serialNumber: lead.serialNumber || lead.lead_serial_number || String(lead.id),
          name: lead.leadName ?? "Unknown Client",
          email: lead.email ?? "-",
          phone: lead.phone ?? "-",
          location: lead.location ?? "-",
          eventDate: lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-GB') : "-",
          shootType: lead.eventType ?? "-",
          status: formatLeadStatus(lead),
          executive: lead.assignedEmployee ?? "Unassigned",
          currentPhase: lead.currentPhase ?? undefined,
          phaseStatus: lead.phaseStatus ?? undefined,
          preProductionStep: lead.preProductionStep ?? undefined,
          flowType: lead.flowType ?? undefined,
        }));

        setClients(formatted);
      } catch (err) {
        console.error("Client fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // ✅ SAFE AFTER ALL HOOKS
  if (view === 'callDetails' && selectedClient) {
    return (
      <InitialCallDetails
        client={selectedClient}
        onBack={() => setView('list')}
        onNext={() => setView('assignTeam')}
        expandCreativeSection={openCreativeSection}
      />
    );
  }
  if (view === 'assignTeam' && selectedClient) {
    const stepHint = selectedPhaseStep ?? selectedClient.preProductionStep;
    const forceShoot = stepHint ? stepHint === 'shoot' : true;
    return <AssignTeam client={selectedClient} onBack={() => setView('callDetails')} onNext={() => setView('list')} forceShootTeamOnly={forceShoot} />;
  }

  const filtered = clients.filter(c => {
    const textMatch = (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.id ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.serialNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const dateMatch = eventDateSearch ? c.eventDate === eventDateSearch : true;

    // Filter by workflow phase. `current_phase` from external_leads tracks
    // pre_production / event / post_production. Treat unknown phases as
    // pre_production by default since brand-new leads start there.
    let phaseMatch = true;
    if (workflowPhase !== 'all') {
      const rawPhase = (c.currentPhase || 'pre_production').toLowerCase();
      const phase = rawPhase === 'not_started' ? 'pre_production' : rawPhase;
      
      // If we are in the pre_production view, we want to show leads that are 
      // in pre_production, but also those that have ALREADY passed it (moved to event or post_production)
      // so they "stay" in the list as completed history.
      if (workflowPhase === 'pre_production') {
        phaseMatch = ['pre_production', 'event', 'post_production'].includes(phase);
      } else {
        phaseMatch = phase === workflowPhase;
      }
    }

    return textMatch && dateMatch && phaseMatch;
  });

  const handleOpenClient = async (client: Client) => {
    try {
      const [stageRes, phaseRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/stage/${client.id}`).catch(() => null),
        axios.get(`${import.meta.env.VITE_API_URL}/crm/leads/${client.id}/phase-info`).catch(() => null),
      ]);
      const phaseInfo = phaseRes?.data?.data;
      const freshStep = phaseInfo?.pre_production_step ?? client.preProductionStep;
      setSelectedClient({ ...client, preProductionStep: freshStep, currentPhase: phaseInfo?.current_phase ?? client.currentPhase });
      setSelectedPhaseStep(freshStep);
      const currentPhase = phaseInfo?.current_phase;
      const currentStage = stageRes?.data?.data?.current_stage;

      // If the lead has already moved past pre-production (event / post_production),
      // show the workflow-handoff card inside InitialCallDetails instead of the
      // assign-team page so users aren't sent back to a stage that's already done.
      if (currentPhase === 'event' || currentPhase === 'post_production') {
        setOpenCreativeSection(false);
      setView("callDetails");
        return;
      }

      // Allow opening if it's pre-production OR not started yet
      if (!isPreProductionPhase(currentPhase) && currentPhase !== 'not_started' && currentPhase) {
        setOpenCreativeSection(false);
      setView("callDetails");
        return;
      }

      // Pre-production assignment already finished but phase reconciliation
      // hasn't bumped current_phase yet — also treat as a workflow handoff.
      if (currentStage === 'completed_assign_team') {
        setOpenCreativeSection(false);
      setView("callDetails");
        return;
      }

      // post_wedding still walks through Initial Call Details -> Creative Confirmation
      // -> Assign team before the Event Coordinator handoff. Only jump
      // straight to assignTeam for the editing sub-step (post-event editing flow).
      if (phaseInfo?.flow_type === 'post_wedding') {
        if (phaseInfo?.pre_production_step === 'editing') {
          setView("assignTeam");
          return;
        }
        setOpenCreativeSection(currentStage === 'creative_confirmation');
      setView(resolveClientFlowView(currentStage));
        return;
      }
      if (phaseInfo?.pre_production_step === 'editing') {
        setView("assignTeam");
        return;
      }
      setOpenCreativeSection(currentStage === 'creative_confirmation');
      setView(resolveClientFlowView(currentStage));

    } catch (error) {
      console.error(error);

      // If stage record not found → go to first stage
      setSelectedClient(client);
      setSelectedPhaseStep(client.preProductionStep);
      setOpenCreativeSection(false);
      setView("callDetails");
    }
  };



  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#111827' }}>{title ?? 'Overall leads'}</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>{description ?? 'Manage overall incoming Client'}</p>
        </div>
        <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium" style={{ color: '#6B7280' }}>
          <Download size={14} /> Download report
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-1"
          style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search by client name or ID..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1" style={{ color: '#374151' }} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7', cursor: 'pointer' }}>
          <input type="date" className="bg-transparent outline-none" value={eventDateSearch} onChange={(e) => setEventDateSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7', cursor: 'pointer' }}>
          <Filter size={14} /> All Status
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7', cursor: 'pointer' }}>
          All Types
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>

      {/* Table */}
      <div className="crm-table-wrap">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
              {['Lead ID', 'Client Name', 'E-mail ID', 'Contact number', 'Location', 'Event date', 'Event type', 'Status', 'Executive', 'Action'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span>Loading clients...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>
                  <div className="flex flex-col items-center gap-2">
                    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <span>No clients found</span>
                  </div>
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                <td className="px-5 py-3 text-sm font-medium" style={{ color: '#5B5FC7' }}>{c.serialNumber || c.id}</td>
                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>
                  <span className="hover:underline" style={{ color: '#5B5FC7', cursor: 'pointer' }} onClick={() => handleOpenClient(c)}>
                    {c.name}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{c.email}</td>
                <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{c.phone}</td>
                <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{c.location}</td>
                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{c.eventDate}</td>
                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{c.shootType}</td>
                <td className="px-5 py-3"><Badge status={c.status} /></td>
                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{c.executive}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-3" style={{ color: '#9CA3AF' }}>
                    <button onClick={() => handleOpenClient(c)} title="View Details">
                      <Eye size={15} className="hover:text-indigo-600 transition-colors" />
                    </button>
                    <button 
                      onClick={() => setEditClient(c)} 
                      disabled={c.status === 'Completed'}
                      className={`transition-colors ${c.status === 'Completed' ? 'opacity-20 cursor-not-allowed' : 'hover:text-indigo-600'}`} 
                      title={c.status === 'Completed' ? "Cannot edit completed lead" : "Edit Client"}
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(c.id)} 
                      disabled={c.status === 'Completed'}
                      className={`transition-colors ${c.status === 'Completed' ? 'opacity-20 cursor-not-allowed' : 'hover:text-red-500'}`} 
                      title={c.status === 'Completed' ? "Cannot delete completed lead" : "Delete Client"}
                    >
                      <Trash size={14} />
                    </button>
                    <button 
                      disabled={c.status === 'Completed'}
                      className={`transition-colors ${c.status === 'Completed' ? 'opacity-20 cursor-not-allowed' : 'hover:text-green-600'}`}
                    >
                      <Phone size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {editClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px]">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>Edit Client</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editClient.name} onChange={e => setEditClient({ ...editClient, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editClient.email} onChange={e => setEditClient({ ...editClient, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="text" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editClient.phone} onChange={e => setEditClient({ ...editClient, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editClient.location} onChange={e => setEditClient({ ...editClient, location: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-4 py-2 text-sm font-medium border rounded-lg" onClick={() => setEditClient(null)}>Cancel</button>
              <button className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors" style={{ background: '#5B5FC7' }} onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px]">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Delete Client?</h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this client? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium border rounded-lg" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
