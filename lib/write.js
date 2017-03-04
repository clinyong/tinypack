const fs = require('fs');
const path = require('path');

const tplDir = path.resolve(__dirname, './templates');

const chunkTPL = fs.readFileSync(`${tplDir}/chunk.js`).toString();
const basicTPL = fs.readFileSync(`${tplDir}/basic.js`).toString();

const outputPostfix = '.output.js';
const jsonpName = 'webpackJsonp';

function replaceModuleWithID(m) {
    let source = m.source;

    if (!m.requires || m.requires.length === 0) {
        return source;
    }

    let replaces = m.requires.map(r => ({
        from: r.range[0],
        to: r.range[1],
        value: `/* ${r.name} */ ${r.id}`
    }));

    // 得从后到前替换
    replaces = replaces.sort((a, b) => a.from < b.from);

    replaces.forEach(r => {
        let start = source.substring(0, r.from);
        let tail = source.substring(r.to);
        source = start + r.value + tail;
    });

    return source;
}

function buildFunc(m) {
    let buffer = [
        `${m.id}: function(module, exports, require) {`,
        replaceModuleWithID(m),
        '}'
    ];

    return buffer.join('\n');
}

function writeChunk(depTree, mainModule) {
    const { modulesByID } = depTree;
    let moduleList = [];

    for (let mid of mainModule.modules) {
        moduleList.push(modulesByID[mid]);
    }

    const buffer = moduleList.map(m => buildFunc(m));
    return buffer.join(',');
}

module.exports = function (depTree) {
    const { chunks, modulesByID } = depTree;

    let buffer = [];
    for (let chunk of chunks) {
        let fileName;

        if (chunk.id === 0) {
            fileName = 'bundle.js';
            let mainModule = modulesByID[0];
            const { asyncs } = mainModule;
            if (asyncs && asyncs.length > 0) {
                buffer.push(chunkTPL);
                buffer.push(`({a: ${outputPostfix}, b: ${jsonpName}, \n`);
            } else {
                buffer.push(basicTPL);
                buffer.push('({');
            }
        } else {
            fileName = `${chunk.id}${outputPostfix}`;
        }

        buffer.push(writeChunk(depTree, chunk));
        buffer.push('})');

        const dist = path.resolve(__dirname, `../output/${fileName}`);
        fs.writeFile(dist, buffer.join(''), err => {
            if (err) {
                throw err;
            }
        });
    }

};