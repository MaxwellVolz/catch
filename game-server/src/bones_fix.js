const fs = require('fs');
const path = require('path');
const gltfPipeline = require('gltf-pipeline');

const directory = './gltf_output';
const pattern = /mixa\w*:/g;

function processGlbFile(filePath) {
    const fileData = fs.readFileSync(filePath);
    gltfPipeline.gltfToGlb(fileData)
        .then(results => {
            let json = JSON.stringify(results.gltf);
            json = json.replace(pattern, '');

            gltfPipeline.glbToGltf(Buffer.from(json))
                .then(newResults => {
                    fs.writeFileSync(filePath, Buffer.from(newResults.glb));
                    console.log(`Processed file: ${filePath}`);
                })
                .catch(err => {
                    console.error(`Error converting GLTF to GLB for file ${filePath}: ${err}`);
                });
        })
        .catch(err => {
            console.error(`Error processing file ${filePath}: ${err}`);
        });
}

fs.readdirSync(directory).forEach(file => {
    if (path.extname(file) === '.glb') {
        processGlbFile(path.join(directory, file));
    }
});
