(function (modules) {
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

})