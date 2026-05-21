import { useState } from 'react'
import { Download, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function Reports() {
    const [search, setSearch] = useState('')
    const [reportType, setReportType] = useState('Photographer')
    
    // Dummy Data to match the specified UI screenshot
    const totalEmployees = 9;
    const presentCount = 0;
    const absentCount = 9;
    
    const dummyEmployees = [
        { sno: 1, name: 'testing t', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
        { sno: 2, name: 'channel partener p', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
        { sno: 3, name: 'employee n', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
        { sno: 4, name: 'channel partener n', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
        { sno: 5, name: 'channel partener n', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
        { sno: 6, name: 'channel partener n', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
        { sno: 7, name: 'channel partener n', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
        { sno: 8, name: 'yaswanth v', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
        { sno: 9, name: 'someone else', month: '-', punchIn: '-', punchOut: '-', totalHours: '-', status: 'Absent' },
    ];

    const todayDate = "11/03/2026"; // Hardcoded to match screenshot for visual continuity

    const filteredEmployees = dummyEmployees.filter(emp => emp.name.toLowerCase().includes(search.toLowerCase()))

    const handleDownloadExcel = () => {
        if (filteredEmployees.length === 0) return;
        
        const exportData = filteredEmployees.map(emp => ({
            'S.NO': emp.sno,
            'NAME': emp.name,
            'MONTH': emp.month,
            'PUNCH IN': emp.punchIn,
            'PUNCH OUT': emp.punchOut,
            'TOTAL HOURS': emp.totalHours,
            'STATUS': emp.status
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        
        const dateStr = todayDate.split('/').join('-');
        XLSX.writeFile(workbook, `attendance_report_${dateStr}.xlsx`);
    };

    return (
        <div className="flex flex-col min-h-full">
            <h1 className="text-[22px] font-bold tracking-tight mb-5" style={{ color: '#111827' }}>All Employees Attendance Monthly</h1>
            
            <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold" style={{ color: '#4B5563' }}>Available Reports:</span>
                <div className="relative">
                    <select 
                        className="text-sm font-medium rounded-lg appearance-none bg-white pr-10 pl-3 py-2 outline-none border transition-colors cursor-pointer"
                        style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                    >
                        <option value="Photographer">Photographer</option>
                        <option value="Videographer">Videographer</option>
                        <option value="Save the Date">Save the Date</option>
                        <option value="Save the Video">Save the Video</option>
                        <option value="Retouch">Retouch</option>
                        <option value="Candidit">Candidit</option>
                    </select>
                    <svg className="absolute right-3 top-2.5 pointer-events-none" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            
            <p className="text-[13px] mb-6" style={{ color: '#6B7280' }}>
                Daily summary date: <span className="font-medium text-slate-800">{todayDate}</span>
            </p>

            {/* Search Bar + Controls */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 flex-1 bg-white border" style={{ borderColor: '#E5E7EB' }}>
                    <Search size={16} style={{ color: '#9CA3AF' }} />
                    <input type="text" placeholder="Search employee name"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="bg-transparent outline-none text-[13px] flex-1 font-medium placeholder:font-normal" style={{ color: '#374151' }} />
                </div>
                <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold bg-white border transition-colors hover:bg-slate-50" style={{ borderColor: '#E5E7EB', color: '#4B5563' }}>
                    <ArrowUpDown size={14} /> Sort &darr;
                </button>
                <button 
                    onClick={handleDownloadExcel}
                    disabled={filteredEmployees.length === 0}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold text-white transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#6366F1' }}
                >
                    <Download size={14} /> Download Excel
                </button>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                {[
                    { label: 'Total Employees (API)', val: totalEmployees },
                    { label: 'Present (daily summary)', val: presentCount },
                    { label: 'Absent (daily summary)', val: absentCount }
                ].map(card => (
                    <div key={card.label} className="bg-white p-5 rounded-2xl border shadow-sm" style={{ borderColor: '#F3F4F6' }}>
                        <p className="text-[13px] font-medium mb-3" style={{ color: '#6B7280' }}>{card.label}</p>
                        <p className="text-[22px] font-bold" style={{ color: '#6366F1' }}>{card.val}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col" style={{ borderColor: '#F3F4F6', minHeight: '400px' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                                {['S.NO', 'NAME', 'MONTH', 'PUNCH IN', 'PUNCH OUT', 'TOTAL HOURS', 'STATUS'].map((h, i) => (
                                    <th key={h} className={`py-4 text-xs font-bold tracking-wide ${i===0?'pl-6':'px-6'}`} style={{ color: '#111827' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.slice(0, 8).map((emp, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors" style={{ borderBottom: '1px solid #F9FAFB' }}>
                                    <td className="pl-6 pr-6 py-4 text-[13px] font-medium" style={{ color: '#6B7280' }}>
                                        {emp.sno}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] font-medium" style={{ color: '#374151' }}>
                                        {emp.name}
                                    </td>
                                    <td className="px-6 py-4 text-[13px]" style={{ color: '#9CA3AF' }}>{emp.month}</td>
                                    <td className="px-6 py-4 text-[13px]" style={{ color: '#9CA3AF' }}>{emp.punchIn}</td>
                                    <td className="px-6 py-4 text-[13px]" style={{ color: '#9CA3AF' }}>{emp.punchOut}</td>
                                    <td className="px-6 py-4 text-[13px]" style={{ color: '#9CA3AF' }}>{emp.totalHours}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-[11px] font-bold tracking-wide shrink-0" 
                                              style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                                            {emp.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-sm font-medium" style={{ color: '#9CA3AF' }}>
                                        No employee records found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="mt-auto px-6 py-5 flex items-center justify-end border-t" style={{ borderColor: '#F3F4F6' }}>
                    <span className="text-[13px] font-medium mr-6" style={{ color: '#6B7280' }}>
                        1-8 of {filteredEmployees.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50" style={{ color: '#9CA3AF' }} disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: '#9CA3AF' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
