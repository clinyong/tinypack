const fs = require('fs');
const resolveModule = require('./resolveModule');
const parse = require('./parse');

let moduleID = 0;
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

module.exports = function (mainModule, context) {
    let depTree = {
        modules: {}
    };

    parseModule(depTree, mainModule, context);
    return depTree;
};