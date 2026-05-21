const fs = require('fs');

const filesToUpdate = [
    'd:/Red-Angle (2)/Red-Angle (2)/Frontend/src/pages/media/components/MediaSidebar.tsx',
    'd:/Red-Angle (2)/Red-Angle (2)/Frontend/src/pages/event-coordinator/components/EventCoordinatorSidebar.tsx',
    'd:/Red-Angle (2)/Red-Angle (2)/Frontend/src/pages/employee/components/EmployeeSidebar.tsx',
    'd:/Red-Angle (2)/Red-Angle (2)/Frontend/src/pages/data-management/components/DataManagementSidebar.tsx',
    'd:/Red-Angle (2)/Red-Angle (2)/Frontend/src/pages/data-manager/components/DataManagerSidebar.tsx',
    'd:/Red-Angle (2)/Red-Angle (2)/Frontend/src/pages/client/components/ClientSidebar.tsx',
    'd:/Red-Angle (2)/Red-Angle (2)/Frontend/src/pages/crm/components/Sidebar.tsx',
    'd:/Red-Angle (2)/Red-Angle (2)/Frontend/src/pages/admin/components/AdminSidebar.tsx'
];

const newLogoHtml = '<img src="/red_angle_logo.png" alt="RED ANGLE STUDIO" className="h-[40px] w-auto object-contain" />';

for (const file of filesToUpdate) {
    if (!fs.existsSync(file)) {
        console.log("File not found:", file);
        continue;
    }
    
    let content = fs.readFileSync(file, 'utf8');
    
    // 1. In Sidebars, replace the div > div "ro" + div "RED ANGLE" "STUDIO"
    // We can target the exact replacement looking for the container.
    // The target wraps `<div className="bg-black text-white p-2.5 rounded-2xl...` up to `...STUDIO</p>\n                    </div>`
    
    const regex = /<div className="bg-black text-white p-2\.5 rounded-2xl[\s\S]*?<p className="text-\[10px\] uppercase tracking-\[0\.2em\] text-gray-600 font-bold mt-1">STUDIO<\/p>\s*<\/div>/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, newLogoHtml);
        fs.writeFileSync(file, content);
        console.log('Updated logo in:', file);
    } else {
        console.log('Logo block not found in:', file);
    }
}
