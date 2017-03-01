const fs = require('fs');
const path = require('path');

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
        'function(module, exports, require) {',
        replaceModuleWithID(m),
        '}'
    ];

    return buffer.join('\n');
}

module.exports = function(depTree) {
    let moduleList = [];
    for (let k in depTree.modules) {
        moduleList.push(depTree.modules[k]);
    }
    moduleList = moduleList.sort((a, b) => a.id > b.id);

    const arguments = moduleList.map(m => buildFunc(m));
    const content = `(function(modules){
        var cacheModules = {};

        function __tinypack__require(moduleID) {
            if (cacheModules[moduleID]) {
                return cacheModules[moduleID].exports;
            }

            var m = cacheModules[moduleID] = {
                exports: {},
                id: moduleID,
                loaded: false
            };

            // NodeJS 的 this 指向的是 exports
            modules[moduleID].call(m.exports, m, m.exports, __tinypack__require);

            m.loaded = true;
            return m.exports;
        }

        return __tinypack__require(0);

    })([${arguments.join(', ')}]);`;

    const dist = path.resolve(__dirname, '../output/bundle.js');
    fs.writeFileSync(dist, content, 'utf8');
};