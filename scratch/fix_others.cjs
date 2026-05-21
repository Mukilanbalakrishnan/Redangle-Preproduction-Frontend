const fs = require('fs');

const files = [
    "src/pages/multi-role/pages/videographer/AssignedClient.tsx",
    "src/pages/multi-role/pages/drone/AssignedClient.tsx"
];

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');

    content = content.replace(/<\/div>\s*<\/div>\s*\{\/\* Shoot Locations Section \*\/\}/, `</div>
                        </div>
                    </div>
                )}

                {/* Shoot Locations Section */}`);

    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
}
