const fs = require('fs');
const resolveModule = require('./resolveModule');
const parse = require('./parse');

let moduleID = 0;
let chunID = 0;
let currentModuleID = 0;

function processSubModule(depTree, subModule, context) {
    parseModule(depTree, subModule.name, context);
    subModule.id = currentModuleID;
}

function parseModule(depTree, mainModule, context) {
    const absolutePath = resolveModule(mainModule, context);
    let source = fs.readFileSync(absolutePath).toString();
    let modules = parse(source);
    let { requires, asyncs } = modules;

    if (!(absolutePath in depTree.modules)) {
        let newModule = {
            id: moduleID++,
            absolutePath,
            name: mainModule,
            requires,
            asyncs,
            source
        };
        depTree.modules[absolutePath] = newModule;
        depTree.modulesByID.push(newModule);
    }

    currentModuleID = depTree.modules[absolutePath].id;

    if (requires && requires.length > 0) {
        for (let i = 0; i < requires.length; i++) {
            processSubModule(depTree, requires[i], context);
        }
    }

    if (asyncs && asyncs.length > 0) {
        asyncs.forEach(item => {
            const {args, requires} = item;
            for (let i = 0; i < args.length; i++) {
                processSubModule(depTree, args[i], context);
            }

            for (let i = 0; i < requires.length; i++) {
                processSubModule(depTree, requires[i], context);
            }
        });
    }
}

function addChunk(depTree, startPoint) {
    let chunk = {
        id: chunID++,
        modules: []
    };

    if (startPoint.id === 0) {
        chunk.modules.push(0);
    }

    const {requires, asyncs} = startPoint;
    if(requires && requires.length > 0) {
        for (let m of requires) {
            chunk.modules.push(m.id);
        }
    }
    depTree.chunks.push(chunk);

    if (asyncs && asyncs.length > 0) {
        for (let a of asyncs) {
            const subChunk = addChunk(depTree, a);
            a.chunkID = subChunk.id;
        }
    }

    return chunk;
}

function buildChunks(depTree, startPoint) {
    addChunk(depTree, startPoint);
}

module.exports = function (mainModule, context) {
    let depTree = {
        modules: {},
        modulesByID: [],
        chunks: []
    };

    parseModule(depTree, mainModule, context);
    buildChunks(depTree, depTree.modulesByID[0]);

    return depTree;
};