const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src/api');

function fixFrontendApi() {
    const apiFiles = [
        'creativePlanning.api.ts',
        'assignTeam.api.ts',
        'creativeConfirmation.api.ts',
        'eventDetails.api.ts',
        'stageTracking.api.ts'
    ];

    for (const f of apiFiles) {
        const filePath = path.join(apiDir, f);
        if (fs.existsSync(filePath)) {
            let code = fs.readFileSync(filePath, 'utf8');
            code = code.replace(/parent_lead_id: number/g, "parent_lead_id: string");
            code = code.replace(/external_lead_id: number/g, "external_lead_id: string");
            code = code.replace(/externalLeadId: number/g, "externalLeadId: string");
            code = code.replace(/leadId: number/g, "leadId: string");
            fs.writeFileSync(filePath, code);
        }
    }
}
fixFrontendApi();
console.log("Frontend APIs migrated to string successfully.");
