const fs = require('fs');
const resolveModule = require('./resolveModule');
const parse = require('./parse');

let moduleID = 0;
let currentModuleID = 0;

function parseModule(depTree, mainModule, context) {
    const absolutePath = resolveModule(mainModule, context);
    let source = fs.readFileSync(absolutePath).toString();
    let requires = parse(source);

    if (!(absolutePath in depTree.modules)) {
        depTree.modules[absolutePath] = {
            id: moduleID++,
            absolutePath,
            name: mainModule,
            requires,
            source
        };
    }

    currentModuleID = depTree.modules[absolutePath].id;

    if (requires && requires.length > 0) {
        for (let i = 0; i < requires.length; i++) {
            let requireModule = requires[i];
            parseModule(depTree, requireModule.name, context);
            requireModule.id = currentModuleID;
        }
    }
}

module.exports = function (mainModule, options) {
    let depTree = {
        modules: {}
    };

    parseModule(depTree, mainModule, options.context);
    return depTree;
};