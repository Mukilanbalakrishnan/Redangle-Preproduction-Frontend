import { useState, useEffect } from 'react'
import { Filter, Download, Eye, Pencil, Phone, Trash } from 'lucide-react'
import Badge from '../../crm/components/ui/Badge'
import axios from "axios";
import EventStageClientView from '../components/EventStageClientView'

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
  phaseOwner?: string
}

type View = 'list' | 'assignTeam'

export default function Client() {

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventDateSearch, setEventDateSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [view, setView] = useState<View>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/event-coordinator/dashboard/leads`
      );

      const formatted = (res.data.data || [])
        .filter((lead: any) => lead.currentPhase === 'event')
        .map((lead: any) => {
          const assignedTo = String(lead.assignedTo || '').trim();
          const isAssigned = assignedTo && assignedTo !== 'Unassigned';

          return {
            id: String(lead.id),
            serialNumber: lead.serialNumber,
            name: lead.leadName ?? "Unknown Client",
            email: lead.email ?? "-",
            phone: lead.phone ?? "-",
            location: lead.location ?? "-",
            eventDate: lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-GB') : "-",
            shootType: lead.eventType ?? "-",
            status:
              lead.status === "completed"
                ? "Completed"
                : isAssigned || lead.phaseStatus === 'in_progress'
                  ? "In Progress"
                  : "New",
            executive: isAssigned ? assignedTo : "Unassigned",
            currentPhase: lead.currentPhase,
            phaseOwner: lead.phaseOwner,
          };
        });

      setClients(formatted);
    } catch (err) {
      console.error("Client fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchClients();
  }, []);

  // ✅ SAFE AFTER ALL HOOKS
  if (view === 'assignTeam' && selectedClient) {
    return (
      <EventStageClientView
        client={selectedClient}
        onBack={() => setView('list')}
        onNext={() => {
          setView('list');
          fetchClients();
        }}
      />
    );
  }

  const filtered = clients.filter(c => {
    const textMatch = (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.id ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.serialNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const dateMatch = eventDateSearch ? c.eventDate === new Date(eventDateSearch).toLocaleDateString('en-GB') : true;
    const statusMatch = filterStatus ? c.status === filterStatus : true;
    const typeMatch = filterType ? c.shootType === filterType : true;

    return textMatch && dateMatch && statusMatch && typeMatch;
  });

  const handleDownloadReport = () => {
    const headers = ['Lead ID', 'Client Name', 'E-mail ID', 'Contact number', 'Location', 'Event date', 'Event type', 'Status', 'Executive'];
    const csvRows = filtered.map(c =>
      [c.serialNumber || c.id, c.name, c.email, c.phone, c.location, c.eventDate, c.shootType, c.status, c.executive]
        .map(field => `"${String(field || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `overall_leads_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenClient = async (client: Client) => {
    try {
      const phaseRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/crm/leads/${client.id}/phase-info`
      ).catch(() => null);
      const currentPhase = phaseRes?.data?.data?.current_phase;

      if (currentPhase !== 'event') {
        alert('This lead is not in the event phase yet.');
        return;
      }
      setSelectedClient({
        ...client,
        currentPhase,
        phaseOwner: phaseRes?.data?.data?.phase_owner ?? client.phaseOwner,
      });
      setView('assignTeam');
    } catch (error) {
      console.error(error);
      alert('Failed to open event-stage client.');
    }
  };



  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Event leads</h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Manage clients that have reached the event phase</p>
        </div>
        <button onClick={handleDownloadReport} className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 bg-white" style={{ color: '#6B7280' }}>
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
          <input type="date" className="bg-transparent outline-none flex-1 font-medium" value={eventDateSearch} onChange={(e) => setEventDateSearch(e.target.value)} />
        </div>

        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7' }}>
          <Filter size={14} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent outline-none font-medium text-[#5B5FC7] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent outline-none font-medium text-[#5B5FC7] cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="Wedding">Wedding</option>
            <option value="Corporate">Corporate</option>
            <option value="Maternity">Maternity</option>
          </select>
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
                    <span>Loading event leads...</span>
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
                    <span>No event-stage clients found</span>
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
                    <button onClick={() => handleOpenClient(c)}>
                      <Eye size={15} />
                    </button>
                    <button onClick={() => setEditClient(c)} className="hover:text-indigo-600 transition-colors" title="Edit Client"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirm(c.id)} className="hover:text-red-500 transition-colors" title="Delete Client"><Trash size={14} /></button>
                    <button><Phone size={14} /></button>
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
