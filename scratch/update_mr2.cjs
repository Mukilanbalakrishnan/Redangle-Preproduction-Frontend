const fs = require('fs');
const path = require('path');

const files = [
    "src/pages/multi-role/pages/photographer/AssignedClient.tsx",
    "src/pages/multi-role/pages/videographer/AssignedClient.tsx",
    "src/pages/multi-role/pages/drone/AssignedClient.tsx"
];

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

    if (!content.includes('Shoot Locations Section')) {
        content = content.replace(/<\/div>[\r\n\s]*\)[\r\n\s]*\}/, shootLocationsStr);
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
    } else {
        console.log('Already has Shoot Locations Section: ' + file);
    }
}
