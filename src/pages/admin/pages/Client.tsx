import { useState, useRef, useEffect } from 'react'
import { Search, Eye, Calendar, Pencil, Trash } from 'lucide-react'
import InitialCallDetails from '../../../ClientFlow/InitialCallDetails'
import AssignTeam from '../../../ClientFlow/AssignTeam'
import CreativeConfirmation from '../../../ClientFlow/CreativeConfirmation'
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { isPreProductionPhase, resolveClientFlowView } from '../../../ClientFlow/flowRouting';



export default function Client() {
  const location = useLocation();
  const [searchName, setSearchName] = useState('')
  const [searchDate, setSearchDate] = useState('')
  const searchDateRef = useRef<HTMLInputElement>(null)
  
  const [statusFilter, setStatusFilter] = useState<string>(location.state?.statusFilter || 'All')
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (location.state?.statusFilter) {
      setStatusFilter(location.state.statusFilter)
    }
  }, [location.state?.statusFilter])

  const [clientData, setClientData] = useState<any[]>([])

  const [view, setView] = useState<'clientList' | 'callDetails' | 'creativeConfirmation' | 'assignTeam'>('clientList')
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const [editClient, setEditClient] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEditSave = async () => {
    if (!editClient) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/externalLeads/${editClient.id}`, editClient);
      setClientData(prev => prev.map(c => c.id === editClient.id ? editClient : c));
      setEditClient(null);
    } catch (error) {
      console.error("Failed to update client", error);
      alert("Failed to update client");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/externalLeads/${id}`);
      setClientData(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete client", error);
      alert("Failed to delete client");
    }
  };

  const mappedClientContext = selectedClient ? {
    ...selectedClient,
    email: selectedClient.email || 'N/A',
    shootType: selectedClient.type || ''
  } : null


  useEffect(() => {

    const fetchClients = async () => {

      try {

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/dashboard/leads`
        )

        const formatted = (res.data.data || []).map((lead: any) => ({
          id: String(lead.id),
          serialNumber: lead.serialNumber,
          name: lead.leadName ?? "Unknown Client",
          email: lead.email ?? "-",
          phone: lead.phone ?? "-",
          contact: lead.phone ?? "-",
          location: lead.location ?? "-",
          type: lead.eventType ?? "-",
          eventDate: lead.eventDate ?? "",
          status:
            lead.status === "new"
              ? "New"
              : lead.status === "completed"
                ? "Completed"
                : "In progress",
          assignedTo: lead.assignedTo || "Unassigned",
          statusColor:
            lead.status === "new"
              ? "bg-blue-100 text-blue-600"
              : lead.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700",
          date: lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-GB') : "-"
        }))

        setClientData(formatted)

      } catch (err) {

        console.error("Client fetch failed", err)

      }

    }

    fetchClients()

  }, [])

  const filteredClients = clientData.filter((c: any) => {

    const matchName =
      (c.name ?? "").toLowerCase().includes(searchName.toLowerCase()) ||
      (c.id ?? "").toLowerCase().includes(searchName.toLowerCase()) ||
      (c.serialNumber ?? "").toLowerCase().includes(searchName.toLowerCase())

    const matchDate =
      searchDate ? c.date === searchDate : true

    let matchStatus = true;
    if (statusFilter === 'Pending') {
      matchStatus = c.status !== 'Completed';
    } else if (statusFilter !== 'All') {
      matchStatus = c.status === statusFilter;
    }

    return matchName && matchDate && matchStatus

  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchDate, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / itemsPerPage));
  const currentClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenClient = async (client: any) => {

    try {
      const [stageRes, phaseRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/stage/${client.id}`).catch(() => null),
        axios.get(`${import.meta.env.VITE_API_URL}/crm/leads/${client.id}/phase-info`).catch(() => null),
      ])
      setSelectedClient(client)
      const currentPhase = phaseRes?.data?.data?.current_phase

      if (!isPreProductionPhase(currentPhase)) {
        setView("callDetails")
        return
      }

      const currentStage = stageRes?.data?.data?.current_stage
      setView(resolveClientFlowView(currentStage))

    } catch (error) {

      console.error(error)

      setSelectedClient(client)
      setView("callDetails")

    }

  }

  if (view === 'callDetails' && mappedClientContext) {
    return (
      <InitialCallDetails
        client={mappedClientContext}
        onBack={() => setView('clientList')}
        onNext={() => setView('creativeConfirmation')}
      />
    )
  }

  if (view === 'creativeConfirmation' && mappedClientContext) {
    return (
      <CreativeConfirmation
        client={mappedClientContext}
        onBack={() => setView('callDetails')}
        onNext={() => setView('assignTeam')}
      />
    )
  }

  if (view === 'assignTeam' && mappedClientContext) {
    return (
      <AssignTeam
        client={mappedClientContext}
        onBack={() => setView('creativeConfirmation')}
        onNext={() => setView('clientList')}
        forceShootTeamOnly={true}
      />
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1 font-sans">Client</h1>
        <p className="text-[13px] text-gray-500 font-medium">See Overall Clients</p>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-[15px] font-bold text-gray-900 font-sans">All client</h2>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search client by name or ID..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full sm:w-[260px] pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium text-gray-700 shadow-sm"
              />
            </div>
            <div
              className="relative flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              onClick={() => searchDateRef.current?.showPicker()}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} className={searchDate ? "text-purple-600" : "text-gray-400"} />
                <span className={`text-[13px] font-bold ${searchDate ? 'text-gray-900' : 'text-gray-700'}`}>
                  {searchDate ? searchDate : 'Event Date'}
                </span>
              </div>
              <input
                ref={searchDateRef}
                type="date"
                className="absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
              {searchDate && (
                <button
                  className="ml-2 hover:text-red-500 text-gray-400 transition-colors font-bold text-[14px]"
                  onClick={(e) => { e.stopPropagation(); setSearchDate(''); }}
                >
                  ×
                </button>
              )}
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors shadow-sm outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending (Active)</option>
              <option value="New">New</option>
              <option value="In progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100/50">
                <th className="text-left px-8 py-5 text-[12px] font-bold text-purple-600">Lead ID</th>
                <th className="text-left px-8 py-5 text-[12px] font-bold text-purple-600">Client Name</th>
                <th className="text-left px-8 py-5 text-[12px] font-bold text-purple-600">Contact Number</th>
                <th className="text-left px-8 py-5 text-[12px] font-bold text-purple-600">Event Type</th>
                <th className="text-left px-8 py-5 text-[12px] font-bold text-purple-600">Event Date</th>
                <th className="text-left px-8 py-5 text-[12px] font-bold text-purple-600">Status</th>
                <th className="text-left px-8 py-5 text-[12px] font-bold text-purple-600">Assigned To</th>
                <th className="text-left px-8 py-5 text-[12px] font-bold text-purple-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[13px] font-medium text-gray-500">
                    No clients found matching your search.
                  </td>
                </tr>
              ) : currentClients.map((client, index) => (
                <tr key={index} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6 text-[13px] font-medium text-gray-600">{client.serialNumber || client.id}</td>
                  <td className="px-8 py-6 text-[13px] text-purple-700">
                    <button
                      onClick={() => handleOpenClient(client)}
                      className="font-bold hover:text-purple-900 hover:underline transition-colors text-left"
                    >
                      {client.name}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-[13px] font-medium text-gray-700">{client.contact}</td>
                  <td className="px-8 py-6 text-[13px] font-medium text-gray-700">{client.type}</td>
                  <td className="px-8 py-6 text-[13px] font-bold text-gray-900">{client.date}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-lg text-[11px] font-bold ${client.statusColor} inline-block min-w-[90px] text-center`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[13px] font-bold text-gray-900">{client.assignedTo}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenClient(client)}
                        className="flex items-center gap-2 text-purple-700 text-[12px] font-bold hover:text-purple-900 transition-colors"
                        title="View Client"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setEditClient(client)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit Client"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(client.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Client"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredClients.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4">
            <span className="text-[13px] font-medium text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 text-[13px] font-bold border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-700"
              >
                Previous
              </button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-[13px] font-bold text-gray-900">Page {currentPage} of {totalPages}</span>
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 text-[13px] font-bold border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px]">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Edit Client</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editClient.name} onChange={e => setEditClient({ ...editClient, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact</label>
                  <input type="text" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editClient.contact} onChange={e => setEditClient({ ...editClient, contact: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Event Date</label>
                  <input type="text" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editClient.date} onChange={e => setEditClient({ ...editClient, date: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select 
                    className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" 
                    value={editClient.status} 
                    onChange={e => setEditClient({ ...editClient, status: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="In progress">In progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
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
