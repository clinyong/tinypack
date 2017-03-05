const buildModules = require('./buildModules');
const write = require('./write');

module.exports = function(options) {
    const {entry, context} = options;
    const result = buildModules(entry, context);
    write(result);
};