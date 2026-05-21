const fs = require('fs');
const path = require('path');

const files = [
    "src/pages/multi-role/pages/photographer/AssignedClient.tsx",
    "src/pages/multi-role/pages/videographer/AssignedClient.tsx",
    "src/pages/multi-role/pages/drone/AssignedClient.tsx"
];

const acceptButtonStr = `
            {/* ACCEPTED — show tabs */}
            <>
                {!selectedLead.accepted && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-5 text-center">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">New Assignment</h2>
                        <p className="text-sm text-gray-500 mb-4">You have been assigned to this project as a {selectedLead.task_name}. Please review the details and accept the assignment.</p>
                        <button
                            onClick={async () => {
                                try {
                                    const raw = localStorage.getItem('ra_user')
                                    const user = raw ? JSON.parse(raw) : null
                                    if (!user) return
                                    const numericId = parseInt(String(user.employee_id).replace(/\\D/g, ''), 10)
                                    await axios.patch(\`\${API_URL}/assign-team/\${selectedLead.lead_id}/accept\`, {
                                        employeeId: numericId,
                                        taskName: selectedLead.task_name
                                    })
                                    setSelectedLead({...selectedLead, accepted: true})
                                    setLeads(prev => prev.map(l => l.lead_id === selectedLead.lead_id ? { ...l, accepted: true } : l))
                                } catch (e) {
                                    console.error(e)
                                }
                            }}
                            className="px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                        >
                            <CheckCircle size={16} /> Accept Assignment
                        </button>
                    </div>
                )}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">`;

const shootLocationsStr = `
                {/* Shoot Locations Section */}
                {shootLocations && shootLocations.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-purple-600" />
                            <h3 className="text-sm font-bold text-gray-900">Shoot Locations</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shootLocations.map((loc: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-xl flex items-center justify-between gap-4" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Location {idx + 1}</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{loc.label || \`Location \${idx+1}\`}</p>
                                    </div>
                                    <a
                                        href={loc.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition-colors shrink-0"
                                    >
                                        View Location
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }`;

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('const [shootLocations, setShootLocations]')) {
        content = content.replace('const [detailLoading, setDetailLoading] = useState(false)', 'const [detailLoading, setDetailLoading] = useState(false)\n    const [shootLocations, setShootLocations] = useState<any[]>([])');
    }

    if (!content.includes('fetchClientDetails')) continue;

    if (!content.includes('/assign-team/')) {
        const fetchCreativeRegex = /try \{\s*.*?\/\/\s*Fetch creative confirmation[\s\S]*?\} catch \(err\) \{ console\.error\("Creative details fetch failed", err\) \}/;
        if (content.match(fetchCreativeRegex)) {
            const fetchLocationsBlock = `
        try {
            const assignRes = await axios.get(\`\${API_URL}/assign-team/\${leadId}\`)
            const aData = assignRes.data?.data || assignRes.data
            if (aData) {
                setShootLocations(aData.shoot_locations || [])
            }
        } catch (err) { console.error("Assign team details fetch failed", err) }
`;
            content = content.replace(fetchCreativeRegex, (match) => match + '\n' + fetchLocationsBlock);
        } else {
             const alternativeCreative = /try \{\s*const creativeRes = await axios\.get\(\`\${API_URL}\/creative-confirmation\/\${leadId}\`\)[\s\S]*?\} catch \(err\) \{ console\.error\("Creative details fetch failed", err\) \}/;
             if (content.match(alternativeCreative)) {
                const fetchLocationsBlock = `
        try {
            const assignRes = await axios.get(\`\${API_URL}/assign-team/\${leadId}\`)
            const aData = assignRes.data?.data || assignRes.data
            if (aData) {
                setShootLocations(aData.shoot_locations || [])
            }
        } catch (err) { console.error("Assign team details fetch failed", err) }
`;
                content = content.replace(alternativeCreative, (match) => match + '\n' + fetchLocationsBlock);
             }
        }
    }

    if (content.includes('setCreativeDetails(null)')) {
        content = content.replace('setCreativeDetails(null)', 'setCreativeDetails(null); setShootLocations([])');
    }

    if (content.includes('{/* ACCEPTED — show tabs */}\n            <>\n                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">')) {
        content = content.replace('{/* ACCEPTED — show tabs */}\n            <>\n                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">', acceptButtonStr);
    }

    if (content.match(/\{\/\* Location Details \*\/\}([\s\S]*?)\{\/\* My Work Tab Removed \*\/\}/)) {
        // Wait, Location Details might not be the last thing, but it's just before `</div>\n        )\n    }`
        // Let's replace the end of renderClientDetails
        content = content.replace(/<\/div>\n\s*\)\n\s*\}/, shootLocationsStr);
    } else {
       // fallback replace end of renderClientDetails
       content = content.replace(/<\/div>\n\s*\)\n\s*\}/, shootLocationsStr);
    }

    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
}
