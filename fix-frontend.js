const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/ClientFlow');

function fixFile(file) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');
    
    code = code.replace(/const actualId = client\.rawId \|\| client\.id;/g, "const actualId = client.serialNumber || client.id;");
    // also remove Number(actualId) or Number(clientId) that might have been there
    code = code.replace(/Number\(actualId\)/g, "String(actualId)");
    code = code.replace(/Number\(client\.id\)/g, "String(actualId)");

    fs.writeFileSync(filePath, code);
}

const files = [
    'InitialCallDetails.tsx',
    'CreativeConfirmation.tsx',
    'CreativePlanning.tsx',
    'AssignTeam.tsx'
];

for (const f of files) {
    fixFile(f);
}

console.log("Frontend ClientFlow actualId mappings updated to use serialNumber.");
