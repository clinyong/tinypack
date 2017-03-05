const buildModules = require('./lib/buildModules');
const write = require('./lib/write');

const options = {
    context: './test'
};

const result = buildModules('index.js', options);
write(result);